import { describe, it, expect } from "vitest";
import { run } from "@/scripts/pipeline/run";
import type { GitHubApi, LlmClient, RegistryClient, Http, Clock, RepoMeta, CacheStore } from "@/scripts/pipeline/ports";
import type { Source } from "@/scripts/pipeline/sources/types";

const emptyCache: CacheStore = { get: () => undefined, set: () => {}, entries: () => ({}), prevPerSource: () => ({}), setPerSource: () => {} };

const meta = (fn: string): RepoMeta => { const [owner, repo] = fn.split("/"); return { full_name: fn, owner, repo, stars: 1000, license: "MIT", pushed_at: "2026-06-01T00:00:00Z", fork: false, source_full_name: null, default_branch: "main" }; };
const gh: GitHubApi = {
  searchRepos: async () => [], getContent: async () => null,
  getReadme: async (fn) => `# ${fn}\nRun npx -y @acme/${fn.split("/")[1]}`,
  getRepo: async (fn) => ({ meta: meta(fn), etag: "e", notModified: false }),
};
const source = (urls: string[]): Source => ({ id: "github", fetch: async () => urls.map((u) => ({ repo_url: u, via: `github:${u.split("/")[3]}`, raw: { full_name: u.replace("https://github.com/", "") } })) });
const llm: LlmClient = { curate: async (i) => ({ name: i.full_name.split("/")[1], kind: "mcp", category: "developer", tags: ["a"], description_en: "A tool.", description_zh: "工具。", long_en: "Long.", long_zh: "长。", install_spec: {}, sec_note_en: "Reviewed.", sec_note_zh: "已审核。" }) };
const registry: RegistryClient = { npmPackage: async () => ({ exists: true, repository: null }), pypiPackage: async () => ({ exists: true }) };
const http: Http = { getText: async () => "" };
const clock: Clock = { nowIso: () => "2026-06-20T00:00:00Z" };

describe("run (integration, mocked ports)", () => {
  it("produces validated artifacts for 8 repos with a first-run (null trend)", async () => {
    const urls = Array.from({ length: 8 }, (_, i) => `https://github.com/acme/foo${i}`);
    const res = await run({ sources: [source(urls)], gh, llm, registry, http, clock,
      officialOrgs: new Set(["anthropic"]), history: {}, prevContractCount: 8, cache: emptyCache });
    expect(res.report.emitted).toBe(8);
    expect((res.catalog as any).entries).toHaveLength(8);
    expect((res.site as any).entries[0].trend).toBeNull();
    expect(res.heartbeat).toContain("2026-06-20");
    // the emitted spec is the LOCALLY re-inferred one (from the README), not the LLM's {} hint
    expect((res.catalog as any).entries[0].install_spec.type).toBe("mcp_stdio");
    expect((res.catalog as any).entries[0].install_spec.command).toBe("npx");
  });
});
