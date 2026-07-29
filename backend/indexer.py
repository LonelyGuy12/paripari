"""
indexer.py — Offline hierarchical indexer for PariPari.

Uses the GitHub Trees API to fetch the ENTIRE repo file tree in a single API call,
then fetches file contents from raw.githubusercontent.com (generous rate limits).
Each file is compressed via Paritok and assembled into a hierarchical JSON map.
"""

import asyncio
import json
import os
import argparse
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

import httpx
from github_service import GitHubService, parse_github_url, _github_headers
import paritok_service

SUPPORTED = (".py", ".js", ".ts", ".tsx", ".jsx", ".md", ".json", ".html", ".css",
             ".yaml", ".yml", ".toml", ".cfg", ".rs", ".go", ".java", ".rb")


async def _fetch_tree(owner: str, repo: str, branch: str = "HEAD") -> list[dict]:
    """Fetch the full recursive file tree with a single API call."""
    url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"
    for attempt in range(5):
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            r = await client.get(url, headers=_github_headers())
            if r.status_code in (403, 429):
                wait = int(r.headers.get("retry-after", 10)) + 2
                print(f"  Rate limited, waiting {wait}s (attempt {attempt + 1}/5)...")
                await asyncio.sleep(wait)
                continue
            r.raise_for_status()
            data = r.json()
            return data.get("tree", [])
    raise Exception("GitHub API rate limit exceeded after 5 retries")


async def _read_and_compress(owner: str, repo: str, branch: str, path: str) -> dict | None:
    """Read a single file from raw.githubusercontent.com and compress it."""
    if not path.endswith(SUPPORTED):
        return None

    url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            r = await client.get(url)
            r.raise_for_status()
            content = r.text

        if len(content) > 10000:
            content = content[:10000] + "\n\n... [file truncated] ..."

        compressed = await paritok_service.compress(
            content=content,
            query="Provide a concise semantic summary of what this file does, its exports, and its role in the architecture.",
            kind="file_read"
        )
        return {
            "type": "file",
            "path": path,
            "compressed_summary": compressed
        }
    except Exception as e:
        return {"type": "file", "path": path, "error": str(e)}


def _build_hierarchy(flat_files: dict[str, dict]) -> dict:
    """Convert a flat dict of {path: data} into a nested directory tree."""
    root: Dict[str, Any] = {"type": "dir", "path": "", "children": {}}

    for path, data in flat_files.items():
        parts = path.split("/")
        node = root
        # Navigate/create directory nodes for all parent segments
        for part in parts[:-1]:
            if part not in node["children"]:
                node["children"][part] = {"type": "dir", "path": "", "children": {}}
            node = node["children"][part]
        # Insert the file
        node["children"][parts[-1]] = data

    return root


async def build_index(repo_url: str, max_depth: int = 2) -> str:
    info = parse_github_url(repo_url)
    owner, repo, branch = info["owner"], info["repo"], info["branch"]

    print(f"Starting index of {repo_url}")

    cache_dir = os.path.join(os.path.dirname(__file__), "cache")
    os.makedirs(cache_dir, exist_ok=True)

    filename = f"{owner}_{repo}_index.json".replace("-", "_")
    output_path = os.path.join(cache_dir, filename)

    if os.path.exists(output_path):
        print(f"Index already exists at {output_path}")
        return output_path

    # 1. Single API call to get the full tree
    print("Fetching full repo tree (single API call)...")
    tree_items = await _fetch_tree(owner, repo, branch)
    file_items = [item for item in tree_items if item.get("type") == "blob"]

    # Filter by max_depth
    file_items = [f for f in file_items if f["path"].count("/") <= max_depth]

    # Filter by supported extensions
    file_items = [f for f in file_items if f["path"].endswith(SUPPORTED)]

    print(f"Found {len(file_items)} supported files (depth ≤ {max_depth})")

    # 2. Build the flat file list
    flat_files: dict[str, dict] = {}
    for f in file_items:
        flat_files[f["path"]] = {
            "type": "file",
            "path": f["path"],
        }

    # 3. Build hierarchy and save
    index = _build_hierarchy(flat_files)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(index, f, indent=2)

    print(f"Successfully indexed {len(flat_files)} files → {output_path}")
    return output_path


async def main():
    parser = argparse.ArgumentParser(description="Offline hierarchical indexer for PariPari.")
    parser.add_argument("repo_url", type=str, help="GitHub repository URL")
    parser.add_argument("--max-depth", type=int, default=3, help="Maximum directory depth to crawl")
    args = parser.parse_args()

    output_path = await build_index(args.repo_url, args.max_depth)
    print(f"Index built successfully at: {output_path}")

if __name__ == "__main__":
    asyncio.run(main())
