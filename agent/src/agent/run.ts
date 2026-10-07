// The agent loop: find tickets that don't have a decision yet, classify
// each one with the configured model, and write the result to the
// "decisions" table. Run with: npm run agent
import "dotenv/config";

import { pool } from "../db/pool.js";
import { ClaudeModel } from "../models/claude.js";
import { OllamaModel } from "../models/ollama.js";
import type { Model } from "../models/types.js";
import { classifyTicket, type Ticket } from "./classify.js";

// MODEL_PROVIDER picks which implementation of the Model interface to use.
// "ollama" runs free, locally, no API key needed. "claude" needs
// ANTHROPIC_API_KEY set and costs a small amount per call.
function createModel(): Model {
  const provider = process.env.MODEL_PROVIDER ?? "ollama";
  if (provider === "claude") return new ClaudeModel();
  if (provider === "ollama") return new OllamaModel();
  throw new Error(`Unknown MODEL_PROVIDER "${provider}", expected "claude" or "ollama".`);
}

async function getUnprocessedTickets(): Promise<Ticket[]> {
  const { rows } = await pool.query(
    `SELECT t.id, t.subject, t.body, t.order_number
     FROM tickets t
     LEFT JOIN decisions d ON d.ticket_id = t.id
     WHERE d.id IS NULL
     ORDER BY t.id`
  );

  return rows.map((row) => ({
    id: row.id,
    subject: row.subject,
    body: row.body,
    orderNumber: row.order_number,
  }));
}

async function processTicket(model: Model, ticket: Ticket) {
  console.log(`\nTicket #${ticket.id}: ${ticket.subject}`);

  const { decision, costUsd, latencyMs, toolCalls } = await classifyTicket(model, ticket);

  await pool.query(
    `INSERT INTO decisions (ticket_id, category, action, reason, reply_text, model, cost_usd, latency_ms, tool_calls)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      ticket.id,
      decision.category,
      decision.action,
      decision.reason,
      decision.reply,
      model.name,
      costUsd,
      latencyMs,
      JSON.stringify(toolCalls),
    ]
  );

  if (toolCalls.length > 0) {
    console.log(`  tools used: ${toolCalls.map((t) => t.tool).join(", ")}`);
  }
  console.log(`  category: ${decision.category}`);
  console.log(`  action:   ${decision.action}`);
  console.log(`  reason:   ${decision.reason}`);
  if (decision.reply) console.log(`  reply:    ${decision.reply}`);
  const cost = costUsd !== null ? `$${costUsd.toFixed(6)}` : "n/a";
  console.log(`  cost: ${cost}, latency: ${latencyMs}ms`);
}

async function main() {
  const model = createModel();
  console.log(`Using model: ${model.name} (provider: ${process.env.MODEL_PROVIDER ?? "ollama"})`);

  const tickets = await getUnprocessedTickets();
  if (tickets.length === 0) {
    console.log("No new tickets to process.");
  }

  for (const ticket of tickets) {
    try {
      await processTicket(model, ticket);
    } catch (err) {
      console.error(`  Failed to process ticket #${ticket.id}:`, err);
    }
  }

  await pool.end();
}

main().catch((err) => {
  console.error("Agent run failed:", err);
  process.exit(1);
});
