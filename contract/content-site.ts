import { z } from "zod";
import { ContentCatalogEntry, ContentCatalogManifest } from "@/contract/content-schema";

// Richer projection for the website; not part of the wire contract.
export const ContentSiteEntry = ContentCatalogEntry.extend({
  description_zh: z.string(),
  description_en: z.string(),
  long_zh: z.string(),
  long_en: z.string(),
  cover_color: z.string(),   // palette key, computed at emit time
  sec_note_zh: z.string(),
  sec_note_en: z.string(),
});

export const ContentSiteCatalog = z.object({
  manifest: ContentCatalogManifest,
  entries: z.array(ContentSiteEntry),
});

export function validateContentSiteCatalog(json: unknown) {
  return ContentSiteCatalog.parse(json);
}

export type ContentSiteEntryT = z.infer<typeof ContentSiteEntry>;
export type ContentSiteCatalogT = z.infer<typeof ContentSiteCatalog>;
