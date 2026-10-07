// Runs every ticket in dataset.ts through a model and reports accuracy,
// cost and latency. Run with: npm run eval
//
// Only touches the "orders" table (to seed the fixtures the eval tickets
// reference) -- it never writes to "tickets" or "decisions", so it's safe
// to run as often as you like without polluting the manual-testing data
// from db/seed.ts.
import "dotenv/config";

import { pool } from "../db/pool.js";
import { classifyTicket } from "../agent/classify.js";
import { ClaudeModel } from "../models/claude.js";
import { OllamaModel } from "../models/ollama.js";
import type { Model } from "../models/types.js";
import { EVAL_ORDERS, EVAL_TICKETS } from "./dataset.js";

async function seedEvalOrders() {
  for (const o of EVAL_ORDERS) {
    await pool.query(
      `INSERT INTO orders (order_number, customer_email, status, item)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (order_number) DO UPDATE SET status = EXCLUDED.status, item = EXCLUDED.item`,
      [o.order_number, o.customer_email, o.status, o.item]
    );
  }
}

interface Miss {
  id: number;
  subject: string;
  expectedCategory: string;
  gotCategory: string;
  expectedAction: string;
  gotAction: string;
}

interface ModelStats {
  modelName: string;
  total: number;
  categoryCorrect: number;
  actionCorrect: number;
  bothCorrect: number;
  totalCostUsd: number;
  costIsKnown: boolean;
  totalLatencyMs: number;
  misses: Miss[];
}

async function evaluateModel(model: Model): Promise<ModelStats> {
  const stats: ModelStats = {
    modelName: model.name,
    total: 0,
    categoryCorrect: 0,
    actionCorrect: 0,
    bothCorrect: 0,
    totalCostUsd: 0,
    costIsKnown: false,
    totalLatencyMs: 0,
    misses: [],
  };

  for (const ticket of EVAL_TICKETS) {
    stats.total++;
    process.stdout.write(`  #${ticket.id} ${ticket.subject} ... `);

    try {
      const { decision, costUsd, latencyMs } = await classifyTicket(model, {
        id: ticket.id,
        subject: ticket.subject,
        body: ticket.body,
        orderNumber: ticket.orderNumber,
      });

      stats.totalLatencyMs += latencyMs;
      if (costUsd !== null) {
        stats.totalCostUsd += costUsd;
        stats.costIsKnown = true;
      }

      const categoryOk = decision.category === ticket.expectedCategory;
      const actionOk = decision.action === ticket.expectedAction;
      if (categoryOk) stats.categoryCorrect++;
      if (actionOk) stats.actionCorrect++;
      if (categoryOk && actionOk) stats.bothCorrect++;

      console.log(actionOk && categoryOk ? "OK" : "MISS");

      if (!actionOk || !categoryOk) {
        stats.misses.push({
          id: ticket.id,
          subject: ticket.subject,
          expectedCategory: ticket.expectedCategory,
          gotCategory: decision.category,
          expectedAction: ticket.expectedAction,
          gotAction: decision.action,
        });
      }
    } catch (err) {
      console.log("ERROR");
      stats.misses.push({
        id: ticket.id,
        subject: ticket.subject,
        expectedCategory: ticket.expectedCategory,
        gotCategory: "n/a",
        expectedAction: ticket.expectedAction,
        gotAction: `ERROR: ${(err as Error).message}`,
      });
    }
  }

  return stats;
}

function pct(n: number, total: number): string {
  return `${Math.round((n / total) * 100)}%`;
}

function printReport(stats: ModelStats) {
  console.log(`\n=== ${stats.modelName} ===`);
  console.log(`Action accuracy:   ${stats.actionCorrect}/${stats.total} (${pct(stats.actionCorrect, stats.total)})`);
  console.log(`Category accuracy: ${stats.categoryCorrect}/${stats.total} (${pct(stats.categoryCorrect, stats.total)})`);
  console.log(`Both correct:      ${stats.bothCorrect}/${stats.total} (${pct(stats.bothCorrect, stats.total)})`);
  console.log(
    `Avg cost:   ${stats.costIsKnown ? "$" + (stats.totalCostUsd / stats.total).toFixed(6) : "$0 (local model)"}`
  );
  console.log(`Avg latency: ${Math.round(stats.totalLatencyMs / stats.total)}ms`);

  if (stats.misses.length > 0) {
    console.log(`\nMissed (${stats.misses.length}):`);
    for (const m of stats.misses) {
      console.log(
        `  #${m.id} "${m.subject}"\n` +
          `     expected category=${m.expectedCategory} action=${m.expectedAction}\n` +
          `     got      category=${m.gotCategory} action=${m.gotAction}`
      );
    }
  }
}

function printMarkdownSummary(allStats: ModelStats[]) {
  console.log("\n\n--- Summary (copy into README) ---\n");
  console.log("| Model | Action accuracy | Category accuracy | Avg cost | Avg latency |");
  console.log("|---|---|---|---|---|");
  for (const s of allStats) {
    const avgCost = s.costIsKnown ? `$${(s.totalCostUsd / s.total).toFixed(6)}` : "$0 (local)";
    console.log(
      `| ${s.modelName} | ${s.actionCorrect}/${s.total} (${pct(s.actionCorrect, s.total)}) | ` +
        `${s.categoryCorrect}/${s.total} (${pct(s.categoryCorrect, s.total)}) | ${avgCost} | ` +
        `${Math.round(s.totalLatencyMs / s.total)}ms |`
    );
  }
}

async function main() {
  await seedEvalOrders();

  const models: Model[] = [new OllamaModel()];
  if (process.env.ANTHROPIC_API_KEY) {
    models.push(new ClaudeModel());
  } else {
    console.log("ANTHROPIC_API_KEY not set -- skipping Claude, evaluating Ollama only.\n");
  }

  const allStats: ModelStats[] = [];
  for (const model of models) {
    console.log(`\nEvaluating ${model.name} on ${EVAL_TICKETS.length} tickets...`);
    const stats = await evaluateModel(model);
    printReport(stats);
    allStats.push(stats);
  }

  printMarkdownSummary(allStats);

  await pool.end();
}

main().catch((err) => {
  console.error("Evaluation failed:", err);
  process.exit(1);
});
