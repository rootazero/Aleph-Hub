"use client";
import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/providers/LangProvider";
import { STRINGS, CATEGORY_LABELS } from "@/lib/i18n";
import type { ExtensionCategoryT } from "@/contract/types";
import { buildIssueUrl } from "@/lib/submit";

// "data" is a tombstoned category (folded into "developer" in the display taxonomy,
// see lib/i18n.ts) — kept in the contract for back-compat but not offered for new
// submissions, since the browse UI doesn't surface it.
const CATS = (Object.keys(CATEGORY_LABELS) as ExtensionCategoryT[]).filter((c) => c !== "data");

// Mockup lines 206-224. On submit, opens a prefilled GitHub issue.
export function SubmitForm() {
  const { lang } = useLang();
  const t = STRINGS[lang];
  const [repo, setRepo] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ExtensionCategoryT>("developer");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");

  const label = { display: "block", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase" as const, color: "var(--taupe)", fontWeight: 600, marginBottom: 9 };
  const field = { width: "100%", background: "var(--panel)", border: "1px solid var(--hair)", borderRadius: 2, padding: "13px 15px", fontSize: 14, color: "var(--ink)", outline: "none" } as const;

  const submit = () => {
    const url = buildIssueUrl({ repo, name, category, description, tags });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "60px 48px 90px" }}>
      <div style={{ fontSize: 11, letterSpacing: ".24em", textTransform: "uppercase", color: "var(--orange)", marginBottom: 18, fontWeight: 600 }}>{t.submitKicker}</div>
      <h1 style={{ fontFamily: "var(--font-cormorant), var(--font-noto-serif-sc), serif", fontWeight: 500, fontSize: 56, lineHeight: 1.02, margin: "0 0 16px" }}>{t.submitTitle}</h1>
      <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ink-soft)", margin: "0 0 40px", maxWidth: "54ch" }}>{t.submitSub}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <label style={label}>{t.fRepo}</label>
          <input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="https://github.com/you/your-skill" style={{ ...field, fontFamily: "var(--font-mono), monospace" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div>
            <label style={label}>{t.fName}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="my-skill" style={field} />
          </div>
          <div>
            <label style={label}>{t.fCategory}</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as ExtensionCategoryT)} style={field}>
              {CATS.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c][lang]}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={label}>{t.fDesc}</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder={t.fDescPh} style={{ ...field, resize: "vertical", lineHeight: 1.5 }} />
        </div>
        <div>
          <label style={label}>{t.fTags}</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="browser, testing, automation" style={field} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", background: "var(--chip)", borderRadius: 3 }}>
          <span style={{ color: "var(--orange)", fontSize: 18 }}>◷</span>
          <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>{t.submitNote}</div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
          <span onClick={submit} style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600, color: "var(--bg)", background: "var(--ink)", padding: "15px 32px", borderRadius: 2, cursor: "pointer" }}>{t.submitBtn}</span>
          <Link href="/" style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600, color: "var(--ink-soft)", padding: "15px 20px", borderRadius: 2, textDecoration: "none" }}>{t.cancel}</Link>
        </div>
      </div>
    </main>
  );
}
