"use client";
import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/providers/LangProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { STRINGS } from "@/lib/i18n";

const NAV: { kind: string; zh: string; en: string }[] = [
  { kind: "skill", zh: "Agent 技能", en: "Agent Skills" },
  { kind: "plugin", zh: "插件", en: "Plugins" },
  { kind: "mcp", zh: "MCP 服务", en: "MCP Servers" },
  { kind: "prompt", zh: "提示词", en: "Prompts" },
  { kind: "workflow", zh: "工作流", en: "Workflows" },
];

export function Header() {
  const { lang, set } = useLang();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const t = STRINGS[lang];
  const navLink = { fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase" as const, color: "var(--ink-soft)", textDecoration: "none", whiteSpace: "nowrap" as const };
  const submit = { fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase" as const, fontWeight: 600, color: "var(--bg)", background: "var(--ink)", padding: "9px 18px", borderRadius: 2, textDecoration: "none", whiteSpace: "nowrap" as const };
  return (
    <header className="hdr" style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 48px", background: "var(--bg)", borderBottom: "1px solid var(--hair)" }}>
      <Link href="/" onClick={() => setOpen(false)} style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "inherit" }}>
        <span aria-hidden style={{ display: "inline-block", width: 28, height: 28, borderRadius: "50%", background: "url('/aleph-glyph.svg') center / cover no-repeat", flex: "none" }} />
        <span style={{ fontSize: 13, letterSpacing: ".30em", fontWeight: 600, whiteSpace: "nowrap" }}>ALEPH HUB</span>
      </Link>
      <nav className="hdr-nav" style={{ display: "flex", gap: 26 }}>
        {NAV.map((n) => (
          <Link key={n.kind} href={`/c/${n.kind}`} style={navLink}>{lang === "zh" ? n.zh : n.en}</Link>
        ))}
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, letterSpacing: ".06em", fontWeight: 600 }}>
          <span onClick={() => set("zh")} style={{ cursor: "pointer", color: lang === "zh" ? "var(--ink)" : "var(--taupe)" }}>中</span>
          <span style={{ color: "var(--taupe)" }}>/</span>
          <span onClick={() => set("en")} style={{ cursor: "pointer", color: lang === "en" ? "var(--ink)" : "var(--taupe)" }}>EN</span>
        </div>
        <span onClick={toggle} style={{ fontSize: 16, color: "var(--ink-soft)", cursor: "pointer", lineHeight: 1 }}>{theme === "dark" ? "☼" : "☾"}</span>
        <Link href="/submit" className="hdr-submit" style={submit}>{t.submit}</Link>
        <button
          type="button"
          className="hdr-burger"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          style={{ display: "none", alignItems: "center", justifyContent: "center", width: 30, height: 30, padding: 0, background: "none", border: "none", cursor: "pointer", color: "var(--ink)", fontSize: 18, lineHeight: 1 }}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>
      {open && (
        <div className="hdr-menu" style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg)", borderBottom: "1px solid var(--hair)", padding: "10px 20px 20px", display: "flex", flexDirection: "column" }}>
          {NAV.map((n) => (
            <Link key={n.kind} href={`/c/${n.kind}`} onClick={() => setOpen(false)} style={{ ...navLink, padding: "14px 0", borderBottom: "1px solid var(--hair)" }}>{lang === "zh" ? n.zh : n.en}</Link>
          ))}
          <Link href="/submit" onClick={() => setOpen(false)} style={{ ...submit, marginTop: 16, textAlign: "center" }}>{t.submit}</Link>
        </div>
      )}
    </header>
  );
}
