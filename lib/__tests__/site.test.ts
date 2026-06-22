import { describe, it, expect } from "vitest";
import { isContent, slugForAny, allSlugs, anyBySlug, buildBySlug } from "@/lib/site";
import { getAll, slugForEntry } from "@/lib/catalog";
import { getContentByKind, slugForContent } from "@/lib/content";
import type { SiteEntryT } from "@/contract/site";
import type { ContentSiteEntryT } from "@/contract/content-site";

describe("lib/site", () => {
  it("resolves an install slug to its install entry", () => {
    const e = getAll()[0];
    const found = anyBySlug(slugForEntry(e));
    expect(found?.id).toBe(e.id);
    expect(isContent(found!)).toBe(false);
  });
  it("resolves a content slug to its content entry", () => {
    const e = getContentByKind("prompt")[0];
    const found = anyBySlug(slugForContent(e));
    expect(found?.id).toBe(e.id);
    expect(isContent(found!)).toBe(true);
  });
  it("slugForAny round-trips through anyBySlug for both families", () => {
    const install = getAll()[0];
    const content = getContentByKind("prompt")[0];
    expect(anyBySlug(slugForAny(install))?.id).toBe(install.id);
    expect(anyBySlug(slugForAny(content))?.id).toBe(content.id);
  });
  it("allSlugs covers install (2-seg) and content (3-seg) entries", () => {
    const slugs = allSlugs();
    expect(slugs.some((s) => s.length === 2)).toBe(true);
    expect(slugs.some((s) => s.length === 3)).toBe(true);
  });
  it("fails loud when a content slug would shadow a 3-segment install slug", () => {
    // install ids are NOT always 2 segments (multi-skill repos: owner/repo/skill),
    // so an install "a/b/c" and a content "a/b#c" both forward to slug "a/b/c".
    const inst = { id: "aleph-hub:a/b/c", kind: "skill" } as unknown as SiteEntryT;
    const collide = { id: "aleph-hub:a/b#c", kind: "prompt" } as unknown as ContentSiteEntryT;
    const safe = { id: "aleph-hub:a/b#d", kind: "prompt" } as unknown as ContentSiteEntryT;
    expect(() => buildBySlug([inst], [collide])).toThrow(/collides/);
    expect(() => buildBySlug([inst], [safe])).not.toThrow();
  });
});
