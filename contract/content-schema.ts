import { z } from "zod";
import { ExtensionCategory, TrustTier } from "@/contract/schema";

// content kinds are a SEPARATE family from the install ExtensionKind enum.
export const ContentKind = z.enum(["prompt", "workflow"]);
export const ContentFormat = z.enum(["markdown", "javascript"]);

export const CONTENT_BODY_MAX = 65536; // bytes; mirrored in CONFIG for the pipeline

export const CONTENT_SCHEMA_VERSION = 1; // producer constant; wire value synced with Aleph

export const ContentCatalogManifest = z.object({
  content_schema_version: z.number().int().nonnegative(), // distinct from install schema_version
  hub_id: z.string(),
  name: z.string(),
  generated_at: z.string().optional(),
  entry_count: z.number().int().nonnegative().optional(),
  content_hash: z.string().optional(),
});

export const ContentCatalogEntry = z.object({
  id: z.string(),                    // "aleph-hub:<owner>/<repo>#<slug>"
  kind: ContentKind,
  category: ExtensionCategory,       // REUSE install categories
  name: z.string(),
  description: z.string(),
  author: z.string().optional(),
  tags: z.array(z.string()).default([]),
  repo_url: z.url(),                 // P-Provenance: mandatory upstream
  source_path: z.string(),           // file within repo (provenance / verifiability)
  trust_tier: TrustTier,             // REUSE install trust tiers
  license: z.string().optional(),
  via: z.string().optional(),
  body: z.string().min(1).max(CONTENT_BODY_MAX),  // inline payload (copy/insert or save+run)
  format: ContentFormat,
});

export const ContentCatalogArtifact = z.object({
  manifest: ContentCatalogManifest,
  entries: z.array(ContentCatalogEntry),
});

export function validateContentArtifact(json: unknown) {
  return ContentCatalogArtifact.parse(json);
}

export type ContentKindT = z.infer<typeof ContentKind>;
export type ContentFormatT = z.infer<typeof ContentFormat>;
export type ContentCatalogEntryT = z.infer<typeof ContentCatalogEntry>;
export type ContentCatalogManifestT = z.infer<typeof ContentCatalogManifest>;
export type ContentCatalogArtifactT = z.infer<typeof ContentCatalogArtifact>;
