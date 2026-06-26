"use client";
import Link from "next/link";
import type { ExtensionKindT } from "@/contract/types";
import { useLang } from "@/components/providers/LangProvider";
import { STRINGS } from "@/lib/i18n";
import { slugForAny, formatStars } from "@/lib/entry";
import type { HomeInstallCard, HomeFeatRow, InstallRegion } from "@/lib/home";

// The three kinds are the index's axes, shown in order skill -> mcp -> plugin.
// Each is a two-column / four-row region with one image "main extension" spanning
// two rows; the main alternates sides (right / left / right) so the regions cross
// rather than read as three identical lists. Data (counts, flagship, rows, isNew)
// is computed server-side (lib/home) and passed in slim.
const KINDS: Record<ExtensionKindT, { num: string; side: "left" | "right"; zhName: string; enName: string; zhTag: string; enTag: string }> = {
  skill: { num: "01", side: "right", zhName: "Agent 技能", enName: "Agent Skills", zhTag: "可调用的原子能力", enTag: "Atomic callable abilities" },
  mcp: { num: "02", side: "left", zhName: "MCP 服务", enName: "MCP Servers", zhTag: "标准化工具协议服务", enTag: "Standard tool-protocol servers" },
  plugin: { num: "03", side: "right", zhName: "插件", enName: "Plugins", zhTag: "可组合的扩展包", enTag: "Composable extension packs" },
};

export function CategoryIndex({ regions }: { regions: InstallRegion[] }) {
  const { lang } = useLang();
  const t = STRINGS[lang];

  const NewChip = () => (
    <span style={{ fontSize: 9, letterSpacing: ".10em", textTransform: "uppercase", fontWeight: 600, color: "var(--green)", border: "1px solid var(--green)", padding: "2px 6px", borderRadius: 2, flex: "none" }}>{t.newTag}</span>
  );

  const head = (k: ExtensionKindT, count: number) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, marginBottom: 18 }}>
      <span style={{ display: "flex", gap: 18, alignItems: "baseline", minWidth: 0 }}>
        <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, color: "var(--orange)" }}>{KINDS[k].num}</span>
        <span style={{ fontFamily: "var(--font-cormorant), var(--font-noto-serif-sc), serif", fontSize: 30 }}>{lang === "zh" ? KINDS[k].zhName : KINDS[k].enName}</span>
        <span style={{ fontSize: 13, color: "var(--taupe)" }}>{lang === "zh" ? KINDS[k].zhTag : KINDS[k].enTag}</span>
      </span>
      <Link href={`/c/${k}`} className="sec-more" style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none", color: "var(--taupe)", flex: "none" }}>
        <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 13, color: "var(--ink-soft)" }}>{count}</span>
        <span style={{ fontSize: 11, letterSpacing: ".10em", textTransform: "uppercase" }}>{t.viewAll} →</span>
      </Link>
    </div>
  );

  // Compact list pick, reused for the rows beside each main extension.
  const featRow = (e: HomeFeatRow) => (
    <Link key={e.id} href={`/e/${slugForAny(e)}`} className="idx-feat-row" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, padding: "13px 0", borderTop: "1px solid var(--hair)", textDecoration: "none", color: "inherit" }}>
      <span style={{ display: "flex", alignItems: "baseline", gap: 11, minWidth: 0 }}>
        <span className="idx-feat-name" style={{ fontFamily: "var(--font-mono), monospace", fontSize: 14, color: "var(--ink)", whiteSpace: "nowrap" }}>{e.name}</span>
        {e.isNew && <NewChip />}
        <span style={{ fontSize: 12, color: "var(--taupe)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.author}</span>
      </span>
      <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, color: "var(--ink-soft)", flex: "none" }}>★ {formatStars(e.stars)}</span>
    </Link>
  );

  // The image "main extension": cover tile + name + one-line desc + stars, sized
  // to span two list rows.
  const mainCard = (e: HomeInstallCard) => (
    <Link href={`/e/${slugForAny(e)}`} className="idx-main idx-spotlight" style={{ display: "flex", gap: 16, alignItems: "center", background: "var(--panel)", border: "1px solid var(--hair)", borderRadius: 3, padding: 14, textDecoration: "none", color: "inherit" }}>
      <div style={{ width: 74, height: 74, flex: "none", borderRadius: 2, background: e.cover_color, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 44, color: "rgba(255,255,255,.92)", lineHeight: 1 }}>{e.name[0]}</span>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 4 }}>
          <span className="idx-spot-title" style={{ fontFamily: "var(--font-cormorant), var(--font-noto-serif-sc), serif", fontWeight: 600, fontSize: 21 }}>{e.name}</span>
          {e.isNew && <NewChip />}
        </div>
        <p style={{ fontSize: 12.5, lineHeight: 1.4, color: "var(--ink-soft)", margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lang === "zh" ? e.description_zh : e.description_en}</p>
        <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11.5, color: "var(--ink-soft)" }}>★ {formatStars(e.stars)} · {e.author}</span>
      </div>
    </Link>
  );

  // A populated region: two-column grid, the main extension spanning rows 1-2 on
  // its side, the rest auto-flowing into the remaining cells.
  const dataRegion = (region: InstallRegion) => (
    <div className={`idx-region-grid idx-feat-${KINDS[region.kind].side}`} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "0 44px", alignItems: "start", gridAutoFlow: "row dense" }}>
      {mainCard(region.main!)}
      {region.rows.map((e) => featRow(e))}
    </div>
  );

  // The empty Plugins axis: its "main extension" slot becomes a submit card (top
  // right per the cross layout), with the invitation copy in the other column.
  const pluginRegion = (
    <div className="idx-plugins-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 44, alignItems: "center" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--taupe)", marginBottom: 7 }}>{t.comingSoon}</div>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-soft)", margin: 0, maxWidth: "42ch" }}>{t.pluginsInvite}</p>
      </div>
      <Link href="/submit" className="idx-main idx-spotlight" style={{ display: "flex", gap: 16, alignItems: "center", background: "var(--panel)", border: "1px solid var(--hair)", borderRadius: 3, padding: 14, textDecoration: "none", color: "inherit" }}>
        <div style={{ width: 74, height: 74, flex: "none", borderRadius: 2, background: "var(--orange)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 46, color: "var(--bg)", lineHeight: 1 }}>+</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-cormorant), var(--font-noto-serif-sc), serif", fontWeight: 600, fontSize: 21, marginBottom: 4 }}>{t.submitPlugin}</div>
          <span style={{ fontSize: 12.5, color: "var(--orange)", letterSpacing: ".04em" }}>{t.submit} →</span>
        </div>
      </Link>
    </div>
  );

  return (
    <section style={{ maxWidth: 1480, margin: "0 auto", padding: "48px 48px 8px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: "1px solid var(--hair-strong)", paddingBottom: 11, marginBottom: 4 }}>
        <span style={{ fontSize: 11, letterSpacing: ".20em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: 600 }}>{t.indexTitle}</span>
        <span style={{ fontSize: 11, letterSpacing: ".10em", color: "var(--taupe)" }}>{t.browseByCat}</span>
      </div>
      {regions.map((region, i) => (
        <div key={region.kind} style={{ padding: "30px 0", borderBottom: i < regions.length - 1 ? "1px solid var(--hair)" : "none" }}>
          {head(region.kind, region.count)}
          {region.main ? dataRegion(region) : pluginRegion}
        </div>
      ))}
    </section>
  );
}
