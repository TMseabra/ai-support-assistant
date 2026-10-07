import { z } from "zod";

import type { ChatMessage, Model } from "../models/types.js";
import { runTool } from "./tools.js";

// Max turns the model gets, including its final decision. Stops an
// infinite tool-call loop if the model never settles on an answer.
const MAX_STEPS = 4;

const ToolCallSchema = z.object({
  tool: z.enum(["lookup_order", "search_faq"]),
  input: z.record(z.string(), z.unknown()),
});

const DecisionSchema = z.object({
  type: z.literal("decision"),
  category: z.enum(["order_status", "refund", "technical_question", "other"]),
  action: z.enum(["reply", "ask_for_info", "escalate"]),
  reason: z.string(),
  reply: z.string().nullable(),
});

export type Decision = Omit<z.infer<typeof DecisionSchema>, "type">;

export interface Ticket {
  id: number;
  subject: string;
  body: string;
  orderNumber: string | null;
}

export interface ToolCallLog {
  tool: string;
  input: unknown;
  output: unknown;
}

export interface ClassifyResult {
  decision: Decision;
  costUsd: number | null;
  latencyMs: number;
  toolCalls: ToolCallLog[];
}

const SYSTEM_PROMPT = `You are a support-ticket triage agent for an online store.

You have two tools:
- lookup_order: check the real status of an order. Input: {"order_number": "A1001"}
- search_faq: search the store's FAQ for policy / how-to answers. Input: {"query": "refund policy"}

Respond with exactly ONE JSON object per turn. No markdown fences, no extra text.

To call a tool:
{"tool": "lookup_order", "input": {"order_number": "A1001"}}
{"tool": "search_faq", "input": {"query": "..."}}

When you're ready to decide:
{"type": "decision", "category": "order_status|refund|technical_question|other", "action": "reply|ask_for_info|escalate", "reason": "one short sentence", "reply": "exact text to send the customer, or null"}

Rules:
- If the ticket mentions an order number, call lookup_order before saying anything about that order. Never guess an order's status.
- If lookup_order reports the order wasn't found, don't invent details. Use "ask_for_info" (ask the customer to double check the number) or "escalate".
- Use search_faq for questions about policy (refunds, shipping, returns, warranty) when you're not sure of the exact answer.
- You have at most ${MAX_STEPS} turns total, including your final decision. Don't call a tool you don't need.`;

function buildTicketMessage(ticket: Ticket): string {
  return [
    `Subject: ${ticket.subject}`,
    `Order number mentioned: ${ticket.orderNumber ?? "none"}`,
    "",
    ticket.body,
  ].join("\n");
}

function stripFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(json)?\s*/i, "")
    .replace(/```$/, "")
    .trim();
}

type Step =
  | { kind: "tool"; tool: "lookup_order" | "search_faq"; input: Record<string, unknown> }
  | { kind: "decision"; decision: Decision };

function parseStep(raw: string): Step {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripFences(raw));
  } catch {
    throw new Error(`Model did not return valid JSON:\n${raw}`);
  }

  if (typeof parsed === "object" && parsed !== null && "tool" in parsed) {
    const toolCall = ToolCallSchema.parse(parsed);
    return { kind: "tool", tool: toolCall.tool, input: toolCall.input };
  }

  const { type: _type, ...decision } = DecisionSchema.parse(parsed);
  return { kind: "decision", decision };
}

export async function classifyTicket(model: Model, ticket: Ticket): Promise<ClassifyResult> {
  const messages: ChatMessage[] = [{ role: "user", content: buildTicketMessage(ticket) }];
  const toolCalls: ToolCallLog[] = [];

  let totalLatencyMs = 0;
  let totalCostUsd = 0;
  let costIsKnown = false;

  for (let step = 0; step < MAX_STEPS; step++) {
    const reply = await model.complete(SYSTEM_PROMPT, messages);
    totalLatencyMs += reply.latencyMs;
    if (reply.costUsd !== null) {
      totalCostUsd += reply.costUsd;
      costIsKnown = true;
    }

    messages.push({ role: "assistant", content: reply.text });

    const parsedStep = parseStep(reply.text);

    if (parsedStep.kind === "decision") {
      return {
        decision: parsedStep.decision,
        costUsd: costIsKnown ? totalCostUsd : null,
        latencyMs: totalLatencyMs,
        toolCalls,
      };
    }

    const output = await runTool(parsedStep.tool, parsedStep.input);
    toolCalls.push({ tool: parsedStep.tool, input: parsedStep.input, output });
    messages.push({
      role: "user",
      content: `Tool result for ${parsedStep.tool}: ${JSON.stringify(output)}`,
    });
  }

  // Ran out of turns without a decision. Fail safe: escalate rather than
  // silently return nothing or make something up.
  return {
    decision: {
      category: "other",
      action: "escalate",
      reason: `Exceeded ${MAX_STEPS} steps without reaching a decision.`,
      reply: null,
    },
    costUsd: costIsKnown ? totalCostUsd : null,
    latencyMs: totalLatencyMs,
    toolCalls,
  };
}
