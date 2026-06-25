"use client";
import { useState } from "react";
import Link from "next/link";
import type { SiteEntryT } from "@/contract/site";
import { useLang } from "@/components/providers/LangProvider";
import { STRINGS, CATEGORY_LABELS } from "@/lib/i18n";
import { related, formatStars } from "@/lib/catalog";
import { publisherSlug } from "@/lib/publishers";
import { TrustBadge } from "@/components/TrustBadge";
import { Card } from "@/components/Card";

// Mockup lines 157-201. Cohesive detail view: cover, tabs (overview/security),
// install sidebar (copy), meta rows and related grid.
export function DetailView({ entry }: { entry: SiteEntryT }) {
  const { lang } = useLang();
  const t = STRINGS[lang];
  const [tab, setTab] = useState<"overview" | "security">("overview");
  const [copied, setCopied] = useState(false);
  const desc = lang === "zh" ? entry.description_zh : entry.description_en;
  const long = lang === "zh" ? entry.long_zh : entry.long_en;
  const secNote = lang === "zh" ? entry.sec_note_zh : entry.sec_note_en;
  const trendColor = (entry.trend ?? 0) >= 15 ? "var(--green)" : "var(--taupe)";

  const copy = () => {
    try { navigator.clipboard?.writeText(entry.install_cmd); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };
  const tabStyle = (active: boolean) => ({ fontSize: 13, padding: "6px 2px", cursor: "pointer", fontWeight: 600, color: active ? "var(--ink)" : "var(--taupe)", borderBottom: active ? "2px solid var(--orange)" : "2px solid transparent", marginBottom: -9 });
  const metaRow = { display: "flex", justifyContent: "space-between", alignItems: "baseline" } as const;
  const metaKey = { fontSize: 11, letterSpacing: ".10em", textTransform: "uppercase" as const, color: "var(--taupe)" };
  const metaVal = { fontSize: 13, fontWeight: 500 } as const;

  return (
    <main style={{ maxWidth: 1240, margin: "0 auto", padding: "34px 48px 80px" }}>
      <Link href="/" style={{ fontSize: 12, color: "var(--taupe)", letterSpacing: ".04em", textDecoration: "none" }}>{t.back}</Link>
      <section style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 48, marginTop: 26, alignItems: "start" }}>
        <div>
          <div style={{ height: 220, background: entry.cover_color, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
            <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 150, color: "rgba(255,255,255,.92)", lineHeight: 1 }}>{entry.name[0]}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 13 }}>
            <TrustBadge tier={entry.trust_tier} />
            <span style={{ fontSize: 11, letterSpacing: ".10em", textTransform: "uppercase", color: "var(--orange)", fontWeight: 600 }}>{entry.kind}</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 600, fontSize: 52, lineHeight: 1, margin: "0 0 10px" }}>{entry.name}</h1>
          <p style={{ fontSize: 18, color: "var(--ink-soft)", margin: "0 0 26px" }}>{desc}</p>
          <div style={{ display: "flex", gap: 18, paddingBottom: 8, borderBottom: "1px solid var(--hair)", marginBottom: 22 }}>
            <span style={tabStyle(tab === "overview")} onClick={() => setTab("overview")}>{t.tabOverview}</span>
            <span style={tabStyle(tab === "security")} onClick={() => setTab("security")}>{t.tabSecurity}</span>
          </div>
          {tab === "overview" ? (
            <>
              <p style={{ fontSize: 15.5, lineHeight: 1.75, color: "var(--ink)", margin: "0 0 24px", whiteSpace: "pre-line" }}>{long}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {entry.tags.map((tg) => (
                  <span key={tg} style={{ fontSize: 12, fontFamily: "var(--font-mono), monospace", color: "var(--ink-soft)", background: "var(--chip)", padding: "5px 11px", borderRadius: 2 }}>#{tg}</span>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "16px 18px", background: "var(--panel)", border: "1px solid var(--hair)", borderRadius: 3 }}>
                <span style={{ color: "var(--green)", fontSize: 18 }}>✓</span>
                <div><div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{t.secScan}</div><div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>{secNote}</div></div>
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "16px 18px", background: "var(--panel)", border: "1px solid var(--hair)", borderRadius: 3 }}>
                <span style={{ color: "var(--orange)", fontSize: 18 }}>◷</span>
                <div><div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{t.secReview}</div><div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>{t.secReviewNote}</div></div>
              </div>
            </div>
          )}
        </div>
        <aside style={{ position: "sticky", top: 90, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, fontFamily: "var(--font-mono), monospace", fontSize: 13, color: "var(--ink)", background: "var(--chip)", padding: "13px 15px", borderRadius: 2, marginBottom: 12 }}>
            <span style={{ color: "var(--orange)" }}>$</span><span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.install_cmd}</span>
          </div>
          <span onClick={copy} style={{ textAlign: "center", fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600, color: "var(--bg)", background: "var(--ink)", padding: 13, borderRadius: 2, cursor: "pointer" }}>{copied ? t.copied : t.copy}</span>
          <div style={{ borderTop: "1px solid var(--hair)", marginTop: 26, paddingTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={metaRow}>
              <span style={metaKey}>{t.mBy}</span>
              {entry.author
                ? <Link href={`/p/${publisherSlug(entry.author)}`} style={{ ...metaVal, color: "var(--orange)", textDecoration: "none" }}>{entry.author}</Link>
                : <span style={metaVal}>—</span>}
            </div>
            <div style={metaRow}><span style={metaKey}>{t.mCategory}</span><span style={metaVal}>{CATEGORY_LABELS[entry.category][lang]}</span></div>
            <div style={metaRow}><span style={metaKey}>{t.mStars}</span><span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>★ {formatStars(entry.stars)} {entry.trend != null && <span style={{ color: trendColor, fontWeight: 600 }}>▲{entry.trend}%</span>}</span></div>
            <div style={metaRow}><span style={metaKey}>{t.mLicense}</span><span style={metaVal}>{entry.license ?? "—"}</span></div>
            <div style={metaRow}><span style={metaKey}>{t.mUpdated}</span><span style={metaVal}>{entry.updated ?? "—"}</span></div>
          </div>
          <a href={entry.repo_url} target="_blank" rel="noreferrer" style={{ marginTop: 22, fontSize: 12, letterSpacing: ".10em", textTransform: "uppercase", color: "var(--orange)", border: "1px solid var(--orange)", padding: 11, borderRadius: 2, textAlign: "center", textDecoration: "none" }}>{t.viewGithub} ↗</a>
        </aside>
      </section>
      <section style={{ marginTop: 60 }}>
        <div style={{ fontSize: 11, letterSpacing: ".20em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: 600, borderBottom: "1px solid var(--hair-strong)", paddingBottom: 11, marginBottom: 24 }}>{t.related}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {related(entry, 3).map((e) => <Card key={e.id} entry={e} />)}
        </div>
      </section>
    </main>
  );
}
