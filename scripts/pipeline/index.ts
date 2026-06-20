import { run } from "@/scripts/pipeline/run";
import { makeAdapters } from "@/scripts/pipeline/adapters";
import { GitHubSource } from "@/scripts/pipeline/sources/github";
import { ClawHubSource } from "@/scripts/pipeline/sources/clawhub";
import { HermesAtlasSource } from "@/scripts/pipeline/sources/hermes";

async function main() {
  const { gh, llm, registry, http, clock, fs } = makeAdapters();
  const seeds = fs.readJson<{ queries: string[]; seeds: string[] }>("data/seeds/github.json")!;
  const officialOrgs = new Set((fs.readJson<string[]>("data/seeds/official-orgs.json") ?? []).map((s) => s.toLowerCase()));
  const history = fs.readJson<Record<string, number[]>>("data/stars-history.json") ?? {};
  const prev = fs.readJson<{ entries: unknown[] }>("public/catalog.json");
  const sources = [
    new GitHubSource({ gh, http, seeds }),
    new ClawHubSource({ http, indexUrl: "https://clawhub.ai/" }),
    new HermesAtlasSource({ http, indexUrl: "https://hermesatlas.com/" }),
  ];
  const res = await run({ sources, gh, llm, registry, http, clock, officialOrgs, history, prevContractCount: prev?.entries.length ?? 0 });
  fs.writeJson("public/catalog.json", res.catalog);
  fs.writeJson("data/site-catalog.json", res.site);
  fs.writeJson("data/stars-history.json", res.nextHistory);
  fs.writeText("data/.heartbeat", res.heartbeat);
  console.log(JSON.stringify(res.report, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
