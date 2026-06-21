"use client";
import Link from "next/link";
import type { ExtensionCategoryT } from "@/contract/types";
import { useLang } from "@/components/providers/LangProvider";
import { STRINGS, CATEGORY_LABELS } from "@/lib/i18n";
import { editorialPicks, formatStars, slugForEntry } from "@/lib/catalog";

// Editorial gallery: the standout entry in each of the richest areas (spec §7.4).
// Replaces the old tag-bucket grouping, which had no matching data and rendered empty.
export function Collection() {
  const { lang } = useLang();
  const t = STRINGS[lang];
  const picks = editorialPicks(3);
  if (!picks.length) return null;
  return (
    <section style={{ maxWidth: 1480, margin: "0 auto", padding: "8px 48px 80px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: "1px solid var(--hair-strong)", paddingBottom: 11, marginBottom: 26 }}>
        <span style={{ fontSize: 11, letterSpacing: ".20em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: 600 }}>{t.collectionTitle}</span>
      </div>
      <div className="card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 26 }}>
        {picks.map(({ category, entry }) => {
          const area = CATEGORY_LABELS[category as ExtensionCategoryT]?.[lang] ?? category;
          const desc = lang === "zh" ? entry.description_zh : entry.description_en;
          return (
            <Link key={entry.id} href={`/e/${slugForEntry(entry)}`} className="col-card" style={{ display: "block", textDecoration: "none", color: "inherit", background: "var(--panel)", border: "1px solid var(--hair)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: 160, background: entry.cover_color, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 86, color: "rgba(255,255,255,.92)", lineHeight: 1 }}>{entry.name[0]}</span>
                <span style={{ position: "absolute", top: 14, left: 14, fontSize: 9, letterSpacing: ".10em", textTransform: "uppercase", fontWeight: 600, color: entry.cover_color, background: "#fff", padding: "4px 9px", borderRadius: 2 }}>{area}</span>
              </div>
              <div style={{ padding: "20px 22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--orange)", fontWeight: 600 }}>{entry.kind}</span>
                  <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, color: "var(--ink-soft)" }}>★ {formatStars(entry.stars)}</span>
                </div>
                <h3 className="col-card-title" style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 600, fontSize: 25, margin: "0 0 6px" }}>{entry.name}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-soft)", margin: 0 }}>{desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
