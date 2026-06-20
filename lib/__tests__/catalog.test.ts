import { describe, it, expect } from "vitest";
import { getAll, getByKind, getById, bySlug, slugForEntry, idFromSlug, trending, related, formatStars, kindCounts } from "@/lib/catalog";

describe("catalog data layer", () => {
  it("loads 12 validated entries", () => { expect(getAll()).toHaveLength(12); });
  it("filters by kind", () => { expect(getByKind("mcp").every((e) => e.kind === "mcp")).toBe(true); });
  it("slug round-trips through id and strips the hub prefix", () => {
    const e = getAll()[0];
    expect(idFromSlug(slugForEntry(e))).toBe(e.id);
    expect(bySlug(slugForEntry(e))?.id).toBe(e.id);
    // pin the exact slug shape ("owner/repo", no prefix)
    expect(slugForEntry(getById("aleph-hub:block/goose")!)).toBe("block/goose");
  });
  it("getById returns the entry", () => {
    expect(getById("aleph-hub:block/goose")?.name).toBe("goose");
  });
  it("trending sorts by trend desc and respects n", () => {
    const t = trending(3);
    expect(t).toHaveLength(3);
    // ordering, not just length (fixture trend: goose 29 > langgraph 26 > servers 24)
    expect(t.map((e) => e.name)).toEqual(["goose", "langgraph", "servers"]);
    expect(t[0].trend!).toBeGreaterThanOrEqual(t[1].trend!);
  });
  it("related uses category and excludes self", () => {
    const goose = getById("aleph-hub:block/goose")!; // category: developer
    const rel = related(goose, 3);
    expect(rel.every((e) => e.category === "developer" && e.id !== goose.id)).toBe(true);
  });
  it("formatStars compacts thousands", () => {
    expect(formatStars(34000)).toBe("34k");
    expect(formatStars(950)).toBe("950");
  });
  it("kindCounts counts per kind", () => {
    const c = kindCounts();
    expect(c.mcp + c.skill + c.plugin).toBe(12);
  });
});
