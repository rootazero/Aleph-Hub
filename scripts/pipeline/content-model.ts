import type { ContentKindT, ContentFormatT } from "@/contract/content-schema";
import type { ExtensionCategoryT, TrustTierT } from "@/contract/types";
import type { ContentCurationRecord } from "@/scripts/pipeline/ports";

// One discovered content unit (a single prompt/workflow file, post collection-explosion).
export interface ContentCandidate {
  repo_url: string;
  owner: string;
  repo: string;
  source_path: string;   // file path within the repo
  slug: string;          // stable per-unit slug
  kind: ContentKindT;    // the source is kind-specific; carried for the curator + queue
  via: string;
  readme?: string;       // repo README, fetched once per repo as curator context
  raw: { text: string };
}

// Curate product: contract identity + curated content (pre-finalize).
export interface ContentCuratedEntry {
  id: string;            // "aleph-hub:<owner>/<repo>#<slug>"
  kind: ContentKindT;
  category: ExtensionCategoryT;
  name: string;
  author: string;        // = owner
  tags: string[];
  repo_url: string;
  source_path: string;
  via: string;
  body: string;
  format: ContentFormatT;
  description_en: string; description_zh: string;
  long_en: string; long_zh: string;
  sec_note_en: string; sec_note_zh: string;
}

export type ContentFinalEntry = ContentCuratedEntry & { trust_tier: TrustTierT };

export interface ContentBuildReport {
  candidates: number;
  curated: number;        // entries from existing (human/LLM) records this run
  autoCurated: number;    // units the LLM accepted + emitted this run
  queued: number;
  emitted: number;        // total entries in the artifact
  reservedDropped: number; // entries dropped because their slug collides with an install slug
}

// An LLM-authored content record persisted as a human-auditable review buffer.
export type PersistedContentCuration = ContentCurationRecord & { curated_by: "llm" };
