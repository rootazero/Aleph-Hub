import { CONFIG } from "@/scripts/pipeline/config";
import type { GitHubApi } from "@/scripts/pipeline/ports";
import type { Candidate, NormalizedCandidate } from "@/scripts/pipeline/model";

function sourceRank(via: string): number {
  const id = via.startsWith("github:") ? "github" : via;
  const i = (CONFIG.SOURCE_PRIORITY as readonly string[]).indexOf(id);
  return i === -1 ? CONFIG.SOURCE_PRIORITY.length : i;
}
function fullNameFromUrl(url: string): string | null {
  const m = url.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  return m ? `${m[1]}/${m[2].replace(/\.git$/, "")}` : null;
}

export async function dedupe(candidates: Candidate[], gh: GitHubApi): Promise<NormalizedCandidate[]> {
  const byKey = new Map<string, NormalizedCandidate>();
  for (const c of candidates) {
    const fn = fullNameFromUrl(c.repo_url);
    if (!fn) continue;
    const got = await gh.getRepo(fn);
    if (!got) continue; // unresolved → drop (rename absorbed by API; deleted repos vanish)
    // Fold forks to their source repo.
    const canonical = got.meta.fork && got.meta.source_full_name ? got.meta.source_full_name : got.meta.full_name;
    const key = canonical.toLowerCase();
    const [owner, repo] = canonical.split("/");
    const normalized: NormalizedCandidate = {
      ...c, repo_url: `https://github.com/${canonical}`, full_name: canonical, owner, repo,
    };
    const existing = byKey.get(key);
    if (!existing || sourceRank(normalized.via) < sourceRank(existing.via)) byKey.set(key, normalized);
  }
  return [...byKey.values()];
}
