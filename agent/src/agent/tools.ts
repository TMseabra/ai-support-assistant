import { pool } from "../db/pool.js";
import { FAQ } from "../data/faq.js";

// Tool 1: look up the real status of an order. The agent must call this
// instead of guessing -- that's the whole point of giving it a tool.
export async function lookupOrder(orderNumber: string) {
  const { rows } = await pool.query(
    `SELECT order_number, status, item FROM orders WHERE order_number = $1`,
    [orderNumber]
  );

  if (rows.length === 0) {
    return { found: false };
  }

  const [row] = rows;
  return { found: true, orderNumber: row.order_number, status: row.status, item: row.item };
}

// Tool 2: find FAQ entries relevant to a free-text query. Just keyword
// overlap, no embeddings -- the FAQ is tiny, so this is enough and it's
// trivial to explain and debug.
//
// A whole keyword phrase (e.g. "international") found in the query counts
// double; a single word only shared with the question text counts once.
// Without that weighting, generic words like "policy" or "shipping" tie
// several unrelated entries at the same score, and ties keep whichever
// entry happens to come first in the array -- which once silently pushed
// the actual "do you ship internationally?" entry out of the results for
// a query about international shipping. See README "what failed" section.
export function searchFaq(query: string, limit = 2) {
  const q = query.toLowerCase();
  const queryWords = new Set(q.split(/\W+/).filter(Boolean));

  const scored = FAQ.map((entry) => {
    const keywordScore = entry.keywords.filter((k) => q.includes(k.toLowerCase())).length * 2;

    const questionWords = entry.question.toLowerCase().split(/\W+/).filter(Boolean);
    const questionScore = questionWords.filter((w) => queryWords.has(w)).length;

    return { entry, score: keywordScore + questionScore };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.entry);
}

// Dispatches a tool call requested by the model to the actual function.
export async function runTool(name: string, input: Record<string, unknown>): Promise<unknown> {
  if (name === "lookup_order") {
    const orderNumber = input.order_number;
    if (typeof orderNumber !== "string") return { error: "Missing order_number" };
    return lookupOrder(orderNumber);
  }

  if (name === "search_faq") {
    const query = input.query;
    if (typeof query !== "string") return { error: "Missing query" };
    return { results: searchFaq(query) };
  }

  return { error: `Unknown tool "${name}"` };
}
