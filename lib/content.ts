import contentData from "@/data/site-content.json";
import { validateContentSiteCatalog, type ContentSiteEntryT } from "@/contract/content-site";
import type { ContentKindT } from "@/contract/content-schema";

const CONTENT = validateContentSiteCatalog(contentData);

export function getAllContent(): ContentSiteEntryT[] {
  return CONTENT.entries;
}

export function getContentByKind(kind: ContentKindT): ContentSiteEntryT[] {
  return CONTENT.entries.filter((e) => e.kind === kind);
}

// content id "aleph-hub:owner/repo#unit" <-> slug "owner/repo/unit": '#' -> '/' makes
// the unit addressable as a path segment (a literal '#' would be a URL fragment).
export function slugForContent(e: ContentSiteEntryT): string {
  return e.id.replace(/^aleph-hub:/, "").replace("#", "/");
}

export function contentKindCounts(): Record<ContentKindT, number> {
  return CONTENT.entries.reduce(
    (acc, e) => ({ ...acc, [e.kind]: (acc[e.kind] ?? 0) + 1 }),
    { prompt: 0, workflow: 0 } as Record<ContentKindT, number>,
  );
}

// Headline pick for a kind's home region: first entry (content has no star ranking
// yet); undefined when the axis is empty.
export function flagshipContent(kind: ContentKindT): ContentSiteEntryT | undefined {
  return getContentByKind(kind)[0];
}

// The remaining entries of a kind for the region's rows (excludes the flagship).
export function featuredContent(kind: ContentKindT, n: number): ContentSiteEntryT[] {
  return getContentByKind(kind).slice(1, 1 + n);
}

// Related = same category, excluding self (mirrors lib/catalog related()).
export function relatedContent(entry: ContentSiteEntryT, n: number): ContentSiteEntryT[] {
  return CONTENT.entries.filter((e) => e.category === entry.category && e.id !== entry.id).slice(0, n);
}
