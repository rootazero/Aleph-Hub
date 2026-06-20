// Real-world boundary: concrete adapters for every port, over fetch / Anthropic SDK / node:fs.
// No business logic here (that lives in the tested stage modules); errors degrade to null.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import type { GitHubApi, RepoMeta, LlmClient, LlmCurateInput, LlmCurateOutput, RegistryClient, Http, Clock, FileStore } from "@/scripts/pipeline/ports";

const GH_API = "https://api.github.com";

function ghHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = process.env.GH_TOKEN ?? process.env.GH_PAT ?? "";
  return { Accept: "application/vnd.github+json", "User-Agent": "aleph-hub-pipeline",
    ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
}

function makeGitHub(): GitHubApi {
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
    async getRepo(fullName) {
      try {
        const res = await fetch(`${GH_API}/repos/${fullName}`, { headers: ghHeaders() });
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

const CURATE_SCHEMA = {
  type: "object" as const,
  properties: {
    name: { type: "string" }, kind: { type: "string", enum: ["skill", "plugin", "mcp"] },
    category: { type: "string" }, tags: { type: "array", items: { type: "string" } },
    description_en: { type: "string" }, description_zh: { type: "string" },
    long_en: { type: "string" }, long_zh: { type: "string" },
    install_spec: { type: "object" }, sec_note_en: { type: "string" }, sec_note_zh: { type: "string" },
  },
  required: ["name", "kind", "category", "tags", "description_en", "description_zh", "long_en", "long_zh", "sec_note_en", "sec_note_zh"],
};

function makeLlm(): LlmClient {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });
  return {
    async curate(input: LlmCurateInput): Promise<LlmCurateOutput> {
      const prompt = `You are curating an open-source agent extension for a catalog. Repo: ${input.full_name} (${input.repo_url}).\nWrite a bilingual (English canonical + Chinese) entry. README:\n\n${input.readme.slice(0, 8000)}`;
      const msg = await client.messages.create({
        model: "claude-opus-4-8", max_tokens: 1500,
        tools: [{ name: "emit_entry", description: "Emit the curated catalog entry.", input_schema: CURATE_SCHEMA }],
        tool_choice: { type: "tool", name: "emit_entry" },
        messages: [{ role: "user", content: prompt }],
      });
      const block = msg.content.find((b) => b.type === "tool_use");
      if (!block || block.type !== "tool_use") throw new Error("LLM returned no tool_use");
      return block.input as LlmCurateOutput;
    },
  };
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
  return { gh: makeGitHub(), llm: makeLlm(), registry: makeRegistry(), http: makeHttp(), clock: makeClock(), fs: makeFileStore() };
}
