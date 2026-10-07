// Applies db/schema.sql to the database. Safe to run more than once:
// every statement uses CREATE TABLE IF NOT EXISTS.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { pool } from "./pool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, "..", "..", "db", "schema.sql");

async function migrate() {
  const schema = readFileSync(schemaPath, "utf-8");
  console.log(`Applying schema from ${schemaPath} ...`);
  await pool.query(schema);
  console.log("Done. Tables ready: orders, tickets, decisions.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
