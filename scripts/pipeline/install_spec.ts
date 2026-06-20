import { InstallSpec } from "@/contract/schema";
import type { InstallSpecT, ExtensionKindT } from "@/contract/types";

export interface InferCtx {
  repo_url: string; owner: string; repo: string; default_branch: string;
  readme: string; packageJson?: string | null;
}

// Match `npx -y <pkg>` / `uvx <pkg>` / `node <entry>` in fenced or inline code.
const NPX = /\b(?:npx|uvx)\s+(?:-y\s+)?(@?[\w./-]+)/i;
// A documented hosted endpoint ending in /mcp or /mcp/.
const REMOTE = /\bhttps?:\/\/[^\s`)]+\/mcp\/?\b/i;
const ENV_HINT = /`?\b([A-Z][A-Z0-9_]{2,})\b`?/g;
const SECRETY = /(token|key|secret|password|auth)/i;

function detectEnv(readme: string): { name: string; required: boolean; secret: boolean }[] {
  const seen = new Set<string>();
  const out: { name: string; required: boolean; secret: boolean }[] = [];
  for (const m of readme.matchAll(ENV_HINT)) {
    const name = m[1];
    if (seen.has(name) || name.length > 40) continue;
    seen.add(name);
    if (SECRETY.test(name)) out.push({ name, required: true, secret: true });
  }
  return out;
}

export function inferInstallSpec(kind: ExtensionKindT, ctx: InferCtx): InstallSpecT | null {
  if (kind === "mcp") {
    const npx = ctx.readme.match(NPX);
    if (npx) {
      const command = /\buvx\b/i.test(ctx.readme) ? "uvx" : "npx";
      const args = command === "npx" ? ["-y", npx[1]] : [npx[1]]; // npx wants -y; uvx does not
      const env = detectEnv(ctx.readme);
      const parsed = InstallSpec.safeParse({ type: "mcp_stdio", command, args, env });
      return parsed.success ? parsed.data : null;
    }
    const remote = ctx.readme.match(REMOTE);
    if (remote) {
      const transport = /\bsse\b/i.test(ctx.readme) ? "sse" : "streamable_http";
      const headers = SECRETY.test(ctx.readme) ? [{ name: "Authorization", secret: true }] : [];
      const parsed = InstallSpec.safeParse({ type: "mcp_remote", url: remote[0], transport, headers });
      return parsed.success ? parsed.data : null;
    }
    return null; // no install signal for an mcp repo → drop later
  }
  // skill / plugin → git_dir
  const parsed = InstallSpec.safeParse({ type: "git_dir", git_url: ctx.repo_url, git_ref: ctx.default_branch });
  return parsed.success ? parsed.data : null;
}

// Mirror Aleph InstallSpec::requires_config() (types.rs:136-145).
export function requiresConfig(spec: InstallSpecT): boolean {
  if (spec.type === "mcp_stdio") return (spec.env ?? []).some((e) => e.required);
  if (spec.type === "mcp_remote") return (spec.headers ?? []).some((h) => h.secret);
  return false; // git_dir / oci_image
}
