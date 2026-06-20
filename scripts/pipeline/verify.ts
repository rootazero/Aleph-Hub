import type { InstallSpecT } from "@/contract/types";
import type { RegistryClient, GitHubApi } from "@/scripts/pipeline/ports";

export interface VerifyPorts { registry: RegistryClient; gh: GitHubApi; }

// Extract a package name from npx/uvx args (skip flags like -y).
function pkgFromArgs(args: string[]): string | undefined {
  return args.find((a) => !a.startsWith("-"));
}
function ownerOfRepoUrl(url: string | null): string | null {
  const m = url?.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  return m ? m[1].toLowerCase() : null;
}

export async function verifyInstallSpec(
  spec: InstallSpecT, ownerLogin: string, ports: VerifyPorts,
): Promise<{ ok: boolean; reason?: string }> {
  if (spec.type === "mcp_stdio") {
    const pkg = pkgFromArgs(spec.args ?? []);
    if (!pkg) return { ok: false, reason: "no package in args" };
    const isPython = spec.command === "uvx";
    const info = isPython ? await ports.registry.pypiPackage(pkg) : await ports.registry.npmPackage(pkg);
    if (!info) return { ok: false, reason: "registry lookup failed" };
    if (!info.exists) return { ok: false, reason: "package does not exist" };
    if (!isPython && "repository" in info) {
      const pkgOwner = ownerOfRepoUrl((info as { repository: string | null }).repository);
      if (pkgOwner && pkgOwner !== ownerLogin.toLowerCase()) return { ok: false, reason: "owner mismatch" };
    }
    return { ok: true };
  }
  if (spec.type === "mcp_remote") {
    return { ok: /^https?:\/\//i.test(spec.url), reason: /^https?:\/\//i.test(spec.url) ? undefined : "bad url" };
  }
  if (spec.type === "git_dir") {
    const m = spec.git_url.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
    if (!m) return { ok: false, reason: "not a github url" };
    const repo = await ports.gh.getRepo(`${m[1]}/${m[2].replace(/\.git$/, "")}`);
    return { ok: !!repo, reason: repo ? undefined : "repo not found" };
  }
  return { ok: false, reason: "oci not allowed" };
}
