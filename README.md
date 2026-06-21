# Aleph Hub

Centralized extension catalog hub for [Aleph](../Aleph). Crawls and curates
extensions (skills / plugins / MCP servers) from GitHub and other sources, then
publishes a **versioned static catalog artifact** that every Aleph instance
consumes — so all users see one unified, identical browse experience.

- **Stack**: Next.js (App Router) + TypeScript
- **Deploy**: Vercel
- **Role**: the "contract producer" for Aleph's `StaticHubProvider`

## Status

The crawl → curate → publish pipeline and the public browse website are live.
A daily GitHub Actions cron runs the whole flow and commits a refreshed catalog
artifact; the site reads `data/site-catalog.json`. See `CLAUDE.md` for the
architecture and the catalog contract this project must satisfy.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
```

## Pipeline

The pipeline discovers candidate extensions (GitHub topics/awesome-lists,
ClawHub, Hermes Atlas), curates them, classifies and enriches them, and emits
`public/catalog.json` (the Aleph contract) + `data/site-catalog.json` (the
browse site).

```bash
npm run pipeline                  # full run: discover → curate → publish
npm run pipeline:regen-firstparty # offline: rebuild artifacts after editing the official seed
npm run validate:catalog          # schema-check the emitted contract
```

Three tracks feed the catalog:

1. **First-party** — Aleph's official skills/plugins, hand-curated in
   `data/seeds/aleph-official.json` (`trust_tier: official`), merged in ahead of
   discovery. They are subdir leaves of the Aleph repos, so they bypass source
   discovery.
2. **Human curation** — records in `data/curation/*.json`. A record is emitted
   only when its repo is rediscovered by a source that run (queue ≠ worklist).
3. **Autonomous curation (LLM)** — for the discovered backlog with no human
   record, an Anthropic-backed curator applies the curation policy as a hard
   filter ("不确定就排除") and writes accepted records back to
   `data/curation/*.json` with `curated_by: "llm"` (a human-auditable review
   buffer). Capped per run; gated on `ANTHROPIC_API_KEY` (skipped if unset).

### Required secrets (GitHub Actions)

| Secret | Purpose |
|--------|---------|
| `GH_PAT` | Checkout/push identity so the commit triggers Vercel's deploy |
| `GH_TOKEN` | GitHub API auth for discovery/metadata (raises rate limits) |
| `ANTHROPIC_API_KEY` | Enables autonomous LLM curation; without it the run still publishes human + first-party entries |

## Deploy

Vercel auto-detects Next.js — no extra config needed. Push to the connected
repo, or `vercel --prod`.
