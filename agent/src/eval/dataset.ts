import type { Decision } from "../agent/classify.js";

type Category = Decision["category"];
type Action = Decision["action"];

// Orders the eval tickets below reference. Seeded fresh before every
// evaluation run (upsert), so the eval is self-contained and doesn't
// depend on whatever is currently in db/seed.ts.
export const EVAL_ORDERS = [
  { order_number: "E2001", customer_email: "eval@example.com", status: "shipped", item: "Bluetooth Speaker" },
  { order_number: "E2002", customer_email: "eval@example.com", status: "processing", item: "Gaming Mouse" },
  { order_number: "E2003", customer_email: "eval@example.com", status: "delivered", item: "Phone Case" },
  { order_number: "E2004", customer_email: "eval@example.com", status: "cancelled", item: "Desk Lamp" },
  { order_number: "E2005", customer_email: "eval@example.com", status: "shipped", item: "Tablet Stand" },
  { order_number: "E2006", customer_email: "eval@example.com", status: "delivered", item: "Noise Cancelling Headphones" },
  { order_number: "E2007", customer_email: "eval@example.com", status: "delivered", item: "Portable SSD" },
  { order_number: "E2008", customer_email: "eval@example.com", status: "delivered", item: "Smart Watch" },
  { order_number: "E2009", customer_email: "eval@example.com", status: "shipped", item: "Backpack" },
  { order_number: "E2010", customer_email: "eval@example.com", status: "cancelled", item: "Monitor Arm" },
];

export interface EvalTicket {
  id: number;
  subject: string;
  body: string;
  orderNumber: string | null;
  expectedCategory: Category;
  expectedAction: Action;
  note?: string; // why this is the expected answer, for the less obvious cases
}

