import type { ContentCandidate } from "@/scripts/pipeline/content-model";

export interface ContentSource {
  id: "github-content";
  fetch(): Promise<ContentCandidate[]>;
}

// Per-kind discovery config. `pins` are "owner/repo:path" (single file, basename slug)
// or "owner/repo" (explode the whole repo). `queries` are topic searches; `seeds` are
// awesome-list URLs scraped for repo links.
export interface ContentKindSeeds {
  queries: string[];
  seeds: string[];
  pins?: string[];
}
export interface ContentSeeds {
  prompt: ContentKindSeeds;
  workflow: ContentKindSeeds;
}

// The GitHub surface the exploding content source needs (a subset of the real adapter).
export interface ContentGitHub {
  searchRepos(query: string): Promise<string[]>;          // topic discovery → full_names
  getContent(fullName: string, path: string): Promise<string | null>;
  getReadme(fullName: string): Promise<string | null>;
  listFiles(fullName: string): Promise<string[]>;          // recursive blob paths (HEAD tree)
}
