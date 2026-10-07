// The shape every model provider must implement, so the agent loop can
// swap Claude for Ollama (or anything else) without changing its logic.
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ModelReply {
  text: string;
  costUsd: number | null; // null for models with no per-call price (e.g. local Ollama)
  latencyMs: number;
}

export interface Model {
  readonly name: string;
  // "messages" is the running conversation (ticket, tool results, model replies)
  // so the agent can go back and forth with the model over several turns.
  complete(system: string, messages: ChatMessage[]): Promise<ModelReply>;
}
