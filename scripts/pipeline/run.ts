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

    const records = ports.store.getForRepo(cand.full_name);
    if (records.length === 0) {                             // discovered, not yet curated
      queue.push(queueRecord(cand, got.meta));
      uncurated.push({ cand, meta: got.meta });
      continue;
    }

    // A collection repo yields many entries that all share one README/meta, so the
    // incremental cache is per-repo (one RepoCache holding every curated entry).
    let entries: CuratedEntry[] | null = null;
    let readmeHash = cached?.readme_hash ?? "";
    if (got.notModified && cached?.entries) {
      entries = cached.entries;                             // metadata unchanged → reuse
    } else {
      const readme = (await ports.gh.getReadme(cand.full_name)) ?? "";
      readmeHash = contentHashReadme(readme);
      if (cached?.entries && cached.readme_hash === readmeHash) {
        entries = cached.entries;                           // README unchanged → reuse
      } else {
        curatedThisRun += records.length;
        const curatedList = await Promise.all(records.map((rec) =>
          curate({ ...cand, raw: { ...cand.raw, readme } }, got.meta, rec, { registry: ports.registry, gh: ports.gh })));
        entries = curatedList.filter((e): e is CuratedEntry => e !== null); // drop safety/verify/zod failures
      }
    }
    if (entries.length === 0) continue;                     // every record dropped → don't cache, retry next run

    ports.cache.set(cand.full_name, { etag: got.etag, readme_hash: readmeHash, entries });
    for (const entry of entries) finals.push(finalize(entry, got.meta));
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
      ports.cache.set(cand.full_name, { etag: "", readme_hash: contentHashReadme(readme), entries: [entry] });
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

  // Silent-drop audit: a curation record exists but its repo wasn't emitted this run (fell out of
  // the discovery window, a transient fetch failure, or the repo went away). Surface it so a
  // maintainer can pin the repo (to keep it) or delete a stale record. An official seed covering
  // the same upstream counts as emitted (the official entry supersedes the discovered curation).
  const emittedKeys = new Set<string>();
  for (const f of allFinals) { emittedKeys.add(f.full_name.toLowerCase()); emittedKeys.add(upstreamKey(f)); }
  const curatedButNotEmitted = ports.store.all()
    .map((r) => r.full_name)
    .filter((fn) => !emittedKeys.has(fn.toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  const { catalog, site, hash } = buildArtifacts({ entries: allFinals, generatedAt: ports.clock.nowIso(), prevContractCount: ports.prevContractCount });
  const finalQueue = queue.filter((q) => !autoAccepted.has(q.full_name)); // auto-curated repos leave the backlog
  finalQueue.sort((a, b) => a.full_name.localeCompare(b.full_name));
  const report: BuildReport = {
    perSource, candidates: candidates.length, deduped: deduped.length,
    discovered: deduped.length, curated: curatedThisRun, autoCurated: autoAccepted.size, queued: finalQueue.length,
    verified: allFinals.length, emitted: allFinals.length,
    curationCoverage: deduped.length ? finals.length / deduped.length : 0,
    curatedButNotEmitted,
  };
  return { catalog, site, hash, report, nextHistory, heartbeat: `last_run: ${ports.clock.nowIso()}`, queue: finalQueue, newCurations };
}
