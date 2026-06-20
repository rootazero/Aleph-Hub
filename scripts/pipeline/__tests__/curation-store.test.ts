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
  it("returns an empty store when the directory is absent", () => {
    expect(makeCurationStore("scripts/pipeline/__tests__/fixtures/does-not-exist").get("a/b")).toBeNull();
  });
});
