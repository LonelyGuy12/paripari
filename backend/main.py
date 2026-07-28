"""
main.py — FastAPI application for PariPari.

Routes:
  POST /chat          → Run the multi-turn agent; streams SSE events
  GET  /api/telemetry → Live Paritok compression stats
  GET  /health        → Liveness check
"""

import json
import os
from typing import AsyncGenerator

from dotenv import load_dotenv
load_dotenv()  # Must run BEFORE project imports so env vars are available at import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agent import run_agent
from telemetry import fetch_telemetry

# ── Config ────────────────────────────────────────────────────────────────────

PARITOK_URL: str = os.getenv("PARITOK_URL", "https://www.paritok.com")
PARITOK_API_KEY: str = os.getenv("PARITOK_API_KEY", "")
OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "sk-placeholder")
OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
MODEL: str = os.getenv("MODEL", "gpt-4o")
MOCK_MODE: bool = os.getenv("MOCK_MODE", "true").lower() in ("true", "1", "yes")

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="PariPari",
    description="Repo-aware AI copilot that compresses tool outputs through Paritok.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Schemas ───────────────────────────────────────────────────────────────────


class ChatRequest(BaseModel):
    repo_url: str
    question: str


# ── Routes ────────────────────────────────────────────────────────────────────


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "mock_mode": MOCK_MODE,
        "paritok_configured": bool(PARITOK_API_KEY),
        "llm_provider": OPENAI_BASE_URL,
        "model": MODEL,
    }


@app.post("/chat")
async def chat(req: ChatRequest):
    """
    Run the multi-turn agent. Each tool output is compressed through Paritok
    before being added to LLM context — this is where the savings come from.

    Streams Server-Sent Events:
      { "type": "tool_start",   "tool": "...", "input": {...} }
      { "type": "tool_result",  "tool": "...", "output": "..." }
      { "type": "final_answer", "content": "...", "tool_calls": [...] }
      { "type": "error",        "message": "..." }
    """

    async def event_stream() -> AsyncGenerator[str, None]:
        try:
            async for event in run_agent(
                repo_url=req.repo_url,
                question=req.question,
                paritok_url=PARITOK_URL,
                api_key=OPENAI_API_KEY,
                openai_base_url=OPENAI_BASE_URL,
                paritok_api_key=PARITOK_API_KEY,
                model=MODEL,
                mock_mode=MOCK_MODE,
            ):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as exc:
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


class IndexRequest(BaseModel):
    repo_url: str


# In-memory set of repos currently being indexed (prevent duplicate work)
_indexing_in_progress: set[str] = set()


@app.post("/api/index")
async def index_repo(req: IndexRequest):
    """
    Pre-index a repository in the background.
    Called by the frontend as soon as the user enters a repo URL,
    so the index is ready before they even ask a question.
    """
    from github_service import parse_github_url
    import indexer
    import os

    try:
        info = parse_github_url(req.repo_url)
    except ValueError:
        return {"status": "error", "message": "Invalid GitHub URL"}

    key = f"{info['owner']}_{info['repo']}"
    cache_path = os.path.join(os.path.dirname(__file__), "cache", f"{key}_index.json".replace("-", "_"))

    if os.path.exists(cache_path):
        return {"status": "ready", "message": "Index already exists"}

    if key in _indexing_in_progress:
        return {"status": "indexing", "message": "Indexing already in progress"}

    # Fire and forget — index in background
    async def _do_index():
        _indexing_in_progress.add(key)
        try:
            await indexer.build_index(req.repo_url, max_depth=2)
        finally:
            _indexing_in_progress.discard(key)

    import asyncio
    asyncio.create_task(_do_index())
    return {"status": "indexing", "message": "Indexing started in background"}


@app.get("/api/telemetry")
async def telemetry():
    """
    Return live Paritok compression stats.
    Updated in real-time as tool outputs are compressed.

    Returns:
      {
        "total_requests": int,       # compress() calls made
        "original_tokens": int,      # total tokens before compression
        "compressed_tokens": int,    # total tokens after compression
        "compression_ratio": float,  # percentage saved e.g. 73.97
        "estimated_cost_saved": float # USD saved vs uncompressed
      }
    """
    return await fetch_telemetry(paritok_url=PARITOK_URL, mock_mode=MOCK_MODE)
