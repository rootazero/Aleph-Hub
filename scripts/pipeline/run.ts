import { dedupe } from "@/scripts/pipeline/dedup";
import { curate } from "@/scripts/pipeline/curate";
import { trustTier } from "@/scripts/pipeline/trust";
import { enrich } from "@/scripts/pipeline/enrich";
import { buildArtifacts } from "@/scripts/pipeline/emit";
import { CONFIG } from "@/scripts/pipeline/config";
import type { GitHubApi, LlmClient, RegistryClient, Http, Clock } from "@/scripts/pipeline/ports";
import type { Source } from "@/scripts/pipeline/sources/types";
import type { Candidate, FinalEntry, BuildReport } from "@/scripts/pipeline/model";

export interface RunPorts {
  sources: Source[]; gh: GitHubApi; llm: LlmClient; registry: RegistryClient; http: Http; clock: Clock;
  officialOrgs: Set<string>; history: Record<string, number[]>; prevContractCount: number;
}

export async function run(ports: RunPorts): Promise<{ catalog: unknown; site: unknown; report: BuildReport; nextHistory: Record<string, number[]>; heartbeat: string }> {
  const perSource: Record<string, number> = {};
  const candidates: Candidate[] = [];
  for (const s of ports.sources) {
    const got = await s.fetch();
    perSource[s.id] = (perSource[s.id] ?? 0) + got.length;
    candidates.push(...got);
  }
  const deduped = (await dedupe(candidates, ports.gh)).slice(0, CONFIG.MAX_REPOS_CURATED); // budget checkpoint

  const finals: FinalEntry[] = [];
  const nextHistory: Record<string, number[]> = { ...ports.history };
  let verifiedCount = 0;
  for (const cand of deduped) {
    const got = await ports.gh.getRepo(cand.full_name);
    if (!got) continue;
    const readme = (await ports.gh.getReadme(cand.full_name)) ?? "";
    const entry = await curate({ ...cand, raw: { ...cand.raw, readme } }, got.meta,
      { llm: ports.llm, registry: ports.registry, gh: ports.gh });
    if (!entry) continue;          // dropped by safety/verify/zod (§4.7 stage 1)
    verifiedCount++;               // survivors have a verified install_spec
    const tier = trustTier({ owner: cand.owner, meta: got.meta, specVerified: true, officialOrgs: ports.officialOrgs, nowIso: ports.clock.nowIso() });
    const hist = ports.history[cand.full_name] ?? [];
    const enriched = enrich({ fullName: cand.full_name, meta: got.meta, history: hist, installCmd: `aleph add ${cand.repo}` });
    nextHistory[cand.full_name] = [...hist, got.meta.stars].slice(-CONFIG.STARS_HISTORY_KEEP);
    finals.push({ ...entry, ...enriched, trust_tier: tier });
  }

  const { catalog, site } = buildArtifacts({ entries: finals, generatedAt: ports.clock.nowIso(), prevContractCount: ports.prevContractCount });
  const report: BuildReport = {
    perSource, candidates: candidates.length, deduped: deduped.length,
    curated: finals.length, verified: verifiedCount, emitted: finals.length,
    inferenceYield: deduped.length ? finals.length / deduped.length : 0,
  };
  return { catalog, site, report, nextHistory, heartbeat: `last_run: ${ports.clock.nowIso()}` };
}
