"""
mock_data.py — Canned demo scenario for reliable hackathon demos.

Scenario: User asks about a bug in a public Python repo.
The agent "investigates" 3 files and proposes a patch.
"""

MOCK_REPO = "https://github.com/tiangolo/fastapi"
MOCK_QUESTION = "Why is the response model not stripping extra fields?"

# Each step simulates an agent tool call
MOCK_AGENT_STEPS = [
    {
        "type": "tool_call",
        "tool": "list_directory",
        "input": {"path": "/"},
        "output": [
            "fastapi/__init__.py",
            "fastapi/routing.py",
            "fastapi/responses.py",
            "fastapi/encoders.py",
            "README.md",
        ],
    },
    {
        "type": "tool_call",
        "tool": "read_file",
        "input": {"path": "fastapi/routing.py"},
        "output": (
            "# fastapi/routing.py (excerpt)\n"
            "class APIRoute(routing.Route):\n"
            "    def __init__(self, path, endpoint, *, response_model=None, **kwargs):\n"
            "        self.response_model = response_model\n"
            "        # BUG: response_model_exclude_unset defaults to False\n"
            "        self.response_model_exclude_unset = kwargs.get('response_model_exclude_unset', False)\n"
            "        super().__init__(path, endpoint, **kwargs)\n"
            "\n"
            "    async def serialize_response(self, response):\n"
            "        if self.response_model:\n"
            "            # Missing: exclude_unset flag not passed to jsonable_encoder\n"
            "            return jsonable_encoder(response, include=self.response_model.__fields__)\n"
            "        return response\n"
        ),
    },
    {
        "type": "tool_call",
        "tool": "read_file",
        "input": {"path": "fastapi/encoders.py"},
        "output": (
            "# fastapi/encoders.py (excerpt)\n"
            "def jsonable_encoder(obj, include=None, exclude=None, by_alias=True,\n"
            "                     exclude_unset=False, exclude_defaults=False):\n"
            "    \"\"\"Convert any object to JSON-serializable format.\"\"\"\n"
            "    if hasattr(obj, '__fields__'):\n"
            "        obj_dict = obj.dict(\n"
            "            include=include,\n"
            "            exclude=exclude,\n"
            "            by_alias=by_alias,\n"
            "            exclude_unset=exclude_unset,  # ← must be forwarded\n"
            "        )\n"
            "        return obj_dict\n"
            "    return obj\n"
        ),
    },
    {
        "type": "tool_call",
        "tool": "propose_patch",
        "input": {"path": "fastapi/routing.py"},
        "output": (
            "--- a/fastapi/routing.py\n"
            "+++ b/fastapi/routing.py\n"
            "@@ -8,7 +8,8 @@ class APIRoute(routing.Route):\n"
            "     async def serialize_response(self, response):\n"
            "         if self.response_model:\n"
            "-            return jsonable_encoder(response, include=self.response_model.__fields__)\n"
            "+            return jsonable_encoder(\n"
            "+                response,\n"
            "+                include=self.response_model.__fields__,\n"
            "+                exclude_unset=self.response_model_exclude_unset,\n"
            "+            )\n"
            "         return response\n"
        ),
    },
]

MOCK_FINAL_ANSWER = (
    "**Root Cause:** In `fastapi/routing.py`, the `serialize_response` method calls "
    "`jsonable_encoder` but never forwards the `exclude_unset` flag. "
    "This means extra/default fields are always included regardless of what you set "
    "on the route.\n\n"
    "**Fix:** Pass `exclude_unset=self.response_model_exclude_unset` to `jsonable_encoder`. "
    "The patch above applies this one-line change."
)

# Telemetry mock — starts at these values and increments per poll
TELEMETRY_BASE = {
    "total_requests": 12,
    "original_tokens": 84_320,
    "compressed_tokens": 21_940,
    "compression_ratio": 73.97,
    "estimated_cost_saved": 1.87,
}

# How much each value grows per poll call (simulates live usage)
TELEMETRY_INCREMENT = {
    "total_requests": 1,
    "original_tokens": 3_200,
    "compressed_tokens": 830,
    "compression_ratio": 0,      # recomputed from tokens
    "estimated_cost_saved": 0,   # recomputed from tokens
}

# Cost per 1K tokens (GPT-4o as reference)
COST_PER_1K_TOKENS = 0.005
