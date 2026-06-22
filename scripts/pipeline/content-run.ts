import { curateContent } from "@/scripts/pipeline/content-curate";
import { buildContentArtifacts } from "@/scripts/pipeline/content-emit";
import type { Clock, ContentCurationStore } from "@/scripts/pipeline/ports";
import type { ContentSource } from "@/scripts/pipeline/sources/content-types";
import type { ContentCandidate, ContentFinalEntry, ContentBuildReport } from "@/scripts/pipeline/content-model";
import type { TrustTierT } from "@/contract/types";

export interface ContentRunPorts {
  sources: ContentSource[];
  store: ContentCurationStore;
  clock: Clock;
  officialOrgs: Set<string>;   // lower-cased owners
}

// Plan-1 trust: official if the owner is an official org, else community. (Verified/
// unverified tiering needs repo meta — a later enhancement.)
function contentTrustTier(owner: string, officialOrgs: Set<string>): TrustTierT {
  return officialOrgs.has(owner.toLowerCase()) ? "official" : "community";
}

export async function runContent(ports: ContentRunPorts): Promise<{
  catalog: unknown; site: unknown; hash: string; report: ContentBuildReport; queue: ContentCandidate[];
}> {
  // 1) Discovery → candidates (for the backlog queue).
  const candidates: ContentCandidate[] = [];
  for (const s of ports.sources) candidates.push(...(await s.fetch()));

  // 2) Emission is driven by human curation records (the body is already curated).
  const finals: ContentFinalEntry[] = [];
  for (const rec of ports.store.all()) {
    const curated = curateContent(rec);
    if (!curated) continue;                                  // dropped by safety/zod
    finals.push({ ...curated, trust_tier: contentTrustTier(curated.author, ports.officialOrgs) });
  }

  // 3) Queue = discovered units that have no record yet.
  const haveIds = new Set(ports.store.all().map((r) => r.id));
  const queue = candidates.filter((c) => !haveIds.has(`aleph-hub:${c.owner}/${c.repo}#${c.slug}`));

  const { catalog, site, hash } = buildContentArtifacts({ entries: finals, generatedAt: ports.clock.nowIso() });
  const report: ContentBuildReport = {
    candidates: candidates.length, curated: finals.length, queued: queue.length, emitted: finals.length,
  };
  return { catalog, site, hash, report, queue };
}
