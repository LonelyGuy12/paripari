"""
telemetry.py — Serve live compression stats tracked by paritok_service.

Since Paritok's API is a /compress endpoint (not a /stats endpoint),
we track our own stats in paritok_service._stats and serve them here.
Stats update in real-time as tool calls are made.
"""

import paritok_service


async def fetch_telemetry(paritok_url: str = "", mock_mode: bool = False) -> dict:
    """
    Return current Paritok compression stats.
    Data comes from paritok_service's in-memory tracker,
    which is updated on every compress() call.
    """
    return paritok_service.get_telemetry()
