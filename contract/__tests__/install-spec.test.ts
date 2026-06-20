import { describe, it, expect } from "vitest";
import { InstallSpec } from "@/contract/schema";

describe("InstallSpec", () => {
  it("parses mcp_stdio with env defaults", () => {
    const s = InstallSpec.parse({ type: "mcp_stdio", command: "npx", args: ["-y", "@acme/foo"] });
    expect(s).toMatchObject({ type: "mcp_stdio", command: "npx", args: ["-y", "@acme/foo"], env: [] });
  });
  it("parses mcp_remote with a valid transport", () => {
    const s = InstallSpec.parse({ type: "mcp_remote", url: "https://x", transport: "streamable_http" });
    expect(s).toMatchObject({ type: "mcp_remote", transport: "streamable_http", headers: [] });
  });
  it("rejects mcp_remote with transport 'http'", () => {
    expect(() => InstallSpec.parse({ type: "mcp_remote", url: "https://x", transport: "http" })).toThrow();
  });
  it("parses git_dir with nullable optionals", () => {
    const s = InstallSpec.parse({ type: "git_dir", git_url: "https://github.com/a/b" });
    expect(s).toMatchObject({ type: "git_dir", git_url: "https://github.com/a/b" });
  });
  it("parses oci_image (schema completeness) even though producer never emits it", () => {
    expect(InstallSpec.parse({ type: "oci_image", image: "ghcr.io/a/b:1" })).toMatchObject({ type: "oci_image" });
  });
  it("rejects an unknown type", () => {
    expect(() => InstallSpec.parse({ type: "brew", formula: "x" })).toThrow();
  });
});
