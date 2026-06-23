import { describe, it, expect } from "vitest";
import { loadAlephMcp } from "@/scripts/pipeline/mcp-presets";
import { makeAdapters } from "@/scripts/pipeline/adapters";
import { HubCatalogEntry } from "@/contract/schema";
import type { FinalEntry } from "@/scripts/pipeline/model";
import type { FileStore } from "@/scripts/pipeline/ports";

// Mirror emit.ts's toContractEntry (internal) so we can assert the shipped seed projects
// to a contract-valid entry — the real safety net against a typo in aleph-mcp.json.
function toContractEntry(e: FinalEntry) {
  return {
    id: e.id, kind: e.kind, category: e.category, name: e.name, description: e.description_en,
    repo_url: e.repo_url, trust_tier: e.trust_tier, install_spec: e.install_spec,
    requires_config: e.requires_config, author: e.author, tags: e.tags, via: e.via,
  };
}

describe("loadAlephMcp", () => {
  const { fs } = makeAdapters();
  const entries = loadAlephMcp(fs);
  const byId = new Map(entries.map((p) => [p.id, p]));

  it("loads the first-party Aleph MCP servers", () => {
    expect(entries.length).toBeGreaterThanOrEqual(1);
    for (const p of entries) {
      expect(p.kind).toBe("mcp");
      expect(p.trust_tier).toBe("official");
      // First-party: same provenance badge as Aleph-skills / Aleph-plugins, NOT a vendor preset.
      expect(p.via).toBe("aleph-official");
      expect(p.repo_url.startsWith("https://github.com/rootazero/Aleph-mcp")).toBe(true);
    }
  });

  it("projects every entry to a contract-valid HubCatalogEntry", () => {
    for (const p of entries) {
      expect(() => HubCatalogEntry.parse(toContractEntry(p))).not.toThrow();
    }
  });

  it("siliconflow is a keyed stdio server requiring config", () => {
    const s = byId.get("aleph-hub:rootazero/Aleph-mcp/siliconflow")!;
    expect(s).toBeDefined();
    expect(s.install_spec.type).toBe("mcp_stdio");
    expect(s.requires_config).toBe(true);
    if (s.install_spec.type === "mcp_stdio") {
      const key = s.install_spec.env.find((v) => v.name === "SILICONFLOW_API_KEY");
      expect(key?.required).toBe(true);
      expect(key?.secret).toBe(true);
    }
    expect(s.install_cmd).toContain("uvx");
    expect(s.install_cmd).toContain("#subdirectory=siliconflow");
  });

  it("returns [] when the seed is absent", () => {
    const emptyFs = { readJson: () => null } as unknown as FileStore;
    expect(loadAlephMcp(emptyFs)).toEqual([]);
  });
});
