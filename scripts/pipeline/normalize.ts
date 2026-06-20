import { via } from "@/scripts/pipeline/config";
import type { Candidate, SourceRaw } from "@/scripts/pipeline/model";

const GH = /^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)/i;

export function rawToCandidate(
  sourceId: "github" | "clawhub" | "hermesatlas", repoUrl: string, raw: SourceRaw,
): Candidate | null {
  const m = repoUrl.match(GH);
  if (!m) return null; // not a resolvable upstream GitHub repo → drop (D7)
  const owner = m[1];
  const repo = m[2].replace(/\.git$/, "");
  const clean = `https://github.com/${owner}/${repo}`;
  return { repo_url: clean, via: via(sourceId, owner), raw };
}
