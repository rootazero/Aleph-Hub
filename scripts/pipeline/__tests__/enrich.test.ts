import { describe, it, expect } from "vitest";
import { enrich, nextHistory, coverColorFor } from "@/scripts/pipeline/enrich";
import type { RepoMeta } from "@/scripts/pipeline/ports";

const meta: RepoMeta = { full_name: "acme/foo", owner: "acme", repo: "foo", stars: 1200, license: "Apache-2.0", pushed_at: "2026-06-09T00:00:00Z", fork: false, source_full_name: null, default_branch: "main" };

describe("enrich", () => {
  it("first run has null trend and empty spark", () => {
    const e = enrich({ fullName: "acme/foo", meta, history: [], installCmd: "aleph add foo" });
    expect(e.trend).toBeNull();
    expect(e.spark).toEqual([]);
    expect(e.stars).toBe(1200);
    expect(e.license).toBe("Apache-2.0");
    expect(e.updated).toBe("2026-06-09");
  });
  it("computes week-over-week trend % from history", () => {
    const e = enrich({ fullName: "acme/foo", meta, history: [1000], installCmd: "aleph add foo" });
    expect(e.trend).toBe(20); // (1200-1000)/1000 = +20%
    expect(e.spark).toEqual([1000, 1200]);
  });
  it("coverColorFor is deterministic and from the palette", () => {
    expect(coverColorFor("acme/foo")).toBe(coverColorFor("acme/foo"));
    expect(coverColorFor("acme/foo")).toMatch(/^#[0-9A-F]{6}$/i);
  });
  it("nextHistory appends and is bounded", () => {
    const h = Array.from({ length: 20 }, (_, i) => i);
    expect(nextHistory(h, 99).length).toBeLessThanOrEqual(12);
    expect(nextHistory([1, 2], 3)).toEqual([1, 2, 3]);
  });
});
