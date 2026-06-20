"use client";
import { useState } from "react";
import type { ExtensionKindT } from "@/contract/types";
import { useLang } from "@/components/providers/LangProvider";
import { STRINGS } from "@/lib/i18n";
import { getByKind } from "@/lib/catalog";
import { Card } from "@/components/Card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const CATS = ["search", "developer", "data", "productivity", "writing", "communication", "knowledge", "files", "design", "automation", "finance", "utilities", "other"];
const KIND_TITLE: Record<ExtensionKindT, string> = { skill: "Agent Skills", plugin: "Plugins", mcp: "MCP Servers" };

export function CategoryView({ kind }: { kind: ExtensionKindT }) {
  const { lang } = useLang();
  const t = STRINGS[lang];
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const all = getByKind(kind);
  const query = q.trim().toLowerCase();
  const visible = all
    .filter((e) => cat === "all" || e.category === cat)
    .filter((e) => !query || `${e.name} ${e.description_en} ${e.description_zh} ${e.tags.join(" ")}`.toLowerCase().includes(query));
  return (
    <>
      <Header />
      <main style={{ maxWidth: 1480, margin: "0 auto", padding: "0 48px 76px" }}>
        <section style={{ padding: "56px 0 28px", borderBottom: "1px solid var(--hair-strong)" }}>
          <div style={{ fontSize: 11, letterSpacing: ".24em", textTransform: "uppercase", color: "var(--orange)", marginBottom: 18, fontWeight: 600 }}>{t.catalogKicker}</div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24 }}>
            <h1 style={{ fontFamily: "var(--font-cormorant), var(--font-noto-serif-sc), serif", fontWeight: 500, fontSize: 60, lineHeight: 1, margin: 0 }}>{KIND_TITLE[kind]}</h1>
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 14, color: "var(--ink-soft)", paddingBottom: 8 }}>{visible.length} {t.results}</span>
          </div>
        </section>
        <section style={{ display: "flex", gap: 16, padding: "22px 0", borderBottom: "1px solid var(--hair)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, background: "var(--panel)", border: "1px solid var(--hair)", borderRadius: 2, padding: "11px 15px" }}>
            <span style={{ color: "var(--taupe)" }}>⌕</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.searchPh} style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14, color: "var(--ink)" }} />
          </div>
        </section>
        <section style={{ display: "flex", gap: 10, padding: "18px 0 28px", flexWrap: "wrap" }}>
          {["all", ...CATS].map((c) => (
            <span key={c} onClick={() => setCat(c)} style={{ fontSize: 12, padding: "8px 18px", borderRadius: 20, cursor: "pointer", color: cat === c ? "#FBF6EE" : "var(--ink-soft)", background: cat === c ? "var(--orange)" : "var(--panel)", border: cat === c ? "none" : "1px solid var(--hair)" }}>{c === "all" ? t.allCats : c}</span>
          ))}
        </section>
        {visible.length ? (
          <section style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {visible.map((e) => <Card key={e.id} entry={e} />)}
          </section>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--taupe)", fontSize: 15 }}>{t.noResults}</div>
        )}
      </main>
      <Footer />
    </>
  );
}
