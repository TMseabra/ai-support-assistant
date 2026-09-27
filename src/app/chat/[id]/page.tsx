import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChatWindow } from "@/components/ChatWindow";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user!.id!;

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conversation) {
    notFound();
  }

  return (
    <ChatWindow conversationId={conversation.id} initialMessages={conversation.messages} />
  );
}
