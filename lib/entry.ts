import type { ExtensionKindT, TrustTierT } from "@/contract/types";
import type { ContentKindT, ContentFormatT } from "@/contract/content-schema";

// Light per-card shape: ONLY the fields Card + the browse views actually read. Both
// the full catalog entries (SiteEntryT / ContentSiteEntryT) and the slim list
// projection (ListEntry) are structurally assignable to this, so Card renders either
// without forcing the heavy catalog JSON (body, long_*, install_spec) into a route's
// client bundle. The pure helpers below live here (not in lib/catalog|content|site)
// for the same reason: importing them must not drag the JSON modules client-side.
type CardBase = {
  id: string;
  name: string;
  author?: string;
  trust_tier: TrustTierT;
  description_zh: string;
  description_en: string;
};
export type CardInstall = CardBase & { kind: ExtensionKindT; stars: number; trend: number | null; spark: number[] };
export type CardContent = CardBase & { kind: ContentKindT; format: ContentFormatT };
export type CardEntry = CardInstall | CardContent;

// Browse views additionally filter on category + tags.
export type ListEntry = CardEntry & { category: string; tags: string[] };

export function isContent(e: CardEntry): e is CardContent {
  return e.kind === "prompt" || e.kind === "workflow";
}

// Forward slug for a detail URL. Content ids carry a "#unit" suffix; '#' -> '/' makes
// the unit a path segment. Install ids never contain '#', so the replace is a no-op
// for them — one helper serves both id spaces.
export function slugForAny(e: { id: string }): string {
  return e.id.replace(/^aleph-hub:/, "").replace("#", "/");
}

export function formatStars(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);
}
