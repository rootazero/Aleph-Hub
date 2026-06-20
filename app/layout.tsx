import type { Metadata } from "next";
import { Cormorant_Garamond, Hanken_Grotesk, JetBrains_Mono, Noto_Serif_SC, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/components/providers/ThemeScript";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LangProvider } from "@/components/providers/LangProvider";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-cormorant" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-hanken" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });
const notoSerif = Noto_Serif_SC({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-noto-serif-sc" });
const notoSans = Noto_Sans_SC({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-noto-sans-sc" });

export const metadata: Metadata = {
  title: "Aleph Hub — The Agent Capability Atlas",
  description: "Discover Agent Skills, MCP servers and plugins. Open source, security-reviewed, always fresh.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cls = [cormorant, hanken, mono, notoSerif, notoSans].map((f) => f.variable).join(" ");
  return (
    <html lang="en" suppressHydrationWarning className={cls}>
      <head><ThemeScript /></head>
      <body><ThemeProvider><LangProvider>{children}</LangProvider></ThemeProvider></body>
    </html>
  );
}
