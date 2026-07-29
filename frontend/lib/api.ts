/**
 * lib/api.ts — Backend client utilities
 */

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export interface ChatRequest {
  repo_url: string;
  question: string;
}

export interface AgentEvent {
  type: "tool_start" | "tool_result" | "final_answer" | "error";
  tool?: string;
  input?: Record<string, unknown>;
  output?: string;
  content?: string;
  tool_calls?: ToolCall[];
  iteration?: number;
  message?: string;
}

export interface ToolCall {
  tool: string;
  input: Record<string, unknown>;
  output: string;
}

export interface TelemetryData {
  total_requests: number;
  original_tokens: number;
  compressed_tokens: number;
  compression_ratio: number;
  estimated_cost_saved: number;
}

/**
 * Stream chat events from the backend.
 * Calls onEvent for each SSE payload.
 */
export async function streamChat(
  req: ChatRequest,
  onEvent: (event: AgentEvent) => void,
  onDone: () => void
): Promise<void> {
  const response = await fetch(`${BACKEND}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Backend error ${response.status}: ${text}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") {
          onDone();
          return;
        }
        try {
          const event: AgentEvent = JSON.parse(raw);
          onEvent(event);
        } catch {
          // Skip malformed lines
        }
      }
    }
  }
  onDone();
}

/**
 * Fetch telemetry stats from the backend.
 */
export async function fetchTelemetry(): Promise<TelemetryData> {
  const res = await fetch(`${BACKEND}/api/telemetry`, { cache: "no-store" });
  if (!res.ok) throw new Error("Telemetry fetch failed");
  return res.json();
}
