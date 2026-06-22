import { describe, it, expect } from "vitest";
import { validateContentArtifact, ContentCatalogEntry } from "@/contract/content-schema";
import { validateContentSiteCatalog } from "@/contract/content-site";

const entry = {
  id: "aleph-hub:acme/prompts#hello", kind: "prompt", category: "writing",
  name: "Hello", description: "A greeting prompt.", author: "acme", tags: ["greeting"],
  repo_url: "https://github.com/acme/prompts", source_path: "prompts/hello.md",
  trust_tier: "community", via: "github:acme", body: "Say hello to {name}.", format: "markdown",
};

describe("content-schema", () => {
  it("accepts a valid content artifact", () => {
    const art = validateContentArtifact({
      manifest: { content_schema_version: 1, hub_id: "aleph-hub", name: "Aleph Hub" },
      entries: [entry],
    });
    expect(art.entries[0].kind).toBe("prompt");
    expect(art.entries[0].format).toBe("markdown");
  });
  it("rejects an unknown format", () => {
    expect(ContentCatalogEntry.safeParse({ ...entry, format: "html" }).success).toBe(false);
  });
  it("rejects an over-cap body", () => {
    expect(ContentCatalogEntry.safeParse({ ...entry, body: "x".repeat(65537) }).success).toBe(false);
  });
  it("rejects a missing repo_url (provenance)", () => {
    const { repo_url, ...noRepo } = entry;
    expect(ContentCatalogEntry.safeParse(noRepo).success).toBe(false);
  });
  it("rejects a non-URL repo_url", () => {
    expect(ContentCatalogEntry.safeParse({ ...entry, repo_url: "acme/prompts" }).success).toBe(false);
  });
  it("accepts a site entry with bilingual + display fields", () => {
    const site = validateContentSiteCatalog({
      manifest: { content_schema_version: 1, hub_id: "aleph-hub", name: "Aleph Hub" },
      entries: [{ ...entry, description_zh: "问候。", description_en: "A greeting.",
        long_zh: "长。", long_en: "Long.", cover_color: "#C9542A",
        sec_note_zh: "已审核。", sec_note_en: "Reviewed." }],
    });
    expect(site.entries[0].description_zh).toBe("问候。");
  });
});
