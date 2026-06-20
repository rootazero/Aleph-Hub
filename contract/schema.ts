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
