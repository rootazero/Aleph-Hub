import { describe, it, expect } from "vitest";
import { buildIssueUrl } from "@/lib/submit";

describe("buildIssueUrl", () => {
  it("builds a prefilled GitHub issue URL", () => {
    const url = buildIssueUrl({ repo: "https://github.com/a/b", name: "b", category: "developer", description: "x", tags: "ci, git" });
    expect(url).toContain("https://github.com/rootazero/Aleph-Hub/issues/new");
    expect(url).toContain("template=suggest-extension.yml");
    // URLSearchParams encodes spaces as "+" (form-encoding; GitHub reads it as space).
    const decoded = decodeURIComponent(url).replace(/\+/g, " ");
    expect(decoded).toContain("Repo: https://github.com/a/b");
    expect(decoded).toContain("Name: b");
    expect(decoded).toContain("Suggest extension: b"); // prefilled title
  });
});
