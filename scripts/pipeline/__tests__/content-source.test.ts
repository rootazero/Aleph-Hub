import { describe, it, expect } from "vitest";
import { GitHubContentSource } from "@/scripts/pipeline/sources/github-content";
import type { ContentGitHub } from "@/scripts/pipeline/sources/content-types";

function fakeGh(files: Record<string, string>): ContentGitHub {
  return { async getContent(full, path) { return files[`${full}:${path}`] ?? null; } };
}

describe("GitHubContentSource", () => {
  it("reads each pin into a candidate with slug from the file basename", async () => {
    const gh = fakeGh({ "acme/prompts:prompts/hello.md": "Say hi." });
    const src = new GitHubContentSource({ gh, seeds: { queries: [], seeds: [], pins: ["acme/prompts:prompts/hello.md"] } });
    const got = await src.fetch();
    expect(got).toHaveLength(1);
    expect(got[0]).toMatchObject({
      owner: "acme", repo: "prompts", source_path: "prompts/hello.md", slug: "hello",
      repo_url: "https://github.com/acme/prompts", via: "github:acme",
    });
    expect(got[0].raw.text).toBe("Say hi.");
  });
  it("skips pins whose file cannot be read", async () => {
    const src = new GitHubContentSource({ gh: fakeGh({}), seeds: { queries: [], seeds: [], pins: ["acme/prompts:missing.md"] } });
    expect(await src.fetch()).toHaveLength(0);
  });
  it("returns nothing when there are no pins", async () => {
    const src = new GitHubContentSource({ gh: fakeGh({}), seeds: { queries: [], seeds: [] } });
    expect(await src.fetch()).toHaveLength(0);
  });
});
