import type { SiteEntryT } from "@/contract/site";
import type { ContentSiteEntryT } from "@/contract/content-site";
import { getAll, slugForEntry } from "@/lib/catalog";
import { getAllContent, slugForContent } from "@/lib/content";

// Unified browse model over the install catalog (skill|plugin|mcp) and the content
// catalog (prompt|workflow). The two kind value spaces are disjoint, so `isContent`
// narrows the union safely.
export type AnySiteEntry = SiteEntryT | ContentSiteEntryT;

export function isContent(e: AnySiteEntry): e is ContentSiteEntryT {
  return e.kind === "prompt" || e.kind === "workflow";
}

export function slugForAny(e: AnySiteEntry): string {
  return isContent(e) ? slugForContent(e) : slugForEntry(e);
}

// Canonical forward-slug map across both catalogs. install full_name is always
// 2 segments and content unit slugs never contain '/', so:
//   install "owner/repo" (2 seg) and content "owner/repo/unit" (3 seg) never collide.
// Keying by the precomputed forward slug avoids any reverse '/'->'#' guesswork.
const entries: Array<[string, AnySiteEntry]> = [
  ...getAll().map((e): [string, AnySiteEntry] => [slugForEntry(e), e]),
  ...getAllContent().map((e): [string, AnySiteEntry] => [slugForContent(e), e]),
];
const BY_SLUG = new Map<string, AnySiteEntry>(entries);

export function allSlugs(): string[][] {
  return [...BY_SLUG.keys()].map((s) => s.split("/"));
}

export function anyBySlug(slug: string): AnySiteEntry | undefined {
  return BY_SLUG.get(slug);
}
