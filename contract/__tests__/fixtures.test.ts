import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { validateArtifact } from "@/contract/schema";
import { validateSiteCatalog } from "@/contract/site";

const read = (p: string) => JSON.parse(readFileSync(p, "utf8"));

describe("fixtures", () => {
  it("public/catalog.json is a valid contract artifact", () => {
    const art = validateArtifact(read("public/catalog.json"));
    // count is pipeline-driven; assert it's non-empty and consistent with the manifest
    expect(art.entries.length).toBeGreaterThan(0);
    expect(art.entries.length).toBe(art.manifest.entry_count);
    expect(art.manifest.hub_id).toBe("aleph-hub");
    for (const e of art.entries) {
      expect(e.id.startsWith("aleph-hub:")).toBe(true);
      // Real upstream (铁律): usually a GitHub repo, but an official package-registry page
      // is allowed when the vendor ships no public source repo (e.g. 高德's @amap npm package).
      expect(e.repo_url).toMatch(/^https:\/\/(github\.com|www\.npmjs\.com)\//);
      expect(e.install_spec.type).not.toBe("oci_image"); // producer never emits OCI
    }
  });
  it("data/site-catalog.json is a valid site catalog with the same ids as the contract", () => {
    const site = validateSiteCatalog(read("data/site-catalog.json"));
    const contract = validateArtifact(read("public/catalog.json"));
    expect(site.entries.map((e) => e.id).sort()).toEqual(contract.entries.map((e) => e.id).sort());
  });
  it("catalog.json description matches site description_en (English canonical)", () => {
    const site = validateSiteCatalog(read("data/site-catalog.json"));
    const contract = validateArtifact(read("public/catalog.json"));
    const byId = new Map(site.entries.map((e) => [e.id, e]));
    for (const e of contract.entries) expect(e.description).toBe(byId.get(e.id)!.description_en);
  });
});
