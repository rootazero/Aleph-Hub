"use client";
import { useLang } from "@/components/providers/LangProvider";
import { STRINGS } from "@/lib/i18n";
import { collections } from "@/lib/catalog";
import { Card } from "@/components/Card";

// Mockup lines 107-124. Editorial collections grouped by tag (spec §7.4):
// Integrations / Templates / Workflows. Empty groups are skipped.
const GROUP_LABELS: Record<string, { zh: string; en: string }> = {
  integration: { zh: "集成", en: "Integrations" },
  template: { zh: "模板", en: "Templates" },
  workflow: { zh: "工作流", en: "Workflows" },
};

export function Collection() {
  const { lang } = useLang();
  const t = STRINGS[lang];
  const groups = collections().filter((g) => g.entries.length);
  return (
    <section style={{ maxWidth: 1480, margin: "0 auto", padding: "8px 48px 80px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: "1px solid var(--hair-strong)", paddingBottom: 11, marginBottom: 26 }}>
        <span style={{ fontSize: 11, letterSpacing: ".20em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: 600 }}>{t.collectionTitle}</span>
      </div>
      {groups.map((g) => (
        <div key={g.tag} style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "var(--font-cormorant), var(--font-noto-serif-sc), serif", fontSize: 24, marginBottom: 16 }}>{GROUP_LABELS[g.tag][lang]}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {g.entries.map((e) => <Card key={e.id} entry={e} />)}
          </div>
        </div>
      ))}
    </section>
  );
}
