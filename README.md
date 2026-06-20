# Aleph Hub

Centralized extension catalog hub for [Aleph](../Aleph). Crawls and curates
extensions (skills / plugins / MCP servers) from GitHub and other sources, then
publishes a **versioned static catalog artifact** that every Aleph instance
consumes — so all users see one unified, identical browse experience.

- **Stack**: Next.js (App Router) + TypeScript
- **Deploy**: Vercel
- **Role**: the "contract producer" for Aleph's `StaticHubProvider`

## Status

🚧 Scaffold only. The crawl/curation pipeline and the public browse website are
not yet implemented — see `CLAUDE.md` for the architecture and the catalog
contract this project must satisfy.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
```

## Deploy

Vercel auto-detects Next.js — no extra config needed. Push to the connected
repo, or `vercel --prod`.
