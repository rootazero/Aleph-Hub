export const CONFIG = {
  STAR_VERIFIED: 500,        // min stars for verified tier
  ACTIVE_DAYS: 365,          // pushed within N days to be "active"
  MIN_ENTRIES: 8,            // absolute floor — below this, fail the run (D12)
  MAX_DROP_PCT: 0.5,         // max allowed shrink vs last committed artifact (D12)
  STARS_HISTORY_KEEP: 12,    // rolling star snapshots retained
  PER_SOURCE_DROP_PCT: 0.5,  // a single source falling >50% vs last run fails the run (§6.2)
  SOURCE_PRIORITY: ["github", "clawhub", "hermes-atlas"] as const,
} as const;

// `via` is mapped from the SOURCE ID, never derived from a module filename (provenance).
export function via(sourceId: "github" | "clawhub" | "hermesatlas", owner?: string): string {
  switch (sourceId) {
    case "github": return `github:${owner ?? ""}`;
    case "clawhub": return "clawhub";
    case "hermesatlas": return "hermes-atlas";
  }
}
