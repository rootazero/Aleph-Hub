import { describe, it, expect } from "vitest";
import { buildContentArtifacts } from "@/scripts/pipeline/content-emit";
import { validateContentArtifact, CONTENT_SCHEMA_VERSION } from "@/contract/content-schema";
import { validateContentSiteCatalog } from "@/contract/content-site";
import type { ContentFinalEntry } from "@/scripts/pipeline/content-model";

function fe(over: Partial<ContentFinalEntry> = {}): ContentFinalEntry {
  return {
    id: "aleph-hub:acme/prompts#hello", kind: "prompt", category: "writing", name: "Hello",
    author: "acme", tags: ["greeting"], repo_url: "https://github.com/acme/prompts",
    source_path: "prompts/hello.md", via: "github:acme", body: "Say hello.", format: "markdown",
    description_en: "A greeting.", description_zh: "问候。", long_en: "Long.", long_zh: "长。",
    sec_note_en: "Reviewed.", sec_note_zh: "已审核。", trust_tier: "community", ...over,
  };
}

describe("content-emit", () => {
  it("builds artifacts that pass both content validators", () => {
    const { catalog, site } = buildContentArtifacts({ entries: [fe()], generatedAt: "2026-06-22T00:00:00Z" });
    const art = validateContentArtifact(catalog);
    const s = validateContentSiteCatalog(site);
    expect(art.manifest.content_schema_version).toBe(1);
    expect(art.entries[0].description).toBe(s.entries[0].description_en);
    expect(art.entries[0].body).toBe("Say hello.");
    // wire entry carries NO site-only fields
    expect((art.entries[0] as Record<string, unknown>).cover_color).toBeUndefined();
    // site entry gets a computed cover_color
    expect(s.entries[0].cover_color).toMatch(/^#/);
  });
  it("emits an empty but valid artifact for zero entries", () => {
    const { catalog } = buildContentArtifacts({ entries: [], generatedAt: "2026-06-22T00:00:00Z" });
    expect(validateContentArtifact(catalog).entries).toHaveLength(0);
  });
  it("hash is stable regardless of entry key order", () => {
    const a = buildContentArtifacts({ entries: [fe()], generatedAt: "2026-06-22T00:00:00Z" }).hash;
    const b = buildContentArtifacts({ entries: [fe()], generatedAt: "2026-06-22T00:00:00Z" }).hash;
    expect(a).toBe(b);
  });
  it("stamps the manifest with the shared CONTENT_SCHEMA_VERSION", () => {
    const { catalog } = buildContentArtifacts({ entries: [], generatedAt: "2026-06-22T00:00:00Z" });
    expect((catalog as { manifest: { content_schema_version: number } }).manifest.content_schema_version).toBe(CONTENT_SCHEMA_VERSION);
  });
});
