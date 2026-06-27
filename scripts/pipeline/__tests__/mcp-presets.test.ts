import { describe, it, expect } from "vitest";
import { loadMcpPresets } from "@/scripts/pipeline/mcp-presets";
import { makeAdapters } from "@/scripts/pipeline/adapters";
import { HubCatalogEntry } from "@/contract/schema";
import type { FinalEntry } from "@/scripts/pipeline/model";
import type { FileStore } from "@/scripts/pipeline/ports";

// Mirror emit.ts's toContractEntry (internal) so we can assert the shipped seed projects
// to a contract-valid entry — the real safety net against a typo in mcp-presets.json.
function toContractEntry(e: FinalEntry) {
  return {
    id: e.id, kind: e.kind, category: e.category, name: e.name, description: e.description_en,
    repo_url: e.repo_url, trust_tier: e.trust_tier, install_spec: e.install_spec,
    requires_config: e.requires_config, author: e.author, tags: e.tags, via: e.via,
  };
}

describe("loadMcpPresets", () => {
  const { fs } = makeAdapters();
  const presets = loadMcpPresets(fs);
  const byId = new Map(presets.map((p) => [p.id, p]));

  it("loads the five official MCP presets", () => {
    expect(presets).toHaveLength(5);
    expect(new Set(presets.map((p) => p.id)).size).toBe(5); // ids unique
    for (const p of presets) {
      expect(p.kind).toBe("mcp");
      expect(p.trust_tier).toBe("official");
      expect(p.id.startsWith("aleph-hub:")).toBe(true);
    }
  });

  it("projects every preset to a contract-valid HubCatalogEntry", () => {
    for (const p of presets) {
      expect(() => HubCatalogEntry.parse(toContractEntry(p))).not.toThrow();
    }
  });

  // Cross-repo id contract: ids are the Aleph catalog.json preset slugs (aleph-hub:<slug>),
  // matching the primer projection in Aleph src/hub/official_mcp.rs — NOT aleph-hub:<full_name>.
  it("ids are the Aleph preset slugs (cross-repo install-state contract)", () => {
    expect(new Set(presets.map((p) => p.id))).toEqual(
      new Set([
        "aleph-hub:context7",
        "aleph-hub:zhipu-vision",
        "aleph-hub:amap",
        "aleph-hub:minimax",
        "aleph-hub:volcengine-veimagex",
      ]),
    );
  });

  it("context7 is a zero-config remote endpoint", () => {
    const c = byId.get("aleph-hub:context7")!;
    expect(c.install_spec.type).toBe("mcp_remote");
    expect(c.requires_config).toBe(false);
  });

  it("keyed stdio presets require config and carry env declarations", () => {
    for (const id of ["aleph-hub:zhipu-vision", "aleph-hub:amap", "aleph-hub:minimax", "aleph-hub:volcengine-veimagex"]) {
      const e = byId.get(id)!;
      expect(e.install_spec.type).toBe("mcp_stdio");
      expect(e.requires_config).toBe(true);
      if (e.install_spec.type === "mcp_stdio") expect(e.install_spec.env.length).toBeGreaterThan(0);
    }
  });

  it("amap provenance points at the official npm package (no GitHub repo)", () => {
    const a = byId.get("aleph-hub:amap")!;
    expect(a.repo_url).toBe("https://www.npmjs.com/package/@amap/amap-maps-mcp-server");
  });

  it("returns [] when the seed is absent", () => {
    const emptyFs = { readJson: () => null } as unknown as FileStore;
    expect(loadMcpPresets(emptyFs)).toEqual([]);
  });
});
