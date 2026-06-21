import { run } from "@/scripts/pipeline/run";
import { makeAdapters, makeGitHub } from "@/scripts/pipeline/adapters";
import { makeCachingGitHub, type MetaCacheEntry } from "@/scripts/pipeline/gh-cache";
import { GitHubSource } from "@/scripts/pipeline/sources/github";
import { ClawHubSource } from "@/scripts/pipeline/sources/clawhub";
import { HermesAtlasSource } from "@/scripts/pipeline/sources/hermes";
import type { CacheStore, RepoCache, FileStore } from "@/scripts/pipeline/ports";

function makeFileCache(fs: FileStore): CacheStore {
  const repos = new Map(Object.entries(fs.readJson<Record<string, RepoCache>>("data/cache/repos.json") ?? {}));
  let perSource = fs.readJson<Record<string, number>>("data/cache/per-source.json") ?? {};
  return {
    get: (fn) => repos.get(fn),
    set: (fn, v) => { repos.set(fn, v); },
    entries: () => Object.fromEntries(repos),
    prevPerSource: () => perSource,
    setPerSource: (c) => { perSource = c; },
  };
}

async function main() {
  const { store, registry, http, clock, fs } = makeAdapters();
  const metaCache = new Map<string, MetaCacheEntry>(
    Object.entries(fs.readJson<Record<string, MetaCacheEntry>>("data/cache/repos-meta.json") ?? {}),
  );
  const gh = makeCachingGitHub(makeGitHub(), metaCache);
  const cache = makeFileCache(fs);
  const seeds = fs.readJson<{ queries: string[]; seeds: string[] }>("data/seeds/github.json")!;
  const officialOrgs = new Set((fs.readJson<string[]>("data/seeds/official-orgs.json") ?? []).map((s) => s.toLowerCase()));
  const history = fs.readJson<Record<string, number[]>>("data/stars-history.json") ?? {};
  const prev = fs.readJson<{ manifest?: { content_hash?: string }; entries: unknown[] }>("public/catalog.json");
  const prevHash = prev?.manifest?.content_hash;
  const sources = [
    new GitHubSource({ gh, http, seeds }),
    new ClawHubSource({ http, indexUrl: "https://clawhub.ai/" }),
    new HermesAtlasSource({ http, indexUrl: "https://hermesatlas.com/" }),
  ];
  const res = await run({ sources, gh, store, registry, http, clock, officialOrgs, history, prevContractCount: prev?.entries.length ?? 0, cache });

  fs.writeText("data/.heartbeat", res.heartbeat);    // always — keepalive (D14)
  fs.writeJson("data/queue/to-curate.json", res.queue);  // always — backlog visibility for agent curation
  fs.writeJson("data/cache/repos-meta.json", Object.fromEntries(metaCache)); // always — persist etags for next run's 304s
  if (res.hash !== prevHash) {                         // §6.7 skip-emit on unchanged content
    fs.writeJson("public/catalog.json", res.catalog);
    fs.writeJson("data/site-catalog.json", res.site);
    fs.writeJson("data/stars-history.json", res.nextHistory);
    fs.writeJson("data/cache/repos.json", cache.entries());
    fs.writeJson("data/cache/per-source.json", res.report.perSource);
  }
  console.log(JSON.stringify(res.report, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
