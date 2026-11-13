export const ASSISTANT_TEXT_PART_ID = "assistant-text";

export type AssistantTextChunk =
  | { type: "text-start"; id: string }
  | { type: "text-delta"; id: string; delta: string }
  | { type: "text-end"; id: string };

const DROPPED_AGENT_CHUNK_TYPES = new Set([
  "text-start",
  "text-end",
  "reasoning-start",
  "reasoning-delta",
  "reasoning-end",
  "start",
  "finish",
]);

export type AgentChunkKind = "text-delta" | "drop" | "forward";

export function classifyAgentChunk(chunk: unknown): AgentChunkKind {
  if (!chunk || typeof chunk !== "object" || !("type" in chunk)) return "drop";
  const type = chunk.type;
  if (typeof type !== "string" || type.length === 0) return "drop";
  if (type === "text-delta") {
    return "delta" in chunk && typeof chunk.delta === "string"
      ? "text-delta"
      : "drop";
  }
  if (DROPPED_AGENT_CHUNK_TYPES.has(type)) return "drop";
  return "forward";
}

export function readAgentTextDelta(chunk: unknown) {
  if (classifyAgentChunk(chunk) !== "text-delta") return "";
  return (chunk as { delta: string }).delta;
}

/** Chunk que pode seguir para o cliente. Texto é reescrito pelo encoder. */
export function forwardAgentChunk(chunk: unknown, isValid: boolean) {
  if (classifyAgentChunk(chunk) !== "forward" || !isValid) return null;
  return chunk;
}

export function createAssistantTextEncoder(id = ASSISTANT_TEXT_PART_ID) {
  let opened = false;
  let sent = "";
  let pending: AssistantTextChunk[] = [];

  const push = (delta: string) => {
    if (!delta) return;
    if (!opened) {
      pending.push({ type: "text-start", id });
      opened = true;
    }
    pending.push({ type: "text-delta", id, delta });
    sent += delta;
  };

  return {
    get sent() {
      return sent;
    },
    push,
    sync(finalText: string) {
      const shown = sent;
      if (shown === finalText || shown.trim() === finalText.trim()) {
        // O cliente já tem o texto que será gravado.
      } else if (finalText.startsWith(shown)) {
        push(finalText.slice(shown.length));
      } else if (shown && finalText.startsWith(shown.trim())) {
        push(finalText.slice(shown.trim().length));
      } else if (!shown.trim()) {
        push(finalText);
      }
      if (opened) {
        pending.push({ type: "text-end", id });
        opened = false;
      }
    },
    drain() {
      const next = pending;
      pending = [];
      return next;
    },
  };
}

export type AssistantTextEncoder = ReturnType<typeof createAssistantTextEncoder>;
