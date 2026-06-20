import { describe, it, expect } from "vitest";
import { HubCatalogEntry, validateArtifact } from "@/contract/schema";

const goodEntry = {
  id: "aleph-hub:acme/foo", kind: "mcp", category: "developer",
  name: "Acme Foo", description: "A tool.",
  repo_url: "https://github.com/acme/foo", trust_tier: "verified",
  install_spec: { type: "mcp_stdio", command: "npx", args: ["@acme/foo"] },
};

describe("entry + artifact", () => {
  it("parses a good entry with defaults", () => {
    const e = HubCatalogEntry.parse(goodEntry);
    expect(e).toMatchObject({ requires_config: false, tags: [] });
  });
  it("rejects an entry missing repo_url (mandatory in our contract)", () => {
    const { repo_url, ...noRepo } = goodEntry;
    expect(() => HubCatalogEntry.parse(noRepo)).toThrow();
  });
  it("rejects an entry with a bad category", () => {
    expect(() => HubCatalogEntry.parse({ ...goodEntry, category: "misc" })).toThrow();
  });
  it("validateArtifact accepts a valid artifact", () => {
    const art = validateArtifact({
      manifest: { schema_version: 1, hub_id: "aleph-hub", name: "Aleph Hub" },
      entries: [goodEntry],
    });
    expect(art.entries).toHaveLength(1);
  });
  it("validateArtifact rejects schema_version != number / missing entries", () => {
    expect(() => validateArtifact({ manifest: { schema_version: 1, hub_id: "x", name: "y" } })).toThrow();
  });
});
