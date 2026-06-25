# Publisher Attribution Facet — Design

**Date:** 2026-06-25
**Status:** Approved (design)
**Scope:** A site-side, build-time-derived **publisher facet**: clicking an author
on a detail page opens `/p/[slug]` listing every entry by that author. Pure
derivation from the existing `author` field. **The Hub↔Aleph wire contract
(`contract/schema.ts`) is untouched** — no schema, pipeline, curation, or artifact
change. Inspired by officialskills.sh's "Publishers" (`/{publisher}/skills`), but
adapted to our data shape.

## Problem / Motivation

officialskills.sh organizes its whole catalog **by vendor/publisher**
(`/microsoft/skills` = 100+ skills, `/anthropics/skills` = 17). That model works
because their catalog is built around vendor monorepos — "official skills from the
dev teams of software vendors" is their headline value.

Our catalog is the **inverse shape**. Measured against `data/site-catalog.json`
(136 entries):

| Metric | Value |
|---|---|
| Total entries | 136 |
| Distinct GitHub-slug owners | 91 |
| Owners with ≥2 entries | **3** (`rootazero` 43, `op7418` 3, `Bhanunamikaze` 2) |
| Owners with exactly 1 entry | 88 |

So a literal "Publishers directory" would today produce 91 pages, 88 of which list a
single skill — it would *not* capture the value officialskills.sh gets. The single
large "publisher" is `rootazero`, our own first-party (`official`) account.

The borrowable kernel is the **mechanism**: make the author a browsable attribution
facet. This reinforces the project's **P-Provenance** principle (every entry credits
a real upstream author) — a better fit for our ethos than a vendor directory. The
raw material already exists: every entry has `author` (0 missing), already rendered
as plain text on cards and detail pages.

## Decisions (with evidence)

Three pivotal choices, each made against real data:

1. **What the facet serves → attribution/provenance**, not a vendor showcase or a
   full directory. Clicking author → that author's entries. Works today even for
   single-entry authors as a canonical "who made this" link, and lays groundwork for
   a richer curated overlay later.

2. **Grouping key → `author` (display name)**, *not* the id-slug owner and *not* the
   GitHub org. Evidence the slug-owner is the wrong key:
   - id slug `context7` but `repo_url` is `github.com/upstash/context7` (author = `Upstash`).
   - id slugs `siliconflow` / `t8star` both actually live under
     `github.com/rootazero/Aleph-mcp/...` (author = `rootazero`).
   - `amap`'s `repo_url` is **npmjs.com**, not GitHub — so a GitHub-org key isn't
     universal either.

   Keying on `author` makes Upstash/MiniMax/高德/ByteDance real publisher groups and
   correctly merges the first-party MCPs (`siliconflow`, `t8star`) with the 43 skills
   into one `rootazero` publisher (~46 entries). Accepted consequence: `author` is
   free text, so a deterministic `author → urlSlug` map is built at module load.

3. **Implementation depth → lean derivation (v1)**, *not* a contract/pipeline-level
   publisher entity and *not yet* a curated overlay. The contract is a sacred
   external boundary; current long-tail data does not justify curation cost.

## Boundary (the contract red line)

`HubCatalogEntry` (`contract/schema.ts`) is the wire contract synced with Aleph
(`../Aleph/src/hub/types.rs`). Adding a `publisher` field would be a breaking change.
Therefore the facet is **derived entirely on the site side from the existing
`author` field** — it touches no wire schema, no pipeline, no curation, and no
published artifact. `SiteEntry` is likewise unchanged: grouping is a `lib/` + UI
concern only.

## Design

### 1. Derivation — new `lib/publishers.ts`

Single source of truth for both linking and routing, so they are internally
consistent by construction. Derives across **both** catalogs (install +
content) — `ContentDetailView` author links must resolve, and a publisher page
should show *all* of an author's work (skills + prompts/workflows alike).

```ts
export interface Publisher {
  slug: string;            // url-safe, unique, deterministic
  name: string;            // = author (display name)
  entries: AnySiteEntry[]; // all entries by this author (install + content), see sort below
  homepage?: string;       // best-effort source root; omitted if not derivable
}

export function publishersIndex(): Publisher[];   // grouped by author
export function publisherBySlug(slug: string): Publisher | undefined;
export function publisherSlug(author: string): string;  // author -> slug (map-backed)
export function allPublisherSlugs(): string[];    // for generateStaticParams
```

- **Source:** add `allEntries(): AnySiteEntry[]` to `lib/site.ts` (it already owns
  the unified model — imports `getAll()` + `getAllContent()` and the `AnySiteEntry`
  type) and group on that. Keeps the union's home in one place.
- **Grouping:** bucket `allEntries()` by `author`. Within a publisher, sort by stars
  desc using `("stars" in e ? e.stars : -1)` so install entries lead and content
  entries (no stars) trail — `<Card>` already renders both shapes via `isContent`.
