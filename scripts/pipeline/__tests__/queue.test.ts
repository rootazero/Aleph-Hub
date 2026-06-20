import { describe, it, expect } from "vitest";
import { queueRecord } from "@/scripts/pipeline/queue";
import type { NormalizedCandidate } from "@/scripts/pipeline/model";
import type { RepoMeta } from "@/scripts/pipeline/ports";

const cand: NormalizedCandidate = { repo_url: "https://github.com/acme/bar", via: "github:acme", raw: {}, full_name: "acme/bar", owner: "acme", repo: "bar" };
const meta: RepoMeta = { full_name: "acme/bar", owner: "acme", repo: "bar", stars: 42, license: "MIT", pushed_at: "2026-06-10T00:00:00Z", fork: false, source_full_name: null, default_branch: "main" };

describe("queueRecord", () => {
  it("captures provenance + metric snapshot for an uncurated repo", () => {
    expect(queueRecord(cand, meta)).toEqual({
      full_name: "acme/bar", repo_url: "https://github.com/acme/bar", via: "github:acme",
      stars: 42, pushed_at: "2026-06-10T00:00:00Z",
    });
  });
});
