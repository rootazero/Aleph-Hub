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
