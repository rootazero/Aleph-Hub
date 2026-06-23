import type { ContentCandidate } from "@/scripts/pipeline/content-model";
import type { ContentKindT } from "@/contract/content-schema";
import type { ContentSource, ContentKindSeeds, ContentGitHub } from "@/scripts/pipeline/sources/content-types";
import type { Http } from "@/scripts/pipeline/ports";
import { extractGitHubLinks } from "@/scripts/pipeline/sources/types";
import { isPromptFile, unitSlug } from "@/scripts/pipeline/content-explode";
import { isWorkflowScript } from "@/scripts/pipeline/workflow-detect";
import { CONFIG } from "@/scripts/pipeline/config";

// Discovers content repos (pins + topic queries + awesome-list seeds) and explodes each
// into per-file candidates (one prompt .md / one workflow .js = one unit). Kind-specific:
// constructed once per kind with that kind's seeds (seeds.prompt / seeds.workflow).
export class GitHubContentSource implements ContentSource {
  readonly id = "github-content" as const;
  constructor(private deps: { gh: ContentGitHub; http: Http; kind: ContentKindT; seeds: ContentKindSeeds }) {}

  async fetch(): Promise<ContentCandidate[]> {
    const repos = new Set<string>();
    const filePins: string[] = [];                       // "owner/repo:path" → single file
    for (const pin of this.deps.seeds.pins ?? []) {
      if (pin.includes(":")) filePins.push(pin);
      else repos.add(pin);                                // "owner/repo" → explode whole repo
    }
    for (const q of this.deps.seeds.queries) for (const fn of await this.deps.gh.searchRepos(q)) repos.add(fn);
    for (const seed of this.deps.seeds.seeds) {
      const html = await this.deps.http.getText(seed);
      if (html) for (const u of extractGitHubLinks(html)) repos.add(u.replace("https://github.com/", ""));
    }

    const out: ContentCandidate[] = [];
    for (const pin of filePins) {
      const c = await this.pinnedFile(pin);
      if (c) out.push(c);
    }
    for (const full of repos) out.push(...(await this.explode(full)));
    return out;
  }

  // A pinned single file keeps the legacy basename slug (curated, hand-pinned units).
  private async pinnedFile(pin: string): Promise<ContentCandidate | null> {
    const sep = pin.indexOf(":");
    const full = pin.slice(0, sep);
    const path = pin.slice(sep + 1);
    const [owner, repo] = full.split("/");
    if (!owner || !repo || !path) return null;
    const text = await this.deps.gh.getContent(full, path);
    if (!text) return null;
    const base = path.split("/").pop() ?? path;
    return {
      repo_url: `https://github.com/${owner}/${repo}`, owner, repo, source_path: path,
      slug: base.replace(/\.[^.]+$/, ""), kind: this.deps.kind, via: `github:${owner}`,
      readme: (await this.deps.gh.getReadme(full)) ?? "", raw: { text },
    };
  }

  // A discovered repo → one candidate per matching file (capped), path-derived slug.
  private async explode(full: string): Promise<ContentCandidate[]> {
    const [owner, repo] = full.split("/");
    if (!owner || !repo) return [];
    const paths = await this.deps.gh.listFiles(full);
    const wanted = this.deps.kind === "prompt"
      ? paths.filter(isPromptFile)
      : paths.filter((p) => p.toLowerCase().endsWith(".js"));
    const readme = (await this.deps.gh.getReadme(full)) ?? "";
    const out: ContentCandidate[] = [];
    for (const path of wanted.slice(0, CONFIG.CONTENT_FILES_PER_REPO)) {
      const text = await this.deps.gh.getContent(full, path);
      if (!text) continue;
      if (this.deps.kind === "workflow" && !isWorkflowScript(text)) continue;  // .js but not a workflow
      out.push({
        repo_url: `https://github.com/${owner}/${repo}`, owner, repo, source_path: path,
        slug: unitSlug(path), kind: this.deps.kind, via: `github:${owner}`, readme, raw: { text },
      });
    }
    return out;
  }
}
