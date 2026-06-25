"use client";
import Link from "next/link";
import type { TrustTierT } from "@/contract/types";
import type { Publisher } from "@/lib/publishers";
import { useLang } from "@/components/providers/LangProvider";
import { STRINGS } from "@/lib/i18n";
import { TrustBadge } from "@/components/TrustBadge";
import { Card } from "@/components/Card";

// A publisher's trust signal = the highest tier among its entries.
const TIER_RANK: Record<TrustTierT, number> = { official: 3, verified: 2, community: 1, unverified: 0 };

export function PublisherView({ publisher }: { publisher: Publisher }) {
  const { lang } = useLang();
  const t = STRINGS[lang];
  const topTier = publisher.entries.reduce<TrustTierT>(
    (best, e) => (TIER_RANK[e.trust_tier] > TIER_RANK[best] ? e.trust_tier : best),
    "unverified",
  );
  const count = t.pubEntries.replace("{n}", String(publisher.entries.length));

  return (
    <main style={{ maxWidth: 1240, margin: "0 auto", padding: "34px 48px 80px" }}>
      <Link href="/" style={{ fontSize: 12, color: "var(--taupe)", letterSpacing: ".04em", textDecoration: "none" }}>{t.back}</Link>
      <header style={{ marginTop: 26, marginBottom: 40, borderBottom: "1px solid var(--hair-strong)", paddingBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: ".20em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: 600, marginBottom: 12 }}>{t.pubKicker}</div>
        <h1 style={{ fontFamily: "var(--font-cormorant), var(--font-noto-serif-sc), serif", fontWeight: 600, fontSize: 52, lineHeight: 1, margin: "0 0 16px" }}>{publisher.name}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <TrustBadge tier={topTier} />
          <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>{count}</span>
          {publisher.homepage && (
            <a href={publisher.homepage} target="_blank" rel="noreferrer" style={{ fontSize: 12, letterSpacing: ".10em", textTransform: "uppercase", color: "var(--orange)", textDecoration: "none" }}>{t.viewGithub} ↗</a>
          )}
        </div>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
        {publisher.entries.map((e) => <Card key={e.id} entry={e} />)}
      </div>
    </main>
  );
}
