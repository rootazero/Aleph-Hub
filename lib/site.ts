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

// Canonical forward-slug map across both catalogs, keyed by the precomputed forward
// slug (no reverse '/'->'#' guesswork). Install slugs are NOT always 2 segments:
// multi-skill repos emit "owner/repo/skill" (3 seg), the SAME shape as a content
// "owner/repo/unit" slug — so the two spaces CAN overlap. We add install entries first
// (the established URLs) and fail loud if a content slug would shadow one, rather than
// silently hijacking an install detail URL. A real collision is a curation data error.
export function buildBySlug(install: SiteEntryT[], content: ContentSiteEntryT[]): Map<string, AnySiteEntry> {
  const map = new Map<string, AnySiteEntry>();
  for (const e of install) map.set(slugForEntry(e), e);
  for (const e of content) {
    const slug = slugForContent(e);
    if (map.has(slug)) throw new Error(`content slug collides with an install slug: ${slug}`);
    map.set(slug, e);
  }
  return map;
}
const BY_SLUG = buildBySlug(getAll(), getAllContent());

export function allSlugs(): string[][] {
  return [...BY_SLUG.keys()].map((s) => s.split("/"));
}

export function anyBySlug(slug: string): AnySiteEntry | undefined {
  return BY_SLUG.get(slug);
}