export const EVAL_TICKETS: EvalTicket[] = [
  // --- order_status (8) ---
  {
    id: 1,
    subject: "Where is my order?",
    body: "Hi, I ordered a Bluetooth Speaker a few days ago, order E2001. I haven't gotten any shipping update. Can you tell me what's going on?",
    orderNumber: "E2001",
    expectedCategory: "order_status",
    expectedAction: "reply",
  },
  {
    id: 2,
    subject: "When will my mouse ship?",
    body: "I placed an order for a Gaming Mouse, order E2002, three days ago and it still says processing. When can I expect it to ship?",
    orderNumber: "E2002",
    expectedCategory: "order_status",
    expectedAction: "reply",
  },
  {
    id: 3,
    subject: "Need tracking number",
    body: "Could you send me the tracking number for my Tablet Stand order, E2005? I want to know exactly when it'll arrive.",
    orderNumber: "E2005",
    expectedCategory: "order_status",
    expectedAction: "reply",
  },
  {
    id: 4,
    subject: "Why was my order cancelled?",
    body: "My Desk Lamp order, E2004, shows as cancelled but I never asked to cancel it. Can you tell me why, and can you place the order again for me?",
    orderNumber: "E2004",
    expectedCategory: "order_status",
    expectedAction: "reply",
  },
  {
    id: 5,
    subject: "Status of order Q7777",
    body: "Can you check the status of my order Q7777? I placed it last week but never got a confirmation email.",
    orderNumber: "Q7777",
    expectedCategory: "order_status",
    expectedAction: "ask_for_info",
    note: "Q7777 doesn't exist in the orders table -- the agent should ask the customer to double-check it, not guess.",
  },
  {
    id: 6,
    subject: "Has my order shipped yet?",
    body: "I ordered something from you guys last week and I'm wondering if it's shipped yet. Can you check for me?",
    orderNumber: null,
    expectedCategory: "order_status",
    expectedAction: "ask_for_info",
    note: "No order number given at all -- there's nothing to look up.",
  },
  {
    id: 7,
    subject: "Package says delivered but I don't have it",
    body: "The tracking for my Phone Case order, E2003, says it was delivered yesterday, but there's nothing here and none of my neighbors have seen it either. I'm worried it was stolen.",
    orderNumber: "E2003",
    expectedCategory: "order_status",
    expectedAction: "escalate",
    note: "System says delivered, customer says missing -- a possible lost/stolen package needs a human to investigate and decide on compensation.",
  },
  {
    id: 8,
    subject: "Quick question about my order",
    body: "Just double-checking -- is my Noise Cancelling Headphones order, E2006, still at your warehouse or has it already reached me?",
    orderNumber: "E2006",
    expectedCategory: "order_status",
    expectedAction: "reply",
  },

  // --- refund (7) ---
  {
    id: 9,
    subject: "Want to cancel and get a refund",
    body: "I changed my mind about the Gaming Mouse I ordered, order E2002. It says it hasn't shipped yet -- can I cancel it and get my money back?",
    orderNumber: "E2002",
    expectedCategory: "refund",
    expectedAction: "reply",
  },
  {
    id: 10,
    subject: "Headphones arrived damaged",
    body: "My Noise Cancelling Headphones, order E2006, arrived with a cracked earcup. I'd like a refund please.",
    orderNumber: "E2006",
    expectedCategory: "refund",
    expectedAction: "reply",
  },
  {
    id: 11,
    subject: "Changed my mind about my backpack",
    body: "I ordered a Backpack, order E2009, but I don't think I need it anymore. It's already shipped -- can I still get a refund once it arrives?",
    orderNumber: "E2009",
    expectedCategory: "refund",
    expectedAction: "reply",
  },
  {
    id: 12,
    subject: "Refund for order R4444",
    body: "I'd like a refund for order R4444, please process it as soon as possible.",
    orderNumber: "R4444",
    expectedCategory: "refund",
    expectedAction: "ask_for_info",
    note: "R4444 doesn't exist -- the agent needs a valid order before it can process anything.",
  },
  {
    id: 13,
    subject: "Charged for a cancelled order",
    body: "I was charged for order E2010, a Monitor Arm, but the order status shows cancelled. I want my money back immediately.",
    orderNumber: "E2010",
    expectedCategory: "refund",
    expectedAction: "escalate",
    note: "A billing discrepancy (charged for something marked cancelled) needs a human with access to payment records, not a scripted reply.",
  },
  {
    id: 14,
    subject: "This is unacceptable",
    body: "I ordered a Smart Watch, order E2008, and received a backpack instead! This is the second time something like this has happened. Fix this now or I'm disputing the charge with my bank and leaving a 1-star review everywhere.",
    orderNumber: "E2008",
    expectedCategory: "refund",
    expectedAction: "escalate",
    note: "Angry, repeat-issue customer threatening a chargeback -- escalate rather than let a bot handle it.",
  },
  {
    id: 15,
    subject: "Refund policy question",
    body: "Before I place an order, I want to understand your refund policy. How long do I have to return something, and do I get my money back in full?",
    orderNumber: null,
    expectedCategory: "refund",
    expectedAction: "reply",
  },

  // --- technical_question (8) ---
  {
    id: 16,
    subject: "Headphones won't pair",
    body: "My Noise Cancelling Headphones, order E2006, won't pair with my phone over Bluetooth anymore. It worked fine for the first week. Any ideas?",
    orderNumber: "E2006",
    expectedCategory: "technical_question",
    expectedAction: "reply",
  },
  {
    id: 17,
    subject: "SSD not showing up",
    body: "My Portable SSD, order E2007, isn't being detected by my laptop anymore. It worked yesterday. What should I try?",
    orderNumber: "E2007",
    expectedCategory: "technical_question",
    expectedAction: "reply",
  },
  {
    id: 18,
    subject: "Speaker making static noise",
    body: "The Bluetooth Speaker I got, order E2001, makes a crackling static noise whenever I turn the volume up past 50%. Is this a known issue?",
    orderNumber: "E2001",
    expectedCategory: "technical_question",
    expectedAction: "reply",
  },
  {
    id: 19,
    subject: "Smart watch battery draining fast",
    body: "My Smart Watch, order E2008, used to last 2 days on a charge and now dies in a few hours. Is that normal or is something wrong with it?",
    orderNumber: "E2008",
    expectedCategory: "technical_question",
    expectedAction: "reply",
  },
  {
    id: 20,
    subject: "App keeps crashing",
    body: "The companion app keeps crashing every time I try to sync my device. It happens on both my phone and tablet.",
    orderNumber: null,
    expectedCategory: "technical_question",
    expectedAction: "ask_for_info",
    note: "No order or device model given -- the agent can't meaningfully troubleshoot without more detail.",
  },
  {
    id: 21,
    subject: "Device won't turn on",
    body: "The device from order T9999 won't turn on at all, even after charging it overnight. Can you help?",
    orderNumber: "T9999",
    expectedCategory: "technical_question",
    expectedAction: "ask_for_info",
    note: "T9999 doesn't exist -- verify the order before troubleshooting.",
  },
  {
    id: 22,
    subject: "Driver install question",
    body: "I ordered a Gaming Mouse, order E2002, and it hasn't arrived yet, but I wanted to get ahead of it -- once it's here, how do I install the drivers for the extra buttons?",
    orderNumber: "E2002",
    expectedCategory: "technical_question",
    expectedAction: "reply",
  },
  {
    id: 23,
    subject: "Can I install custom firmware?",
    body: "Is it possible to flash custom firmware onto your devices to unlock extra features? I know it might void the warranty but I want to try anyway.",
    orderNumber: null,
    expectedCategory: "technical_question",
    expectedAction: "escalate",
    note: "Warranty-voiding modification request -- policy-sensitive, better handled by a human.",
  },

  // --- other (7) ---
  {
    id: 24,
    subject: "Do you ship internationally?",
    body: "Before I order, I'd like to know if you ship to Brazil, and roughly how long delivery takes.",
    orderNumber: null,
    expectedCategory: "other",
    expectedAction: "reply",
  },
  {
    id: 25,
    subject: "What are your support hours?",
    body: "What hours is your support team available? I want to know when I can expect a reply if I email you.",
    orderNumber: null,
    expectedCategory: "other",
    expectedAction: "reply",
  },
  {
    id: 26,
    subject: "Need to change my shipping address",
    body: "I just realized I entered the wrong shipping address for my Gaming Mouse order, E2002. Can you update it to my new address before it ships?",
    orderNumber: "E2002",
    expectedCategory: "other",
    expectedAction: "escalate",
    note: "Editing an order's address is an account action, not something to answer from a script -- escalate even though an order number is involved.",
  },
  {
    id: 27,
    subject: "You've won a prize!!!",
    body: "Congratulations, you have been selected to receive a free $1000 gift card! Click here to claim your prize before it expires: bit.ly/claim-now",
    orderNumber: null,
    expectedCategory: "other",
    expectedAction: "escalate",
    note: "Looks like spam/phishing sent to the support inbox -- flag for a human rather than reply to it.",
  },
  {
    id: 28,
    subject: "Are you hiring?",
    body: "Hi, I came across your website and I'm really interested in joining your engineering team. Are you currently hiring software developers?",
    orderNumber: null,
    expectedCategory: "other",
    expectedAction: "escalate",
    note: "Misdirected message, not a support request -- route to a human (e.g. forward to HR).",
  },
  {
    id: 29,
    subject: "Just wanted to say thanks",
    body: "I don't have an issue, I just wanted to say I love the products I've bought from you so far. Keep up the great work!",
    orderNumber: null,
    expectedCategory: "other",
    expectedAction: "reply",
  },
  {
    id: 30,
    subject: "Legal notice regarding my data",
    body: "I am writing to inform you that my lawyer will be in contact regarding how my personal data was handled by your company.",
    orderNumber: null,
    expectedCategory: "other",
    expectedAction: "escalate",
    note: "Legal/data-protection matter -- always escalate, never let the agent respond on the company's behalf.",
  },
];
