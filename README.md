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

Later on, company documents/FAQ can be added so the AI answers based on them (RAG).

## What this project demonstrates

AI integration + APIs + backend + database

## Development roadmap

1. Idea
2. Planning
3. Database / Architecture
4. Development
5. Git / Branches
6. Testing
7. Deployment
8. README
9. Screenshots
10. Demo

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
