import { describe, it, expect } from "vitest";
import { GitHubSource } from "@/scripts/pipeline/sources/github";
import type { GitHubApi, Http } from "@/scripts/pipeline/ports";

const gh = {
  searchRepos: async (q: string) => (q.includes("mcp") ? ["acme/foo"] : []),
  getReadme: async (fn: string) => `# ${fn}\nRun npx -y @acme/foo`,
  getRepo: async () => null, getContent: async () => null,
} as unknown as GitHubApi;
const http: Http = { getText: async () => `<a href="https://github.com/seed/bar">bar</a>` };

describe("GitHubSource", () => {
  it("collects repos from queries + expands seed lists, attaching READMEs", async () => {
    const src = new GitHubSource({ gh, http, seeds: { queries: ["topic:mcp"], seeds: ["https://github.com/list/awesome"] } });
    const cands = await src.fetch();
    const urls = cands.map((c) => c.repo_url).sort();
    expect(urls).toContain("https://github.com/acme/foo");
    expect(urls).toContain("https://github.com/seed/bar");
    expect(cands.every((c) => c.via.startsWith("github:"))).toBe(true);
    expect(cands.find((c) => c.repo_url.endsWith("/foo"))!.raw.readme).toContain("npx");
  });
});
