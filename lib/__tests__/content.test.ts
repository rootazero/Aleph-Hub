import { describe, it, expect } from "vitest";
import { getAllContent, getContentByKind, slugForContent, contentKindCounts, relatedContent } from "@/lib/content";

describe("lib/content", () => {
  it("loads content entries and filters by kind", () => {
    expect(getAllContent().length).toBeGreaterThan(0);
    const prompts = getContentByKind("prompt");
    expect(prompts.length).toBeGreaterThan(0);
    expect(prompts.every((e) => e.kind === "prompt")).toBe(true);
  });
  it("maps a content id to a path-safe slug (# -> /)", () => {
    const e = getContentByKind("prompt")[0];
    const slug = slugForContent(e);
    expect(slug.includes("#")).toBe(false);
    expect(slug).toBe(e.id.replace(/^aleph-hub:/, "").replace("#", "/"));
    // owner/repo/unit => 3 segments
    expect(slug.split("/").length).toBe(3);
  });
  it("counts kinds and never mutates inputs", () => {
    const counts = contentKindCounts();
    expect(counts.prompt).toBe(getContentByKind("prompt").length);
    expect(typeof counts.workflow).toBe("number");
  });
  it("related excludes self", () => {
    const e = getContentByKind("prompt")[0];
    expect(relatedContent(e, 3).every((r) => r.id !== e.id)).toBe(true);
  });
});
