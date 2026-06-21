// First-party track: Aleph's official skills/plugins live as subdir leaves of the
// Aleph repos, not as standalone repositories, so they bypass source discovery.
// This module reads the hand-curated seed and projects each record into a FinalEntry
// (trust_tier=official), ready to merge into the run's finals before buildArtifacts.
import { InstallSpec } from "@/contract/schema";
import { coverColorFor } from "@/scripts/pipeline/enrich";
import { requiresConfig } from "@/scripts/pipeline/install_spec";
import type { FinalEntry } from "@/scripts/pipeline/model";
import type { FileStore } from "@/scripts/pipeline/ports";
import type { ExtensionKindT, ExtensionCategoryT } from "@/contract/types";

const SEED_PATH = "data/seeds/aleph-official.json";

// Per-kind repo coordinates + repo-level enrichment, shared by every leaf of that kind.
interface GroupCfg {
  git_url: string;
  git_ref: string;
  subdir_prefix: string;   // "skills" | "plugins"
  tree_url: string;        // upstream tree URL prefix (provenance)
  owner: string;
  repo: string;
  stars: number;
  license: string | null;
  updated: string;
}

interface SeedEntry {
  kind: ExtensionKindT;
  leaf: string;            // subdir name under subdir_prefix, also the `aleph add` target
  name: string;
  category: ExtensionCategoryT;
  tags: string[];
  description_en: string; description_zh: string;
  long_en: string; long_zh: string;
  sec_note_en: string; sec_note_zh: string;
}

interface OfficialSeed { groups: Record<string, GroupCfg>; entries: SeedEntry[]; }

export function loadFirstParty(fs: FileStore): FinalEntry[] {
  const seed = fs.readJson<OfficialSeed>(SEED_PATH);
  if (!seed) return [];
  return seed.entries.map((e) => {
    const group = seed.groups[e.kind];
    if (!group) throw new Error(`aleph-official: no group config for kind '${e.kind}' (leaf '${e.leaf}')`);
    return toFinal(e, group);
  });
}

function toFinal(e: SeedEntry, g: GroupCfg): FinalEntry {
  const subdir = `${g.subdir_prefix}/${e.leaf}`;
  const install_spec = InstallSpec.parse({ type: "git_dir", git_url: g.git_url, subdir, git_ref: g.git_ref });
  const fullName = `${g.owner}/${g.repo}/${subdir}`;   // synthetic identity (not a real GitHub repo)
  return {
    id: `aleph-hub:${g.owner}/${g.repo}/${subdir}`,
    repo_url: `${g.tree_url}/${e.leaf}`,
    via: "aleph-official",
    full_name: fullName, owner: g.owner, repo: g.repo,
    kind: e.kind,
    name: e.name,
    author: g.owner,
    category: e.category,
    tags: e.tags,
    install_spec,
    description_en: e.description_en, description_zh: e.description_zh,
    long_en: e.long_en, long_zh: e.long_zh,
    sec_note_en: e.sec_note_en, sec_note_zh: e.sec_note_zh,
    requires_config: requiresConfig(install_spec),
    // EnrichData — repo-level metrics shared across leaves (deterministic, no network).
    stars: g.stars,
    license: g.license ?? undefined,
    updated: g.updated,
    trend: null,
    spark: [],
    cover_color: coverColorFor(fullName),
    install_cmd: `aleph add ${e.leaf}`,
    // trust
    trust_tier: "official",
  };
}
