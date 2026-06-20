import { CONFIG } from "@/scripts/pipeline/config";
import type { RepoMeta } from "@/scripts/pipeline/ports";
import type { TrustTierT } from "@/contract/types";

export interface TrustInput {
  owner: string; meta: RepoMeta; specVerified: boolean; officialOrgs: Set<string>; nowIso: string;
}

function daysSince(iso: string, nowIso: string): number {
  return (Date.parse(nowIso) - Date.parse(iso)) / 86_400_000;
}

export function trustTier(input: TrustInput): TrustTierT {
  // §6.5 铁律: an unverified install_spec can NEVER be official/verified.
  if (input.specVerified && input.officialOrgs.has(input.owner.toLowerCase())) return "official";
  const active = daysSince(input.meta.pushed_at, input.nowIso) <= CONFIG.ACTIVE_DAYS;
  if (input.specVerified && input.meta.stars >= CONFIG.STAR_VERIFIED && active && input.meta.license) {
    return "verified"; // safety-flag already removed the entry upstream (§6.4)
  }
  if (input.specVerified) return "community"; // has repo_url + verified spec, below the bar
  return "unverified"; // weak signals / unverified spec; still requires a repo_url (enforced upstream)
}
