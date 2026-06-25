import { describe, it, expect } from "vitest";
import { run } from "@/scripts/pipeline/run";
import type { GitHubApi, CurationStore, CurationRecord, RegistryClient, Http, Clock, RepoMeta, CacheStore, LlmClient } from "@/scripts/pipeline/ports";
import type { Source } from "@/scripts/pipeline/sources/types";
import type { FinalEntry } from "@/scripts/pipeline/model";

// An official, pre-built seed (loadMcpPresets/loadAlephMcp shape): id is a catalog slug,
// decoupled from full_name, with the real upstream carried by repo_url.
const official = (id: string, full_name: string, repo_url: string): FinalEntry => {
  const [owner, repo] = full_name.split("/");
  return {
    id, repo_url, via: "aleph-mcp-preset", full_name, owner, repo,
    kind: "mcp", name: id, author: owner, category: "developer", tags: ["x"],
    install_spec: { type: "mcp_stdio", command: "npx", args: ["-y", "x"], env: [] },
    description_en: "Official.", description_zh: "官方。", long_en: "Long.", long_zh: "长。",
    sec_note_en: "Reviewed.", sec_note_zh: "已审核。", requires_config: false,
    stars: 100, license: "MIT", updated: "2026-06-01", trend: null, spark: [], cover_color: "#000",
    install_cmd: "npx -y x", trust_tier: "official",
  };
};

const emptyCache: CacheStore = { get: () => undefined, set: () => {}, entries: () => ({}), prevPerSource: () => ({}), setPerSource: () => {} };

const meta = (fn: string): RepoMeta => { const [owner, repo] = fn.split("/"); return { full_name: fn, owner, repo, stars: 1000, license: "MIT", pushed_at: "2026-06-01T00:00:00Z", fork: false, source_full_name: null, default_branch: "main" }; };
const gh: GitHubApi = {
  searchRepos: async () => [], getContent: async () => null,
  getReadme: async (fn) => `# ${fn}\nRun npx -y @acme/${fn.split("/")[1]}`,
  getRepo: async (fn) => ({ meta: meta(fn), etag: "e", notModified: false }),
};
const source = (urls: string[]): Source => ({ id: "github", fetch: async () => urls.map((u) => ({ repo_url: u, via: `github:${u.split("/")[3]}`, raw: { full_name: u.replace("https://github.com/", "") } })) });
// store curates every repo EXCEPT acme/foo8 (left uncurated → queued)
const store: CurationStore = { get: (fn) => fn.endsWith("/foo8") ? null : ({
  full_name: fn, name: fn.split("/")[1], kind: "mcp", category: "developer", tags: ["a"],
  description_en: "A tool.", description_zh: "工具。", long_en: "Long.", long_zh: "长。",
  install_spec: {}, sec_note_en: "Reviewed.", sec_note_zh: "已审核。",
}), all: () => [] };
const registry: RegistryClient = { npmPackage: async () => ({ exists: true, repository: null }), pypiPackage: async () => ({ exists: true }) };
const http: Http = { getText: async () => "" };
const clock: Clock = { nowIso: () => "2026-06-20T00:00:00Z" };

