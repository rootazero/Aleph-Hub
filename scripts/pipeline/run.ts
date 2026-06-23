import { createHash } from "node:crypto";
import { dedupe, fullNameFromUrl } from "@/scripts/pipeline/dedup";
import { curate } from "@/scripts/pipeline/curate";
import { trustTier } from "@/scripts/pipeline/trust";
import { enrich } from "@/scripts/pipeline/enrich";
import { buildArtifacts } from "@/scripts/pipeline/emit";
import { queueRecord, type QueueRecord } from "@/scripts/pipeline/queue";
import { CONFIG } from "@/scripts/pipeline/config";
import type { GitHubApi, CurationStore, RegistryClient, Http, Clock, CacheStore, LlmClient, CurationRecord, RepoMeta } from "@/scripts/pipeline/ports";
import type { Source } from "@/scripts/pipeline/sources/types";
import type { Candidate, NormalizedCandidate, FinalEntry, CuratedEntry, BuildReport } from "@/scripts/pipeline/model";

export function contentHashReadme(readme: string): string {
  return createHash("sha256").update(readme).digest("hex");
}

// A curation record the pipeline authored itself (provenance for the review buffer).
export type PersistedCuration = CurationRecord & { curated_by: "llm" };

export interface RunPorts {
  sources: Source[]; gh: GitHubApi; store: CurationStore; registry: RegistryClient; http: Http; clock: Clock;
  officialOrgs: Set<string>; history: Record<string, number[]>; prevContractCount: number; cache: CacheStore;
  firstParty: FinalEntry[];   // Aleph official extensions, merged in ahead of discovery (D7 provenance)
  llm: LlmClient | null;      // autonomous curator; null disables auto-curation (Phase 2)
}

function perSourceGuard(current: Record<string, number>, prev: Record<string, number>): void {
  for (const [id, prevCount] of Object.entries(prev)) {
    if (prevCount > 0 && (current[id] ?? 0) < prevCount * (1 - CONFIG.PER_SOURCE_DROP_PCT)) {
      throw new Error(`source guard: '${id}' dropped from ${prevCount} to ${current[id] ?? 0}`);
    }
  }
}

export async function run(ports: RunPorts): Promise<{ catalog: unknown; site: unknown; hash: string; report: BuildReport; nextHistory: Record<string, number[]>; heartbeat: string; queue: QueueRecord[]; newCurations: PersistedCuration[] }> {
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
  const uncurated: { cand: NormalizedCandidate; meta: RepoMeta }[] = []; // discovered, no record → auto-curation candidates
  const nextHistory: Record<string, number[]> = { ...ports.history };
  let curatedThisRun = 0;

  // enrich + trust + history-roll for a curated entry → a publishable FinalEntry.
  const finalize = (entry: CuratedEntry, meta: RepoMeta): FinalEntry => {
    const tier = trustTier({ owner: entry.owner, meta, specVerified: true, officialOrgs: ports.officialOrgs, nowIso: ports.clock.nowIso() });
    const hist = ports.history[entry.full_name] ?? [];
    const enriched = enrich({ fullName: entry.full_name, meta, history: hist, installCmd: `aleph add ${entry.repo}` });
    nextHistory[entry.full_name] = [...hist, meta.stars].slice(-CONFIG.STARS_HISTORY_KEEP);
    return { ...entry, ...enriched, trust_tier: tier };
  };

  for (const cand of deduped) {
    const cached = ports.cache.get(cand.full_name);
    const got = await ports.gh.getRepo(cand.full_name);
    if (!got) continue;

    const record = ports.store.get(cand.full_name);
    if (!record) {                                          // discovered, not yet curated
      queue.push(queueRecord(cand, got.meta));
      uncurated.push({ cand, meta: got.meta });
      continue;
    }

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
    finals.push(finalize(entry, got.meta));
  }

  // Autonomous curation (Phase 2): for a capped batch of uncurated repos, the LLM applies
  // the policy as a hard filter. Accepted proposals are curated/verified in-run, emitted this
  // run, and returned for persistence (curated_by="llm" — the human-auditable review buffer).
  const newCurations: PersistedCuration[] = [];
  const autoAccepted = new Set<string>();
  if (ports.llm) {
    for (const { cand, meta } of uncurated.slice(0, CONFIG.LLM_CURATE_PER_RUN)) {
      const readme = (await ports.gh.getReadme(cand.full_name)) ?? "";
      const result = await ports.llm.curate({ full_name: cand.full_name, repo_url: cand.repo_url, stars: meta.stars, license: meta.license, readme });
      if (!result || result.decision !== "accept") continue; // reject / uncertain / error → stays queued
      const record: CurationRecord = { full_name: cand.full_name, install_spec: {}, ...result.proposal };
      const entry = await curate({ ...cand, raw: { ...cand.raw, readme } }, meta, record, { registry: ports.registry, gh: ports.gh });
      if (!entry) continue;                                  // failed safety/verify → not persisted, not emitted
      ports.cache.set(cand.full_name, { etag: "", readme_hash: contentHashReadme(readme), entry });
      finals.push(finalize(entry, meta));
      newCurations.push({ ...record, curated_by: "llm" });
      autoAccepted.add(cand.full_name);
    }
  }

  ports.cache.setPerSource(perSource);
  // First-party official extensions take precedence over any discovered repo with the same
  // id OR the same upstream repo. Official ids are catalog slugs (decoupled from full_name),
  // so the id check alone no longer dedupes a discovered curation of an officially-seeded repo
  // (e.g. upstash/context7); guard the canonical upstream too. Monorepo sub-server seeds key on
  // the repo root (volcengine/mcp-server), npm-only presets fall back to their synthetic full_name.
  const upstreamKey = (f: FinalEntry): string => (fullNameFromUrl(f.repo_url) ?? f.full_name).toLowerCase();
  const byId = new Map<string, FinalEntry>();
  const officialUpstreams = new Set<string>();
  for (const f of ports.firstParty) { byId.set(f.id, f); officialUpstreams.add(upstreamKey(f)); }
  for (const f of finals) {
    if (byId.has(f.id) || officialUpstreams.has(upstreamKey(f))) continue;
    byId.set(f.id, f);
  }
  const allFinals = [...byId.values()];

  const { catalog, site, hash } = buildArtifacts({ entries: allFinals, generatedAt: ports.clock.nowIso(), prevContractCount: ports.prevContractCount });
  const finalQueue = queue.filter((q) => !autoAccepted.has(q.full_name)); // auto-curated repos leave the backlog
  finalQueue.sort((a, b) => a.full_name.localeCompare(b.full_name));
  const report: BuildReport = {
    perSource, candidates: candidates.length, deduped: deduped.length,
    discovered: deduped.length, curated: curatedThisRun, autoCurated: autoAccepted.size, queued: finalQueue.length,
    verified: allFinals.length, emitted: allFinals.length,
    curationCoverage: deduped.length ? finals.length / deduped.length : 0,
  };
  return { catalog, site, hash, report, nextHistory, heartbeat: `last_run: ${ports.clock.nowIso()}`, queue: finalQueue, newCurations };
}
