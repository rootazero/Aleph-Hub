import type { ContentCandidate } from "@/scripts/pipeline/content-model";
import type { ContentSource, ContentKindSeeds, ContentGitHub } from "@/scripts/pipeline/sources/content-types";

// Reads pinned units of the form "owner/repo:path/to/file.md" into candidates.
// The slug is the file basename without extension; the body is the raw file text.
export class GitHubContentSource implements ContentSource {
  readonly id = "github-content" as const;
  constructor(private deps: { gh: ContentGitHub; seeds: ContentKindSeeds }) {}

  async fetch(): Promise<ContentCandidate[]> {
    const out: ContentCandidate[] = [];
    for (const pin of this.deps.seeds.pins ?? []) {
      const sep = pin.indexOf(":");
      if (sep < 0) continue;
      const full = pin.slice(0, sep);
      const path = pin.slice(sep + 1);
      const [owner, repo] = full.split("/");
      if (!owner || !repo || !path) continue;
      const text = await this.deps.gh.getContent(full, path);
      if (!text) continue;
      const base = path.split("/").pop() ?? path;
      const slug = base.replace(/\.[^.]+$/, "");
      out.push({
        repo_url: `https://github.com/${owner}/${repo}`, owner, repo,
        source_path: path, slug, via: `github:${owner}`, raw: { text },
      });
    }
    return out;
  }
}
