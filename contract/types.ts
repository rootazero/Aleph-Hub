import { z } from "zod";
import {
  ExtensionKind, ExtensionCategory, TrustTier, McpTransport,
  InstallSpec, HubCatalogEntry, HubCatalogManifest, HubCatalogArtifact,
} from "@/contract/schema";

export type ExtensionKindT = z.infer<typeof ExtensionKind>;
export type ExtensionCategoryT = z.infer<typeof ExtensionCategory>;
export type TrustTierT = z.infer<typeof TrustTier>;
export type McpTransportT = z.infer<typeof McpTransport>;
export type InstallSpecT = z.infer<typeof InstallSpec>;
export type HubCatalogEntryT = z.infer<typeof HubCatalogEntry>;
export type HubCatalogManifestT = z.infer<typeof HubCatalogManifest>;
export type HubCatalogArtifactT = z.infer<typeof HubCatalogArtifact>;
