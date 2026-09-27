import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { streamAssistantReply, type ChatMessage } from "@/lib/ollama";

async function getOwnedConversation(conversationId: string, userId: string) {
  return prisma.conversation.findFirst({
    where: { id: conversationId, userId },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const conversation = await getOwnedConversation(id, session.user.id);
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const conversation = await getOwnedConversation(id, session.user.id);
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { content } = (await req.json()) as { content?: string };
  if (!content?.trim()) {
    return NextResponse.json({ error: "Missing content" }, { status: 400 });
  }

  const previousMessages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
  });

  await prisma.message.create({
    data: { conversationId: id, role: "user", content },
  });

  if (conversation.title === "Nova conversa") {
    await prisma.conversation.update({
      where: { id },
      data: { title: content.slice(0, 60) },
    });
  }

  const history: ChatMessage[] = [
    ...previousMessages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user", content },
  ];

  const ollamaStream = await streamAssistantReply(history);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      let fullReply = "";

      try {
        for await (const chunk of ollamaStream) {
          const text = chunk.message?.content ?? "";
          if (text) {
            fullReply += text;
            controller.enqueue(encoder.encode(text));
          }
        }
      } finally {
        controller.close();
        if (fullReply.trim()) {
          await prisma.message.create({
            data: { conversationId: id, role: "assistant", content: fullReply },
          });
        }
        await prisma.conversation.update({
          where: { id },
          data: { updatedAt: new Date() },
        });
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
