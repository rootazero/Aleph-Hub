import { describe, it, expect, vi } from "vitest";
import { run, contentHashReadme } from "@/scripts/pipeline/run";
import type { GitHubApi, CurationStore, RegistryClient, Http, Clock, RepoMeta, CacheStore, RepoCache } from "@/scripts/pipeline/ports";
import type { Source } from "@/scripts/pipeline/sources/types";
import type { CuratedEntry } from "@/scripts/pipeline/model";

const meta = (fn: string): RepoMeta => { const [owner, repo] = fn.split("/"); return { full_name: fn, owner, repo, stars: 1000, license: "MIT", pushed_at: "2026-06-01T00:00:00Z", fork: false, source_full_name: null, default_branch: "main" }; };
const README = "# acme/foo\nRun npx -y @acme/foo";
const gh: GitHubApi = { searchRepos: async () => [], getContent: async () => null, getReadme: async () => README, getRepo: async (fn) => ({ meta: meta(fn), etag: "e", notModified: false }) };
const source: Source = { id: "github", fetch: async () => Array.from({ length: 8 }, (_, i) => ({ repo_url: `https://github.com/acme/foo${i}`, via: "github:acme", raw: { full_name: `acme/foo${i}` } })) };
const store: CurationStore = { get: (fn) => ({ full_name: fn, name: fn.split("/")[1], kind: "mcp", category: "developer", tags: ["a"], description_en: "A tool.", description_zh: "工具。", long_en: "L.", long_zh: "长。", install_spec: {}, sec_note_en: "Reviewed.", sec_note_zh: "已审核。" }) };
const registry: RegistryClient = { npmPackage: async () => ({ exists: true, repository: null }), pypiPackage: async () => ({ exists: true }) };
const http: Http = { getText: async () => "" };
const clock: Clock = { nowIso: () => "2026-06-20T00:00:00Z" };

function memCache(seed: Record<string, RepoCache> = {}, perSource: Record<string, number> = {}): CacheStore {
  const map = new Map(Object.entries(seed)); let ps = perSource;
  return { get: (fn) => map.get(fn), set: (fn, v) => { map.set(fn, v); }, entries: () => Object.fromEntries(map),
    prevPerSource: () => ps, setPerSource: (c) => { ps = c; } };
}
function curatedFixture(fn: string): CuratedEntry {
  const [owner, repo] = fn.split("/");
  return { id: `aleph-hub:${fn}`, repo_url: `https://github.com/${fn}`, via: "github:acme", full_name: fn, owner, repo,
    kind: "mcp", name: repo, author: owner, category: "developer", tags: ["a"],
    install_spec: { type: "mcp_stdio", command: "npx", args: ["-y", "@acme/foo"], env: [] },
    description_en: "A tool.", description_zh: "工具。", long_en: "L.", long_zh: "长。",
    sec_note_en: "Reviewed.", sec_note_zh: "已审核。", requires_config: false };
}

describe("incremental run", () => {
  it("reuses cached entries without calling curate when READMEs are unchanged", async () => {
    const seed: Record<string, RepoCache> = {};
    for (let i = 0; i < 8; i++) seed[`acme/foo${i}`] = { etag: "e", readme_hash: contentHashReadme(README), entry: curatedFixture(`acme/foo${i}`) };
    const res = await run({ sources: [source], gh, store, registry, http, clock,
      officialOrgs: new Set(), history: {}, prevContractCount: 8, cache: memCache(seed), firstParty: [], llm: null });
    expect(res.report.emitted).toBe(8);
    expect(res.report.curated).toBe(0); // all 8 reused from cache
  });
  it("throws when a source collapses vs the previous run (§6.2)", async () => {
    const cache = memCache({}, { github: 100 }); // last run saw 100, now 8 → >50% drop
    await expect(run({ sources: [source], gh, store, registry, http, clock,
      officialOrgs: new Set(), history: {}, prevContractCount: 8, cache, firstParty: [], llm: null })).rejects.toThrow(/source/i);
  });
});
