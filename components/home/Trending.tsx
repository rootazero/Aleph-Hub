"use client";
import Link from "next/link";
import { useLang } from "@/components/providers/LangProvider";
import { STRINGS } from "@/lib/i18n";
import { trending } from "@/lib/catalog";
import { Card } from "@/components/Card";

// Mockup lines 91-105.
export function Trending() {
  const { lang } = useLang();
  const t = STRINGS[lang];
  return (
    <section style={{ maxWidth: 1480, margin: "0 auto", padding: "44px 48px 76px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: "1px solid var(--hair-strong)", paddingBottom: 11, marginBottom: 26 }}>
        <span style={{ fontSize: 11, letterSpacing: ".20em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: 600 }}>{t.trendingTitle}</span>
        <Link href="/c/skill" className="sec-more" style={{ fontSize: 11, letterSpacing: ".10em", color: "var(--taupe)", textDecoration: "none" }}>{t.viewAll} →</Link>
      </div>
      <div className="card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
        {trending(6).map((e, i) => <Card key={e.id} entry={e} rank={i + 1} />)}
      </div>
    </section>
  );
}
