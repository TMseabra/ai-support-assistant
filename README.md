# AI Support Assistant

An AI-powered customer support system, built to demonstrate AI integration, APIs, backend and database work.

## Stack

- Next.js (App Router)
- TypeScript
- [Ollama](https://ollama.com) (local LLM, no API key required)
- PostgreSQL (via Prisma ORM, hosted on [Neon](https://neon.tech))
- Auth.js (NextAuth.js) with GitHub OAuth

## Features

- Chat interface with streaming responses
- Conversation history
- Start new conversations
- Save messages
- Prompt system (system prompts / instructions for the AI)
- Authentication (GitHub OAuth)
- Conversation context (the AI remembers previous messages in the conversation)

Planned: company documents/FAQ so the AI answers based on them (RAG).

## Ticket Triage Agent

This repo also contains a separate, self-contained project: an autonomous agent
that classifies support tickets, uses tools (order lookup, FAQ search) to decide
what to do, and logs every decision with cost/latency. It has its own README,
database, and evaluation script — see [`agent/README.md`](agent/README.md).

## What this project demonstrates

AI integration + APIs + backend + database

## Project status

The core app and the triage agent are implemented and working locally.

- [x] Idea
- [x] Planning
- [x] Database / architecture (Prisma + Neon, agent schema in `agent/db`)
- [x] Development (chat app, auth, streaming, history, triage agent + eval harness)
- [x] Git / branches
- [ ] Testing (the agent has an evaluation script; the web app has no automated tests yet)
- [ ] Deployment (runs locally only; Ollama needs a reachable host to deploy)
- [x] README
- [ ] Screenshots
- [ ] Demo

Not built yet: RAG over company documents/FAQ in the chat app.

## Running locally

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Ollama (free, runs locally)

Install [Ollama](https://ollama.com), then pull a model:

```bash
ollama pull llama3.2
```

Make sure Ollama is running (it starts automatically after install) before using the chat.

### 3. Set up GitHub OAuth

Create a GitHub OAuth App at [github.com/settings/developers](https://github.com/settings/developers):

- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`


    
### 4. Configure environment variables

```bash
cp .env.example .env
```

Fill in `DATABASE_URL` (a Postgres connection string, e.g. from [Neon](https://neon.tech)), `AUTH_SECRET` (`openssl rand -base64 32`), and `AUTH_GITHUB_ID`/`AUTH_GITHUB_SECRET` from step 3.

### 5. Set up the database

```bash
npx prisma migrate dev
```

### 6. Run the app

```bash
npm run dev
```

## Scripts

| Command             | What it does                      |
| ------------------- | --------------------------------- |
| `npm run dev`       | Start the dev server              |
| `npm run build`     | Production build                  |
| `npm run start`     | Serve the production build        |
| `npm run lint`      | Run ESLint                        |
| `npm run typecheck` | Type-check with `tsc --noEmit`    |

## Troubleshooting

- **Login fails on a different port:** if port 3000 is taken, Next.js falls back to 3001 and the GitHub OAuth callback (`http://localhost:3000/api/auth/callback/github`) no longer matches. Free port 3000 and restart `npm run dev`.
- **Chat returns an error:** make sure Ollama is running and the model is pulled (`ollama pull llama3.2`). `OLLAMA_BASE_URL` and `OLLAMA_MODEL` can override the defaults.
