import type { NormalizedCandidate } from "@/scripts/pipeline/model";
import type { RepoMeta } from "@/scripts/pipeline/ports";

// Snapshot of a discovered-but-uncurated repo, written to data/queue/to-curate.json
// so the agent can triage and curate it in a later session.
export interface QueueRecord {
  full_name: string;
  repo_url: string;
  via: string;
  stars: number;
  pushed_at: string;
}

export function queueRecord(cand: NormalizedCandidate, meta: RepoMeta): QueueRecord {
  return { full_name: cand.full_name, repo_url: cand.repo_url, via: cand.via, stars: meta.stars, pushed_at: meta.pushed_at };
}
