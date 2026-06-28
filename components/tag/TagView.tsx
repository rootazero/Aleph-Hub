"use client";
import Link from "next/link";
import type { Tag } from "@/lib/tags";
import { useLang } from "@/components/providers/LangProvider";
import { STRINGS } from "@/lib/i18n";
import { Card } from "@/components/Card";

// Sibling of PublisherView: a flat grid of every entry carrying this tag, across
// both the install and content catalogs. A tag is a cross-cutting facet (not an
// entity), so there's no trust badge or homepage — just the label and a count.
export function TagView({ tag }: { tag: Tag }) {
  const { lang } = useLang();
  const t = STRINGS[lang];
  const count = t.pubEntries.replace("{n}", String(tag.entries.length));

  return (
    <main style={{ maxWidth: 1240, margin: "0 auto", padding: "34px 48px 80px" }}>
      <Link href="/" style={{ fontSize: 12, color: "var(--taupe)", letterSpacing: ".04em", textDecoration: "none" }}>{t.back}</Link>
      <header style={{ marginTop: 26, marginBottom: 40, borderBottom: "1px solid var(--hair-strong)", paddingBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: ".20em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: 600, marginBottom: 12 }}>{t.tagKicker}</div>
        <h1 style={{ fontFamily: "var(--font-cormorant), var(--font-noto-serif-sc), serif", fontWeight: 600, fontSize: 52, lineHeight: 1, margin: "0 0 16px" }}>#{tag.name}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>{count}</span>
        </div>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
        {tag.entries.map((e) => <Card key={e.id} entry={e} />)}
      </div>
    </main>
  );
}
