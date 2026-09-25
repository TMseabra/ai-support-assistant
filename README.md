# AI Support Assistant

An AI-powered customer support system, built as a portfolio project to demonstrate AI integration, APIs, backend and database work.

## Stack

- Next.js (App Router)
- TypeScript
- AI API (e.g. OpenAI / Anthropic)
- PostgreSQL (via Prisma ORM)
- Authentication (NextAuth.js / Auth.js)

## Features

- Chat interface
- Conversation history
- Start new conversations
- Save messages
- Prompt system (system prompts / instructions for the AI)
- Authentication
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

npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
