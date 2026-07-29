"""
agent.py — Multi-turn tool-calling agent with Paritok compression.

Flow per tool call:
  1. LLM returns a tool call
  2. We execute the tool (list_dir / read_file / etc.)
  3. We call Paritok /api/compress on the tool output
  4. We put the COMPRESSED output into the conversation messages
  5. The LLM only ever sees compressed context → huge token savings

This is what makes Paritok most useful — long sessions with many file reads
build up thousands of tokens of history that Paritok squeezes down.
"""

import asyncio
import json
import os
import re
from typing import AsyncGenerator

from openai import AsyncOpenAI

import mock_data
import paritok_service
from github_service import GitHubService

# ── Tool schemas ──────────────────────────────────────────────────────────────

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "view_compressed_map",
            "description": "View the offline compressed semantic map of the entire repository. Always call this FIRST.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_directory",
            "description": "List the files and folders in a directory of the GitHub repo.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Relative path inside the repo. Use '' or '/' for root.",
                    }
                },
                "required": ["path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read the full contents of a specific file in the repo.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Relative file path inside the repo.",
                    }
                },
                "required": ["path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "propose_patch",
            "description": (
                "Propose a unified diff patch to fix the identified bug. "
                "Call this AFTER reading the relevant files."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string"},
                    "explanation": {"type": "string"},
                    "diff": {"type": "string"},
                },
                "required": ["path", "explanation", "diff"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "write_pr_summary",
            "description": "Write a GitHub PR title and description summarising the fix.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "body": {"type": "string"},
                },
                "required": ["title", "body"],
            },
        },
    },
]

SYSTEM_PROMPT = """\
You are PariPari, a senior software engineer and repo-aware AI copilot.
Your job is to investigate bugs, understand codebases, propose minimal patches, and write PR summaries.

WORKFLOW (always follow this order):
1. view_compressed_map() to get a bird's-eye view of the codebase semantics and structural map.
2. read_file on files that are highlighted by the map as relevant. Read AT LEAST 1-3 files before concluding.
3. propose_patch with a minimal unified diff.
4. write_pr_summary with a concise PR title and body.

Be thorough. Use the compressed map to guide your file reads, instead of blindly listing directories. Never skip steps.
"""


def _kind_for_tool(tool_name: str) -> paritok_service.Kind:
    """Map tool names to Paritok content kinds."""
    if tool_name == "read_file":
        return "file_read"
    if tool_name == "view_compressed_map":
        return "history" # The map is already compressed, but we pass it as history to preserve token count
    return "tool_result"


async def _execute_and_compress(
    tool_name: str,
    tool_args: dict,
    github: GitHubService,
    question: str,
    tool_results_collector: list,
    api_key: str,
) -> str:
    """
    Execute a tool, compress the output through Paritok, return compressed text.
    The LLM only sees the compressed version — this is the core token saving.
    """
    # 1. Execute tool → raw output
    if tool_name == "view_compressed_map":
        info = f"{github.owner}_{github.repo}"
        cache_path = os.path.join(os.path.dirname(__file__), "cache", f"{info}_index.json".replace("-", "_"))
        if not os.path.exists(cache_path):
            try:
                import indexer
                repo_url = f"https://github.com/{github.owner}/{github.repo}"
                await indexer.build_index(repo_url, max_depth=2)
            except Exception as e:
                return f"Failed to build index: {e}"

        if os.path.exists(cache_path):
            with open(cache_path, "r", encoding="utf-8") as f:
                full_index = json.load(f)
            
            def extract_paths(node, paths_list):
                if node.get("type") == "file":
                    paths_list.append(node.get("path", ""))
                elif node.get("type") == "dir" and "children" in node:
                    for child in node["children"].values():
                        extract_paths(child, paths_list)
            
            paths = []
            extract_paths(full_index, paths)
            compressed_map_text = "\n".join(paths)
            if len(compressed_map_text) > 1500:
                compressed_map_text = compressed_map_text[:1500] + "\n... [truncated - use list_directory to explore deeper folders!]"
            
            raw_output = compressed_map_text
        else:
            raw_output = "No compressed map found. The backend needs to run indexer.py on this repo first."

    elif tool_name == "list_directory":
        path = tool_args.get("path", "")
        try:
            items = await github.list_directory(path)
            raw_output = json.dumps(items, indent=2)
        except Exception as e:
            raw_output = f"Error listing {path}: {e}"

    elif tool_name == "read_file":
        path = tool_args.get("path", "")
        try:
            content = await github.read_file(path)
            if len(content) > 800:
                content = content[:800] + "\n\n... [truncated — use read_file on a specific section] ..."
            raw_output = content
        except Exception as e:
            raw_output = f"Error reading {path}: {e}"

    elif tool_name == "propose_patch":
        raw_output = json.dumps({
            "status": "patch_proposed",
            "path": tool_args.get("path"),
            "diff": tool_args.get("diff"),
            "explanation": tool_args.get("explanation"),
        })

    elif tool_name == "write_pr_summary":
        raw_output = json.dumps({
            "status": "pr_summary_written",
            "title": tool_args.get("title"),
            "body": tool_args.get("body"),
        })

    else:
        raw_output = f"Unknown tool: {tool_name}"

    # 2. Compress through Paritok — this is the magic
    # Skip compression for the compressed map — it's already compressed by the indexer!
    if tool_name == "view_compressed_map":
        compressed_output = raw_output
        # Still track telemetry so the dashboard reflects the map's token count
        orig_tokens = paritok_service._estimate_tokens(raw_output)
        paritok_service._stats.total_requests += 1
        paritok_service._stats.original_tokens += orig_tokens
        paritok_service._stats.compressed_tokens += orig_tokens
    else:
        kind = _kind_for_tool(tool_name)
        compressed_output = await paritok_service.compress(
            content=raw_output,
            query=question,
            kind=kind,
            api_key=api_key,
        )

    # 3. Collect for frontend display (show raw output so user sees real content)
    tool_results_collector.append({
        "tool": tool_name,
        "input": tool_args,
        "output": raw_output,  # Show uncompressed to user in UI
    })

    return compressed_output  # LLM gets compressed version


