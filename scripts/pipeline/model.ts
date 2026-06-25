import type { ExtensionKindT, ExtensionCategoryT, TrustTierT, InstallSpecT, HubCatalogEntryT } from "@/contract/types";
import type { SiteEntryT } from "@/contract/site";

export interface SourceRaw { full_name?: string; readme?: string; [k: string]: unknown; }

// Crawl product (§6.1)
export interface Candidate { repo_url: string; via: string; raw: SourceRaw; }

// After dedup: canonical identity resolved
export interface NormalizedCandidate extends Candidate { full_name: string; owner: string; repo: string; }

// Curate product (§6.1): contract identity + curated content (pre-trust, pre-enrich)
export interface CuratedEntry {
  id: string;                 // "aleph-hub:<owner>/<repo>"
  repo_url: string;
  via: string;
  full_name: string; owner: string; repo: string;
  kind: ExtensionKindT;
  name: string;
  author: string;
  category: ExtensionCategoryT;
  tags: string[];
  install_spec: InstallSpecT;
  description_en: string; description_zh: string;
  long_en: string; long_zh: string;
  sec_note_en: string; sec_note_zh: string;
  requires_config: boolean;
}

// Enrich product (§6.7): presentation/metrics layer (not all of it enters the contract)
export interface EnrichData {
  stars: number;
  license?: string;
  updated?: string;
  trend: number | null;
  spark: number[];
  cover_color: string;
  install_cmd: string;
}

export type FinalEntry = CuratedEntry & EnrichData & { trust_tier: TrustTierT };

// Per-run observability (§6.2 source counts, D12 gate)
export interface BuildReport {
  perSource: Record<string, number>;
  candidates: number;
  deduped: number;
  discovered: number;         // deduped repos considered this run
  curated: number;            // human records applied this run
  autoCurated: number;        // repos curated by the LLM this run (Phase 2)
  queued: number;             // discovered but uncurated → to-curate.json
  verified: number;
  emitted: number;
  curationCoverage: number;   // emitted / discovered
  curatedButNotEmitted: string[];  // records that exist but weren't emitted this run (silent-drop audit)
}

// Re-export the contract projection targets for emit.
export type { HubCatalogEntryT, SiteEntryT };
