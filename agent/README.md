# Ticket Triage Agent

An autonomous agent that reads a support ticket, decides what to do about it, and
writes its decision (and why, and at what cost) to a database — without a human
triggering each step.

Built as a portfolio project to practice the core pieces of an "AI agent" system:
a swappable model layer, tools the model can call, a database for state, and a
real evaluation harness instead of eyeballing a few outputs.

## What it does

For each ticket, the agent:

1. **Classifies** it into a category: `order_status`, `refund`, `technical_question`, or `other`.
2. **Decides an action**: `reply` (it has enough to answer), `ask_for_info` (needs
   something from the customer first), or `escalate` (needs a human).
3. **Uses tools** to ground its answer in real data instead of guessing:
   - `lookup_order` — checks the real status of an order in Postgres.
   - `search_faq` — searches a small FAQ knowledge base for policy answers.
4. **Writes every decision** to Postgres: category, action, reason, the reply text,
   which model was used, what it cost, how long it took, and which tools it called.

## Architecture

```
                    ┌─────────────────────────┐
  ticket  ───────▶  │  agent loop (classify.ts)│
                    │                          │
                    │  loop (max 4 turns):     │
                    │   model.complete(...)    │◀────────┐
                    │     │                    │         │
                    │     ▼                    │         │
                    │  "call a tool"?  ────────┼─▶ tools.ts
                    │     │  yes               │   ├─ lookup_order (Postgres)
                    │     │  (feed result back)│   └─ search_faq (keyword match)
                    │     ▼  no                │         │
                    │  final decision          │◀────────┘
                    └───────────┬──────────────┘
                                ▼
                     INSERT INTO decisions
                (category, action, reason, reply,
                 model, cost, latency, tool_calls)
```

The `Model` interface (`src/models/types.ts`) is what makes the model swappable:
both `ClaudeModel` and `OllamaModel` implement the same `complete(system, messages)`
method, so `classify.ts` never knows or cares which one it's talking to.

## Project structure

```
db/schema.sql           tables: orders, tickets, decisions
src/db/                 Postgres connection, migrate + seed scripts
src/models/             the Model interface, and the Claude / Ollama implementations
src/data/faq.ts         the FAQ knowledge base (8 entries)
src/agent/tools.ts       the two tools: lookup_order, search_faq
src/agent/classify.ts   the agent loop: prompt, tool-call parsing, decision schema
src/agent/run.ts        CLI entry point -- processes unprocessed tickets
src/eval/dataset.ts     30 hand-labeled tickets with the expected category/action
src/eval/run.ts         runs the dataset through a model, prints accuracy/cost/time
```

## How to run it

**Prerequisites:** Node.js 20+, Docker Desktop, [Ollama](https://ollama.com) with a
model pulled (e.g. `ollama pull qwen2.5:7b` or `llama3.2`). An Anthropic API key is
optional — only needed to also run/evaluate Claude.

```bash
cd agent
docker compose up -d        # starts Postgres locally on port 5433
npm install
cp .env.example .env        # defaults already point at the Docker Postgres + Ollama
npm run migrate             # creates the tables
npm run seed                # 5 sample orders + tickets, for manually poking at the agent
npm run agent                # processes every ticket that doesn't have a decision yet
```

To also evaluate (or just run) Claude, add `ANTHROPIC_API_KEY` to `.env`, and either
set `MODEL_PROVIDER=claude` in `.env` or edit `src/eval/run.ts`.

### Running the evaluation

```bash
npm run eval
```

This seeds its own 10 fixed orders, runs all 30 tickets in `src/eval/dataset.ts`
through every available model (Ollama always; Claude too if `ANTHROPIC_API_KEY` is
set), and prints per-ticket pass/fail plus a summary table. It never touches the
`tickets`/`decisions` tables, so it's safe to re-run as often as you like.

## Results

Real output from `npm run eval` on this machine. Claude hasn't been evaluated yet —
no Anthropic API key was available while building this — so there's only one row.

| Model | Action accuracy | Category accuracy | Avg cost | Avg latency |
|---|---|---|---|---|
| qwen2.5:7b (Ollama, local) | 20/30 (67%) | 26/30 (87%) | $0 (local) | 1785ms |

What "action accuracy" means here: the agent's `reply` / `ask_for_info` / `escalate`
decision matched the hand-labeled expected action in `dataset.ts` exactly.

To add the Claude row later: set `ANTHROPIC_API_KEY` in `.env` and run `npm run eval`
again — it picks up Claude automatically and prints both rows.

## What failed and what I changed

**1. Before the agent had tools, it hallucinated.** In the first version (no
`lookup_order`/`search_faq`), a ticket referencing a non-existent order (`Z9999`)
got a confident, completely made-up reply: *"your order is in transit."* Adding the
tool loop and the rule "never guess an order's status, call `lookup_order` first"
fixed this — the agent now correctly says it can't find the order and asks the
customer to double-check it.

**2. The FAQ search had a real ranking bug.** For the query *"international shipping
policy"*, three FAQ entries tied on score because they each shared one generic word
(`shipping`, `policy`) with the query. Ties kept whichever entry happened to come
first in the array — which excluded the one actually about international shipping.
The agent then confidently told a customer *"we don't ship internationally,"* which
is false. Fixed by weighting a whole matched keyword phrase (e.g. `"international"`)
double over an incidental single-word match in the question text. Confirmed with
the same query before and after the fix.

**3. Tightening the escalation rules didn't simply help.** The first evaluation run
showed a clear pattern: the agent almost never failed on *content* (tool use and
factual answers were fine), it failed on *judgment* — it tried to "helpfully" reply
to an angry customer threatening a chargeback, a legal/data-protection complaint, a
spam message, and a request to bypass warranty terms, instead of recognizing those
need a human. I added explicit escalation triggers to the system prompt (anger,
legal mentions, billing discrepancies, non-support messages, account-detail changes,
policy bypass requests).

Result: category accuracy improved (83% → 87%), but action accuracy actually *dropped*
slightly (67% → 63%) on the next run — the small local model started over-escalating
ordinary refund requests it used to handle correctly, and on one ticket it broke the
JSON output format entirely. Re-running the exact same code a third time produced yet
a third set of specific misses, with the overall numbers landing back at 67%/87%. That
run-to-run variation, on identical prompts and inputs, is itself a finding: a 7B local
model's outputs aren't fully stable, so a single evaluation run has real noise, and I
shouldn't over-read one run's delta as "the prompt change worked/didn't work."

What I kept from this: the escalation rules themselves are more correct regardless
(an agent that never escalates angry or legal messages is a worse agent), and I added
a retry: if the model's output fails JSON/schema validation, the agent now tells it
what was wrong and gives it one more turn instead of failing the whole ticket. That
turned the one hard schema-violation error into a normal retry-and-succeed.

**Takeaway for the write-up:** prompt changes on a small local model are noisy enough
that a single before/after run isn't trustworthy evidence either way — this is also
exactly the kind of thing worth re-checking once Claude is in the comparison, since a
larger model should be more consistent run-to-run.

## Not done yet (by design)

- **Claude vs. Ollama comparison** — code is ready (`MODEL_PROVIDER=claude`), just
  needs an API key to actually run.
- **Deployment to Cloud Run + Cloud Scheduler** — intentionally out of scope for now,
  per the original project plan.
- **Averaging multiple eval runs** — would reduce the noise described above; skipped
  here to keep API/compute cost down during development.

## Type-checking

```bash
npm run typecheck
```
