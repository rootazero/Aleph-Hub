// Offline rebuild: merge the committed site catalog with the first-party official
// seed and re-emit public/catalog.json + data/site-catalog.json — no network.
// Use after editing data/seeds/aleph-official.json to refresh the committed artifacts
// without a full pipeline run. The next real pipeline run reproduces this deterministically.
import { makeAdapters } from "@/scripts/pipeline/adapters";
import { loadFirstParty } from "@/scripts/pipeline/firstParty";
import { loadMcpPresets, loadAlephMcp } from "@/scripts/pipeline/mcp-presets";
import { buildArtifacts } from "@/scripts/pipeline/emit";
import { validateArtifact } from "@/contract/schema";
import { validateSiteCatalog } from "@/contract/site";
import type { FinalEntry } from "@/scripts/pipeline/model";
import type { SiteEntryT } from "@/contract/site";

// Reconstruct a FinalEntry from a committed SiteEntry. full_name/owner/repo are not
// projected by buildArtifacts, so synthesizing them from the id is lossless for output.
function siteEntryToFinal(se: SiteEntryT): FinalEntry {
  const fullName = se.id.replace(/^aleph-hub:/, "");
  const [owner = "", repo = ""] = fullName.split("/");
  return {
    id: se.id, repo_url: se.repo_url, via: se.via ?? "",
    full_name: fullName, owner, repo,
    kind: se.kind, name: se.name, author: se.author ?? owner,
    category: se.category, tags: se.tags ?? [], install_spec: se.install_spec,
    description_en: se.description_en, description_zh: se.description_zh,
    long_en: se.long_en, long_zh: se.long_zh,
    sec_note_en: se.sec_note_en, sec_note_zh: se.sec_note_zh,
    requires_config: se.requires_config ?? false,
    stars: se.stars, license: se.license, updated: se.updated,
    trend: se.trend ?? null, spark: se.spark ?? [],
    cover_color: se.cover_color, install_cmd: se.install_cmd,
    trust_tier: se.trust_tier,
  };
}

function main(): void {
  const { fs } = makeAdapters();
  const site = fs.readJson<{ entries: SiteEntryT[] }>("data/site-catalog.json");
  const existing: FinalEntry[] = (site?.entries ?? []).map(siteEntryToFinal);
  const firstParty = [...loadFirstParty(fs), ...loadMcpPresets(fs), ...loadAlephMcp(fs)];

  // First-party official entries take precedence over any existing entry sharing an id.
  const byId = new Map<string, FinalEntry>();
  for (const f of firstParty) byId.set(f.id, f);
  for (const f of existing) if (!byId.has(f.id)) byId.set(f.id, f);
  const merged = [...byId.values()];

  const { catalog, site: siteOut } = buildArtifacts({
    entries: merged,
    generatedAt: new Date().toISOString(),
    prevContractCount: existing.length,
  });

  validateArtifact(catalog);       // fail loudly if the merge produced an invalid contract
  validateSiteCatalog(siteOut);

  fs.writeJson("public/catalog.json", catalog);
  fs.writeJson("data/site-catalog.json", siteOut);

  const official = firstParty.length;
  console.log(`regen-firstparty: ${merged.length} entries (${official} official + ${existing.length} existing, deduped)`);
}

main();
