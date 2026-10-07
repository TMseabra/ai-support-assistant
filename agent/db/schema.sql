-- Orders the agent can look up when a ticket mentions one.
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_email TEXT NOT NULL,
  status TEXT NOT NULL, -- 'processing' | 'shipped' | 'delivered' | 'cancelled'
  item TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Incoming support tickets.
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  customer_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  order_number TEXT, -- optional, the customer may or may not reference an order
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per decision the agent makes about a ticket: what, why, and at what cost.
CREATE TABLE IF NOT EXISTS decisions (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  category TEXT NOT NULL,     -- 'order_status' | 'refund' | 'technical_question' | 'other'
  action TEXT NOT NULL,       -- 'reply' | 'ask_for_info' | 'escalate'
  reason TEXT NOT NULL,       -- short explanation the model gave for this decision
  reply_text TEXT,            -- what the agent would send back, when action = 'reply'
  model TEXT NOT NULL,        -- e.g. 'claude-sonnet-5', 'llama3.2'
  cost_usd NUMERIC(10, 6),    -- null for local models, which have no per-call cost
  latency_ms INTEGER NOT NULL,
  tool_calls JSONB,           -- which tools were called while reaching this decision, and their results
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Safety net: if this file is re-run against a database created before
-- tool_calls existed, add the column instead of silently skipping it
-- (CREATE TABLE IF NOT EXISTS above won't alter an existing table).
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS tool_calls JSONB;
