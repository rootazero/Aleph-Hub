import { z } from "zod";

// Mirrors Aleph src/hub/types.rs — all snake_case wire values.
export const ExtensionKind = z.enum(["skill", "plugin", "mcp"]);

export const ExtensionCategory = z.enum([
  "search", "developer", "data", "productivity", "writing", "communication",
  "knowledge", "files", "design", "automation", "finance", "utilities", "other",
]);

export const TrustTier = z.enum(["official", "verified", "community", "unverified"]);

// Aleph McpTransport { Stdio, StreamableHttp, Sse } (snake_case). No bare "http".
export const McpTransport = z.enum(["stdio", "streamable_http", "sse"]);

export const EnvDecl = z.object({
  name: z.string(),
  description: z.string().optional(),
  required: z.boolean().default(false),
  secret: z.boolean().default(false),
  default: z.string().nullable().optional(),
  placeholder: z.string().optional(),
});

export const HeaderDecl = z.object({
  name: z.string(),
  secret: z.boolean().default(false),
});

// Aleph InstallSpec: #[serde(tag = "type", rename_all = "snake_case")]
export const InstallSpec = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("mcp_stdio"),
    command: z.string(),
    args: z.array(z.string()).default([]),
    env: z.array(EnvDecl).default([]),
  }),
  z.object({
    type: z.literal("mcp_remote"),
    url: z.string(),
    transport: McpTransport,
    headers: z.array(HeaderDecl).default([]),
  }),
  z.object({
    type: z.literal("oci_image"),
    image: z.string(),
  }),
  z.object({
    type: z.literal("git_dir"),
    git_url: z.string(),
    subdir: z.string().nullable().optional(),
    git_ref: z.string().nullable().optional(),
    sha256: z.string().nullable().optional(),
  }),
]);

export const HubCatalogManifest = z.object({
  schema_version: z.number().int().nonnegative(),
  hub_id: z.string(),
  name: z.string(),
  generated_at: z.string().optional(),
  entry_count: z.number().int().nonnegative().optional(),
  content_hash: z.string().optional(),
});

export const HubCatalogEntry = z.object({
  id: z.string(),
  kind: ExtensionKind,
  category: ExtensionCategory,
  name: z.string(),
  description: z.string(),
  repo_url: z.url(), // mandatory in our contract (D7); zod-4 top-level URL format
  trust_tier: TrustTier,
  install_spec: InstallSpec,
  requires_config: z.boolean().default(false),
  author: z.string().optional(),
  icon: z.url().optional(), // intentional producer-side narrowing (Aleph is plain Option<String>)
  tags: z.array(z.string()).default([]),
  version: z.string().optional(),
  config_schema: z.record(z.string(), z.unknown()).optional(),
  via: z.string().optional(), // producer convention, not constrained
});

export const HubCatalogArtifact = z.object({
  manifest: HubCatalogManifest,
  entries: z.array(HubCatalogEntry),
});

export function validateArtifact(json: unknown) {
  return HubCatalogArtifact.parse(json);
}
