import { describe, it, expect } from "vitest";
import { getAll, getByKind, getById, bySlug, slugForEntry, idFromSlug, trending, related, formatStars, kindCounts } from "@/lib/catalog";

// These assert the data layer's INVARIANTS against whatever catalog is committed,
// not specific entries — the catalog is pipeline-generated and refreshes over time.
describe("catalog data layer", () => {
  const all = getAll();

  it("loads a non-empty validated catalog", () => {
    expect(all.length).toBeGreaterThan(0);
  });
  it("filters by kind", () => {
    expect(getByKind("mcp").every((e) => e.kind === "mcp")).toBe(true);
  });
  it("slug round-trips through id and strips the hub prefix", () => {
    const e = all[0];
    expect(idFromSlug(slugForEntry(e))).toBe(e.id);
    expect(bySlug(slugForEntry(e))?.id).toBe(e.id);
    // slug is "owner/repo" — the hub prefix is stripped
    expect(slugForEntry(e)).toBe(e.id.replace(/^aleph-hub:/, ""));
    expect(slugForEntry(e).startsWith("aleph-hub:")).toBe(false);
  });
  it("getById returns the entry, undefined for an unknown id", () => {
    const e = all[0];
    expect(getById(e.id)?.id).toBe(e.id);
    expect(getById("aleph-hub:does/not-exist")).toBeUndefined();
  });
  it("trending sorts by trend desc and respects n", () => {
    const t = trending(3);
    expect(t.length).toBeLessThanOrEqual(3);
    expect(t.length).toBeLessThanOrEqual(all.length);
    for (let i = 1; i < t.length; i++) {
      expect(t[i - 1].trend ?? 0).toBeGreaterThanOrEqual(t[i].trend ?? 0);
    }
  });
  it("related uses category and excludes self", () => {
    const e = all[0];
    const rel = related(e, 3);
    expect(rel.length).toBeLessThanOrEqual(3);
    expect(rel.every((r) => r.category === e.category && r.id !== e.id)).toBe(true);
  });
  it("formatStars compacts thousands", () => {
    expect(formatStars(34000)).toBe("34k");
    expect(formatStars(950)).toBe("950");
  });
  it("kindCounts counts per kind and sums to the catalog size", () => {
    const c = kindCounts();
    expect(c.mcp + c.skill + c.plugin).toBe(all.length);
  });
});
