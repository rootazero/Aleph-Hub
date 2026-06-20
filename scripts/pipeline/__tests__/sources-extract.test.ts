import { describe, it, expect } from "vitest";
import { extractGitHubLinks } from "@/scripts/pipeline/sources/types";

describe("extractGitHubLinks", () => {
  it("pulls unique github repo urls out of html/markdown", () => {
    const html = `<a href="https://github.com/acme/foo">foo</a> see https://github.com/acme/foo/issues and https://github.com/other/bar.git plus https://example.com/x`;
    expect(extractGitHubLinks(html).sort()).toEqual([
      "https://github.com/acme/foo",
      "https://github.com/other/bar",
    ]);
  });
});
