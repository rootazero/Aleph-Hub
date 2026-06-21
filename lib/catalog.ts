import siteData from "@/data/site-catalog.json";
import { validateSiteCatalog, type SiteEntryT } from "@/contract/site";
import type { ExtensionKindT } from "@/contract/types";
import { FEATURED_BY_KIND } from "@/lib/featured";

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
  // trend is the primary axis; stars break ties (and carry the ordering entirely
  // until the pipeline backfills week-over-week trend data).
  return [...CATALOG.entries].sort((a, b) => (b.trend ?? 0) - (a.trend ?? 0) || b.stars - a.stars).slice(0, n);
}
// Recency is the only real temporal signal (trend/spark are null on first runs),
// so "latest" sorts by upstream `updated` desc, breaking ties by stars.
function byRecency(a: SiteEntryT, b: SiteEntryT): number {
  const d = (b.updated ?? "").localeCompare(a.updated ?? "");
  return d !== 0 ? d : b.stars - a.stars;
}
// Newest entry of a single kind, or undefined when that axis is still empty.
export function newestOfKind(kind: ExtensionKindT): SiteEntryT | undefined {
  return getByKind(kind).sort(byRecency)[0];
}
// The kind's headline pick (the image "main extension"): the first curated slug
// if set, otherwise the most-starred entry. undefined when the axis is empty.
export function flagshipOfKind(kind: ExtensionKindT): SiteEntryT | undefined {
  const pool = getByKind(kind);
  if (!pool.length) return undefined;
  for (const slug of FEATURED_BY_KIND[kind]) {
    const e = pool.find((x) => slugForEntry(x) === slug);
    if (e) return e;
  }
  return [...pool].sort((a, b) => b.stars - a.stars)[0];
}
// Featured picks for a kind's homepage region: curated slugs (FEATURED_BY_KIND)
// lead, then the newest entry so recency always surfaces, then top entries by
// stars to fill up to n. Empty kinds return [].
export function featuredOfKind(kind: ExtensionKindT, n: number): SiteEntryT[] {
  const pool = getByKind(kind);
  if (!pool.length) return [];
  const out: SiteEntryT[] = [];
  const seen = new Set<string>();
  const push = (e?: SiteEntryT) => { if (e && !seen.has(e.id)) { out.push(e); seen.add(e.id); } };
  for (const slug of FEATURED_BY_KIND[kind]) push(pool.find((x) => slugForEntry(x) === slug));
  push(newestOfKind(kind));
  for (const e of [...pool].sort((a, b) => b.stars - a.stars)) { if (out.length >= n) break; push(e); }
  return out.slice(0, n);
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
// Staff picks across areas: the most-starred entry of each category (richest
// categories first), excluding the hero's editor's pick so the two don't repeat.
export function editorialPicks(n: number): { category: string; entry: SiteEntryT }[] {
  const heroId = editorsPick().id;
  const counts = new Map<string, number>();
  for (const e of CATALOG.entries) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
  const cats = [...counts.keys()].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0));
  const picks: { category: string; entry: SiteEntryT }[] = [];
  for (const category of cats) {
    const entry = CATALOG.entries
      .filter((e) => e.category === category && e.id !== heroId)
      .sort((a, b) => b.stars - a.stars)[0];
    if (entry) picks.push({ category, entry });
    if (picks.length >= n) break;
  }
  return picks;
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
