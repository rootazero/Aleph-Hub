import { describe, it, expect } from "vitest";
import { makeCachingGitHub, type MetaCacheEntry } from "@/scripts/pipeline/gh-cache";
import type { RawGitHubApi, RawRepoResult, RepoMeta } from "@/scripts/pipeline/ports";

function meta(fn: string, over: Partial<RepoMeta> = {}): RepoMeta {
  const [owner, repo] = fn.split("/");
  return { full_name: fn, owner, repo, stars: 1, license: "MIT", pushed_at: "2026-01-01T00:00:00Z", fork: false, source_full_name: null, default_branch: "main", ...over };
}
function fakeRaw(results: Record<string, RawRepoResult | null>) {
  const calls: { fullName: string; etag?: string }[] = [];
  const inner: RawGitHubApi = {
    searchRepos: async () => [],
    getReadme: async () => "",
    getContent: async () => null,
    getRepo: async (fullName, etag) => { calls.push({ fullName, etag }); return results[fullName.toLowerCase()] ?? null; },
  };
  return { inner, calls };
}

describe("makeCachingGitHub", () => {
  it("fetches each repo at most once per run (memo)", async () => {
    const { inner, calls } = fakeRaw({ "acme/foo": { meta: meta("acme/foo"), etag: "e1", notModified: false } });
    const gh = makeCachingGitHub(inner, new Map());
    await gh.getRepo("acme/foo");
    await gh.getRepo("acme/foo");
    expect(calls).toHaveLength(1);
  });

  it("sends the cached etag and reuses cached meta on a 304", async () => {
    const cache = new Map<string, MetaCacheEntry>([["acme/foo", { etag: "e1", meta: meta("acme/foo", { stars: 42 }) }]]);
    const { inner, calls } = fakeRaw({ "acme/foo": { meta: null, etag: "e1", notModified: true } });
    const gh = makeCachingGitHub(inner, cache);
    const got = await gh.getRepo("acme/foo");
    expect(calls[0].etag).toBe("e1");
    expect(got?.notModified).toBe(true);
    expect(got?.meta.stars).toBe(42);
  });

  it("updates the etag cache on a 200", async () => {
    const cache = new Map<string, MetaCacheEntry>();
    const { inner } = fakeRaw({ "acme/foo": { meta: meta("acme/foo"), etag: "e9", notModified: false } });
    const gh = makeCachingGitHub(inner, cache);
    await gh.getRepo("acme/foo");
    expect(cache.get("acme/foo")?.etag).toBe("e9");
  });

  it("memoizes under the canonical name so a renamed repo is reused", async () => {
    const { inner, calls } = fakeRaw({ "old/name": { meta: meta("new/name"), etag: "e1", notModified: false } });
    const gh = makeCachingGitHub(inner, new Map());
    await gh.getRepo("Old/Name");
    await gh.getRepo("new/name");
    expect(calls).toHaveLength(1);
  });

  it("passes through and memoizes a null (unresolved) repo", async () => {
    const { inner, calls } = fakeRaw({});
    const gh = makeCachingGitHub(inner, new Map());
    expect(await gh.getRepo("gone/x")).toBeNull();
    await gh.getRepo("gone/x");
    expect(calls).toHaveLength(1);
  });
});
