import { curateContent } from "@/scripts/pipeline/content-curate";
import { buildContentArtifacts } from "@/scripts/pipeline/content-emit";
import { CONFIG } from "@/scripts/pipeline/config";
import type { Clock, ContentCurationStore, ContentLlmClient, ContentLlmProposal, ContentCurationRecord } from "@/scripts/pipeline/ports";
import type { ContentSource } from "@/scripts/pipeline/sources/content-types";
import type { ContentCandidate, ContentFinalEntry, ContentBuildReport, PersistedContentCuration } from "@/scripts/pipeline/content-model";
import type { TrustTierT } from "@/contract/types";

export interface ContentRunPorts {
  sources: ContentSource[];
  store: ContentCurationStore;
  clock: Clock;
  officialOrgs: Set<string>;   // lower-cased owners
  llm: ContentLlmClient | null; // null disables auto-curation (no ANTHROPIC_API_KEY)
  reservedSlugs?: Set<string>;  // install site-slugs; colliding content entries are dropped
}

// Plan-1 trust: official if the owner is an official org, else community.
function contentTrustTier(owner: string, officialOrgs: Set<string>): TrustTierT {
  return officialOrgs.has(owner.toLowerCase()) ? "official" : "community";
}

// "aleph-hub:owner/repo#unit" → site-slug "owner/repo/unit" (the website's routing key).
function siteSlug(id: string): string {
  return id.replace(/^aleph-hub:/, "").replace("#", "/");
}

const idOf = (c: ContentCandidate): string => `aleph-hub:${c.owner}/${c.repo}#${c.slug}`;

// Build a curation record from a candidate + the LLM's metadata. The body is the
// upstream file verbatim; format is fixed by kind. (curateContent re-validates + safety.)
function recordFromProposal(c: ContentCandidate, p: ContentLlmProposal): ContentCurationRecord {
  return {
    id: idOf(c), full_name: `${c.owner}/${c.repo}`, slug: c.slug, source_path: c.source_path,
    kind: c.kind, category: p.category, name: p.name, tags: p.tags,
    format: c.kind === "workflow" ? "javascript" : "markdown", body: c.raw.text,
    description_en: p.description_en, description_zh: p.description_zh,
    long_en: p.long_en, long_zh: p.long_zh,
    sec_note_en: p.sec_note_en, sec_note_zh: p.sec_note_zh,
  };
}

export async function runContent(ports: ContentRunPorts): Promise<{
  catalog: unknown; site: unknown; hash: string; report: ContentBuildReport;
  queue: ContentCandidate[]; newCurations: PersistedContentCuration[];
}> {
  // 1) Discovery → candidates.
  const candidates: ContentCandidate[] = [];
  for (const s of ports.sources) candidates.push(...(await s.fetch()));

  // 2) Emit from existing curation records (body is already curated).
  const records = ports.store.all();
  const finals: ContentFinalEntry[] = [];
  for (const rec of records) {
    const curated = curateContent(rec);
    if (!curated) continue;
    finals.push({ ...curated, trust_tier: contentTrustTier(curated.author, ports.officialOrgs) });
  }
  const recordEmitted = finals.length;

  // 3) Queue = discovered units with no record yet.
  const haveIds = new Set(records.map((r) => r.id));
  const queue = candidates.filter((c) => !haveIds.has(idOf(c)));

  // 4) Autonomous curation: LLM applies the policy as a hard filter over a capped batch.
  const newCurations: PersistedContentCuration[] = [];
  const autoAccepted = new Set<string>();
  if (ports.llm) {
    for (const c of queue.slice(0, CONFIG.LLM_CURATE_PER_RUN)) {
      const result = await ports.llm.curate({
        repo_url: c.repo_url, full_name: `${c.owner}/${c.repo}`, source_path: c.source_path,
        kind: c.kind, body: c.raw.text, readme: c.readme ?? "",
      });
      if (!result || result.decision !== "accept") continue;
      const record = recordFromProposal(c, result.proposal);
      const curated = curateContent(record);
      if (!curated) continue;                          // failed safety/zod → not persisted/emitted
      finals.push({ ...curated, trust_tier: contentTrustTier(curated.author, ports.officialOrgs) });
      newCurations.push({ ...record, curated_by: "llm" });
      autoAccepted.add(record.id);
    }
  }

  // 5) Drop any entry whose site-slug collides with an install slug (fail-safe vs the
  //    website build guard in lib/site.ts, which throws on collision).
  const reserved = ports.reservedSlugs ?? new Set<string>();
  const kept = finals.filter((e) => !reserved.has(siteSlug(e.id)));
  const reservedDropped = finals.length - kept.length;

  const { catalog, site, hash } = buildContentArtifacts({ entries: kept, generatedAt: ports.clock.nowIso() });
  const finalQueue = queue.filter((c) => !autoAccepted.has(idOf(c)));
  const report: ContentBuildReport = {
    candidates: candidates.length, curated: recordEmitted, autoCurated: autoAccepted.size,
    queued: finalQueue.length, emitted: kept.length, reservedDropped,
  };
  return { catalog, site, hash, report, queue: finalQueue, newCurations };
}
