import { describe, it, expect } from "vitest";
import { runContent } from "@/scripts/pipeline/content-run";
import { validateContentArtifact } from "@/contract/content-schema";
import type { ContentCurationRecord, ContentLlmClient, ContentLlmResult } from "@/scripts/pipeline/ports";
import type { ContentCandidate } from "@/scripts/pipeline/content-model";
import type { ContentSource } from "@/scripts/pipeline/sources/content-types";

const clock = { nowIso: () => "2026-06-22T00:00:00Z" };

function record(over: Partial<ContentCurationRecord> = {}): ContentCurationRecord {
  return {
    id: "aleph-hub:acme/prompts#hello", full_name: "acme/prompts", slug: "hello",
    source_path: "prompts/hello.md", kind: "prompt", category: "writing", name: "Hello",
    tags: ["greeting"], format: "markdown", body: "Say hello.",
    description_en: "A greeting.", description_zh: "问候。", long_en: "Long.", long_zh: "长。",
    sec_note_en: "Reviewed.", sec_note_zh: "已审核。", ...over,
  };
}
function store(recs: ContentCurationRecord[]) {
  return { get: (id: string) => recs.find((r) => r.id === id) ?? null, all: () => recs };
}
function source(cands: ContentCandidate[]): ContentSource {
  return { id: "github-content", fetch: async () => cands };
}
const cand = (over: Partial<ContentCandidate> = {}): ContentCandidate => ({
  repo_url: "https://github.com/acme/prompts", owner: "acme", repo: "prompts",
  source_path: "p.md", slug: "p", kind: "prompt", via: "github:acme", raw: { text: "x" }, ...over,
});

const acceptProposal = {
  name: "Found", category: "writing", tags: ["t"], description_en: "e", description_zh: "z",
  long_en: "le", long_zh: "lz", sec_note_en: "se", sec_note_zh: "sz",
};
function llm(map: Record<string, ContentLlmResult | null>): ContentLlmClient {
  return { async curate(input) { return input.full_name in map ? map[input.full_name] : null; } };
}

describe("runContent", () => {
  it("emits a valid artifact from curation records", async () => {
    const res = await runContent({ sources: [source([])], store: store([record()]), clock, officialOrgs: new Set(), llm: null });
    const art = validateContentArtifact(res.catalog);
    expect(art.entries).toHaveLength(1);
    expect(art.entries[0].trust_tier).toBe("community");
    expect(res.report.emitted).toBe(1);
  });
  it("marks an entry official when its owner is an official org", async () => {
    const res = await runContent({ sources: [source([])], store: store([record()]), clock, officialOrgs: new Set(["acme"]), llm: null });
    expect(validateContentArtifact(res.catalog).entries[0].trust_tier).toBe("official");
  });
  it("queues discovered candidates that have no curation record", async () => {
    const res = await runContent({
      sources: [source([cand({ owner: "new", repo: "r", slug: "x" })])],
      store: store([record()]), clock, officialOrgs: new Set(), llm: null,
    });
    expect(res.report.queued).toBe(1);
    expect(res.queue[0].owner).toBe("new");
  });
  it("does NOT queue a candidate that already has a record", async () => {
    const res = await runContent({
      sources: [source([cand({ owner: "acme", repo: "prompts", slug: "hello" })])],
      store: store([record()]), clock, officialOrgs: new Set(), llm: null,
    });
    expect(res.report.queued).toBe(0);
  });

  it("auto-curates a queued candidate and returns it for persistence", async () => {
    const c = cand({ owner: "new", repo: "r", slug: "x", kind: "prompt", raw: { text: "Do a thing." } });
    const res = await runContent({
      sources: [source([c])], store: store([]), clock, officialOrgs: new Set(),
      llm: llm({ "new/r": { decision: "accept", proposal: acceptProposal } }),
    });
    expect(res.report.autoCurated).toBe(1);
    expect(res.report.emitted).toBe(1);
    expect(res.report.queued).toBe(0);                 // accepted unit leaves the backlog
    expect(res.newCurations).toHaveLength(1);
    expect(res.newCurations[0].curated_by).toBe("llm");
    expect(res.newCurations[0].id).toBe("aleph-hub:new/r#x");
  });

  it("leaves a rejected candidate queued and unpersisted", async () => {
    const c = cand({ owner: "new", repo: "r", slug: "x" });
    const res = await runContent({
      sources: [source([c])], store: store([]), clock, officialOrgs: new Set(),
      llm: llm({ "new/r": { decision: "reject", reason: "NSFW" } }),
    });
    expect(res.report.autoCurated).toBe(0);
    expect(res.report.queued).toBe(1);
    expect(res.newCurations).toHaveLength(0);
  });

  it("drops an entry whose slug collides with a reserved install slug", async () => {
    const res = await runContent({
      sources: [source([])], store: store([record()]), clock, officialOrgs: new Set(),
      llm: null, reservedSlugs: new Set(["acme/prompts/hello"]),  // matches record id acme/prompts#hello
    });
    expect(res.report.reservedDropped).toBe(1);
    expect(res.report.emitted).toBe(0);
  });
});
