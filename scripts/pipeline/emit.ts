import { createHash } from "node:crypto";
import { CONFIG } from "@/scripts/pipeline/config";
import type { FinalEntry } from "@/scripts/pipeline/model";
import type { HubCatalogEntryT } from "@/contract/types";
import type { SiteEntryT } from "@/contract/site";

function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_k, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, (v as Record<string, unknown>)[k]]))
      : v);
}
export function contentHash(obj: unknown): string {
  return "sha256:" + createHash("sha256").update(stableStringify(obj)).digest("hex");
}

export function floorGate(newCount: number, prevCount: number): void {
  if (newCount < CONFIG.MIN_ENTRIES) throw new Error(`floor gate: ${newCount} < MIN_ENTRIES ${CONFIG.MIN_ENTRIES}`);
  if (prevCount > 0 && newCount < prevCount * (1 - CONFIG.MAX_DROP_PCT)) {
    throw new Error(`floor gate: ${newCount} drops >${CONFIG.MAX_DROP_PCT * 100}% from ${prevCount}`);
  }
}

function toContractEntry(e: FinalEntry): HubCatalogEntryT {
  return {
    id: e.id, kind: e.kind, category: e.category, name: e.name, description: e.description_en,
    repo_url: e.repo_url, trust_tier: e.trust_tier, install_spec: e.install_spec,
    requires_config: e.requires_config, author: e.author, tags: e.tags, via: e.via,
  };
}
function toSiteEntry(e: FinalEntry): SiteEntryT {
  return {
    ...toContractEntry(e),
    description_zh: e.description_zh, description_en: e.description_en,
    long_zh: e.long_zh, long_en: e.long_en, cover_color: e.cover_color, stars: e.stars,
    trend: e.trend, spark: e.spark, license: e.license, updated: e.updated,
    install_cmd: e.install_cmd, sec_note_zh: e.sec_note_zh, sec_note_en: e.sec_note_en,
  };
}

export interface BuildInput { entries: FinalEntry[]; generatedAt: string; prevContractCount: number; }

export function buildArtifacts(input: BuildInput): { catalog: unknown; site: unknown; hash: string } {
  floorGate(input.entries.length, input.prevContractCount);
  const manifestBase = { schema_version: 1, hub_id: "aleph-hub", name: "Aleph Hub", entry_count: input.entries.length };
  const catalogEntries = input.entries.map(toContractEntry);
  const hash = contentHash(catalogEntries);
  const manifest = { ...manifestBase, generated_at: input.generatedAt, content_hash: hash };
  return {
    catalog: { manifest, entries: catalogEntries },
    site: { manifest, entries: input.entries.map(toSiteEntry) },
    hash,
  };
}
