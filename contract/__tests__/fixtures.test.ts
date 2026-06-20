import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { validateArtifact } from "@/contract/schema";
import { validateSiteCatalog } from "@/contract/site";

const read = (p: string) => JSON.parse(readFileSync(p, "utf8"));

describe("fixtures", () => {
  it("public/catalog.json is a valid contract artifact", () => {
    const art = validateArtifact(read("public/catalog.json"));
    expect(art.entries.length).toBe(12);
    expect(art.manifest.hub_id).toBe("aleph-hub");
    for (const e of art.entries) {
      expect(e.id.startsWith("aleph-hub:")).toBe(true);
      expect(e.repo_url).toMatch(/^https:\/\/github\.com\//);
      expect(e.install_spec.type).not.toBe("oci_image"); // producer never emits OCI
    }
  });
  it("data/site-catalog.json is a valid site catalog with the same 12 ids", () => {
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