async def run_agent(
    repo_url: str,
    question: str,
    paritok_url: str,
    api_key: str,
    paritok_api_key: str,
    openai_base_url: str = "https://api.openai.com/v1",
    model: str = "gpt-4o",
    mock_mode: bool = False,
) -> AsyncGenerator[dict, None]:
    """
    Run the multi-turn tool-calling agent.
    Each tool output is compressed by Paritok before being added to messages.
    Yields SSE event dicts as the agent works.
    """
    if mock_mode:
        async for event in _run_mock_agent(question, paritok_api_key):
            yield event
        return

    github = GitHubService(repo_url)
    # OpenAI client pointing at OpenRouter (or any compatible endpoint)
    client = AsyncOpenAI(api_key=api_key, base_url=openai_base_url)
    tool_results: list[dict] = []

    # ── Background index (telemetry only, not injected into prompt) ──────────
    # We record the index savings for the dashboard, but keep the prompt tiny
    # so the LLM + max_tokens stays well under Groq's TPM limit.
    # Actual compression happens on every list_directory / read_file call below.
    info = f"{github.owner}_{github.repo}"
    cache_path = os.path.join(os.path.dirname(__file__), "cache", f"{info}_index.json".replace("-", "_"))

    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                full_index = json.load(f)
            full_json = json.dumps(full_index)
            # Simulate what the map saving looks like — just count for dashboard
            def _count_paths(node):
                if node.get("type") == "file":
                    return len(node.get("path", ""))
                return sum(_count_paths(c) for c in node.get("children", {}).values())
            compressed_chars = _count_paths(full_index)
            orig_tokens = paritok_service._estimate_tokens(full_json)
            comp_tokens = max(1, compressed_chars // 4)
            paritok_service._stats.total_requests += 1
            paritok_service._stats.original_tokens += orig_tokens
            paritok_service._stats.compressed_tokens += comp_tokens
            print(f"[Map] Index loaded: {orig_tokens}→{comp_tokens} tokens ({round((1-comp_tokens/orig_tokens)*100, 1)}% saved)")
        except Exception:
            pass

    messages: list[dict] = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Repository: {repo_url}\n\n"
                f"Question: {question}\n\n"
                "Please investigate thoroughly and propose a fix."
            ),
        },
    ]

    MAX_ITERATIONS = 40
    WINDOW = 6  # keep last 6 assistant turns ≈ 12 msgs; Paritok keeps them dense

    for iteration in range(MAX_ITERATIONS):
        anchor = messages[:2]
        history = messages[2:]
        
        kept_history = []
        assistant_count = 0
        for m in reversed(history):
            kept_history.insert(0, m)
            if isinstance(m, dict) and m.get("role") == "assistant":
                assistant_count += 1
                if assistant_count >= WINDOW:
                    break
                    
        trimmed_messages = anchor + kept_history

        # Retry on 429 rate-limit or tool_use_failed
        tool_use_failed = False
        for attempt in range(4):
            try:
                response = await client.chat.completions.create(
                    model=model,
                    messages=trimmed_messages,
                    tools=TOOLS,
                    tool_choice="auto",
                    max_tokens=1024,
                )
                break
            except Exception as e:
                err_str = str(e)
                if "rate_limit_exceeded" in err_str or "429" in err_str:
                    # Parse "Please try again in X.Xs"
                    m = re.search(r"try again in (\d+\.?\d*)s", err_str)
                    wait = float(m.group(1)) + 1.0 if m else 6.0
                    if attempt < 3:
                        await asyncio.sleep(wait)
                        continue
                elif "tool_use_failed" in err_str:
                    # Groq error when model outputs bad JSON/XML for tool calls
                    messages.append({
                        "role": "user",
                        "content": "API ERROR: Your last output was an invalid tool call format. Please generate the tool call strictly following the OpenAI JSON format."
                    })
                    tool_use_failed = True
                    break
                raise

        if tool_use_failed:
            continue

        msg = response.choices[0].message

        if msg.tool_calls:
            messages.append(msg.model_dump(exclude_none=True))

            for tc in msg.tool_calls:
                tool_name = tc.function.name
                tool_args = json.loads(tc.function.arguments)

                yield {
                    "type": "tool_start",
                    "tool": tool_name,
                    "input": tool_args,
                    "iteration": iteration,
                }

                # Execute + compress through Paritok
                compressed_output = await _execute_and_compress(
                    tool_name=tool_name,
                    tool_args=tool_args,
                    github=github,
                    question=question,
                    tool_results_collector=tool_results,
                    api_key=paritok_api_key,
                )

                yield {
                    "type": "tool_result",
                    "tool": tool_name,
                    "input": tool_args,
                    "output": tool_results[-1]["output"],  # raw for display
                }

                # LLM gets the compressed version
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": compressed_output,
                })

        else:
            final_answer = msg.content or ""
            yield {
                "type": "final_answer",
                "content": final_answer,
                "tool_calls": tool_results,
            }
            return

        # Throttle to avoid hitting Groq's 8000 TPM limit (max ~4 requests/min)
        await asyncio.sleep(12)

    # Safety: hit max iterations — force a final answer from what was gathered
    messages.append({
        "role": "user",
        "content": (
            "You've now read enough files. Based on everything above, "
            "give a clear, complete final answer to the original question. "
            "If relevant, include a proposed patch and PR summary."
        ),
    })
    try:
        final_response = await client.chat.completions.create(
            model=model,
            messages=trimmed_messages + [messages[-1]],  # Safe context + the new final prompt
            max_tokens=1024,
            tools=TOOLS,
            tool_choice="auto",
        )
        msg = final_response.choices[0].message
        if msg.tool_calls and not msg.content:
            final_text = "I reached the maximum iteration limit. I wanted to keep investigating, but I've stopped for now. You can check the tool calls above for the information I gathered!"
        else:
            final_text = msg.content or "Investigation complete."
    except Exception as e:
        final_text = f"Investigation stopped. (Note: {str(e)})"

    yield {
        "type": "final_answer",
        "content": final_text,
        "tool_calls": tool_results,
    }



