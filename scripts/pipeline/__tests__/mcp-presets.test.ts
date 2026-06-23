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

  it("loads the four official MCP presets", () => {
    expect(presets).toHaveLength(4);
    expect(new Set(presets.map((p) => p.id)).size).toBe(4); // ids unique
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

  it("context7 is a zero-config remote endpoint", () => {
    const c = byId.get("aleph-hub:upstash/context7")!;
    expect(c.install_spec.type).toBe("mcp_remote");
    expect(c.requires_config).toBe(false);
  });

  it("keyed stdio presets require config and carry env declarations", () => {
    for (const id of ["aleph-hub:amap/amap-maps-mcp-server", "aleph-hub:MiniMax-AI/MiniMax-MCP", "aleph-hub:volcengine/mcp-server/veimagex"]) {
      const e = byId.get(id)!;
      expect(e.install_spec.type).toBe("mcp_stdio");
      expect(e.requires_config).toBe(true);
      if (e.install_spec.type === "mcp_stdio") expect(e.install_spec.env.length).toBeGreaterThan(0);
    }
  });

  it("amap provenance points at the official npm package (no GitHub repo)", () => {
    const a = byId.get("aleph-hub:amap/amap-maps-mcp-server")!;
    expect(a.repo_url).toBe("https://www.npmjs.com/package/@amap/amap-maps-mcp-server");
  });

  it("returns [] when the seed is absent", () => {
    const emptyFs = { readJson: () => null } as unknown as FileStore;
    expect(loadMcpPresets(emptyFs)).toEqual([]);
  });
});
