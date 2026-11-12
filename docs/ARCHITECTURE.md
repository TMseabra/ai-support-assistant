# Architecture

```
Browser (ChatWindow, Sidebar)
   │  fetch / server actions
   ▼
Next.js App Router
   ├─ /api/conversations                  list and create conversations
   ├─ /api/conversations/[id]/messages    save a message, stream the AI reply
   └─ /api/auth/[...nextauth]             Auth.js (GitHub OAuth)
   │
   ├─ Prisma ──▶ PostgreSQL (Neon): users, conversations, messages
   └─ Ollama client ──▶ local LLM (streaming)
```

Each request is tied to the signed-in user. The full message history of a
conversation is sent to the model with a system prompt, which is how the AI
keeps context between messages.
