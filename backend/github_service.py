"""
github_service.py — Fetch files and directory listings from public GitHub repos.
Uses the GitHub Contents API (no auth required for public repos, 60 req/hr limit).
"""

import httpx
import os
import re
from typing import Union

GITHUB_API = "https://api.github.com"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")

def _github_headers() -> dict:
    headers = {"Accept": "application/vnd.github+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    return headers

# Parse GitHub URLs like:
#   https://github.com/owner/repo
#   https://github.com/owner/repo/tree/branch/path
_GITHUB_URL_RE = re.compile(
    r"github\.com/(?P<owner>[^/]+)/(?P<repo>[^/]+)"
    r"(?:/tree/(?P<branch>[^/]+)(?P<path>/.*)?)?"
)


def parse_github_url(url: str) -> dict:
    """Extract owner, repo, branch, and path from a GitHub URL."""
    m = _GITHUB_URL_RE.search(url)
    if not m:
        raise ValueError(f"Cannot parse GitHub URL: {url}")
    return {
        "owner": m.group("owner"),
        "repo": m.group("repo"),
        "branch": m.group("branch") or "HEAD",
        "path": (m.group("path") or "/").lstrip("/"),
    }


async def list_directory(owner: str, repo: str, path: str = "", branch: str = "HEAD") -> list[dict]:
    """Return directory contents from GitHub Contents API."""
    url = f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}"
    params = {"ref": branch}
    async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
        r = await client.get(url, params=params, headers=_github_headers())
        r.raise_for_status()
        items = r.json()
        if isinstance(items, dict):
            # Single file returned — treat as a one-item list
            items = [items]
        return [
            {
                "name": item["name"],
                "path": item["path"],
                "type": item["type"],  # "file" | "dir"
                "size": item.get("size", 0),
            }
            for item in items
        ]


async def read_file(owner: str, repo: str, path: str, branch: str = "HEAD") -> str:
    """Fetch raw file content from GitHub."""
    # Use raw.githubusercontent.com for efficiency
    url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        r = await client.get(url)
        r.raise_for_status()
        return r.text


class GitHubService:
    """Stateful service bound to a single repository."""

    def __init__(self, repo_url: str):
        info = parse_github_url(repo_url)
        self.owner = info["owner"]
        self.repo = info["repo"]
        self.branch = info["branch"]
        self.root_path = info["path"]

    async def list_directory(self, path: str = "") -> list[dict]:
        full_path = f"{self.root_path}/{path}".strip("/")
        return await list_directory(self.owner, self.repo, full_path, self.branch)

    async def read_file(self, path: str) -> str:
        full_path = f"{self.root_path}/{path}".strip("/")
        return await read_file(self.owner, self.repo, full_path, self.branch)
