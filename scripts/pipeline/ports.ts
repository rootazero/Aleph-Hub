// Every external dependency is an interface so the pipeline is testable with fakes.

export interface RepoMeta {
  full_name: string;        // canonical "owner/repo" (lower-cased by callers for keys)
  owner: string;
  repo: string;
  stars: number;
  license: string | null;
  pushed_at: string;        // ISO timestamp
  fork: boolean;
  source_full_name: string | null;  // for fork→source folding
  default_branch: string;
}

export interface GitHubApi {
  // Search returns canonical full_names. Implementation paginates within Search API limits.
  searchRepos(query: string, opts?: { perPage?: number; maxPages?: number }): Promise<string[]>;
  // null = repo not found / deleted. notModified honours the passed etag (conditional request).
  getRepo(fullName: string, etag?: string): Promise<{ meta: RepoMeta; etag: string; notModified: boolean } | null>;
  getReadme(fullName: string): Promise<string | null>;
  getContent(fullName: string, path: string): Promise<string | null>;
}

// The thin HTTP adapter honors conditional requests: a 304 carries no body, so
// `meta` is null on notModified. The gh-cache decorator reconciles this back to a
// full RepoMeta (from cache) and presents the unchanged GitHubApi to the pipeline.
export type RawRepoResult =
  | { meta: RepoMeta; etag: string; notModified: false }
  | { meta: null; etag: string; notModified: true };
export interface RawGitHubApi {
  searchRepos(query: string, opts?: { perPage?: number; maxPages?: number }): Promise<string[]>;
  getRepo(fullName: string, etag?: string): Promise<RawRepoResult | null>;
  getReadme(fullName: string): Promise<string | null>;
  getContent(fullName: string, path: string): Promise<string | null>;
}

// Curation comes from a git-committed store (data/curation/*.json), not an API.
export interface CurationRecord {
  full_name: string;          // canonical owner/repo (lower-cased on lookup)
  name: string;
  kind: "skill" | "plugin" | "mcp";
  category: string;
  tags: string[];
  description_en: string; description_zh: string;
  long_en: string; long_zh: string;
  install_spec: unknown;      // hint only — re-inferred + verified locally
  sec_note_en: string; sec_note_zh: string;
}
export interface CurationStore { get(fullName: string): CurationRecord | null; }

// Autonomous curation (Phase 2). The LLM applies the curation policy as a hard filter
// ("不确定就排除") and either proposes a record or rejects with a reason. The proposal
// mirrors the human curation fields; install_spec is re-inferred downstream by curate().
export interface LlmCurationInput {
  full_name: string;
  repo_url: string;
  stars: number;
  license: string | null;
  readme: string;
}
export interface LlmProposal {
  name: string;
  kind: "skill" | "plugin" | "mcp";
  category: string;
  tags: string[];
  description_en: string; description_zh: string;
  long_en: string; long_zh: string;
  sec_note_en: string; sec_note_zh: string;
}
export type LlmCurationResult =
  | { decision: "accept"; proposal: LlmProposal }
  | { decision: "reject"; reason: string };
export interface LlmClient {
  // null = transport/parse failure (caller leaves the repo queued for a later run).
  curate(input: LlmCurationInput): Promise<LlmCurationResult | null>;
}

export interface RegistryClient {
  // null = lookup failed (network); {exists:false} = definitively absent.
  npmPackage(name: string): Promise<{ exists: boolean; repository: string | null } | null>;
  pypiPackage(name: string): Promise<{ exists: boolean } | null>;
}

export interface Http { getText(url: string): Promise<string | null>; }

export interface Clock { nowIso(): string; }   // injected so trend/generated_at are deterministic in tests

export interface FileStore {
  readJson<T>(path: string): T | null;
  writeJson(path: string, value: unknown): void;
  readText(path: string): string | null;
  writeText(path: string, value: string): void;
}

// Per-repo incremental cache (§6.8/D13): reuse curation for unchanged repos.
import type { CuratedEntry } from "@/scripts/pipeline/model";

export interface RepoCache { etag?: string; readme_hash: string; entry: CuratedEntry; }
export interface CacheStore {
  get(fullName: string): RepoCache | undefined;
  set(fullName: string, value: RepoCache): void;
  entries(): Record<string, RepoCache>;
  prevPerSource(): Record<string, number>;
  setPerSource(counts: Record<string, number>): void;
}

// --- Content kinds (prompt / workflow) -------------------------------------
// Unlike install CurationRecord, a content record CARRIES the curated body — the
// payload IS the text, so there is nothing to re-infer/verify downstream.
export interface ContentCurationRecord {
  id: string;                 // "aleph-hub:<owner>/<repo>#<slug>"
  full_name: string;          // "owner/repo" (links the unit back to its upstream repo)
  slug: string;
  source_path: string;        // file within repo
  kind: "prompt" | "workflow";
  category: string;
  name: string;
  tags: string[];
  format: "markdown" | "javascript";
  body: string;
  description_en: string; description_zh: string;
  long_en: string; long_zh: string;
  sec_note_en: string; sec_note_zh: string;
}
export interface ContentCurationStore {
  get(id: string): ContentCurationRecord | null;
  all(): ContentCurationRecord[];
}
