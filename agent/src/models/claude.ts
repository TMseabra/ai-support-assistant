import Anthropic from "@anthropic-ai/sdk";

import type { ChatMessage, Model, ModelReply } from "./types.js";

// Anthropic's API doesn't return a dollar cost, only token counts, so we
// compute it ourselves. Prices are per million tokens.
// Source: https://anotherwrapper.com/llm-pricing/claude-haiku-4-5-20251001 (Oct 2026)
const PRICING_PER_MILLION_TOKENS: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5-20251001": { input: 1.0, output: 5.0 },
  "claude-sonnet-5": { input: 3.0, output: 15.0 },
};

export class ClaudeModel implements Model {
  readonly name: string;
  private client: Anthropic;

  constructor(modelId = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001") {
    this.name = modelId;
    this.client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  }

  async complete(system: string, messages: ChatMessage[]): Promise<ModelReply> {
    const start = Date.now();

    const response = await this.client.messages.create({
      model: this.name,
      max_tokens: 1024,
      system,
      messages,
    });

    const latencyMs = Date.now() - start;

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    const pricing = PRICING_PER_MILLION_TOKENS[this.name];
    const costUsd = pricing
      ? (response.usage.input_tokens / 1_000_000) * pricing.input +
        (response.usage.output_tokens / 1_000_000) * pricing.output
      : null;

    return { text, costUsd, latencyMs };
  }
}
