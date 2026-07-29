"""
paritok_service.py — Client for the Paritok compression API.

Paritok compresses tool outputs, file reads, and conversation history
BEFORE they are sent to the LLM. This is where the 74-95% token savings come from.

API: POST https://www.paritok.com/api/compress
Body: { "content": str, "query": str, "kind": str }
Response: { "compressed": str, "gpu_available": bool }
"""

import os
import httpx
from dataclasses import dataclass, field
from typing import Literal

PARITOK_COMPRESS_URL = "https://www.paritok.com/api/compress"

# Supported content kinds (hints to Paritok's compression model)
Kind = Literal["file_read", "tool_result", "history"]

# ── Token estimation ──────────────────────────────────────────────────────────
# Paritok doesn't return token counts — estimate at ~4 chars/token (GPT standard)

def _estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)


# ── In-memory telemetry tracker ───────────────────────────────────────────────
# Updated on every compress() call; read by /api/telemetry

@dataclass
class _TelemetryState:
    total_requests: int = 0
    original_tokens: int = 0
    compressed_tokens: int = 0
    gpu_available: bool = False

    @property
    def tokens_saved(self) -> int:
        return self.original_tokens - self.compressed_tokens

    @property
    def compression_ratio(self) -> float:
        if self.original_tokens == 0:
            return 0.0
        return round((1 - self.compressed_tokens / self.original_tokens) * 100, 2)

    @property
    def estimated_cost_saved(self) -> float:
        # GPT-4o: $5 per 1M input tokens = $0.000005 per token
        return round(self.tokens_saved * 0.000005, 6)

    def to_dict(self) -> dict:
        return {
            "total_requests": self.total_requests,
            "original_tokens": self.original_tokens,
            "compressed_tokens": self.compressed_tokens,
            "compression_ratio": self.compression_ratio,
            "estimated_cost_saved": self.estimated_cost_saved,
            "gpu_available": self.gpu_available,
        }


# Singleton state — shared across all requests in the process
_stats = _TelemetryState()


def get_telemetry() -> dict:
    """Return current telemetry stats."""
    return _stats.to_dict()


# ── Compress ──────────────────────────────────────────────────────────────────

async def compress(
    content: str,
    query: str,
    kind: Kind = "file_read",
    api_key: str | None = None,
) -> str:
    """
    Compress content through Paritok before sending to the LLM.

    Returns the compressed string (or original if compression fails/GPU not ready).
    Always updates the telemetry tracker.
    """
    key = api_key or os.getenv("PARITOK_API_KEY", "")
    original_tokens = _estimate_tokens(content)

    compressed_content = content  # fallback
    try:
        async with httpx.AsyncClient(timeout=120) as client:  # 120s timeout
            resp = await client.post(
                PARITOK_COMPRESS_URL,
                headers={
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                },
                json={
                    "content": content,
                    "query": query,
                    "kind": kind,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            gpu = data.get("gpu_available", False)
            _stats.gpu_available = gpu

            # Only use compressed output when GPU was available (quality guarantee)
            result = data.get("compressed", content)
            if result and result != content:
                compressed_content = result
                print(f"[Paritok] Successfully compressed {kind}")
            elif not gpu:
                print(f"[Paritok] GPU unavailable — using original ({kind})")

    except Exception as e:
        # Never let compression failures break the agent — fall back to original
        print(f"[Paritok] compress failed ({kind}): {type(e).__name__} — using original")

    compressed_tokens = _estimate_tokens(compressed_content)
    ratio = round((1 - compressed_tokens / original_tokens) * 100, 1) if original_tokens > 0 else 0
    if compressed_content != content:
        print(f"[Paritok] ✓ compressed ({kind}): {original_tokens}→{compressed_tokens} tokens ({ratio}% saved)")
    else:
        print(f"[Paritok] ⚠ no compression ({kind}): returned original ({original_tokens} tokens)")

    # Update stats
    _stats.total_requests += 1
    _stats.original_tokens += original_tokens
    _stats.compressed_tokens += compressed_tokens

    return compressed_content
