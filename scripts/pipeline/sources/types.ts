import type { Candidate } from "@/scripts/pipeline/model";

export interface Source { id: "github" | "clawhub" | "hermesatlas"; fetch(): Promise<Candidate[]>; }

// Pull unique "https://github.com/owner/repo" URLs from arbitrary HTML/markdown,
// stripping trailing path/.git/query. Used by awesome-list expansion + scrapers.
export function extractGitHubLinks(text: string): string[] {
  const re = /https?:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/g;
  const out = new Set<string>();
  for (const m of text.matchAll(re)) {
    const owner = m[1];
    const repo = m[2].replace(/\.git$/, "");
    if (owner && repo && repo !== "issues") out.add(`https://github.com/${owner}/${repo}`);
  }
  return [...out];
}
