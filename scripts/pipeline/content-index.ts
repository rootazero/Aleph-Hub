import { runContent } from "@/scripts/pipeline/content-run";
import { makeAdapters, makeContentCurationStore, makeContentGitHub } from "@/scripts/pipeline/adapters";
import { makeContentLlmCurator } from "@/scripts/pipeline/content-llm-curator";
import { GitHubContentSource } from "@/scripts/pipeline/sources/github-content";
import { slimContentQueue } from "@/scripts/pipeline/content-queue";
import { resolveKind, isContentKind } from "@/scripts/pipeline/target-kind.mjs";
import { CONFIG } from "@/scripts/pipeline/config";
import type { ContentSeeds } from "@/scripts/pipeline/sources/content-types";
import type { ContentKindT } from "@/contract/content-schema";
import type { FileStore } from "@/scripts/pipeline/ports";

// Install site-slugs (owner/repo) the content axis must not shadow (lib/site.ts throws on collision).
function installSiteSlugs(fs: FileStore): Set<string> {
  const cat = fs.readJson<{ entries?: { id: string }[] }>("data/site-catalog.json");
  return new Set((cat?.entries ?? []).map((e) => e.id.replace(/^aleph-hub:/, "")));
}

async function main() {
  const { clock, fs, http } = makeAdapters();
  const day = new Date().getUTCDay() || 7;             // JS Sun=0 → ISO 7
  const resolved = resolveKind(process.argv.slice(2), process.env, day);
  const kind: ContentKindT = (isContentKind(resolved) ? resolved : "prompt") as ContentKindT;

  const seeds = fs.readJson<ContentSeeds>("data/seeds/content.json")
    ?? { prompt: { queries: [], seeds: [], pins: [] }, workflow: { queries: [], seeds: [], pins: [] } };
  const officialOrgs = new Set((fs.readJson<string[]>("data/seeds/official-orgs.json") ?? []).map((s) => s.toLowerCase()));
  const store = makeContentCurationStore();
  const gh = makeContentGitHub();
  const llm = makeContentLlmCurator();                  // null unless ANTHROPIC_API_KEY is set
  const sources = [new GitHubContentSource({ gh, http, kind, seeds: seeds[kind] })];
  const reservedSlugs = installSiteSlugs(fs);

  const prev = fs.readJson<{ manifest?: { content_hash?: string } }>("public/catalog-content.json");
  const res = await runContent({ sources, store, clock, officialOrgs, llm, reservedSlugs });

  // Persist LLM-authored records (review buffer): data/curation-content/<owner>__<repo>__<slug>.json
  for (const rec of res.newCurations) {
    fs.writeJson(`data/curation-content/${rec.full_name.replace(/\//g, "__")}__${rec.slug}.json`, rec);
  }
  // Committed queue = bounded review buffer (excludes rejected, caps count, embeds bodies). The full
  // backlog would exceed GitHub's 100MB file limit; res.report.queued still reports the true depth.
  const rejected = new Set(fs.readJson<string[]>("data/queue/content-rejected.json") ?? []);
  const buffer = slimContentQueue(res.queue, rejected, {
    cap: CONFIG.CONTENT_QUEUE_BUFFER, bodyMax: CONFIG.CONTENT_BODY_MAX, readmeChars: CONFIG.CONTENT_QUEUE_README_CHARS,
  });
  fs.writeJson("data/queue/content-to-curate.json", buffer);
  if (res.hash !== prev?.manifest?.content_hash) {               // skip-emit on unchanged content
    fs.writeJson("public/catalog-content.json", res.catalog);
    fs.writeJson("data/site-content.json", res.site);
  }
  console.log(JSON.stringify({ kind, ...res.report }, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
