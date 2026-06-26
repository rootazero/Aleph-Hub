// Offline content rebuild: re-emit public/catalog-content.json + data/site-content.json from the
// committed data/curation-content/*.json records ALONE — no discovery, no network, no queue write.
// Mirrors regen-firstparty for the content axis. Used by humans after editing records and by the
// scheduled curation routine (which has no GitHub token, so it must never run live discovery).
import { readFileSync, writeFileSync } from "node:fs";
import { runContent } from "@/scripts/pipeline/content-run";
import { makeContentCurationStore } from "@/scripts/pipeline/adapters";

function installSiteSlugs(): Set<string> {
  const cat = JSON.parse(readFileSync("data/site-catalog.json", "utf8")) as { entries?: { id: string }[] };
  return new Set((cat.entries ?? []).map((e) => e.id.replace(/^aleph-hub:/, "")));
}

async function main() {
  const store = makeContentCurationStore();
  const officialOrgs = new Set((JSON.parse(readFileSync("data/seeds/official-orgs.json", "utf8")) as string[] ?? []).map((s) => s.toLowerCase()));
  const clock = { nowIso: () => new Date().toISOString() };
  // sources: [] → no discovery; llm: null → no auto-curation. Pure record-based emit.
  const res = await runContent({ sources: [], store, clock, officialOrgs, llm: null, reservedSlugs: installSiteSlugs() });
  writeFileSync("public/catalog-content.json", JSON.stringify(res.catalog, null, 2) + "\n");
  writeFileSync("data/site-content.json", JSON.stringify(res.site, null, 2) + "\n");
  console.log(JSON.stringify({ rebuilt: true, ...res.report }, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
