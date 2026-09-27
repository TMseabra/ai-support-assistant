import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session!.user!.id!;

  const conversations = await prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true },
  });

  return (
    <div className="flex">
      <Sidebar
        conversations={conversations}
        userLabel={session!.user!.name ?? session!.user!.email ?? "Utilizador"}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
