import { describe, it, expect } from "vitest";
import { ClawHubSource } from "@/scripts/pipeline/sources/clawhub";
import { HermesAtlasSource } from "@/scripts/pipeline/sources/hermes";
import type { Http } from "@/scripts/pipeline/ports";

const page = `<html><body>
  <div class="card"><a href="https://github.com/acme/foo">foo</a></div>
  <div class="card"><a href="https://github.com/other/bar">bar</a></div>
</body></html>`;
const http: Http = { getText: async () => page };

describe("scraper sources", () => {
  it("ClawHubSource extracts upstream github repos with via=clawhub", async () => {
    const cands = await new ClawHubSource({ http, indexUrl: "https://clawhub.ai/" }).fetch();
    expect(cands.map((c) => c.repo_url).sort()).toEqual(["https://github.com/acme/foo", "https://github.com/other/bar"]);
    expect(cands.every((c) => c.via === "clawhub")).toBe(true);
  });
  it("HermesAtlasSource uses via=hermes-atlas", async () => {
    const cands = await new HermesAtlasSource({ http, indexUrl: "https://hermesatlas.com/" }).fetch();
    expect(cands.every((c) => c.via === "hermes-atlas")).toBe(true);
  });
});
