# Database

PostgreSQL through Prisma (`prisma/schema.prisma`).

- **Auth.js tables**: `User`, `Account`, `Session`, `VerificationToken`.
- **`Conversation`**: belongs to a `User`; has a `title` (default "Nova conversa"),
  `createdAt` and `updatedAt`.
- **`Message`**: belongs to a `Conversation`; has a `role` (`user`, `assistant`
  or `system`), the `content` and `createdAt`.

Deleting a user deletes their conversations, and deleting a conversation deletes
its messages (`onDelete: Cascade`).

Apply migrations with `npx prisma migrate dev`.
