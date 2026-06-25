import type { AnySiteEntry } from "@/lib/site";
import { allEntries } from "@/lib/site";

export interface Publisher {
  slug: string;            // url-safe, unique, deterministic
  name: string;            // = author display name
  entries: AnySiteEntry[]; // install + content; install (with stars) first
  homepage?: string;       // best-effort source root; undefined if nothing parses
}

// Base url-safe slug from a free-text author. CJK + punctuation drop out, so
// "高德 AutoNavi" -> "autonavi", "MiniMax" -> "minimax". Pure; may return "".
export function slugifyAuthor(author: string): string {
  return author.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Stars when present (install entries), else -1 so content trails install.
function starsOf(e: AnySiteEntry): number {
  return "stars" in e ? e.stars : -1;
}

// Best-effort canonical source root for a group: the most common GitHub org,
// else the origin of the first parseable repo_url. undefined only if none parse.
function deriveHomepage(entries: AnySiteEntry[]): string | undefined {
  const orgCount = new Map<string, number>();
  let firstOrigin: string | undefined;
  for (const e of entries) {
    try {
      const u = new URL(e.repo_url);
      if (firstOrigin === undefined) firstOrigin = u.origin;
      if (u.hostname === "github.com") {
        const org = u.pathname.split("/").filter(Boolean)[0];
        if (org) orgCount.set(org, (orgCount.get(org) ?? 0) + 1);
      }
    } catch {
      // skip unparseable repo_url
    }
  }
  let top: string | undefined;
  let best = 0;
  for (const [org, n] of orgCount) if (n > best) { best = n; top = org; }
  if (top) return `https://github.com/${top}`;
  return firstOrigin;
}

// Pure grouping: author -> Publisher. Authors sorted for deterministic slug
// suffixing; entries sorted stars desc (install before content). Entries with
// no author have no publisher facet and are skipped.
export function groupPublishers(entries: AnySiteEntry[]): Publisher[] {
  const byAuthor = new Map<string, AnySiteEntry[]>();
  for (const e of entries) {
    if (!e.author) continue;
    const list = byAuthor.get(e.author);
    if (list) list.push(e);
    else byAuthor.set(e.author, [e]);
  }
  const used = new Set<string>();
  const out: Publisher[] = [];
  for (const author of [...byAuthor.keys()].sort()) {
    let slug = slugifyAuthor(author) || "publisher";
    if (used.has(slug)) {
      let i = 2;
      while (used.has(`${slug}-${i}`)) i++;
      slug = `${slug}-${i}`;
    }
    used.add(slug);
    const list = [...byAuthor.get(author)!].sort((a, b) => starsOf(b) - starsOf(a));
    out.push({ slug, name: author, entries: list, homepage: deriveHomepage(list) });
  }
  return out;
}

// Built once at module load — the single source for routing and linking.
const INDEX = groupPublishers(allEntries());
const BY_SLUG = new Map(INDEX.map((p) => [p.slug, p]));
const AUTHOR_SLUG = new Map(INDEX.map((p) => [p.name, p.slug]));

export function publishersIndex(): Publisher[] {
  return INDEX;
}
export function publisherBySlug(slug: string): Publisher | undefined {
  return BY_SLUG.get(slug);
}
export function allPublisherSlugs(): string[] {
  return [...BY_SLUG.keys()];
}

// Slug for an author, matching the index so detail-page links resolve. Falls
// back to the base slug for authors not in the catalog (defensive).
export function publisherSlug(author: string): string {
  return AUTHOR_SLUG.get(author) ?? (slugifyAuthor(author) || "publisher");
}
