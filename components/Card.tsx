"use client";
import Link from "next/link";
import { useLang } from "@/components/providers/LangProvider";
import { formatStars } from "@/lib/catalog";
import { type AnySiteEntry, isContent, slugForAny } from "@/lib/site";
import { TrustBadge } from "@/components/TrustBadge";
import { Sparkline } from "@/components/Sparkline";

export function Card({ entry, rank }: { entry: AnySiteEntry; rank?: number }) {
  const { lang } = useLang();
  const desc = lang === "zh" ? entry.description_zh : entry.description_en;
  return (
    <Link href={`/e/${slugForAny(entry)}`} className="cat-card" style={{ display: "block", textDecoration: "none", color: "inherit", background: "var(--panel)", border: "1px solid var(--hair)", borderRadius: 3, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 13 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "baseline", minWidth: 0 }}>
          {rank != null && <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, color: "var(--orange)", flex: "none" }}>{String(rank).padStart(2, "0")}</span>}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 15, fontWeight: 500 }}>{entry.name}</div>
            <div style={{ fontSize: 11, color: "var(--taupe)", marginTop: 3 }}>{entry.author}</div>
          </div>
        </div>
        <TrustBadge tier={entry.trust_tier} />
      </div>
      <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-soft)", margin: "0 0 16px", minHeight: 39 }}>{desc}</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid var(--hair)" }}>
        <span style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-soft)", background: "var(--chip)", padding: "3px 8px", borderRadius: 2 }}>{entry.kind}</span>
        {isContent(entry) ? (
          // content has no stars/trend; surface the payload format instead.
          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: "var(--ink-soft)" }}>{entry.format}</span>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Sparkline points={entry.spark} color={(entry.trend ?? 0) >= 15 ? "var(--green)" : "var(--taupe)"} />
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12 }}>★{formatStars(entry.stars)}</span>
            {entry.trend != null && <span style={{ fontSize: 11, fontWeight: 600, color: (entry.trend ?? 0) >= 15 ? "var(--green)" : "var(--taupe)" }}>▲{entry.trend}%</span>}
          </div>
        )}
      </div>
    </Link>
  );
}
