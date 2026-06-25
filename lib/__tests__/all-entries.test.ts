import { describe, it, expect } from "vitest";
import { allEntries } from "@/lib/site";
import { getAll } from "@/lib/catalog";
import { getAllContent } from "@/lib/content";

describe("allEntries", () => {
  it("unions install and content catalogs, install first", () => {
    const all = allEntries();
    expect(all.length).toBe(getAll().length + getAllContent().length);
    // install entries lead (skill|plugin|mcp), content (prompt|workflow) trails
    expect(all.slice(0, getAll().length).every((e) => e.kind === "skill" || e.kind === "plugin" || e.kind === "mcp")).toBe(true);
  });
});
