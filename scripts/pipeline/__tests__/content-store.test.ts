import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeContentCurationStore } from "@/scripts/pipeline/adapters";

function fixtureDir(records: object[]): string {
  const dir = mkdtempSync(join(tmpdir(), "content-curation-"));
  records.forEach((r, i) => writeFileSync(join(dir, `rec-${i}.json`), JSON.stringify(r)));
  writeFileSync(join(dir, "not-json.txt"), "ignored");
  return dir;
}

describe("makeContentCurationStore", () => {
  it("loads records keyed by id and lists all", () => {
    const dir = fixtureDir([
      { id: "aleph-hub:acme/p#a", full_name: "acme/p", slug: "a", name: "A" },
      { id: "aleph-hub:acme/p#b", full_name: "acme/p", slug: "b", name: "B" },
    ]);
    const store = makeContentCurationStore(dir);
    expect(store.get("aleph-hub:acme/p#a")?.name).toBe("A");
    expect(store.get("missing")).toBeNull();
    expect(store.all()).toHaveLength(2);
  });
  it("returns an empty store for a missing dir", () => {
    const store = makeContentCurationStore(join(tmpdir(), "does-not-exist-xyz"));
    expect(store.all()).toEqual([]);
  });
});
