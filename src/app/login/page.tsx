import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session) {
    redirect("/chat");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">AI Support Assistant</h1>
        <p className="text-neutral-400 mt-1">
          Entra para começar a conversar com o assistente
        </p>
      </div>

      <form
        action={async () => {
          "use server";
          await signIn("github", { redirectTo: "/chat" });
        }}
      >
        <button
          type="submit"
          className="flex items-center gap-2 rounded-md bg-white px-4 py-2 font-medium text-neutral-900 hover:bg-neutral-200"
        >
          Entrar com GitHub
        </button>
      </form>
    </div>
  );
}
