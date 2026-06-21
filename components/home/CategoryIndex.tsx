"use client";
import Link from "next/link";
import type { ExtensionKindT } from "@/contract/types";
import type { SiteEntryT } from "@/contract/site";
import { useLang } from "@/components/providers/LangProvider";
import { STRINGS } from "@/lib/i18n";
import { latest, newestOfKind, kindCounts, formatStars, formatShortDate, slugForEntry } from "@/lib/catalog";
import { TrustBadge } from "@/components/TrustBadge";

// The 3 kinds remain the index's navigational axis (mockup lines 78-89); each row
// now previews its newest entry instead of standing as a bare directory link.
const KINDS: { kind: ExtensionKindT; num: string; zhName: string; enName: string; zhTag: string; enTag: string }[] = [
  { kind: "skill", num: "01", zhName: "Agent 技能", enName: "Agent Skills", zhTag: "可调用的原子能力", enTag: "Atomic callable abilities" },
  { kind: "plugin", num: "02", zhName: "插件", enName: "Plugins", zhTag: "可组合的扩展包", enTag: "Composable extension packs" },
  { kind: "mcp", num: "03", zhName: "MCP 服务", enName: "MCP Servers", zhTag: "标准化工具协议服务", enTag: "Standard tool-protocol servers" },
];

export function CategoryIndex() {
  const { lang } = useLang();
  const t = STRINGS[lang];
  const counts = kindCounts();
  const feed = latest(4); // 1 featured + 3 also-new
  const featured = feed[0];
  const alsoNew = feed.slice(1, 4);
  const descOf = (e: SiteEntryT) => (lang === "zh" ? e.description_zh : e.description_en);

  return (
    <section style={{ maxWidth: 1480, margin: "0 auto", padding: "48px 48px 8px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: "1px solid var(--hair-strong)", paddingBottom: 11 }}>
        <span style={{ fontSize: 11, letterSpacing: ".20em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: 600 }}>{t.indexTitle}</span>
        <span style={{ fontSize: 11, letterSpacing: ".10em", color: "var(--taupe)" }}>{t.browseByCat}</span>
      </div>

      {/* Latest lede: the freshest entry featured large, with the next three beside it. */}
      {featured && (
        <div className="idx-lede" style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 44, alignItems: "stretch", padding: "30px 0 34px", borderBottom: "1px solid var(--hair)" }}>
          <Link href={`/e/${slugForEntry(featured)}`} className="idx-feature" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <span style={{ fontSize: 10.5, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--orange)", fontWeight: 600 }}>{t.latestLabel}</span>
              <span style={{ flex: 1, height: 1, background: "var(--hair)" }} />
              <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, color: "var(--taupe)" }}>{formatShortDate(featured.updated)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
              <h3 className="idx-feature-title" style={{ fontFamily: "var(--font-cormorant), var(--font-noto-serif-sc), serif", fontWeight: 600, fontSize: 40, lineHeight: 1.05, letterSpacing: "-.01em", margin: 0 }}>{featured.name}</h3>
              <span style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-soft)", background: "var(--chip)", padding: "3px 8px", borderRadius: 2 }}>{featured.kind}</span>
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.58, color: "var(--ink-soft)", maxWidth: "52ch", margin: "0 0 18px" }}>{descOf(featured)}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12.5, color: "var(--taupe)" }}>
              <span>{featured.author}</span>
              <span style={{ fontFamily: "var(--font-mono), monospace", color: "var(--ink-soft)" }}>★ {formatStars(featured.stars)}</span>
              <TrustBadge tier={featured.trust_tier} />
              <span className="idx-feature-arrow" style={{ color: "var(--orange)", marginLeft: "auto", fontSize: 16 }}>→</span>
            </div>
          </Link>

          <div className="idx-alsonew" style={{ borderLeft: "1px solid var(--hair)", paddingLeft: 36, display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 10.5, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--taupe)", fontWeight: 600, marginBottom: 6 }}>{t.alsoNew}</span>
            {alsoNew.map((e) => (
              <Link key={e.id} href={`/e/${slugForEntry(e)}`} className="idx-row" style={{ display: "flex", alignItems: "baseline", gap: 14, padding: "14px 0", borderBottom: "1px solid var(--hair)", textDecoration: "none", color: "inherit" }}>
                <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: "var(--taupe)", width: 46, flex: "none" }}>{formatShortDate(e.updated)}</span>
                <span className="idx-row-name" style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 16, fontFamily: "var(--font-cormorant), var(--font-noto-serif-sc), serif" }}>{e.name}</span>
                <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11.5, color: "var(--ink-soft)", flex: "none" }}>★ {formatStars(e.stars)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Numbered kind directory: each axis previews its newest item, or shows it is empty. */}
      {KINDS.map((r) => {
        const newest = newestOfKind(r.kind);
        return (
          <div key={r.kind} style={{ borderBottom: "1px solid var(--hair)" }}>
            <Link href={`/c/${r.kind}`} className="idx-kind" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "20px 0 8px", textDecoration: "none", color: "inherit" }}>
              <span style={{ display: "flex", gap: 22, alignItems: "baseline", minWidth: 0 }}>
                <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, color: "var(--orange)" }}>{r.num}</span>
                <span style={{ fontFamily: "var(--font-cormorant), var(--font-noto-serif-sc), serif", fontSize: 30 }}>{lang === "zh" ? r.zhName : r.enName}</span>
                <span style={{ fontSize: 13, color: "var(--taupe)" }}>{lang === "zh" ? r.zhTag : r.enTag}</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 18, flex: "none" }}>
                <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 13, color: "var(--ink-soft)" }}>{counts[r.kind]}</span>
                <span className="idx-kind-arrow" style={{ color: "var(--orange)", fontSize: 16 }}>→</span>
              </span>
            </Link>
            <div style={{ padding: "0 0 16px 56px" }}>
              {newest ? (
                <Link href={`/e/${slugForEntry(newest)}`} className="idx-preview" style={{ display: "flex", alignItems: "baseline", gap: 10, textDecoration: "none", color: "inherit" }}>
                  <span style={{ fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--taupe)", flex: "none" }}>{t.latestPrefix}</span>
                  <span className="idx-preview-name" style={{ fontFamily: "var(--font-mono), monospace", fontSize: 13, color: "var(--ink)", flex: "none" }}>{newest.name}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "var(--taupe)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{descOf(newest)}</span>
                </Link>
              ) : (
                <span style={{ fontSize: 12.5, color: "var(--taupe)", fontStyle: "italic" }}>{t.comingSoon}</span>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