- **Route namespace:** publisher pages live under `/p/[slug]`, disjoint from
  `/e/[...slug]`, so publisher slugs cannot collide with entry slugs.
- **Slug:** url-safe slugify of `author` — lowercase, whitespace → `-`, keep
  `[a-z0-9-]` (`"高德 AutoNavi"` → `autonavi`, `"火山引擎 ByteDance"` → `bytedance`,
  `MiniMax` → `minimax`). The `author → slug` map is computed once at module load;
  **empty results (pure-CJK author) or collisions get a deterministic stable
  suffix**, guaranteeing uniqueness. Both link generation and `generateStaticParams`
  read this one map.
- **`homepage` (optional provenance touch):** best-effort from members' `repo_url`
  — the GitHub org root when members are on GitHub, else the host root (e.g. npm).
  Omitted when not derivable. Not the primary path; each entry already carries its
  own `repo_url` on its detail page.

### 2. Route — `app/p/[slug]/page.tsx`

Server component mirroring `app/e/[...slug]/page.tsx`:

```ts
export function generateStaticParams() {
  return allPublisherSlugs().map((slug) => ({ slug }));
}
```

Resolve via `publisherBySlug`; unknown slug → `notFound()`. Renders
`<Header /> <PublisherView publisher={…} /> <Footer />`.

### 3. UI — `components/publisher/PublisherView.tsx`

Client component (`useLang`), reusing existing primitives:

- Back link (reuse `t.back`).
- Header: publisher `name`, `"{n} 件作品" / "{n} entries"`, and a `<TrustBadge>` for
  the **highest** `trust_tier` present among the publisher's entries.
- Optional source link: render `homepage` reusing the `viewGithub` button style from
  `DetailView:83`; skip when absent.
- Entry grid: reuse `<Card>` in `repeat(3,1fr)` (matches `related` / `AllView`),
  flat, stars desc.

### 4. Clickable surface (surgical — exactly two edits)

Author text appears in 5 places, but `Card`, `CategoryIndex` (`featRow`/`mainCard`),
and `ContentIndex` rows are each **already a `<Link>`** — a nested anchor there is
invalid HTML. So only the two detail-page meta rows, which are *not* inside a link,
become clickable:

- `components/detail/DetailView.tsx:77` — wrap `{entry.author}` in
  `<Link href={`/p/${publisherSlug(entry.author)}`}>`.
- `components/detail/ContentDetailView.tsx:82` — same.

Card and home-index author text **stay plain** (avoid nested anchors). Link styling
stays subtle, consistent with existing meta values.

### 5. i18n — `lib/i18n.ts`

Add the minimal keys to `Strings` + both `zh`/`en` maps:

- `pubKicker`: `"发布者 · Publisher"` / `"Publisher"`
- `pubEntries`: `"{n} 件作品"` / `"{n} entries"`

Reuse existing `back` and `viewGithub`.

### 6. Testing (matches existing vitest layout)

- `lib/__tests__/publishers.test.ts`:
  - groups by `author` across both catalogs; `rootazero` merges 43 skills +
    `siliconflow` + `t8star`; a content (prompt/workflow) entry lands under its
    author's publisher.
  - owner ≠ author handled (`context7` groups under `Upstash`).
  - slug determinism, uniqueness, and empty/collision fallback.
  - mixed-entry sort: install entries (with stars) lead, content entries trail.
- `components/publisher/__tests__/publisher.test.tsx` + route 404 test, mirroring the
  `category` / `detail` test patterns.

## Out of scope (YAGNI — deferred to a future "Approach 3")

- Top-level "Publishers" navigation axis / directory landing.
- Curated overlay (`data/curation/publishers.json`) enriching name/links/avatar.
- Publisher avatars, bios, publisher-level verification badge.
- Any contract / pipeline / artifact change.

## Implementation file checklist

| File | Change |
|---|---|
| `lib/site.ts` | add `allEntries(): AnySiteEntry[]` (union of install + content) |
| `lib/publishers.ts` | **new** — derivation (group, slug map, homepage, lookups) |
| `app/p/[slug]/page.tsx` | **new** — SSG route + `notFound()` |
| `components/publisher/PublisherView.tsx` | **new** — page UI (reuses `Card`/`TrustBadge`) |
| `lib/i18n.ts` | add `pubKicker`, `pubEntries` to `Strings` + `zh`/`en` |
| `components/detail/DetailView.tsx` | line 77 author → `<Link>` |
| `components/detail/ContentDetailView.tsx` | line 82 author → `<Link>` |
| `lib/__tests__/publishers.test.ts` | **new** |
| `components/publisher/__tests__/publisher.test.tsx` | **new** |
