import type { Metadata } from "next";
import { Space_Grotesk, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "PariPari — Quantum Core Copilot",
  description:
    "PariPari is a repo-aware AI coding copilot that routes LLM traffic through Paritok, compressing agent sessions by up to 74–95% and slashing your API costs.",
  keywords: ["AI copilot", "code review", "bug fix", "Paritok", "LLM compression"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${outfit.variable} ${jetbrains.variable}`}>
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
