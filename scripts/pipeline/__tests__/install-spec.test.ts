import { describe, it, expect } from "vitest";
import { inferInstallSpec, requiresConfig } from "@/scripts/pipeline/install_spec";

const base = { repo_url: "https://github.com/acme/foo", owner: "acme", repo: "foo", default_branch: "main" };

describe("install_spec inference", () => {
  it("infers mcp_stdio from an npx command in the README", () => {
    const spec = inferInstallSpec("mcp", { ...base, readme: "Run `npx -y @acme/foo` to start the server.\nSet `ACME_TOKEN` (secret)." });
    expect(spec).toMatchObject({ type: "mcp_stdio", command: "npx" });
    expect((spec as any).args).toContain("@acme/foo");
  });
  it("infers mcp_remote with a streamable_http endpoint", () => {
    const spec = inferInstallSpec("mcp", { ...base, readme: "Hosted endpoint: https://api.acme.dev/mcp/ (streamable http). Send Authorization header." });
    expect(spec).toMatchObject({ type: "mcp_remote", transport: "streamable_http" });
  });
  it("infers git_dir for skills/plugins", () => {
    const spec = inferInstallSpec("skill", { ...base, readme: "Clone and load." });
    expect(spec).toEqual({ type: "git_dir", git_url: "https://github.com/acme/foo", git_ref: "main" });
  });
  it("returns null when no install signal is found for an mcp repo", () => {
    expect(inferInstallSpec("mcp", { ...base, readme: "A library with no server entrypoint documented." })).toBeNull();
  });
  it("requiresConfig is true for a required env / secret header, false otherwise", () => {
    expect(requiresConfig({ type: "mcp_stdio", command: "npx", args: [], env: [{ name: "K", required: true, secret: true }] })).toBe(true);
    expect(requiresConfig({ type: "mcp_remote", url: "https://x", transport: "sse", headers: [{ name: "Authorization", secret: true }] })).toBe(true);
    expect(requiresConfig({ type: "git_dir", git_url: "https://github.com/a/b" })).toBe(false);
  });
});
