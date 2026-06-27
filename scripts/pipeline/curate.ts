import { ExtensionKind, ExtensionCategory } from "@/contract/schema";
import { z } from "zod";
import { safeOrNull } from "@/scripts/pipeline/safety";
import { inferInstallSpec, requiresConfig } from "@/scripts/pipeline/install_spec";
import { verifyInstallSpec } from "@/scripts/pipeline/verify";
import type { RegistryClient, GitHubApi, RepoMeta, CurationRecord } from "@/scripts/pipeline/ports";
import type { NormalizedCandidate, CuratedEntry } from "@/scripts/pipeline/model";

export interface CuratePorts { registry: RegistryClient; gh: GitHubApi; }

// Re-validate the curation record against the contract's value space.
const Curated = z.object({
  name: z.string().min(1),
  kind: ExtensionKind,
  slug: z.string().min(1).optional(),   // multi-skill repo → per-skill id segment
  category: ExtensionCategory,
  tags: z.array(z.string()).min(1).max(5),
  description_en: z.string().min(1), description_zh: z.string().min(1),
  long_en: z.string().min(1), long_zh: z.string().min(1),
  sec_note_en: z.string().min(1), sec_note_zh: z.string().min(1),
});

export async function curate(
  cand: NormalizedCandidate, meta: RepoMeta, record: CurationRecord, ports: CuratePorts,
): Promise<CuratedEntry | null> {
  const readme = String(cand.raw.readme ?? "");
  const packageJson = (cand.raw.packageJson as string | undefined) ?? null;

  const parsed = Curated.safeParse(record);
  if (!parsed.success) return null;
  const c = parsed.data;

  // Safety: clean/drop name + description (§4.6).
  const safeEn = safeOrNull(c.description_en);
  const safeZh = safeOrNull(c.description_zh);
  const safeName = safeOrNull(c.name);
  if (!safeEn || !safeZh || !safeName) return null;

  // Re-infer install_spec locally (the record's spec is only a hint). For a git_dir
  // skill/plugin we still honor a curator-provided subdir (the skill may live in a repo subdir).
  const hint = record.install_spec as { type?: string; subdir?: string | null } | null | undefined;
  const subdir = hint?.type === "git_dir" ? hint.subdir ?? null : null;
  const spec = inferInstallSpec(c.kind, {
    repo_url: cand.repo_url, owner: cand.owner, repo: cand.repo, default_branch: meta.default_branch,
    readme, packageJson, subdir,
  });
  if (!spec) return null; // §4.7 stage-1 drop

  // Semantic verification (D11) — failure drops the entry.
  const v = await verifyInstallSpec(spec, cand.owner, { registry: ports.registry, gh: ports.gh });
  if (!v.ok) return null;

  return {
    // Multi-skill collection repos disambiguate entries with a /slug segment; a bare
    // repo (one curated skill) keeps the canonical "aleph-hub:owner/repo" id.
    id: c.slug ? `aleph-hub:${cand.full_name}/${c.slug}` : `aleph-hub:${cand.full_name}`,
    repo_url: cand.repo_url, via: cand.via,
    full_name: cand.full_name, owner: cand.owner, repo: cand.repo,
    kind: c.kind, name: safeName, author: cand.owner,
    category: c.category, tags: c.tags, install_spec: spec,
    description_en: safeEn, description_zh: safeZh,
    long_en: c.long_en, long_zh: c.long_zh,
    sec_note_en: c.sec_note_en, sec_note_zh: c.sec_note_zh,
    requires_config: requiresConfig(spec),
  };
}
