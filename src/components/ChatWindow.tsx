"use client";

import { useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

export function ChatWindow({
  conversationId,
  initialMessages,
}: {
  conversationId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function sendMessage() {
    const content = input.trim();
    if (!content || sending) return;

    setInput("");
    setSending(true);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };
    const assistantId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.body) throw new Error("Sem resposta do servidor");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + chunk } : m
          )
        );
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Erro ao contactar o assistente. Verifica se o Ollama está a correr." }
            : m
        )
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`mb-4 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xl whitespace-pre-wrap rounded-lg px-4 py-2 text-sm ${
                m.role === "user"
                  ? "bg-white text-neutral-900"
                  : "bg-neutral-800 text-neutral-100"
              }`}
            >
              {m.content || (sending ? "…" : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex gap-2 border-t border-neutral-800 p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escreve a tua mensagem..."
          disabled={sending}
          className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
