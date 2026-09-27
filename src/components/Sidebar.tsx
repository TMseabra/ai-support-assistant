"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { signOutAction } from "@/lib/actions";

type Conversation = {
  id: string;
  title: string;
};

export function Sidebar({
  conversations,
  userLabel,
}: {
  conversations: Conversation[];
  userLabel: string;
}) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const [creating, setCreating] = useState(false);

  async function createConversation() {
    setCreating(true);
    try {
      const res = await fetch("/api/conversations", { method: "POST" });
      const conversation = await res.json();
      router.push(`/chat/${conversation.id}`);
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-neutral-800 bg-neutral-900">
      <div className="p-3">
        <button
          onClick={createConversation}
          disabled={creating}
          className="w-full rounded-md bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
        >
          + Nova conversa
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2">
        {conversations.map((c) => (
          <Link
            key={c.id}
            href={`/chat/${c.id}`}
            className={`block truncate rounded-md px-3 py-2 text-sm hover:bg-neutral-800 ${
              params?.id === c.id ? "bg-neutral-800" : ""
            }`}
          >
            {c.title}
          </Link>
        ))}
      </nav>

      <div className="border-t border-neutral-800 p-3 text-sm text-neutral-400">
        <div className="mb-2 truncate">{userLabel}</div>
        <form action={signOutAction}>
          <button className="text-neutral-400 hover:text-neutral-200">
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
