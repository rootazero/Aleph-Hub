// Real-world boundary: concrete adapters for every port, over fetch / node:fs.
// No business logic here (that lives in the tested stage modules); errors degrade to null.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname } from "node:path";
import type { RepoMeta, RegistryClient, Http, Clock, FileStore, CurationStore, CurationRecord, RawGitHubApi } from "@/scripts/pipeline/ports";

const GH_API = "https://api.github.com";

function ghHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = process.env.GH_TOKEN ?? process.env.GH_PAT ?? "";
  return { Accept: "application/vnd.github+json", "User-Agent": "aleph-hub-pipeline",
    ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
}

export function makeGitHub(): RawGitHubApi {
  return {
    async searchRepos(query, opts) {
      const perPage = opts?.perPage ?? 100;
      const maxPages = opts?.maxPages ?? 3;
      const out: string[] = [];
      for (let page = 1; page <= maxPages; page++) {
        const res = await fetch(`${GH_API}/search/repositories?q=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`, { headers: ghHeaders() });
        if (!res.ok) break;
        const json = (await res.json()) as { items?: { full_name: string }[] };
        const items = json.items ?? [];
        out.push(...items.map((i) => i.full_name));
        if (items.length < perPage) break;
      }
      return out;
    },
    async getRepo(fullName, etag) {
      try {
        const res = await fetch(`${GH_API}/repos/${fullName}`, { headers: ghHeaders(etag ? { "If-None-Match": etag } : {}) });
        if (res.status === 304) return { meta: null, etag: res.headers.get("etag") ?? etag ?? "", notModified: true };
        if (!res.ok) return null;
        const r = (await res.json()) as Record<string, any>;
        const meta: RepoMeta = {
          full_name: r.full_name, owner: r.owner?.login ?? fullName.split("/")[0], repo: r.name ?? fullName.split("/")[1],
          stars: r.stargazers_count ?? 0, license: r.license?.spdx_id ?? null, pushed_at: r.pushed_at ?? "",
          fork: !!r.fork, source_full_name: r.source?.full_name ?? null, default_branch: r.default_branch ?? "main",
        };
        return { meta, etag: res.headers.get("etag") ?? "", notModified: false };
      } catch { return null; }
    },
    async getReadme(fullName) {
      try {
        const res = await fetch(`${GH_API}/repos/${fullName}/readme`, { headers: ghHeaders({ Accept: "application/vnd.github.raw" }) });
        return res.ok ? await res.text() : null;
      } catch { return null; }
    },
    async getContent(fullName, path) {
      try {
        const res = await fetch(`${GH_API}/repos/${fullName}/contents/${path}`, { headers: ghHeaders({ Accept: "application/vnd.github.raw" }) });
        return res.ok ? await res.text() : null;
      } catch { return null; }
    },
  };
}

// Loads every data/curation/*.json into a keyed map at construction (local, free — no API).
export function makeCurationStore(dir = "data/curation"): CurationStore {
  const map = new Map<string, CurationRecord>();
  if (existsSync(dir)) {
    for (const name of readdirSync(dir)) {
      if (!name.endsWith(".json")) continue;
      try {
        const rec = JSON.parse(readFileSync(`${dir}/${name}`, "utf8")) as CurationRecord;
        if (rec?.full_name) map.set(rec.full_name.toLowerCase(), rec);
      } catch { /* skip malformed record */ }
    }
  }
  return { get: (fullName) => map.get(fullName.toLowerCase()) ?? null };
}

function makeRegistry(): RegistryClient {
  return {
    async npmPackage(name) {
      try {
        const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`);
        if (res.status === 404) return { exists: false, repository: null };
        if (!res.ok) return null;
        const json = (await res.json()) as { repository?: { url?: string } | string };
        const repo = typeof json.repository === "string" ? json.repository : json.repository?.url ?? null;
        return { exists: true, repository: repo };
      } catch { return null; }
    },
    async pypiPackage(name) {
      try {
        const res = await fetch(`https://pypi.org/pypi/${encodeURIComponent(name)}/json`);
        if (res.status === 404) return { exists: false };
        if (!res.ok) return null;
        return { exists: true };
      } catch { return null; }
    },
  };
}

function makeHttp(): Http {
  return { async getText(url) { try { const res = await fetch(url, { headers: { "User-Agent": "aleph-hub-pipeline" } }); return res.ok ? await res.text() : null; } catch { return null; } } };
}

function makeClock(): Clock { return { nowIso: () => new Date().toISOString() }; }

function makeFileStore(): FileStore {
  return {
    readJson<T>(path: string): T | null { return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as T) : null; },
    writeJson(path: string, value: unknown): void { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, JSON.stringify(value, null, 2) + "\n"); },
    readText(path: string): string | null { return existsSync(path) ? readFileSync(path, "utf8") : null; },
    writeText(path: string, value: string): void { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, value); },
  };
}

export function makeAdapters() {
  return { store: makeCurationStore(), registry: makeRegistry(), http: makeHttp(), clock: makeClock(), fs: makeFileStore() };
}
