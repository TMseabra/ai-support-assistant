// A small, hardcoded FAQ knowledge base. In a real system this might come
// from a database or a CMS, but for this project a plain array is enough
// and keeps the "search_faq" tool trivial to read and test.
export interface FaqEntry {
  question: string;
  answer: string;
  keywords: string[];
}

export const FAQ: FaqEntry[] = [
  {
    question: "What is your refund policy?",
    answer:
      "We offer a full refund within 30 days of delivery if the item is unused and in its original packaging. Refunds are issued to the original payment method within 5-7 business days.",
    keywords: ["refund", "money back", "return policy"],
  },
  {
    question: "How long does shipping take?",
    answer:
      "Domestic orders typically arrive within 3-5 business days. You'll receive a tracking link by email once your order ships.",
    keywords: ["shipping", "delivery", "how long", "arrive"],
  },
  {
    question: "Do you ship internationally?",
    answer:
      "Yes, we ship to most countries. International delivery usually takes 7-14 business days, and customs fees may apply depending on your country.",
    keywords: ["international", "ship abroad", "customs", "country", "brazil"],
  },
  {
    question: "Can I cancel my order?",
    answer:
      "You can cancel an order for free as long as it hasn't shipped yet. Once it's marked 'shipped', we can no longer cancel it, but you can return it after delivery.",
    keywords: ["cancel", "cancellation"],
  },
  {
    question: "My device isn't working, what should I do?",
    answer:
      "Try unplugging the device and reconnecting it, and make sure you have the latest drivers installed from the manufacturer's website. If the problem continues, it may be covered under our 1-year warranty against manufacturing defects.",
    keywords: ["not working", "broken", "reset", "troubleshoot", "driver"],
  },
  {
    question: "What is your warranty?",
    answer:
      "All products come with a 1-year warranty against manufacturing defects. This doesn't cover accidental damage or normal wear and tear.",
    keywords: ["warranty", "guarantee", "defect"],
  },
  {
    question: "How do I return an item?",
    answer:
      "Start a return from your order confirmation email, print the prepaid shipping label, and drop the package off at any courier location. Returns must be postmarked within 30 days of delivery.",
    keywords: ["return", "send back", "exchange"],
  },
  {
    question: "What are your business hours?",
    answer:
      "Our support team is available Monday to Friday, 9am to 6pm (UTC). We usually reply to emails within one business day.",
    keywords: ["business hours", "support hours", "contact", "open"],
  },
];
