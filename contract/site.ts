import { z } from "zod";
import { HubCatalogEntry, HubCatalogManifest } from "@/contract/schema";

export const SiteEntry = HubCatalogEntry.extend({
  description_zh: z.string(),
  description_en: z.string(),
  long_zh: z.string(),
  long_en: z.string(),
  cover_color: z.string(),       // palette color key, not an image
  stars: z.number().nonnegative(),
  trend: z.number().nullable().default(null),   // week-over-week %, null on first run
  spark: z.array(z.number()).default([]),       // sparkline points, [] on first run
  license: z.string().optional(),
  updated: z.string().optional(),
  install_cmd: z.string(),       // display CLI string (not the wire install_spec)
  sec_note_zh: z.string(),
  sec_note_en: z.string(),
});

export const SiteCatalog = z.object({
  manifest: HubCatalogManifest,
  entries: z.array(SiteEntry),
});

export function validateSiteCatalog(json: unknown) {
  return SiteCatalog.parse(json);
}

export type SiteEntryT = z.infer<typeof SiteEntry>;
export type SiteCatalogT = z.infer<typeof SiteCatalog>;
