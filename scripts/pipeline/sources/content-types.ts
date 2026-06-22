import type { ContentCandidate } from "@/scripts/pipeline/content-model";

export interface ContentSource {
  id: "github-content";
  fetch(): Promise<ContentCandidate[]>;
}

// Per-kind discovery config. Plan-1 uses `pins` ("owner/repo:path"); queries/seeds
// are reserved for a later collection-explosion source.
export interface ContentKindSeeds {
  queries: string[];
  seeds: string[];
  pins?: string[];
}
export interface ContentSeeds {
  prompt: ContentKindSeeds;
  workflow: ContentKindSeeds;
}

// The minimal GitHub surface this source needs (a subset of GitHubApi).
export interface ContentGitHub {
  getContent(fullName: string, path: string): Promise<string | null>;
}
