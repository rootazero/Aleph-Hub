# Publisher Attribution Facet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make an entry's author a clickable attribution facet — `/p/[slug]` lists every entry by that author, grouped across both catalogs.

**Architecture:** Pure site-side derivation from the existing `author` field. A new `lib/publishers.ts` groups `allEntries()` (install + content) by author, slugifies deterministically, and exposes lookups. A new SSG route `app/p/[slug]/page.tsx` renders a `PublisherView` reusing `Card`/`TrustBadge`. The two detail-page "By" rows become links. No wire-contract, pipeline, curation, or artifact change.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Zod (existing schemas), Vitest + Testing Library.

Spec: `docs/superpowers/specs/2026-06-25-publisher-attribution-facet-design.md`

## Global Constraints

- **Contract red line:** do NOT touch `contract/schema.ts`, `contract/content-schema.ts`, the pipeline, `data/curation/*`, or any published artifact. The facet derives only from the existing `author` field.
- **Grouping key is `author`** (display name), never the id-slug owner or GitHub org.
- **No nested anchors:** only the two detail-page meta rows become links; `Card` and home-index author text stay plain (they are already inside `<Link>`).
- Replies to the user in Chinese; **code comments in English**.
- Commit message format: `<scope>: <description>` (English), e.g. `feat(publishers): ...`. No attribution footer (disabled globally).
- Immutable updates (spread, no in-place mutation), per repo style.
- Path alias `@/` → repo root. Run a single test file with `npx vitest run <path>`.

---

### Task 1: `allEntries()` union accessor

**Files:**
- Modify: `lib/site.ts` (append one exported function)
- Test: `lib/__tests__/all-entries.test.ts` (create)

**Interfaces:**
- Consumes: `getAll()` from `@/lib/catalog`, `getAllContent()` from `@/lib/content`, type `AnySiteEntry` (already defined in `lib/site.ts`).
- Produces: `allEntries(): AnySiteEntry[]` — install entries first, then content.

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/all-entries.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { allEntries } from "@/lib/site";
import { getAll } from "@/lib/catalog";
import { getAllContent } from "@/lib/content";

