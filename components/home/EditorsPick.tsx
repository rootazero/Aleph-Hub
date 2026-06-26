"use client";
import Link from "next/link";
import { useLang } from "@/components/providers/LangProvider";
import { STRINGS } from "@/lib/i18n";
import { slugForAny, formatStars } from "@/lib/entry";
import type { HomeInstallCard } from "@/lib/home";

// Mockup lines 56-67. The "editor's pick" (highest-starred entry) is picked server-side
// and passed in slim.
export function EditorsPick({ pick }: { pick: HomeInstallCard }) {
  const { lang } = useLang();
  const t = STRINGS[lang];
  const desc = lang === "zh" ? pick.description_zh : pick.description_en;
  return (
    <Link href={`/e/${slugForAny(pick)}`} style={{ display: "block", textDecoration: "none", color: "inherit", background: "var(--panel)", border: "1px solid var(--hair)", borderRadius: 3, overflow: "hidden", boxShadow: "0 12px 40px rgba(36,28,22,.10)" }}>
      <div style={{ height: 236, background: pick.cover_color, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 140, color: "rgba(255,255,255,.92)", lineHeight: 1 }}>{pick.name[0]}</span>
        <span style={{ position: "absolute", top: 16, left: 16, fontSize: 10, letterSpacing: ".10em", textTransform: "uppercase", fontWeight: 600, color: pick.cover_color, background: "#fff", padding: "5px 11px", borderRadius: 2 }}>{t.editorPick}</span>
      </div>
      <div style={{ padding: "22px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 11, letterSpacing: ".10em", textTransform: "uppercase", color: "var(--orange)", fontWeight: 600 }}>{pick.kind}</span>
          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 13, color: "var(--ink-soft)" }}>★ {formatStars(pick.stars)}</span>
        </div>
        <h3 style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 600, fontSize: 30, margin: "0 0 8px" }}>{pick.name}</h3>
        <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--ink-soft)", margin: "0 0 16px" }}>{desc}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-mono), monospace", fontSize: 12.5, color: "var(--ink)", background: "var(--chip)", padding: "11px 14px", borderRadius: 2 }}>
          <span style={{ color: "var(--orange)" }}>$</span><span style={{ flex: 1 }}>{pick.install_cmd}</span>
        </div>
      </div>
    </Link>
  );
}
