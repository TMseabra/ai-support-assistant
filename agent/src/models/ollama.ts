import { Ollama } from "ollama";

import type { ChatMessage, Model, ModelReply } from "./types.js";

export class OllamaModel implements Model {
  readonly name: string;
  private client: Ollama;

  constructor(modelId = process.env.OLLAMA_MODEL ?? "llama3.2") {
    this.name = modelId;
    this.client = new Ollama({
      host: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    });
  }

  async complete(system: string, messages: ChatMessage[]): Promise<ModelReply> {
    const start = Date.now();

    const response = await this.client.chat({
      model: this.name,
      messages: [{ role: "system", content: system }, ...messages],
      stream: false,
    });

    return {
      text: response.message.content,
      costUsd: null, // runs on your own machine, no per-call price
      latencyMs: Date.now() - start,
    };
  }
}
