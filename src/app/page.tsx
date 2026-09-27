import { redirect } from "next/navigation";

import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  redirect(session ? "/chat" : "/login");
}
