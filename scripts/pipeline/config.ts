export const CONFIG = {
  STAR_VERIFIED: 500,        // min stars for verified tier
  ACTIVE_DAYS: 365,          // pushed within N days to be "active"
  MIN_ENTRIES: 8,            // absolute floor — below this, fail the run (D12)
  MAX_DROP_PCT: 0.5,         // max allowed shrink vs last committed artifact (D12)
  STARS_HISTORY_KEEP: 12,    // rolling star snapshots retained
  PER_SOURCE_DROP_PCT: 0.5,  // a single source falling >50% vs last run fails the run (§6.2)
  SOURCE_PRIORITY: ["hermes-atlas", "clawhub", "github"] as const,
  LLM_CURATOR_MODEL: "claude-opus-4-8", // autonomous curation model (quality-first; user choice)
  LLM_CURATE_PER_RUN: 20,    // max uncurated repos auto-curated per run (cost/rate-limit cap; backlog drains over days)
  LLM_README_CHARS: 12000,   // README chars passed to the curator (truncate to bound tokens)
} as const;

// `via` is mapped from the SOURCE ID, never derived from a module filename (provenance).
export function via(sourceId: "github" | "clawhub" | "hermesatlas", owner?: string): string {
  switch (sourceId) {
    case "github": return `github:${owner ?? ""}`;
    case "clawhub": return "clawhub";
    case "hermesatlas": return "hermes-atlas";
  }
}
