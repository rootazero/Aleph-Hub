import { describe, it, expect } from "vitest";
import { GitHubContentSource } from "@/scripts/pipeline/sources/github-content";
import type { ContentGitHub } from "@/scripts/pipeline/sources/content-types";
import type { Http } from "@/scripts/pipeline/ports";

function fakeGh(opts: {
  search?: Record<string, string[]>;
  trees?: Record<string, string[]>;
  files?: Record<string, string>;       // "full:path" → text
  readmes?: Record<string, string>;
}): ContentGitHub {
  return {
    async searchRepos(q) { return opts.search?.[q] ?? []; },
    async listFiles(full) { return opts.trees?.[full] ?? []; },
    async getContent(full, path) { return opts.files?.[`${full}:${path}`] ?? null; },
    async getReadme(full) { return opts.readmes?.[full] ?? null; },
  };
}
const noHttp: Http = { async getText() { return null; } };

describe("GitHubContentSource (prompt explosion)", () => {
  it("explodes a discovered repo into one candidate per prompt file", async () => {
    const gh = fakeGh({
      search: { "topic:awesome-prompts": ["acme/prompts"] },
      trees: { "acme/prompts": ["README.md", "prompts/a.md", "prompts/b.md", "tool.js"] },
      files: { "acme/prompts:prompts/a.md": "Prompt A", "acme/prompts:prompts/b.md": "Prompt B" },
      readmes: { "acme/prompts": "A collection." },
    });
    const src = new GitHubContentSource({ gh, http: noHttp, kind: "prompt", seeds: { queries: ["topic:awesome-prompts"], seeds: [] } });
    const got = await src.fetch();
    expect(got.map((c) => c.slug).sort()).toEqual(["prompts-a", "prompts-b"]);
    expect(got.every((c) => c.kind === "prompt" && c.readme === "A collection.")).toBe(true);
    expect(got.find((c) => c.slug === "prompts-a")!.raw.text).toBe("Prompt A");
  });

  it("reads a file pin (owner/repo:path) with a basename slug", async () => {
    const gh = fakeGh({ files: { "acme/p:prompts/hello.md": "Hi." }, readmes: { "acme/p": "r" } });
    const src = new GitHubContentSource({ gh, http: noHttp, kind: "prompt", seeds: { queries: [], seeds: [], pins: ["acme/p:prompts/hello.md"] } });
    const got = await src.fetch();
    expect(got).toHaveLength(1);
    expect(got[0]).toMatchObject({ slug: "hello", source_path: "prompts/hello.md", kind: "prompt" });
  });
});

describe("GitHubContentSource (workflow explosion)", () => {
  it("keeps only .js files that look like workflow scripts", async () => {
    const gh = fakeGh({
      search: { "topic:agent-workflow": ["acme/wf"] },
      trees: { "acme/wf": ["flow.js", "util.js", "results-1.json"] },
      files: {
        "acme/wf:flow.js": "export const meta = {};\nawait pipeline(items, s1)",
        "acme/wf:util.js": "export function x(){}",
      },
    });
    const src = new GitHubContentSource({ gh, http: noHttp, kind: "workflow", seeds: { queries: ["topic:agent-workflow"], seeds: [] } });
    const got = await src.fetch();
    expect(got).toHaveLength(1);
    expect(got[0]).toMatchObject({ slug: "flow", kind: "workflow" });
  });

  it("caps the number of files exploded per repo", async () => {
    const paths = Array.from({ length: 40 }, (_, i) => `prompts/p${i}.md`);
    const files = Object.fromEntries(paths.map((p) => [`acme/big:${p}`, "body"]));
    const gh = fakeGh({ search: { q: ["acme/big"] }, trees: { "acme/big": paths }, files });
    const src = new GitHubContentSource({ gh, http: noHttp, kind: "prompt", seeds: { queries: ["q"], seeds: [] } });
    expect((await src.fetch()).length).toBe(25);
  });
});
