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
export function latest(n: number): SiteEntryT[] {
  return [...CATALOG.entries].sort(byRecency).slice(0, n);
}
// Newest entry of a single kind, or undefined when that axis is still empty.
export function newestOfKind(kind: ExtensionKindT): SiteEntryT | undefined {
  return getByKind(kind).sort(byRecency)[0];
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
// "2026-06-20" -> "Jun 20". Returns "" for missing/malformed dates (caller hides it).
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function formatShortDate(iso?: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  if (!m) return "";
  return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}`;
}
