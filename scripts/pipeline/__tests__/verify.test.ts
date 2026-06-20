import { describe, it, expect } from "vitest";
import { verifyInstallSpec } from "@/scripts/pipeline/verify";
import type { RegistryClient, GitHubApi } from "@/scripts/pipeline/ports";
import type { InstallSpecT } from "@/contract/types";

const gh = { getRepo: async (fn: string) => ({ meta: { full_name: fn, owner: fn.split("/")[0], repo: fn.split("/")[1], stars: 1, license: "MIT", pushed_at: "2026-01-01T00:00:00Z", fork: false, source_full_name: null, default_branch: "main" }, etag: "x", notModified: false }) } as unknown as GitHubApi;

const registry = (repo: string | null, exists = true): RegistryClient => ({
  npmPackage: async () => ({ exists, repository: repo }),
  pypiPackage: async () => ({ exists }),
});

describe("verifyInstallSpec", () => {
  it("passes mcp_stdio when the npm pkg exists and owner matches", async () => {
    const spec: InstallSpecT = { type: "mcp_stdio", command: "npx", args: ["-y", "@acme/foo"], env: [] };
    const r = await verifyInstallSpec(spec, "acme", { registry: registry("https://github.com/acme/foo"), gh });
    expect(r.ok).toBe(true);
  });
  it("passes mcp_stdio when the registry returns no repository (owner check skipped)", async () => {
    const spec: InstallSpecT = { type: "mcp_stdio", command: "npx", args: ["-y", "@acme/foo"], env: [] };
    const r = await verifyInstallSpec(spec, "acme", { registry: registry(null), gh });
    expect(r.ok).toBe(true); // null repository → existence-only; this is the path run.test relies on
  });
  it("fails mcp_stdio when the pkg owner mismatches the repo owner (typosquat guard)", async () => {
    const spec: InstallSpecT = { type: "mcp_stdio", command: "npx", args: ["-y", "@evil/foo"], env: [] };
    const r = await verifyInstallSpec(spec, "acme", { registry: registry("https://github.com/evil/foo"), gh });
    expect(r.ok).toBe(false);
  });
  it("fails mcp_stdio when the pkg does not exist (hallucination guard)", async () => {
    const spec: InstallSpecT = { type: "mcp_stdio", command: "npx", args: ["-y", "@acme/ghost"], env: [] };
    const r = await verifyInstallSpec(spec, "acme", { registry: registry(null, false), gh });
    expect(r.ok).toBe(false);
  });
  it("passes git_dir when the repo resolves", async () => {
    const spec: InstallSpecT = { type: "git_dir", git_url: "https://github.com/acme/foo", git_ref: "main" };
    const r = await verifyInstallSpec(spec, "acme", { registry: registry(null), gh });
    expect(r.ok).toBe(true);
  });
});
