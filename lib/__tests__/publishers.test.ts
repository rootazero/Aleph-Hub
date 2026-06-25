import { describe, it, expect } from "vitest";
import {
  slugifyAuthor, groupPublishers, publishersIndex,
  publisherBySlug, publisherSlug, allPublisherSlugs,
} from "@/lib/publishers";
import type { AnySiteEntry } from "@/lib/site";
import { allEntries } from "@/lib/site";

// Minimal install-shaped entry (has `stars`).
const mkInstall = (over: Partial<AnySiteEntry> & { author?: string }): AnySiteEntry =>
  ({ id: "aleph-hub:o/r", name: "n", author: "A", stars: 0,
     repo_url: "https://github.com/o/r", trust_tier: "community", kind: "skill",
     ...over } as unknown as AnySiteEntry);

// Minimal content-shaped entry (NO `stars` key, so the sort treats it as -1).
const mkContent = (over: Partial<AnySiteEntry> & { author?: string }): AnySiteEntry =>
  ({ id: "aleph-hub:o/r#u", name: "n", author: "A",
     repo_url: "https://github.com/o/r", trust_tier: "community", kind: "prompt",
     source_path: "p.md", format: "markdown", ...over } as unknown as AnySiteEntry);

describe("slugifyAuthor", () => {
  it("lowercases and url-safes ascii authors", () => {
    expect(slugifyAuthor("MiniMax")).toBe("minimax");
    expect(slugifyAuthor("op7418")).toBe("op7418");
  });
  it("drops CJK + punctuation, keeps the ascii tail", () => {
    expect(slugifyAuthor("高德 AutoNavi")).toBe("autonavi");
    expect(slugifyAuthor("火山引擎 ByteDance")).toBe("bytedance");
  });
  it("returns empty string for pure non-ascii", () => {
    expect(slugifyAuthor("高德")).toBe("");
  });
});

describe("groupPublishers", () => {
  it("merges one author across different repo owners into a single publisher", () => {
    const groups = groupPublishers([
      mkInstall({ id: "aleph-hub:rootazero/Aleph-skills/a", author: "rootazero", repo_url: "https://github.com/rootazero/Aleph-skills" }),
      mkInstall({ id: "aleph-hub:siliconflow/x", author: "rootazero", repo_url: "https://github.com/rootazero/Aleph-mcp" }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe("rootazero");
    expect(groups[0].entries).toHaveLength(2);
  });
  it("keeps distinct authors separate even when repo owner != author", () => {
    const groups = groupPublishers([
      mkInstall({ author: "Upstash", repo_url: "https://github.com/upstash/context7" }),
      mkInstall({ author: "MiniMax", repo_url: "https://github.com/MiniMax-AI/MiniMax-MCP" }),
    ]);
    expect(groups.map((g) => g.name).sort()).toEqual(["MiniMax", "Upstash"]);
  });
  it("skips entries with no author", () => {
    const groups = groupPublishers([mkInstall({ author: undefined })]);
    expect(groups).toHaveLength(0);
  });
  it("disambiguates colliding slugs deterministically", () => {
    const groups = groupPublishers([
      mkInstall({ author: "Acme Co", repo_url: "https://github.com/acme/a" }),
      mkInstall({ author: "acme-co", repo_url: "https://github.com/acme2/b" }),
    ]);
    const slugs = groups.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toContain("acme-co");
    expect(slugs).toContain("acme-co-2");
  });
  it("sorts install entries (with stars) before content (without)", () => {
    const groups = groupPublishers([
      mkContent({ author: "A", id: "aleph-hub:a/r#p" }),
      mkInstall({ author: "A", stars: 10, id: "aleph-hub:a/s" }),
    ]);
    expect(groups[0].entries[0].id).toBe("aleph-hub:a/s");
  });
  it("derives the github org homepage", () => {
    const [g] = groupPublishers([mkInstall({ author: "Up", repo_url: "https://github.com/upstash/context7" })]);
    expect(g.homepage).toBe("https://github.com/upstash");
  });
  it("falls back to the origin for non-github repo urls", () => {
    const [g] = groupPublishers([mkInstall({ author: "AM", repo_url: "https://www.npmjs.com/package/@amap/amap-maps-mcp-server" })]);
    expect(g.homepage).toBe("https://www.npmjs.com");
  });
});

describe("publishersIndex (real catalog invariants)", () => {
  const idx = publishersIndex();
  const authored = allEntries().filter((e) => e.author);

  it("has exactly one publisher per distinct author", () => {
    expect(idx.length).toBe(new Set(authored.map((e) => e.author)).size);
  });
  it("entry counts sum to the authored-entry total", () => {
    expect(idx.reduce((n, p) => n + p.entries.length, 0)).toBe(authored.length);
  });
  it("slugs are unique and equal allPublisherSlugs", () => {
    const slugs = idx.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect([...allPublisherSlugs()].sort()).toEqual([...slugs].sort());
  });
  it("publisherSlug round-trips back to the same publisher", () => {
    for (const p of idx) {
      expect(publisherBySlug(publisherSlug(p.name))?.slug).toBe(p.slug);
    }
  });
  it("returns undefined for an unknown slug", () => {
    expect(publisherBySlug("definitely-not-a-publisher-zzz")).toBeUndefined();
  });
});
