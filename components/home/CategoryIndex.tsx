"use client";
import Link from "next/link";
import type { ExtensionKindT } from "@/contract/types";
import { useLang } from "@/components/providers/LangProvider";
import { STRINGS } from "@/lib/i18n";
import { kindCounts } from "@/lib/catalog";

// Mockup lines 78-89. Rows = the 3 kinds (the nav axis), counts from kindCounts().
const ROWS: { kind: ExtensionKindT; num: string; zhName: string; enName: string; zhTag: string; enTag: string }[] = [
  { kind: "skill", num: "01", zhName: "Agent 技能", enName: "Agent Skills", zhTag: "可调用的原子能力", enTag: "Atomic callable abilities" },
  { kind: "plugin", num: "02", zhName: "插件", enName: "Plugins", zhTag: "可组合的扩展包", enTag: "Composable extension packs" },
  { kind: "mcp", num: "03", zhName: "MCP 服务", enName: "MCP Servers", zhTag: "标准化工具协议服务", enTag: "Standard tool-protocol servers" },
];

export function CategoryIndex() {
  const { lang } = useLang();
  const t = STRINGS[lang];
  const counts = kindCounts();
  return (
    <section style={{ maxWidth: 1480, margin: "0 auto", padding: "48px 48px 8px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: "1px solid var(--hair-strong)", paddingBottom: 11, marginBottom: 2 }}>
        <span style={{ fontSize: 11, letterSpacing: ".20em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: 600 }}>{t.indexTitle}</span>
        <span style={{ fontSize: 11, letterSpacing: ".10em", color: "var(--taupe)" }}>{t.browseByCat}</span>
      </div>
      {ROWS.map((r) => (
        <Link key={r.kind} href={`/c/${r.kind}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "20px 0", borderBottom: "1px solid var(--hair)", textDecoration: "none", color: "inherit" }}>
          <span style={{ display: "flex", gap: 22, alignItems: "baseline", minWidth: 0 }}>
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, color: "var(--orange)" }}>{r.num}</span>
            <span style={{ fontFamily: "var(--font-cormorant), var(--font-noto-serif-sc), serif", fontSize: 30 }}>{lang === "zh" ? r.zhName : r.enName}</span>
            <span style={{ fontSize: 13, color: "var(--taupe)" }}>{lang === "zh" ? r.zhTag : r.enTag}</span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 18, flex: "none" }}>
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 13, color: "var(--ink-soft)" }}>{counts[r.kind]}</span>
            <span style={{ color: "var(--orange)", fontSize: 16 }}>→</span>
          </span>
        </Link>
      ))}
    </section>
  );
}
