import { describe, it, expect } from "vitest";
import { slimContentQueue } from "@/scripts/pipeline/content-queue";
import type { ContentCandidate } from "@/scripts/pipeline/content-model";

const cand = (over: Partial<ContentCandidate> = {}): ContentCandidate => ({
  repo_url: "https://github.com/acme/prompts", owner: "acme", repo: "prompts",
  source_path: "p/a.md", slug: "a", kind: "prompt", via: "github:acme",
  readme: "readme", raw: { text: "body" }, ...over,
});
const idOf = (c: ContentCandidate) => `aleph-hub:${c.owner}/${c.repo}#${c.slug}`;
const OPTS = { cap: 3, bodyMax: 100, readmeChars: 5 };

describe("slimContentQueue", () => {
  it("caps the count to the buffer size", () => {
    const q = Array.from({ length: 10 }, (_, i) => cand({ slug: `s${i}` }));
    expect(slimContentQueue(q, new Set(), OPTS)).toHaveLength(3);
  });

  it("excludes already-rejected ids so they do not reclaim buffer slots", () => {
    const q = [cand({ slug: "a" }), cand({ slug: "b" }), cand({ slug: "c" })];
    const out = slimContentQueue(q, new Set([idOf(cand({ slug: "b" }))]), OPTS);
    expect(out.map((c) => c.slug)).toEqual(["a", "c"]);
  });

  it("drops candidates whose body exceeds bodyMax (they would fail curation anyway)", () => {
    const q = [cand({ slug: "ok", raw: { text: "x" } }), cand({ slug: "huge", raw: { text: "x".repeat(200) } })];
    expect(slimContentQueue(q, new Set(), OPTS).map((c) => c.slug)).toEqual(["ok"]);
  });

  it("truncates the README but keeps the body verbatim (provenance)", () => {
    const out = slimContentQueue([cand({ readme: "0123456789", raw: { text: "FULL BODY" } })], new Set(), OPTS);
    expect(out[0].readme).toBe("01234");
    expect(out[0].raw.text).toBe("FULL BODY");
  });

  it("does not mutate the input candidates", () => {
    const original = cand({ readme: "0123456789" });
    slimContentQueue([original], new Set(), OPTS);
    expect(original.readme).toBe("0123456789");
  });
});
