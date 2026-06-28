import { describe, it, expect } from "vitest";
import {
  slugifyTag, groupTags, tagsIndex,
  tagBySlug, tagSlug, allTagSlugs,
} from "@/lib/tags";
import type { AnySiteEntry } from "@/lib/site";
import { allEntries } from "@/lib/site";

// Minimal install-shaped entry (has `stars`).
const mkInstall = (over: Partial<AnySiteEntry> & { tags?: string[] }): AnySiteEntry =>
  ({ id: "aleph-hub:o/r", name: "n", author: "A", stars: 0, tags: [],
     repo_url: "https://github.com/o/r", trust_tier: "community", kind: "skill",
     ...over } as unknown as AnySiteEntry);

// Minimal content-shaped entry (NO `stars` key, so the sort treats it as -1).
const mkContent = (over: Partial<AnySiteEntry> & { tags?: string[] }): AnySiteEntry =>
  ({ id: "aleph-hub:o/r#u", name: "n", author: "A", tags: [],
     repo_url: "https://github.com/o/r", trust_tier: "community", kind: "prompt",
     source_path: "p.md", format: "markdown", ...over } as unknown as AnySiteEntry);

describe("slugifyTag", () => {
  it("is identity for lowercase ascii/hyphen tags", () => {
    expect(slugifyTag("video")).toBe("video");
    expect(slugifyTag("landing-page")).toBe("landing-page");
  });
  it("lowercases and url-safes mixed input", () => {
    expect(slugifyTag("CI/CD")).toBe("ci-cd");
    expect(slugifyTag("Image Gen")).toBe("image-gen");
  });
  it("returns empty string for pure non-ascii", () => {
    expect(slugifyTag("中文")).toBe("");
  });
});

describe("groupTags", () => {
  it("places one entry under every tag it carries", () => {
    const groups = groupTags([mkInstall({ id: "aleph-hub:o/x", tags: ["video", "design"] })]);
    expect(groups.map((g) => g.name).sort()).toEqual(["design", "video"]);
    expect(groups.every((g) => g.entries.length === 1)).toBe(true);
  });
  it("merges entries sharing a tag (across install + content)", () => {
    const groups = groupTags([
      mkInstall({ id: "aleph-hub:o/a", tags: ["video"] }),
      mkContent({ id: "aleph-hub:o/b#u", tags: ["video"] }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe("video");
    expect(groups[0].entries).toHaveLength(2);
  });
  it("normalizes case so variants merge and don't double-count one entry", () => {
    const groups = groupTags([mkInstall({ id: "aleph-hub:o/a", tags: ["Video", "video"] })]);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe("video");
    expect(groups[0].entries).toHaveLength(1);
  });
  it("skips entries with no tags", () => {
    expect(groupTags([mkInstall({ tags: [] })])).toHaveLength(0);
  });
  it("disambiguates colliding slugs deterministically", () => {
    const groups = groupTags([mkInstall({ id: "aleph-hub:o/a", tags: ["ci/cd", "ci-cd"] })]);
    const slugs = groups.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toContain("ci-cd");
    expect(slugs).toContain("ci-cd-2");
  });
  it("sorts install entries (with stars) before content (without)", () => {
    const groups = groupTags([
      mkContent({ id: "aleph-hub:a/r#p", tags: ["x"] }),
      mkInstall({ id: "aleph-hub:a/s", stars: 10, tags: ["x"] }),
    ]);
    expect(groups[0].entries[0].id).toBe("aleph-hub:a/s");
  });
});

describe("tagsIndex (real catalog invariants)", () => {
  const idx = tagsIndex();
  const distinct = new Set(
    allEntries().flatMap((e) => (e.tags ?? []).map((t) => t.toLowerCase().trim()).filter(Boolean)),
  );

  it("has exactly one tag group per distinct (lowercased) tag", () => {
    expect(idx.length).toBe(distinct.size);
  });
  it("every group is non-empty", () => {
    expect(idx.every((t) => t.entries.length > 0)).toBe(true);
  });
  it("slugs are unique and equal allTagSlugs", () => {
    const slugs = idx.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect([...allTagSlugs()].sort()).toEqual([...slugs].sort());
  });
  it("tagSlug round-trips back to the same tag", () => {
    for (const t of idx) {
      expect(tagBySlug(tagSlug(t.name))?.slug).toBe(t.slug);
    }
  });
  it("returns undefined for an unknown slug", () => {
    expect(tagBySlug("definitely-not-a-tag-zzz")).toBeUndefined();
  });
});
