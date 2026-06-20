"use client";
import Link from "next/link";
import { useLang } from "@/components/providers/LangProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { STRINGS } from "@/lib/i18n";

const NAV: { kind: string; zh: string; en: string }[] = [
  { kind: "skill", zh: "Agent 技能", en: "Agent Skills" },
  { kind: "plugin", zh: "插件", en: "Plugins" },
  { kind: "mcp", zh: "MCP 服务", en: "MCP Servers" },
];

export function Header() {
  const { lang, set } = useLang();
  const { theme, toggle } = useTheme();
  const t = STRINGS[lang];
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 48px", background: "var(--bg)", borderBottom: "1px solid var(--hair)" }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "inherit" }}>
        <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 30, lineHeight: 1, color: "var(--orange)" }}>ℵ</span>
        <span style={{ fontSize: 13, letterSpacing: ".30em", fontWeight: 600, whiteSpace: "nowrap" }}>ALEPH HUB</span>
      </Link>
      <nav style={{ display: "flex", gap: 26 }}>
        {NAV.map((n) => (
          <Link key={n.kind} href={`/c/${n.kind}`} style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--ink-soft)", textDecoration: "none", whiteSpace: "nowrap" }}>
            {lang === "zh" ? n.zh : n.en}
          </Link>
        ))}
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, letterSpacing: ".06em", fontWeight: 600 }}>
          <span onClick={() => set("zh")} style={{ cursor: "pointer", color: lang === "zh" ? "var(--ink)" : "var(--taupe)" }}>中</span>
          <span style={{ color: "var(--taupe)" }}>/</span>
          <span onClick={() => set("en")} style={{ cursor: "pointer", color: lang === "en" ? "var(--ink)" : "var(--taupe)" }}>EN</span>
        </div>
        <span onClick={toggle} style={{ fontSize: 16, color: "var(--ink-soft)", cursor: "pointer", lineHeight: 1 }}>{theme === "dark" ? "☼" : "☾"}</span>
        <Link href="/submit" style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600, color: "var(--bg)", background: "var(--ink)", padding: "9px 18px", borderRadius: 2, textDecoration: "none", whiteSpace: "nowrap" }}>{t.submit}</Link>
      </div>
    </header>
  );
}
