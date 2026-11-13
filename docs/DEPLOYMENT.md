# Deployment checklist

- [ ] Create a production Postgres database (Neon) and set `DATABASE_URL`
- [ ] Run `npx prisma migrate deploy`
- [ ] Set `AUTH_SECRET` and `NEXTAUTH_URL` to the production URL
- [ ] Create a GitHub OAuth App for the production callback URL
- [ ] Provide a model: a reachable Ollama host (`OLLAMA_BASE_URL`) or a hosted model
- [ ] Deploy (for example on Vercel) and test login and chat
