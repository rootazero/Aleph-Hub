import type { ContentKindT, ContentFormatT } from "@/contract/content-schema";
import type { ExtensionCategoryT, TrustTierT } from "@/contract/types";

// One discovered content unit (a single prompt/workflow file, post collection-explosion).
export interface ContentCandidate {
  repo_url: string;
  owner: string;
  repo: string;
  source_path: string;   // file path within the repo
  slug: string;          // stable per-unit slug
  via: string;
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
  curated: number;
  queued: number;
  emitted: number;
}
