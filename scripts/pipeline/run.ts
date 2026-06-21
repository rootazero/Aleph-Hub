import { createHash } from "node:crypto";
import { dedupe } from "@/scripts/pipeline/dedup";
import { curate } from "@/scripts/pipeline/curate";
import { trustTier } from "@/scripts/pipeline/trust";
import { enrich } from "@/scripts/pipeline/enrich";
import { buildArtifacts } from "@/scripts/pipeline/emit";
import { queueRecord, type QueueRecord } from "@/scripts/pipeline/queue";
import { CONFIG } from "@/scripts/pipeline/config";
import type { GitHubApi, CurationStore, RegistryClient, Http, Clock, CacheStore } from "@/scripts/pipeline/ports";
import type { Source } from "@/scripts/pipeline/sources/types";
import type { Candidate, FinalEntry, CuratedEntry, BuildReport } from "@/scripts/pipeline/model";

export function contentHashReadme(readme: string): string {
  return createHash("sha256").update(readme).digest("hex");
}

export interface RunPorts {
  sources: Source[]; gh: GitHubApi; store: CurationStore; registry: RegistryClient; http: Http; clock: Clock;
  officialOrgs: Set<string>; history: Record<string, number[]>; prevContractCount: number; cache: CacheStore;
}

function perSourceGuard(current: Record<string, number>, prev: Record<string, number>): void {
  for (const [id, prevCount] of Object.entries(prev)) {
    if (prevCount > 0 && (current[id] ?? 0) < prevCount * (1 - CONFIG.PER_SOURCE_DROP_PCT)) {
      throw new Error(`source guard: '${id}' dropped from ${prevCount} to ${current[id] ?? 0}`);
    }
  }
}

export async function run(ports: RunPorts): Promise<{ catalog: unknown; site: unknown; hash: string; report: BuildReport; nextHistory: Record<string, number[]>; heartbeat: string; queue: QueueRecord[] }> {
  const perSource: Record<string, number> = {};
  const candidates: Candidate[] = [];
  for (const s of ports.sources) {
    const got = await s.fetch();
    perSource[s.id] = (perSource[s.id] ?? 0) + got.length;
    candidates.push(...got);
  }
  perSourceGuard(perSource, ports.cache.prevPerSource()); // §6.2 — fail on a per-source collapse

  const deduped = await dedupe(candidates, ports.gh);
  const finals: FinalEntry[] = [];
  const queue: QueueRecord[] = [];
  const nextHistory: Record<string, number[]> = { ...ports.history };
  let curatedThisRun = 0;

  for (const cand of deduped) {
    const cached = ports.cache.get(cand.full_name);
    const got = await ports.gh.getRepo(cand.full_name);
    if (!got) continue;

    const record = ports.store.get(cand.full_name);
    if (!record) { queue.push(queueRecord(cand, got.meta)); continue; }  // discovered, not yet curated

    let entry: CuratedEntry | null = null;
    let readmeHash = cached?.readme_hash ?? "";
    if (got.notModified && cached) {
      entry = cached.entry;                                 // metadata unchanged → reuse
    } else {
      const readme = (await ports.gh.getReadme(cand.full_name)) ?? "";
      readmeHash = contentHashReadme(readme);
      if (cached && cached.readme_hash === readmeHash) {
        entry = cached.entry;                               // README unchanged → reuse
      } else {
        curatedThisRun++;
        entry = await curate({ ...cand, raw: { ...cand.raw, readme } }, got.meta, record,
          { registry: ports.registry, gh: ports.gh });
      }
    }
    if (!entry) continue;                                   // dropped by safety/verify/zod

    ports.cache.set(cand.full_name, { etag: got.etag, readme_hash: readmeHash, entry });
    const tier = trustTier({ owner: cand.owner, meta: got.meta, specVerified: true, officialOrgs: ports.officialOrgs, nowIso: ports.clock.nowIso() });
    const hist = ports.history[cand.full_name] ?? [];
    const enriched = enrich({ fullName: cand.full_name, meta: got.meta, history: hist, installCmd: `aleph add ${cand.repo}` });
    nextHistory[cand.full_name] = [...hist, got.meta.stars].slice(-CONFIG.STARS_HISTORY_KEEP);
    finals.push({ ...entry, ...enriched, trust_tier: tier });
  }

  ports.cache.setPerSource(perSource);
  const { catalog, site, hash } = buildArtifacts({ entries: finals, generatedAt: ports.clock.nowIso(), prevContractCount: ports.prevContractCount });
  queue.sort((a, b) => a.full_name.localeCompare(b.full_name));
  const report: BuildReport = {
    perSource, candidates: candidates.length, deduped: deduped.length,
    discovered: deduped.length, curated: curatedThisRun, queued: queue.length,
    verified: finals.length, emitted: finals.length,
    curationCoverage: deduped.length ? finals.length / deduped.length : 0,
  };
  return { catalog, site, hash, report, nextHistory, heartbeat: `last_run: ${ports.clock.nowIso()}`, queue };
}
