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

export interface LlmCurateInput {
  repo_url: string; full_name: string; readme: string; packageJson?: string | null;
}
export interface LlmCurateOutput {
  name: string; kind: "skill" | "plugin" | "mcp"; category: string; tags: string[];
  description_en: string; description_zh: string; long_en: string; long_zh: string;
  install_spec: unknown;          // re-validated locally against contract InstallSpec
  sec_note_en: string; sec_note_zh: string;
}
export interface LlmClient { curate(input: LlmCurateInput): Promise<LlmCurateOutput>; }

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
