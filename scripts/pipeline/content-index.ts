import { runContent } from "@/scripts/pipeline/content-run";
import { makeAdapters, makeContentCurationStore, makeGitHub } from "@/scripts/pipeline/adapters";
import { GitHubContentSource } from "@/scripts/pipeline/sources/github-content";
import type { ContentSeeds } from "@/scripts/pipeline/sources/content-types";

async function main() {
  const { clock, fs } = makeAdapters();
  const seeds = fs.readJson<ContentSeeds>("data/seeds/content.json")
    ?? { prompt: { queries: [], seeds: [], pins: [] }, workflow: { queries: [], seeds: [], pins: [] } };
  const officialOrgs = new Set((fs.readJson<string[]>("data/seeds/official-orgs.json") ?? []).map((s) => s.toLowerCase()));
  const store = makeContentCurationStore();

  // Pins require a GitHub token to read file contents; with none, fetch() yields [].
  const gh = makeGitHub();
  const sources = [new GitHubContentSource({ gh, seeds: seeds.prompt })];

  const prev = fs.readJson<{ manifest?: { content_hash?: string } }>("public/catalog-content.json");
  const res = await runContent({ sources, store, clock, officialOrgs });

  fs.writeJson("data/queue/content-to-curate.json", res.queue); // always — backlog visibility
  if (res.hash !== prev?.manifest?.content_hash) {              // skip-emit on unchanged content
    fs.writeJson("public/catalog-content.json", res.catalog);
    fs.writeJson("data/site-content.json", res.site);
  }
  console.log(JSON.stringify(res.report, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
