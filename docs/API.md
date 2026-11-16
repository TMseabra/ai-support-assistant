# API

All routes require a signed-in user and return `401` otherwise.

| Method | Route                                | Description                                        |
| ------ | ------------------------------------ | -------------------------------------------------- |
| GET    | `/api/conversations`                 | List the user's conversations, newest first        |
| POST   | `/api/conversations`                 | Create a conversation (`201`)                      |
| GET    | `/api/conversations/[id]/messages`   | List the messages of a conversation (`404` if not owned) |
| POST   | `/api/conversations/[id]/messages`   | Send `{ "content": "..." }` and stream the reply as plain text |

## Notes

- `POST .../messages` returns `400` when `content` is empty.
- A conversation titled "Nova conversa" is renamed to the first 60 characters
  of its first message.
- The assistant reply is saved after the stream finishes.
