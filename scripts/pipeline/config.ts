export const CONFIG = {
  STAR_VERIFIED: 500,        // min stars for verified tier
  ACTIVE_DAYS: 365,          // pushed within N days to be "active"
  MIN_ENTRIES: 8,            // absolute floor — below this, fail the run (D12)
  MAX_DROP_PCT: 0.5,         // max allowed shrink vs last committed artifact (D12)
  MAX_REPOS_CURATED: 200,    // per-run budget (D13)
  STARS_HISTORY_KEEP: 12,    // rolling star snapshots retained
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