async def _run_mock_agent(
    question: str,
    paritok_api_key: str,
) -> AsyncGenerator[dict, None]:
    """
    Replay canned demo steps AND run real Paritok compression on each output
    so telemetry reflects actual API calls, not faked numbers.
    """
    import asyncio

    tool_results = []

    for i, step in enumerate(mock_data.MOCK_AGENT_STEPS):
        await asyncio.sleep(0.4)

        yield {
            "type": "tool_start",
            "tool": step["tool"],
            "input": step["input"],
            "iteration": i,
        }

        await asyncio.sleep(0.5)

        raw_output = (
            json.dumps(step["output"], indent=2)
            if isinstance(step["output"], list)
            else step["output"]
        )

        # Even in mock mode — run REAL Paritok compression so stats are real
        kind = _kind_for_tool(step["tool"])
        await paritok_service.compress(
            content=raw_output,
            query=question,
            kind=kind,
            api_key=paritok_api_key,
        )

        tool_results.append({
            "tool": step["tool"],
            "input": step["input"],
            "output": raw_output,
        })

        yield {
            "type": "tool_result",
            "tool": step["tool"],
            "input": step["input"],
            "output": raw_output,
        }

    await asyncio.sleep(0.4)
    yield {
        "type": "final_answer",
        "content": mock_data.MOCK_FINAL_ANSWER,
        "tool_calls": tool_results,
    }
