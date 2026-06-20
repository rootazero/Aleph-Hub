import siteData from "@/data/site-catalog.json";
import { validateSiteCatalog, type SiteEntryT } from "@/contract/site";
import type { ExtensionKindT } from "@/contract/types";

const CATALOG = validateSiteCatalog(siteData);

export function getAll(): SiteEntryT[] { return CATALOG.entries; }
export function getByKind(kind: ExtensionKindT): SiteEntryT[] { return CATALOG.entries.filter((e) => e.kind === kind); }
export function getByCategory(cat: string): SiteEntryT[] { return CATALOG.entries.filter((e) => e.category === cat); }
export function getById(id: string): SiteEntryT | undefined { return CATALOG.entries.find((e) => e.id === id); }

// id "aleph-hub:owner/repo" <-> slug "owner/repo"
export function slugForEntry(e: SiteEntryT): string { return e.id.replace(/^aleph-hub:/, ""); }
export function idFromSlug(slug: string): string { return `aleph-hub:${slug}`; }
export function bySlug(slug: string): SiteEntryT | undefined { return getById(idFromSlug(slug)); }

export function trending(n: number): SiteEntryT[] {
  return [...CATALOG.entries].sort((a, b) => (b.trend ?? 0) - (a.trend ?? 0)).slice(0, n);
}
// Related = same category (matches the mockup's detail "Related" logic), excluding self.
export function related(entry: SiteEntryT, n: number): SiteEntryT[] {
  return CATALOG.entries.filter((e) => e.category === entry.category && e.id !== entry.id).slice(0, n);
}
export function editorsPick(): SiteEntryT {
  return [...CATALOG.entries].sort((a, b) => b.stars - a.stars)[0];
}
// Editorial collections by tag (spec §7.4): Integrations / Templates / Workflows
export function collections(): { tag: string; entries: SiteEntryT[] }[] {
  return ["integration", "template", "workflow"].map((tag) => ({
    tag, entries: CATALOG.entries.filter((e) => e.tags.includes(tag)),
  }));
}
export function kindCounts(): Record<ExtensionKindT, number> {
  return CATALOG.entries.reduce(
    (acc, e) => ({ ...acc, [e.kind]: (acc[e.kind] ?? 0) + 1 }),
    { skill: 0, plugin: 0, mcp: 0 } as Record<ExtensionKindT, number>,
  );
}
export function formatStars(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);
}
