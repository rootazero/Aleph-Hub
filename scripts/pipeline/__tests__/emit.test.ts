import { describe, it, expect } from "vitest";
import { buildArtifacts, contentHash, floorGate } from "@/scripts/pipeline/emit";
import { validateArtifact } from "@/contract/schema";
import { validateSiteCatalog } from "@/contract/site";
import type { FinalEntry } from "@/scripts/pipeline/model";

function fe(over: Partial<FinalEntry> = {}): FinalEntry {
  return {
    id: "aleph-hub:acme/foo", repo_url: "https://github.com/acme/foo", via: "github:acme",
    full_name: "acme/foo", owner: "acme", repo: "foo", kind: "mcp", name: "foo", author: "acme",
    category: "developer", tags: ["a"], install_spec: { type: "git_dir", git_url: "https://github.com/acme/foo" },
    description_en: "A tool.", description_zh: "工具。", long_en: "Long.", long_zh: "长。",
    sec_note_en: "Reviewed.", sec_note_zh: "已审核。", requires_config: false,
    stars: 10, license: "MIT", updated: "2026-06-01", trend: null, spark: [], cover_color: "#C9542A",
    install_cmd: "aleph add foo", trust_tier: "verified", ...over,
  };
}
const many = (n: number) => Array.from({ length: n }, (_, i) => fe({ id: `aleph-hub:acme/foo${i}`, repo_url: `https://github.com/acme/foo${i}`, full_name: `acme/foo${i}`, repo: `foo${i}`, install_spec: { type: "git_dir", git_url: `https://github.com/acme/foo${i}` } }));

describe("emit", () => {
  it("builds artifacts that pass both validators with English-canonical description", () => {
    const { catalog, site } = buildArtifacts({ entries: many(10), generatedAt: "2026-06-20T00:00:00Z", prevContractCount: 10 });
    const art = validateArtifact(catalog);
    const s = validateSiteCatalog(site);
    expect(art.entries).toHaveLength(10);
    expect(s.entries).toHaveLength(10);
    expect(art.entries[0].description).toBe(s.entries[0].description_en);
    // contract artifact carries NO display fields
    expect((art.entries[0] as Record<string, unknown>).stars).toBeUndefined();
  });
  it("floorGate throws below the absolute minimum", () => {
    expect(() => floorGate(2, 10)).toThrow();
  });
  it("floorGate throws on a too-large drop vs previous", () => {
    expect(() => floorGate(9, 100)).toThrow(); // 91% drop > MAX_DROP_PCT
  });
  it("contentHash is stable regardless of key order", () => {
    expect(contentHash({ a: 1, b: 2 })).toBe(contentHash({ b: 2, a: 1 }));
  });
});
