import { describe, it, expect } from "vitest";
import { dedupe } from "@/scripts/pipeline/dedup";
import type { GitHubApi, RepoMeta } from "@/scripts/pipeline/ports";
import type { Candidate } from "@/scripts/pipeline/model";

function meta(full: string, over: Partial<RepoMeta> = {}): RepoMeta {
  const [owner, repo] = full.split("/");
  return { full_name: full, owner, repo, stars: 1, license: "MIT", pushed_at: "2026-01-01T00:00:00Z", fork: false, source_full_name: null, default_branch: "main", ...over };
}
function fakeGh(map: Record<string, RepoMeta | null>): GitHubApi {
  return { searchRepos: async () => [], getReadme: async () => "", getContent: async () => null,
    getRepo: async (fn) => { const k = fn.toLowerCase(); const m = map[k]; return m ? { meta: m, etag: "e", notModified: false } : null; } };
}

describe("dedupe", () => {
  it("folds a fork to its source and dedupes by canonical full_name", async () => {
    const gh = fakeGh({
      "acme/foo": meta("acme/foo"),
      "user/foo-fork": meta("user/foo-fork", { fork: true, source_full_name: "acme/foo" }),
    });
    const cands: Candidate[] = [
      { repo_url: "https://github.com/user/foo-fork", via: "github:user", raw: {} },
      { repo_url: "https://github.com/acme/foo", via: "github:acme", raw: {} },
    ];
    const out = await dedupe(cands, gh);
    expect(out).toHaveLength(1);
    expect(out[0].full_name).toBe("acme/foo");
  });
  it("keeps the higher-priority source on a tie", async () => {
    const gh = fakeGh({ "acme/foo": meta("acme/foo") });
    const out = await dedupe([
      { repo_url: "https://github.com/acme/foo", via: "clawhub", raw: {} },
      { repo_url: "https://github.com/acme/foo", via: "github:acme", raw: {} },
    ], gh);
    expect(out).toHaveLength(1);
    expect(out[0].via).toBe("github:acme");
  });
  it("drops candidates whose repo does not resolve", async () => {
    const gh = fakeGh({});
    expect(await dedupe([{ repo_url: "https://github.com/gone/x", via: "github:gone", raw: {} }], gh)).toHaveLength(0);
  });
});