describe("run (integration, mocked ports)", () => {
  it("emits curated repos, queues uncurated ones, reports coverage", async () => {
    const urls = Array.from({ length: 9 }, (_, i) => `https://github.com/acme/foo${i}`);
    const res = await run({ sources: [source(urls)], gh, store, registry, http, clock,
      officialOrgs: new Set(["anthropic"]), history: {}, prevContractCount: 8, cache: emptyCache, firstParty: [], llm: null });
    expect(res.report.discovered).toBe(9);
    expect(res.report.emitted).toBe(8);                 // foo8 uncurated → excluded (8 ≥ MIN_ENTRIES, clears floor gate)
    expect(res.report.queued).toBe(1);
    expect(res.queue.map((q) => q.full_name)).toEqual(["acme/foo8"]);
    expect(res.report.curationCoverage).toBeCloseTo(8 / 9);
    expect((res.catalog as any).entries).toHaveLength(8);
    expect((res.site as any).entries[0].trend).toBeNull();
    expect((res.catalog as any).entries[0].install_spec.type).toBe("mcp_stdio");
  });

  it("auto-curates queued repos when an LLM client accepts them", async () => {
    const urls = Array.from({ length: 9 }, (_, i) => `https://github.com/acme/foo${i}`);
    const llm: LlmClient = {
      curate: async (input) => ({
        decision: "accept",
        proposal: {
          name: input.full_name.split("/")[1], kind: "mcp", category: "developer", tags: ["x"],
          description_en: "Auto.", description_zh: "自动。", long_en: "Long.", long_zh: "长。",
          sec_note_en: "Reviewed by LLM.", sec_note_zh: "已由 LLM 审核。",
        },
      }),
    };
    const res = await run({ sources: [source(urls)], gh, store, registry, http, clock,
      officialOrgs: new Set(["anthropic"]), history: {}, prevContractCount: 8, cache: emptyCache, firstParty: [], llm });
    expect(res.report.autoCurated).toBe(1);            // foo8 (the only uncurated repo) picked up
    expect(res.report.emitted).toBe(9);                // 8 human + 1 auto
    expect(res.report.queued).toBe(0);                 // backlog drained
    expect(res.newCurations).toHaveLength(1);
    expect(res.newCurations[0].full_name).toBe("acme/foo8");
    expect(res.newCurations[0].curated_by).toBe("llm");
  });

  it("suppresses a discovered repo whose upstream an official seed already claims", async () => {
    // Official seeds: a github-rooted preset (context7) and a monorepo sub-server (veimagex,
    // whose repo_url roots at volcengine/mcp-server). A later curation record could make either
    // upstream discoverable; the official seed must win even though ids differ (slug vs full_name).
    const firstParty = [
      official("aleph-hub:context7", "upstash/context7", "https://github.com/upstash/context7"),
      official("aleph-hub:volcengine-veimagex", "volcengine/mcp-server/veimagex", "https://github.com/volcengine/mcp-server"),
    ];
    const urls = [
      ...Array.from({ length: 9 }, (_, i) => `https://github.com/acme/foo${i}`), // foo0..foo7 curated, foo8 queued
      "https://github.com/upstash/context7",        // collides with the context7 seed
      "https://github.com/volcengine/mcp-server",   // collides with the veimagex seed's repo root
    ];
    const res = await run({ sources: [source(urls)], gh, store, registry, http, clock,
      officialOrgs: new Set(["anthropic"]), history: {}, prevContractCount: 8, cache: emptyCache, firstParty, llm: null });

    const entries = (res.catalog as any).entries as { id: string; repo_url: string }[];
    expect(entries).toHaveLength(10);                                  // 8 foo + 2 official, both discovered dupes dropped
    const ids = entries.map((e) => e.id).sort();
    expect(ids).toContain("aleph-hub:context7");
    expect(ids).toContain("aleph-hub:volcengine-veimagex");
    expect(ids).not.toContain("aleph-hub:upstash/context7");          // discovered duplicate suppressed
    expect(ids).not.toContain("aleph-hub:volcengine/mcp-server");
    const byUrl = entries.filter((e) => e.repo_url === "https://github.com/upstash/context7");
    expect(byUrl).toHaveLength(1);                                     // exactly one card per upstream
  });

  it("leaves repos queued when the LLM rejects them", async () => {
    const urls = Array.from({ length: 9 }, (_, i) => `https://github.com/acme/foo${i}`);
    const llm: LlmClient = { curate: async () => ({ decision: "reject", reason: "offensive security tooling" }) };
    const res = await run({ sources: [source(urls)], gh, store, registry, http, clock,
      officialOrgs: new Set(["anthropic"]), history: {}, prevContractCount: 8, cache: emptyCache, firstParty: [], llm });
    expect(res.report.autoCurated).toBe(0);
    expect(res.report.queued).toBe(1);                 // foo8 stays in the backlog
    expect(res.newCurations).toHaveLength(0);
  });

  it("flags a curated record whose repo was not emitted this run (silent-drop audit)", async () => {
    const urls = Array.from({ length: 8 }, (_, i) => `https://github.com/acme/foo${i}`); // 8 emitted ≥ MIN_ENTRIES
    const ghost: CurationRecord = {
      full_name: "acme/ghost", name: "ghost", kind: "mcp", category: "developer", tags: ["a"],
      description_en: "A tool.", description_zh: "工具。", long_en: "Long.", long_zh: "长。",
      install_spec: {}, sec_note_en: "Reviewed.", sec_note_zh: "已审核。",
    };
    // acme/foo0 is discovered + emitted; acme/ghost has a record but is never discovered → flagged.
    const auditStore: CurationStore = { get: store.get, all: () => [store.get("acme/foo0")!, ghost] };
    const res = await run({ sources: [source(urls)], gh, store: auditStore, registry, http, clock,
      officialOrgs: new Set(["anthropic"]), history: {}, prevContractCount: 8, cache: emptyCache, firstParty: [], llm: null });
    expect(res.report.emitted).toBe(8);
    expect(res.report.curatedButNotEmitted).toEqual(["acme/ghost"]);
  });
});
