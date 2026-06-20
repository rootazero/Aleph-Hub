import { describe, it, expect } from "vitest";
import { trustTier } from "@/scripts/pipeline/trust";
import type { RepoMeta } from "@/scripts/pipeline/ports";

const NOW = "2026-06-20T00:00:00Z";
const official = new Set(["anthropic", "microsoft"]);
function meta(over: Partial<RepoMeta> = {}): RepoMeta {
  return { full_name: "acme/foo", owner: "acme", repo: "foo", stars: 1000, license: "MIT", pushed_at: "2026-06-01T00:00:00Z", fork: false, source_full_name: null, default_branch: "main", ...over };
}

describe("trustTier", () => {
  it("official for an org in the official set with a verified spec", () => {
    expect(trustTier({ owner: "microsoft", meta: meta({ owner: "microsoft" }), specVerified: true, officialOrgs: official, nowIso: NOW })).toBe("official");
  });
  it("NOT official for an official org when the spec is unverified (§6.5 铁律)", () => {
    expect(trustTier({ owner: "microsoft", meta: meta({ owner: "microsoft" }), specVerified: false, officialOrgs: official, nowIso: NOW })).toBe("unverified");
  });
  it("verified when spec verified + stars + active + license", () => {
    expect(trustTier({ owner: "acme", meta: meta(), specVerified: true, officialOrgs: official, nowIso: NOW })).toBe("verified");
  });
  it("never verified when the spec is not verified, even with high stars", () => {
    expect(trustTier({ owner: "acme", meta: meta({ stars: 99999 }), specVerified: false, officialOrgs: official, nowIso: NOW })).toBe("unverified");
  });
  it("community when verified spec but below the verified bar (low stars)", () => {
    expect(trustTier({ owner: "acme", meta: meta({ stars: 3 }), specVerified: true, officialOrgs: official, nowIso: NOW })).toBe("community");
  });
  it("unverified when no license and stale", () => {
    expect(trustTier({ owner: "acme", meta: meta({ license: null, stars: 1, pushed_at: "2023-01-01T00:00:00Z" }), specVerified: false, officialOrgs: official, nowIso: NOW })).toBe("unverified");
  });
});
