import { describe, it, expect } from "vitest";
import { SiteEntry, validateSiteCatalog } from "@/contract/site";

const base = {
  id: "aleph-hub:acme/foo", kind: "mcp", category: "developer",
  name: "Acme Foo", description: "A tool.", repo_url: "https://github.com/acme/foo",
  trust_tier: "verified", install_spec: { type: "mcp_stdio", command: "npx", args: ["@acme/foo"] },
};
const display = {
  description_zh: "一个工具。", description_en: "A tool.",
  long_zh: "长描述。", long_en: "Long description.",
  cover_color: "#C9542A", stars: 1234, trend: null, spark: [],
  install_cmd: "npx aleph add acme-foo", sec_note_zh: "已审核。", sec_note_en: "Reviewed.",
};

describe("site schema", () => {
  it("parses a site entry (contract + display)", () => {
    const e = SiteEntry.parse({ ...base, ...display });
    expect(e).toMatchObject({ name: "Acme Foo", trend: null, spark: [] });
  });
  it("defaults spark to [] and trend nullable", () => {
    const { spark, trend, ...rest } = display;
    const e = SiteEntry.parse({ ...base, ...rest });
    expect(e.spark).toEqual([]);
    expect(e.trend ?? null).toBeNull();
  });
  it("validateSiteCatalog accepts an artifact of site entries", () => {
    const c = validateSiteCatalog({
      manifest: { schema_version: 1, hub_id: "aleph-hub", name: "Aleph Hub" },
      entries: [{ ...base, ...display }],
    });
    expect(c.entries).toHaveLength(1);
  });
});
