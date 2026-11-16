# Local models

- The chat app defaults to `llama3.2` (`OLLAMA_MODEL`).
- The triage agent example config uses `qwen2.5:7b`, which tends to follow the
  JSON output format more reliably.
- Pull a model with `ollama pull <name>` before using it.
- Larger models give better answers but need more RAM and are slower.
