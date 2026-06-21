// Tested decorator over the thin GitHub adapter: per-run memoization + a persistent
// etag cache + 304 reconciliation. The thin adapter (RawGitHubApi) returns meta:null
// on a 304; this wrapper fills meta from the etag cache so the pipeline-facing
// GitHubApi always yields a RepoMeta. Each repo is fetched at most once per run.
import type { GitHubApi, RawGitHubApi, RepoMeta } from "@/scripts/pipeline/ports";

export type MetaCacheEntry = { etag: string; meta: RepoMeta };
type RepoResult = { meta: RepoMeta; etag: string; notModified: boolean };

export function makeCachingGitHub(inner: RawGitHubApi, metaCache: Map<string, MetaCacheEntry>): GitHubApi {
  const memo = new Map<string, RepoResult | null>(); // per-run, ephemeral
  return {
    searchRepos: (q, o) => inner.searchRepos(q, o),
    getReadme: (fn) => inner.getReadme(fn),
    getContent: (fn, p) => inner.getContent(fn, p),
    async getRepo(fullName) {
      const key = fullName.toLowerCase();
      if (memo.has(key)) return memo.get(key)!;
      const cached = metaCache.get(key);
      const r = await inner.getRepo(fullName, cached?.etag);
      if (r === null) { memo.set(key, null); return null; }
      if (r.notModified) {
        // A 304 only happens after we sent a cached etag, so `cached` exists; degrade safely otherwise.
        if (!cached) { memo.set(key, null); return null; }
        const result: RepoResult = { meta: cached.meta, etag: r.etag || cached.etag, notModified: true };
        memo.set(key, result);
        memo.set(cached.meta.full_name.toLowerCase(), result);
        return result;
      }
      metaCache.set(r.meta.full_name.toLowerCase(), { etag: r.etag, meta: r.meta });
      const result: RepoResult = { meta: r.meta, etag: r.etag, notModified: false };
      memo.set(key, result);
      memo.set(r.meta.full_name.toLowerCase(), result);
      return result;
    },
  };
}
