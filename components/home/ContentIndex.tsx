"use client";
import Link from "next/link";
import type { ContentKindT } from "@/contract/content-schema";
import { useLang } from "@/components/providers/LangProvider";
import { STRINGS, CONTENT_KIND_LABELS } from "@/lib/i18n";
import { slugForAny } from "@/lib/entry";
import type { HomeContentCard, HomeContentRow, ContentRegion } from "@/lib/home";

// The two content axes continue the home Index below the three install axes.
// Numbers 04/05 follow skill(01)/mcp(02)/plugin(03). Like the install axes, each
// is a two-column / four-row region whose image "main" spans two rows on its side,
// alternating right/left so the regions cross. Data is computed server-side
// (lib/home) and passed in slim.
const META: Record<ContentKindT, { num: string; side: "left" | "right"; zhTag: string; enTag: string }> = {
  prompt: { num: "04", side: "right", zhTag: "即用型提示词", enTag: "Copy-ready prompts" },
  workflow: { num: "05", side: "left", zhTag: "可运行的 Agent 工作流", enTag: "Runnable agent workflows" },
};

export function ContentIndex({ regions }: { regions: ContentRegion[] }) {
  const { lang } = useLang();
  const t = STRINGS[lang];
  const nameOf = (k: ContentKindT) => (lang === "zh" ? CONTENT_KIND_LABELS[k].zh : CONTENT_KIND_LABELS[k].en);

  const head = (k: ContentKindT, count: number) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, marginBottom: 18 }}>
      <span style={{ display: "flex", gap: 18, alignItems: "baseline", minWidth: 0 }}>
        <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, color: "var(--orange)" }}>{META[k].num}</span>
        <span style={{ fontFamily: "var(--font-cormorant), var(--font-noto-serif-sc), serif", fontSize: 30 }}>{nameOf(k)}</span>
        <span style={{ fontSize: 13, color: "var(--taupe)" }}>{lang === "zh" ? META[k].zhTag : META[k].enTag}</span>
      </span>
      <Link href={`/c/${k}`} className="sec-more" style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none", color: "var(--taupe)", flex: "none" }}>
        <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 13, color: "var(--ink-soft)" }}>{count}</span>
        <span style={{ fontSize: 11, letterSpacing: ".10em", textTransform: "uppercase" }}>{t.viewAll} →</span>
      </Link>
    </div>
  );

  const featRow = (e: HomeContentRow) => (
    <Link key={e.id} href={`/e/${slugForAny(e)}`} className="idx-feat-row" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, padding: "13px 0", borderTop: "1px solid var(--hair)", textDecoration: "none", color: "inherit" }}>
      <span style={{ display: "flex", alignItems: "baseline", gap: 11, minWidth: 0 }}>
        <span className="idx-feat-name" style={{ fontFamily: "var(--font-mono), monospace", fontSize: 14, color: "var(--ink)", whiteSpace: "nowrap" }}>{e.name}</span>
        <span style={{ fontSize: 12, color: "var(--taupe)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.author}</span>
      </span>
      <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11.5, color: "var(--ink-soft)", flex: "none" }}>{e.format}</span>
    </Link>
  );

  const mainCard = (e: HomeContentCard) => (
    <Link href={`/e/${slugForAny(e)}`} className="idx-main idx-spotlight" style={{ display: "flex", gap: 16, alignItems: "center", background: "var(--panel)", border: "1px solid var(--hair)", borderRadius: 3, padding: 14, textDecoration: "none", color: "inherit" }}>
      <div style={{ width: 74, height: 74, flex: "none", borderRadius: 2, background: e.cover_color, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 44, color: "rgba(255,255,255,.92)", lineHeight: 1 }}>{e.name[0]}</span>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-cormorant), var(--font-noto-serif-sc), serif", fontWeight: 600, fontSize: 21, marginBottom: 4 }}>{e.name}</div>
        <p style={{ fontSize: 12.5, lineHeight: 1.4, color: "var(--ink-soft)", margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lang === "zh" ? e.description_zh : e.description_en}</p>
        <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11.5, color: "var(--ink-soft)" }}>{e.author} · {e.format}</span>
      </div>
    </Link>
  );

  // Empty axis (e.g. workflow before any are curated): a quiet coming-soon note.
  const emptyRegion = (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--taupe)", marginBottom: 7 }}>{t.comingSoon}</div>
      <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-soft)", margin: 0, maxWidth: "42ch" }}>{t.contentSoon}</p>
    </div>
  );

  const regionBody = (region: ContentRegion) => {
    if (!region.main) return emptyRegion;
    return (
      <div className={`idx-region-grid idx-feat-${META[region.kind].side}`} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "0 44px", alignItems: "start", gridAutoFlow: "row dense" }}>
        {mainCard(region.main)}
        {region.rows.map((e) => featRow(e))}
      </div>
    );
  };

  return (
    <section style={{ maxWidth: 1480, margin: "0 auto", padding: "0 48px 8px" }}>
      {regions.map((region) => (
        <div key={region.kind} style={{ padding: "30px 0", borderTop: "1px solid var(--hair)" }}>
          {head(region.kind, region.count)}
          {regionBody(region)}
        </div>
      ))}
    </section>
  );
}
