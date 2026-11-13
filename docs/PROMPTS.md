# Prompts

The chat sends a system prompt before the conversation history
(see `src/lib/ollama.ts`). It tells the model to act as a customer support
assistant and to answer clearly, in a friendly and objective way, in Portuguese.

To change the assistant's behavior, edit `SYSTEM_PROMPT` in that file.
