import { contentHash } from "@/scripts/pipeline/emit";
import { CONTENT_SCHEMA_VERSION } from "@/contract/content-schema";
import type { ContentFinalEntry } from "@/scripts/pipeline/content-model";
import type { ContentCatalogEntryT } from "@/contract/content-schema";
import type { ContentSiteEntryT } from "@/contract/content-site";

// Deterministic palette key from the entry id (site display only).
const PALETTE = ["#C9542A", "#2A6B6B", "#6B4FA6", "#A6822A", "#3A6BA6", "#A63A5C"];
function coverColor(seed: string): string {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function toContentEntry(e: ContentFinalEntry): ContentCatalogEntryT {
  return {
    id: e.id, kind: e.kind, category: e.category, name: e.name, description: e.description_en,
    author: e.author, tags: e.tags, repo_url: e.repo_url, source_path: e.source_path,
    trust_tier: e.trust_tier, via: e.via, body: e.body, format: e.format,
  };
}
function toContentSiteEntry(e: ContentFinalEntry): ContentSiteEntryT {
  return {
    ...toContentEntry(e),
    description_zh: e.description_zh, description_en: e.description_en,
    long_zh: e.long_zh, long_en: e.long_en,
    sec_note_zh: e.sec_note_zh, sec_note_en: e.sec_note_en,
    cover_color: coverColor(e.id),
  };
}

export interface ContentBuildInput { entries: ContentFinalEntry[]; generatedAt: string; }

// No floor gate: the content axis legitimately starts empty and grows; an empty
// artifact is valid. (A drop guard can be added once content volume stabilizes.)
export function buildContentArtifacts(input: ContentBuildInput): { catalog: unknown; site: unknown; hash: string } {
  const manifestBase = { content_schema_version: CONTENT_SCHEMA_VERSION, hub_id: "aleph-hub", name: "Aleph Hub", entry_count: input.entries.length };
  const catalogEntries = input.entries.map(toContentEntry);
  const hash = contentHash(catalogEntries);
  const manifest = { ...manifestBase, generated_at: input.generatedAt, content_hash: hash };
  return {
    catalog: { manifest: { ...manifest }, entries: catalogEntries },
    site: { manifest: { ...manifest }, entries: input.entries.map(toContentSiteEntry) },
    hash,
  };
}
