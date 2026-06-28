import type { AnySiteEntry } from "@/lib/site";
import { allEntries } from "@/lib/site";

export interface Tag {
  slug: string;            // url-safe, unique, deterministic
  name: string;            // the tag label (lowercased; curation tags are lowercase)
  entries: AnySiteEntry[]; // install + content; install (with stars) first
}

// Base url-safe slug from a tag label. Mirrors slugifyAuthor: lowercase, non-alnum
// runs -> "-", trimmed. Catalog tags are already lowercase ascii, so this is usually
// identity ("landing-page" -> "landing-page"). Pure; may return "".
export function slugifyTag(tag: string): string {
  return tag.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Stars when present (install entries), else -1 so content trails install.
function starsOf(e: AnySiteEntry): number {
  return "stars" in e ? e.stars : -1;
}

// Pure grouping: tag -> Tag. Unlike publishers (one author per entry), an entry
// contributes to EVERY tag it carries. Labels normalize to lowercase so case
// variants merge and a tag is never listed twice for one entry; tags sorted for
// deterministic slug suffixing; entries sorted stars desc (install before content).
// Entries with no tags simply don't appear in any group.
export function groupTags(entries: AnySiteEntry[]): Tag[] {
  const byTag = new Map<string, AnySiteEntry[]>();
  for (const e of entries) {
    const seen = new Set<string>(); // dedup repeated tags within a single entry
    for (const raw of e.tags ?? []) {
      const name = raw.toLowerCase().trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      byTag.set(name, [...(byTag.get(name) ?? []), e]);
    }
  }
  const used = new Set<string>();
  const out: Tag[] = [];
  for (const name of [...byTag.keys()].sort()) {
    let slug = slugifyTag(name) || "tag";
    if (used.has(slug)) {
      let i = 2;
      while (used.has(`${slug}-${i}`)) i++;
      slug = `${slug}-${i}`;
    }
    used.add(slug);
    const list = [...byTag.get(name)!].sort((a, b) => starsOf(b) - starsOf(a));
    out.push({ slug, name, entries: list });
  }
  return out;
}

// Built once at module load — the single source for routing and linking.
const INDEX = groupTags(allEntries());
const BY_SLUG = new Map(INDEX.map((t) => [t.slug, t]));
const NAME_SLUG = new Map(INDEX.map((t) => [t.name, t.slug]));

export function tagsIndex(): Tag[] {
  return INDEX;
}
export function tagBySlug(slug: string): Tag | undefined {
  return BY_SLUG.get(slug);
}
export function allTagSlugs(): string[] {
  return [...BY_SLUG.keys()];
}

// Slug for a tag label, matching the index so detail-page links resolve. Normalizes
// to the lowercase index key first, then falls back to the base slug for tags not in
// the catalog (defensive).
export function tagSlug(tag: string): string {
  return NAME_SLUG.get(tag.toLowerCase().trim()) ?? (slugifyTag(tag) || "tag");
}
