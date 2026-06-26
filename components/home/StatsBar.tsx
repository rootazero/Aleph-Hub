"use client";
import { useLang } from "@/components/providers/LangProvider";
import { STRINGS } from "@/lib/i18n";

// Mockup lines 70-76. Projects count is data-bound (not the mockup's hardcoded 622);
// it spans both catalogs (install + content) to match /all and is passed in from the
// server so this client component never imports the catalog JSON. Categories = the
// 13-value ExtensionCategory taxonomy.
export function StatsBar({ total }: { total: number }) {
  const { lang } = useLang();
  const t = STRINGS[lang];
  const stat = { flex: 1, padding: "18px 0", display: "flex", alignItems: "baseline", gap: 10 } as const;
  const num = { fontFamily: "var(--font-cormorant), serif", fontSize: 28 } as const;
  const label = { fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase" as const, color: "var(--taupe)" };
  return (
    <section style={{ maxWidth: 1480, margin: "0 auto", padding: "0 48px" }}>
      <div style={{ display: "flex", borderTop: "1px solid var(--hair-strong)", borderBottom: "1px solid var(--hair)" }}>
        <div style={stat}><span style={num} data-testid="stat-projects">{total}</span><span style={label}>{t.stProjects}</span></div>
        <div style={{ ...stat, borderLeft: "1px solid var(--hair)", paddingLeft: 28 }}><span style={num}>13</span><span style={label}>{t.stCats}</span></div>
        <div style={{ ...stat, borderLeft: "1px solid var(--hair)", paddingLeft: 28 }}><span style={num}>{t.stDailyN}</span><span style={label}>{t.stSync}</span></div>
      </div>
    </section>
  );
}
