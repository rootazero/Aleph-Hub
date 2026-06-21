"use client";
import Link from "next/link";
import { useLang } from "@/components/providers/LangProvider";
import { STRINGS } from "@/lib/i18n";
import { getAll } from "@/lib/catalog";

// Mockup lines 47-55.
export function Hero() {
  const { lang } = useLang();
  const t = STRINGS[lang];
  const ctaAll = t.ctaAll.replace("{n}", String(getAll().length));
  const cta = { fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase" as const, fontWeight: 600, padding: "14px 28px", borderRadius: 2, textDecoration: "none" };
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: ".24em", textTransform: "uppercase", color: "var(--orange)", marginBottom: 22, fontWeight: 600 }}>{t.kicker}</div>
      <h1 className="hero-title" style={{ fontFamily: "var(--font-cormorant), var(--font-noto-serif-sc), serif", fontWeight: 500, fontSize: 70, lineHeight: 1.02, letterSpacing: "-.015em", margin: "0 0 24px" }}>
        {t.heroA}<br /><span style={{ fontStyle: "italic", color: "var(--orange)" }}>{t.heroEm}</span>{t.heroB}
      </h1>
      <p style={{ fontSize: 17, lineHeight: 1.62, color: "var(--ink-soft)", maxWidth: "46ch", margin: "0 0 32px" }}>{t.heroSub}</p>
      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/c/skill" style={{ ...cta, color: "var(--bg)", background: "var(--ink)" }}>{t.ctaExplore}</Link>
        <Link href="/c/mcp" style={{ ...cta, color: "var(--ink)", border: "1px solid var(--hair-strong)" }}>{ctaAll}</Link>
      </div>
    </div>
  );
}
