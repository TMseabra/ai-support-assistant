import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Support Assistant",
  description: "Assistente de suporte ao cliente com IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body className="antialiased bg-neutral-950 text-neutral-100">
        {children}
      </body>
    </html>
  );
}
