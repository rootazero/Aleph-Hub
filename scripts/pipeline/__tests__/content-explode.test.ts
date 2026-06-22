import { describe, it, expect } from "vitest";
import { isPromptFile, unitSlug } from "@/scripts/pipeline/content-explode";

describe("isPromptFile", () => {
  it("accepts markdown/text prompt files", () => {
    expect(isPromptFile("prompts/summary.md")).toBe(true);
    expect(isPromptFile("a/b/Outline.mdx")).toBe(true);
    expect(isPromptFile("notes.txt")).toBe(true);
  });
  it("rejects doc files and non-text files", () => {
    expect(isPromptFile("README.md")).toBe(false);
    expect(isPromptFile("docs/CHANGELOG.md")).toBe(false);
    expect(isPromptFile("script.js")).toBe(false);
    expect(isPromptFile("Makefile")).toBe(false);
  });
});

describe("unitSlug", () => {
  it("derives a path-stable, repo-unique slug (no slashes)", () => {
    expect(unitSlug("prompts/Writing/Summary.md")).toBe("prompts-writing-summary");
    expect(unitSlug("workflows/find-flaky.js")).toBe("workflows-find-flaky");
  });
  it("collapses runs and trims separators", () => {
    expect(unitSlug("a//b__c.md")).toBe("a-b-c");
  });
});
