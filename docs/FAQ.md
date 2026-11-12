# FAQ

**Do I need an API key?** No. The chat runs on a local model through Ollama.

**Which model does it use?** `llama3.2` by default; change it with `OLLAMA_MODEL`.

**Where is the data stored?** In a PostgreSQL database (Neon) through Prisma.

**Why does login fail locally?** The GitHub OAuth callback must match the port
the app runs on. See the Troubleshooting section of the README.
