// Inserts a handful of sample orders and tickets so there is something
// to run the agent against manually. Clears both tables first, so it's
// safe to re-run. The 30-ticket evaluation set (phase 4) is separate
// from this — these are just for manual testing during development.
import { pool } from "./pool.js";

const orders = [
  { order_number: "A1001", customer_email: "maria@example.com", status: "shipped", item: "Wireless Headphones" },
  { order_number: "A1002", customer_email: "joao@example.com", status: "processing", item: "Mechanical Keyboard" },
  { order_number: "A1003", customer_email: "ines@example.com", status: "delivered", item: "USB-C Hub" },
  { order_number: "A1004", customer_email: "pedro@example.com", status: "cancelled", item: "Laptop Stand" },
  { order_number: "A1005", customer_email: "sofia@example.com", status: "delivered", item: "Webcam 1080p" },
];

const tickets = [
  {
    customer_email: "maria@example.com",
    subject: "Where is my order?",
    body: "Hi, I ordered wireless headphones a few days ago (order A1001) and I haven't received a shipping update. Can you tell me the status?",
    order_number: "A1001",
  },
  {
    customer_email: "joao@example.com",
    subject: "Wrong item received",
    body: "I received a completely different product than what I ordered under A1002. I want a refund as soon as possible.",
    order_number: "A1002",
  },
  {
    customer_email: "ines@example.com",
    subject: "How do I reset the device?",
    body: "The USB-C hub I bought (order A1003) isn't being recognized by my laptop anymore. Is there a reset procedure or driver I should install?",
    order_number: "A1003",
  },
  {
    customer_email: "unknown@example.com",
    subject: "Question about an order you don't have",
    body: "Can you check the status of order Z9999? I can't find any confirmation email.",
    order_number: "Z9999",
  },
  {
    customer_email: "carlos@example.com",
    subject: "Do you ship internationally?",
    body: "Before I place an order, I'd like to know if you ship to Brazil and what the delivery time usually looks like.",
    order_number: null,
  },
];

async function seed() {
  await pool.query("TRUNCATE decisions, tickets, orders RESTART IDENTITY CASCADE");

  for (const o of orders) {
    await pool.query(
      `INSERT INTO orders (order_number, customer_email, status, item)
       VALUES ($1, $2, $3, $4)`,
      [o.order_number, o.customer_email, o.status, o.item]
    );
  }

  for (const t of tickets) {
    await pool.query(
      `INSERT INTO tickets (customer_email, subject, body, order_number)
       VALUES ($1, $2, $3, $4)`,
      [t.customer_email, t.subject, t.body, t.order_number]
    );
  }

  console.log(`Seeded ${orders.length} orders and ${tickets.length} tickets.`);
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
