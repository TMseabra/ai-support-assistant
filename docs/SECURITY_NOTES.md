# Security notes

- Secrets live only in `.env` files, which are git-ignored.
- Conversations are stored per user and are only meant to be read by their owner.
- Rotate `AUTH_SECRET` and the GitHub OAuth secret if they are ever exposed.