describe("allEntries", () => {
  it("unions install and content catalogs, install first", () => {
    const all = allEntries();
    expect(all.length).toBe(getAll().length + getAllContent().length);
    // install entries lead (skill|plugin|mcp), content (prompt|workflow) trails
    expect(all.slice(0, getAll().length).every((e) => e.kind === "skill" || e.kind === "plugin" || e.kind === "mcp")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/__tests__/all-entries.test.ts`
Expected: FAIL — `allEntries` is not exported from `@/lib/site`.

- [ ] **Step 3: Add the accessor**

Append to `lib/site.ts` (after `anyBySlug`):

```ts
// Flat union of both catalogs, for facets that group across all entries (e.g.
// publisher attribution). Install entries lead, content entries follow.
export function allEntries(): AnySiteEntry[] {
  return [...getAll(), ...getAllContent()];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/__tests__/all-entries.test.ts`
Expected: PASS (both assertions).

- [ ] **Step 5: Commit**

```bash
git add lib/site.ts lib/__tests__/all-entries.test.ts
git commit -m "feat(site): allEntries union accessor over install + content"
```

---

### Task 2: `lib/publishers.ts` — author-grouped derivation

**Files:**
- Create: `lib/publishers.ts`
- Test: `lib/__tests__/publishers.test.ts`

**Interfaces:**
- Consumes: `allEntries(): AnySiteEntry[]` and type `AnySiteEntry` from `@/lib/site` (Task 1).
- Produces:
  - `interface Publisher { slug: string; name: string; entries: AnySiteEntry[]; homepage?: string }`
  - `slugifyAuthor(author: string): string` — pure base slug (may be `""`).
  - `groupPublishers(entries: AnySiteEntry[]): Publisher[]` — pure grouping.
  - `publishersIndex(): Publisher[]`
  - `publisherBySlug(slug: string): Publisher | undefined`
  - `allPublisherSlugs(): string[]`
  - `publisherSlug(author: string): string` — index-consistent slug for linking.

- [ ] **Step 1: Write the failing tests**

Create `lib/__tests__/publishers.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  slugifyAuthor, groupPublishers, publishersIndex,
  publisherBySlug, publisherSlug, allPublisherSlugs,
} from "@/lib/publishers";
import type { AnySiteEntry } from "@/lib/site";
import { allEntries } from "@/lib/site";

// Minimal install-shaped entry (has `stars`).
const mkInstall = (over: Partial<AnySiteEntry> & { author?: string }): AnySiteEntry =>
  ({ id: "aleph-hub:o/r", name: "n", author: "A", stars: 0,
     repo_url: "https://github.com/o/r", trust_tier: "community", kind: "skill",
     ...over } as unknown as AnySiteEntry);

// Minimal content-shaped entry (NO `stars` key, so the sort treats it as -1).
const mkContent = (over: Partial<AnySiteEntry> & { author?: string }): AnySiteEntry =>
  ({ id: "aleph-hub:o/r#u", name: "n", author: "A",
     repo_url: "https://github.com/o/r", trust_tier: "community", kind: "prompt",
     source_path: "p.md", format: "markdown", ...over } as unknown as AnySiteEntry);

describe("slugifyAuthor", () => {
  it("lowercases and url-safes ascii authors", () => {
    expect(slugifyAuthor("MiniMax")).toBe("minimax");
    expect(slugifyAuthor("op7418")).toBe("op7418");
  });
  it("drops CJK + punctuation, keeps the ascii tail", () => {
    expect(slugifyAuthor("高德 AutoNavi")).toBe("autonavi");
    expect(slugifyAuthor("火山引擎 ByteDance")).toBe("bytedance");
  });
  it("returns empty string for pure non-ascii", () => {
    expect(slugifyAuthor("高德")).toBe("");
  });
});

describe("groupPublishers", () => {
  it("merges one author across different repo owners into a single publisher", () => {
    const groups = groupPublishers([
      mkInstall({ id: "aleph-hub:rootazero/Aleph-skills/a", author: "rootazero", repo_url: "https://github.com/rootazero/Aleph-skills" }),
      mkInstall({ id: "aleph-hub:siliconflow/x", author: "rootazero", repo_url: "https://github.com/rootazero/Aleph-mcp" }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe("rootazero");
    expect(groups[0].entries).toHaveLength(2);
  });
  it("keeps distinct authors separate even when repo owner != author", () => {
    const groups = groupPublishers([
      mkInstall({ author: "Upstash", repo_url: "https://github.com/upstash/context7" }),
      mkInstall({ author: "MiniMax", repo_url: "https://github.com/MiniMax-AI/MiniMax-MCP" }),
    ]);
    expect(groups.map((g) => g.name).sort()).toEqual(["MiniMax", "Upstash"]);
  });
  it("skips entries with no author", () => {
    const groups = groupPublishers([mkInstall({ author: undefined })]);
    expect(groups).toHaveLength(0);
  });
  it("disambiguates colliding slugs deterministically", () => {
    const groups = groupPublishers([
      mkInstall({ author: "Acme Co", repo_url: "https://github.com/acme/a" }),
      mkInstall({ author: "acme-co", repo_url: "https://github.com/acme2/b" }),
    ]);
    const slugs = groups.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toContain("acme-co");
    expect(slugs).toContain("acme-co-2");
  });
  it("sorts install entries (with stars) before content (without)", () => {
    const groups = groupPublishers([
      mkContent({ author: "A", id: "aleph-hub:a/r#p" }),
      mkInstall({ author: "A", stars: 10, id: "aleph-hub:a/s" }),
    ]);
    expect(groups[0].entries[0].id).toBe("aleph-hub:a/s");
  });
  it("derives the github org homepage", () => {
    const [g] = groupPublishers([mkInstall({ author: "Up", repo_url: "https://github.com/upstash/context7" })]);
    expect(g.homepage).toBe("https://github.com/upstash");
  });
  it("falls back to the origin for non-github repo urls", () => {
    const [g] = groupPublishers([mkInstall({ author: "AM", repo_url: "https://www.npmjs.com/package/@amap/amap-maps-mcp-server" })]);
    expect(g.homepage).toBe("https://www.npmjs.com");
  });
});

describe("publishersIndex (real catalog invariants)", () => {
  const idx = publishersIndex();
  const authored = allEntries().filter((e) => e.author);

  it("has exactly one publisher per distinct author", () => {
    expect(idx.length).toBe(new Set(authored.map((e) => e.author)).size);
  });
  it("entry counts sum to the authored-entry total", () => {
    expect(idx.reduce((n, p) => n + p.entries.length, 0)).toBe(authored.length);
  });
  it("slugs are unique and equal allPublisherSlugs", () => {
    const slugs = idx.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect([...allPublisherSlugs()].sort()).toEqual([...slugs].sort());
  });
  it("publisherSlug round-trips back to the same publisher", () => {
    for (const p of idx) {
      expect(publisherBySlug(publisherSlug(p.name))?.slug).toBe(p.slug);
    }
  });
  it("returns undefined for an unknown slug", () => {
    expect(publisherBySlug("definitely-not-a-publisher-zzz")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/__tests__/publishers.test.ts`
Expected: FAIL — cannot resolve `@/lib/publishers`.

- [ ] **Step 3: Implement `lib/publishers.ts`**

Create `lib/publishers.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/__tests__/publishers.test.ts`
Expected: PASS (all `slugifyAuthor`, `groupPublishers`, and invariant cases).

- [ ] **Step 5: Commit**

```bash
git add lib/publishers.ts lib/__tests__/publishers.test.ts
git commit -m "feat(publishers): author-grouped publisher derivation"
```

---

### Task 3: `PublisherView` component + i18n strings

**Files:**
- Modify: `lib/i18n.ts` (add 2 keys to `Strings` + both `zh`/`en` maps)
- Create: `components/publisher/PublisherView.tsx`
- Test: `components/publisher/__tests__/publisher.test.tsx`

**Interfaces:**
- Consumes: `Publisher`, `publishersIndex` from `@/lib/publishers` (Task 2); `STRINGS` from `@/lib/i18n`; `Card`, `TrustBadge`; `useLang`; `TrustTierT` from `@/contract/types`.
- Produces: `PublisherView({ publisher }: { publisher: Publisher })` — a `<main>` block (no Header/Footer; the page supplies those). New i18n keys `pubKicker`, `pubEntries` (the latter contains `{n}`).

- [ ] **Step 1: Write the failing test**

Create `components/publisher/__tests__/publisher.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LangProvider } from "@/components/providers/LangProvider";
import { PublisherView } from "@/components/publisher/PublisherView";
import { publishersIndex } from "@/lib/publishers";

const wrap = (ui: React.ReactNode) =>
  render(<ThemeProvider><LangProvider>{ui}</LangProvider></ThemeProvider>);

describe("PublisherView", () => {
  // Pick a multi-entry publisher from the real index (rootazero qualifies today).
  const pub = [...publishersIndex()].sort((a, b) => b.entries.length - a.entries.length)[0];

  it("renders the publisher name, entry count, and its entries", () => {
    expect(pub.entries.length).toBeGreaterThan(0);
    wrap(<PublisherView publisher={pub} />);
    // name shows in the header (and again as each card's author line)
    expect(screen.getAllByText(pub.name).length).toBeGreaterThan(0);
    // count line is rendered (zh "件作品" or en "entries")
    expect(screen.getByText(/件作品|entries/)).toBeInTheDocument();
    // the top entry's name renders via <Card>
    expect(screen.getAllByText(pub.entries[0].name).length).toBeGreaterThan(0);
  });

  it("links to the homepage when present", () => {
    if (!pub.homepage) return; // homepage is best-effort; skip if absent
    wrap(<PublisherView publisher={pub} />);
    const link = screen.getAllByRole("link").find((a) => a.getAttribute("href") === pub.homepage);
    expect(link).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/publisher/__tests__/publisher.test.tsx`
Expected: FAIL — cannot resolve `@/components/publisher/PublisherView`.

- [ ] **Step 3a: Add i18n keys**

In `lib/i18n.ts`, add to the `Strings` interface (next to `mSource`/`mFormat`/`contentSoon`):

```ts
  pubKicker: string; pubEntries: string;
```

In the `zh` map, add (e.g. after the `mSource`/`mFormat`/`contentSoon` line):

```ts
    pubKicker: "发布者 · Publisher", pubEntries: "{n} 件作品",
```

In the `en` map, add the parallel line:

```ts
    pubKicker: "Publisher", pubEntries: "{n} entries",
```

- [ ] **Step 3b: Implement `PublisherView`**

Create `components/publisher/PublisherView.tsx`:

```tsx
"use client";
import Link from "next/link";
import type { TrustTierT } from "@/contract/types";
import type { Publisher } from "@/lib/publishers";
import { useLang } from "@/components/providers/LangProvider";
import { STRINGS } from "@/lib/i18n";
import { TrustBadge } from "@/components/TrustBadge";
import { Card } from "@/components/Card";

// A publisher's trust signal = the highest tier among its entries.
const TIER_RANK: Record<TrustTierT, number> = { official: 3, verified: 2, community: 1, unverified: 0 };

export function PublisherView({ publisher }: { publisher: Publisher }) {
  const { lang } = useLang();
  const t = STRINGS[lang];
  const topTier = publisher.entries.reduce<TrustTierT>(
    (best, e) => (TIER_RANK[e.trust_tier] > TIER_RANK[best] ? e.trust_tier : best),
    "unverified",
  );
  const count = t.pubEntries.replace("{n}", String(publisher.entries.length));

  return (
    <main style={{ maxWidth: 1240, margin: "0 auto", padding: "34px 48px 80px" }}>
      <Link href="/" style={{ fontSize: 12, color: "var(--taupe)", letterSpacing: ".04em", textDecoration: "none" }}>{t.back}</Link>
      <header style={{ marginTop: 26, marginBottom: 40, borderBottom: "1px solid var(--hair-strong)", paddingBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: ".20em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: 600, marginBottom: 12 }}>{t.pubKicker}</div>
        <h1 style={{ fontFamily: "var(--font-cormorant), var(--font-noto-serif-sc), serif", fontWeight: 600, fontSize: 52, lineHeight: 1, margin: "0 0 16px" }}>{publisher.name}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <TrustBadge tier={topTier} />
          <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>{count}</span>
          {publisher.homepage && (
            <a href={publisher.homepage} target="_blank" rel="noreferrer" style={{ fontSize: 12, letterSpacing: ".10em", textTransform: "uppercase", color: "var(--orange)", textDecoration: "none" }}>{t.viewGithub} ↗</a>
          )}
        </div>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
        {publisher.entries.map((e) => <Card key={e.id} entry={e} />)}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/publisher/__tests__/publisher.test.tsx`
Expected: PASS (both `it` blocks).

- [ ] **Step 5: Commit**

```bash
git add lib/i18n.ts components/publisher/PublisherView.tsx components/publisher/__tests__/publisher.test.tsx
git commit -m "feat(web): PublisherView component + publisher i18n strings"
```

---

### Task 4: `app/p/[slug]` route (SSG + notFound)

**Files:**
- Create: `app/p/[slug]/page.tsx`
- Test: `app/p/[slug]/__tests__/params.test.ts`

**Interfaces:**
- Consumes: `allPublisherSlugs`, `publisherBySlug` from `@/lib/publishers` (Task 2); `PublisherView` (Task 3); `Header`, `Footer`.
- Produces: `generateStaticParams(): { slug: string }[]`; default async page component.

- [ ] **Step 1: Write the failing test**

Create `app/p/[slug]/__tests__/params.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { generateStaticParams } from "@/app/p/[slug]/page";
import { allPublisherSlugs } from "@/lib/publishers";

describe("publisher route params", () => {
  it("generates one static param per publisher slug", () => {
    const params = generateStaticParams();
    expect(params.length).toBeGreaterThan(0);
    expect(params.map((p) => p.slug).sort()).toEqual([...allPublisherSlugs()].sort());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "app/p/[slug]/__tests__/params.test.ts"`
Expected: FAIL — cannot resolve `@/app/p/[slug]/page`.

- [ ] **Step 3: Implement the route**

Create `app/p/[slug]/page.tsx` (mirrors `app/e/[...slug]/page.tsx`):

```tsx
import { notFound } from "next/navigation";
import { allPublisherSlugs, publisherBySlug } from "@/lib/publishers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PublisherView } from "@/components/publisher/PublisherView";

export function generateStaticParams() {
  return allPublisherSlugs().map((slug) => ({ slug }));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const publisher = publisherBySlug(slug);
  if (!publisher) notFound();
  return (
    <>
      <Header />
      <PublisherView publisher={publisher} />
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "app/p/[slug]/__tests__/params.test.ts"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/p/[slug]/page.tsx" "app/p/[slug]/__tests__/params.test.ts"
git commit -m "feat(web): publisher page route /p/[slug]"
```

---

### Task 5: Link author → publisher on both detail views

**Files:**
- Modify: `components/detail/DetailView.tsx` (add import; line 77 "By" row)
- Modify: `components/detail/ContentDetailView.tsx` (add import; line 82 "By" row)
- Test: `components/detail/__tests__/author-link.test.tsx` (create)

**Interfaces:**
- Consumes: `publisherSlug` from `@/lib/publishers` (Task 2). Both files already import `Link`.
- Produces: the author meta value becomes `<Link href={`/p/${publisherSlug(entry.author)}`}>` when `entry.author` is set, else a plain `—`.

- [ ] **Step 1: Write the failing test**

Create `components/detail/__tests__/author-link.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LangProvider } from "@/components/providers/LangProvider";
import { DetailView } from "@/components/detail/DetailView";
import { ContentDetailView } from "@/components/detail/ContentDetailView";
import { getByKind } from "@/lib/catalog";
import { getContentByKind } from "@/lib/content";
import { publisherSlug } from "@/lib/publishers";

const wrap = (ui: React.ReactNode) =>
  render(<ThemeProvider><LangProvider>{ui}</LangProvider></ThemeProvider>);

describe("detail author links", () => {
  it("DetailView links the author to its publisher page", () => {
    const e = getByKind("skill").find((x) => x.author)!;
    wrap(<DetailView entry={e} />);
    const link = screen.getAllByRole("link").find((a) => a.getAttribute("href") === `/p/${publisherSlug(e.author!)}`);
    expect(link).toBeTruthy();
    expect(link!).toHaveTextContent(e.author!);
  });

  it("ContentDetailView links the author to its publisher page", () => {
    const e = getContentByKind("prompt").find((x) => x.author);
    if (!e) return; // no authored prompt in the committed content catalog → skip
    wrap(<ContentDetailView entry={e} />);
    const link = screen.getAllByRole("link").find((a) => a.getAttribute("href") === `/p/${publisherSlug(e.author!)}`);
    expect(link).toBeTruthy();
    expect(link!).toHaveTextContent(e.author!);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/detail/__tests__/author-link.test.tsx`
Expected: FAIL — no link with href `/p/...` (author is currently plain `<span>`).

- [ ] **Step 3a: Edit `DetailView.tsx`**

Add the import (next to the other `@/lib` imports near the top):

```tsx
import { publisherSlug } from "@/lib/publishers";
```

Replace the "By" meta row (currently line 77):

```tsx
            <div style={metaRow}><span style={metaKey}>{t.mBy}</span><span style={metaVal}>{entry.author}</span></div>
```

with:

```tsx
            <div style={metaRow}>
              <span style={metaKey}>{t.mBy}</span>
              {entry.author
                ? <Link href={`/p/${publisherSlug(entry.author)}`} style={{ ...metaVal, color: "var(--orange)", textDecoration: "none" }}>{entry.author}</Link>
                : <span style={metaVal}>—</span>}
            </div>
```

- [ ] **Step 3b: Edit `ContentDetailView.tsx`**

Add the import (next to the other `@/lib` imports near the top):

```tsx
import { publisherSlug } from "@/lib/publishers";
```

Replace the "By" meta row (currently line 82):

```tsx
            <div style={metaRow}><span style={metaKey}>{t.mBy}</span><span style={metaVal}>{entry.author}</span></div>
```

with:

```tsx
            <div style={metaRow}>
              <span style={metaKey}>{t.mBy}</span>
              {entry.author
                ? <Link href={`/p/${publisherSlug(entry.author)}`} style={{ ...metaVal, color: "var(--orange)", textDecoration: "none" }}>{entry.author}</Link>
                : <span style={metaVal}>—</span>}
            </div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/detail/__tests__/author-link.test.tsx`
Expected: PASS (the ContentDetailView case may early-return/skip if no authored prompt exists).

- [ ] **Step 5: Commit**

```bash
git add components/detail/DetailView.tsx components/detail/ContentDetailView.tsx components/detail/__tests__/author-link.test.tsx
git commit -m "feat(web): link entry author to its publisher page"
```

---

### Task 6: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Run the whole test suite**

Run: `npm test`
Expected: PASS — all existing tests plus the 4 new test files.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Production build (exercises SSG of `/p/[slug]`)**

Run: `npm run build`
Expected: build succeeds; output lists `/p/[slug]` as a generated (SSG) route.

- [ ] **Step 4: Commit (only if any fix was needed)**

```bash
git add -A
git commit -m "test(publishers): verify full suite, typecheck, and build"
```

---

## Self-Review

**Spec coverage:**
- Derivation `lib/publishers.ts` (group by author, slug map, homepage, lookups) → Task 2. ✅
- Cross-catalog source via `allEntries()` in `lib/site.ts` → Task 1. ✅
- Route `app/p/[slug]/page.tsx` (SSG + `notFound()`) → Task 4. ✅
- `PublisherView` reusing `Card`/`TrustBadge`, highest-tier badge, optional homepage → Task 3. ✅
- Clickable surface = two detail meta rows only; cards/index stay plain → Task 5 (cards untouched). ✅
- i18n `pubKicker`/`pubEntries` → Task 3. ✅
- Tests: publishers (group/slug/invariants incl. owner≠author merge, mixed sort), PublisherView, route 404 via `publisherBySlug` undefined invariant, author-link → Tasks 2–5. ✅
- Out of scope (nav axis, curation overlay, avatars, contract change) → none added. ✅

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every run step shows an exact command + expected result.

**Type consistency:** `Publisher`, `slugifyAuthor`, `groupPublishers`, `publishersIndex`, `publisherBySlug`, `allPublisherSlugs`, `publisherSlug`, `allEntries` are named identically across definition (Tasks 1–2) and every consumer (Tasks 3–5). `publisherSlug(author)` uses `?? ( … || … )` parentheses to avoid the `??`/`||` mix syntax error. Sort relies on `"stars" in e`; the content test fixture deliberately omits the `stars` key so the narrowing behaves.
