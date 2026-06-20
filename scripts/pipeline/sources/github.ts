import type { GitHubApi, Http } from "@/scripts/pipeline/ports";
import type { Candidate } from "@/scripts/pipeline/model";
import type { Source } from "@/scripts/pipeline/sources/types";
import { extractGitHubLinks } from "@/scripts/pipeline/sources/types";
import { rawToCandidate } from "@/scripts/pipeline/normalize";

export interface GitHubSeeds { queries: string[]; seeds: string[]; }

export class GitHubSource implements Source {
  readonly id = "github" as const;
  constructor(private deps: { gh: GitHubApi; http: Http; seeds: GitHubSeeds }) {}

  async fetch(): Promise<Candidate[]> {
    const urls = new Set<string>();
    for (const q of this.deps.seeds.queries) {
      for (const fn of await this.deps.gh.searchRepos(q)) urls.add(`https://github.com/${fn}`);
    }
    for (const seed of this.deps.seeds.seeds) {
      const html = await this.deps.http.getText(seed);
      if (html) for (const u of extractGitHubLinks(html)) urls.add(u);
    }
    const out: Candidate[] = [];
    for (const url of urls) {
      const fn = url.replace("https://github.com/", "");
      const readme = (await this.deps.gh.getReadme(fn)) ?? "";
      const cand = rawToCandidate("github", url, { full_name: fn, readme });
      if (cand) out.push(cand);
    }
    return out;
  }
}
