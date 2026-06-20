import type { TrustTierT } from "@/contract/types";

const LABEL: Record<TrustTierT, string> = { official: "Official", verified: "Trusted", community: "Community", unverified: "Unverified" };

export function TrustBadge({ tier }: { tier: TrustTierT }) {
  // styles per mockup lines 349-351
  const base = { fontSize: 10, letterSpacing: ".10em", textTransform: "uppercase" as const, fontWeight: 600, padding: "3px 8px", borderRadius: 2, whiteSpace: "nowrap" as const, flex: "none" as const };
  const style =
    tier === "official" ? { ...base, color: "#FBF6EE", background: "var(--orange)", padding: "4px 9px" }
    : tier === "verified" ? { ...base, color: "var(--green)", border: "1px solid var(--green)" }
    : { ...base, color: "var(--taupe)", border: "1px solid var(--taupe)" };
  return <span style={style}>{LABEL[tier]}</span>;
}
