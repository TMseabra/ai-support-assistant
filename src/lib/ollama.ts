import { Ollama } from "ollama";

const ollama = new Ollama({
  host: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
});

const MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";

const SYSTEM_PROMPT =
  "És um assistente de suporte ao cliente. Responde de forma clara, simpática e objetiva.";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export async function streamAssistantReply(history: ChatMessage[]) {
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
  ];

  return ollama.chat({
    model: MODEL,
    messages,
    stream: true,
  });
}
