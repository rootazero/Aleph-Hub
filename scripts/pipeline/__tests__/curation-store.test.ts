import { describe, it, expect } from "vitest";
import { makeCurationStore } from "@/scripts/pipeline/adapters";

const DIR = "scripts/pipeline/__tests__/fixtures/curation";

describe("makeCurationStore", () => {
  it("loads committed records and looks them up case-insensitively", () => {
    const store = makeCurationStore(DIR);
    const rec = store.get("Acme/Foo");
    expect(rec).not.toBeNull();
    expect(rec!.name).toBe("Acme Foo");
    expect(rec!.kind).toBe("mcp");
  });
  it("returns null for an unknown repo", () => {
    expect(makeCurationStore(DIR).get("nobody/nothing")).toBeNull();
  });
  it("all() returns every loaded record", () => {
    expect(makeCurationStore(DIR).all().map((r) => r.full_name)).toContain("acme/foo");
  });
  it("getForRepo() returns every record for a multi-skill collection repo", () => {
    const recs = makeCurationStore(DIR).getForRepo("acme/skills");
    expect(recs.map((r) => r.slug).sort()).toEqual(["alpha", "beta"]);
  });
  it("getForRepo() returns a single record for a bare repo, and [] for unknown", () => {
    const store = makeCurationStore(DIR);
    expect(store.getForRepo("acme/foo").map((r) => r.name)).toEqual(["Acme Foo"]);
    expect(store.getForRepo("nobody/nothing")).toEqual([]);
  });
  it("returns an empty store when the directory is absent", () => {
    expect(makeCurationStore("scripts/pipeline/__tests__/fixtures/does-not-exist").get("a/b")).toBeNull();
  });
});
