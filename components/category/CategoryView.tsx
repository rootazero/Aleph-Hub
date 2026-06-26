"use client";
import { useState } from "react";
import type { ExtensionKindT } from "@/contract/types";
import type { ContentKindT } from "@/contract/content-schema";
import { useLang } from "@/components/providers/LangProvider";
import { STRINGS, catLabel } from "@/lib/i18n";
import type { ListEntry } from "@/lib/entry";
import { useInfiniteScroll } from "@/lib/use-infinite-scroll";
import { Card } from "@/components/Card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

type AnyKind = ExtensionKindT | ContentKindT;
const CATS = ["search", "developer", "productivity", "writing", "communication", "knowledge", "files", "design", "automation", "finance", "utilities", "other"];
const KIND_TITLE: Record<AnyKind, string> = { skill: "Agent Skills", plugin: "Plugins", mcp: "MCP Servers", prompt: "Prompts", workflow: "Workflows" };

// Entries arrive slim from the server page (lib/list); the grid is revealed via infinite
// scroll so a kind with thousands of entries never renders them all at once.
export function CategoryView({ kind, entries }: { kind: AnyKind; entries: ListEntry[] }) {
  const { lang } = useLang();
  const t = STRINGS[lang];
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const query = q.trim().toLowerCase();
  const matches = entries
    .filter((e) => cat === "all" || e.category === cat)
    .filter((e) => !query || `${e.name} ${e.description_en} ${e.description_zh} ${e.tags.join(" ")}`.toLowerCase().includes(query));
  const { visible, sentinel } = useInfiniteScroll(matches, `${kind}|${cat}|${query}`);
  return (
    <>
      <Header />
      <main style={{ maxWidth: 1480, margin: "0 auto", padding: "0 48px 76px" }}>
        <section style={{ padding: "56px 0 28px", borderBottom: "1px solid var(--hair-strong)" }}>
          <div style={{ fontSize: 11, letterSpacing: ".24em", textTransform: "uppercase", color: "var(--orange)", marginBottom: 18, fontWeight: 600 }}>{t.catalogKicker}</div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24 }}>
            <h1 style={{ fontFamily: "var(--font-cormorant), var(--font-noto-serif-sc), serif", fontWeight: 500, fontSize: 60, lineHeight: 1, margin: 0 }}>{KIND_TITLE[kind]}</h1>
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 14, color: "var(--ink-soft)", paddingBottom: 8 }}>{matches.length} {t.results}</span>
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
            <span key={c} onClick={() => setCat(c)} style={{ fontSize: 12, padding: "8px 18px", borderRadius: 20, cursor: "pointer", color: cat === c ? "#FBF6EE" : "var(--ink-soft)", background: cat === c ? "var(--orange)" : "var(--panel)", border: cat === c ? "none" : "1px solid var(--hair)" }}>{catLabel(c, lang)}</span>
          ))}
        </section>
        {matches.length ? (
          <>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
              {visible.map((e) => <Card key={e.id} entry={e} />)}
            </section>
            <div ref={sentinel} aria-hidden style={{ height: 1 }} />
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--taupe)", fontSize: 15 }}>{t.noResults}</div>
        )}
      </main>
      <Footer />
    </>
  );
}
