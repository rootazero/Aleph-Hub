import type { Http } from "@/scripts/pipeline/ports";
import type { Candidate } from "@/scripts/pipeline/model";
import type { Source } from "@/scripts/pipeline/sources/types";
import { extractGitHubLinks } from "@/scripts/pipeline/sources/types";
import { rawToCandidate } from "@/scripts/pipeline/normalize";

export class ClawHubSource implements Source {
  readonly id = "clawhub" as const;
  constructor(private deps: { http: Http; indexUrl: string }) {}
  async fetch(): Promise<Candidate[]> {
    const html = (await this.deps.http.getText(this.deps.indexUrl)) ?? "";
    const out: Candidate[] = [];
    for (const url of extractGitHubLinks(html)) {
      const cand = rawToCandidate("clawhub", url, { full_name: url.replace("https://github.com/", "") });
      if (cand) out.push(cand);
    }
    return out;
  }
}
