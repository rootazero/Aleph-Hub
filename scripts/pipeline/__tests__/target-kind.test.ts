import { describe, it, expect } from "vitest";
import { kindForDay, isContentKind, resolveKind } from "@/scripts/pipeline/target-kind.mjs";

describe("kindForDay", () => {
  it("maps ISO weekday to the partitioned kind", () => {
    expect([1, 2, 3, 4, 5, 6, 7].map((d) => kindForDay(d))).toEqual(
      ["skill", "skill", "plugin", "mcp", "prompt", "prompt", "workflow"],
    );
  });
  it("defaults out-of-range days to skill", () => {
    expect(kindForDay(0)).toBe("skill");
  });
});

describe("isContentKind", () => {
  it("is true only for prompt/workflow", () => {
    expect(isContentKind("prompt")).toBe(true);
    expect(isContentKind("workflow")).toBe(true);
    expect(isContentKind("mcp")).toBe(false);
  });
});

describe("resolveKind", () => {
  it("prefers --kind, then TARGET_KIND, then the weekday", () => {
    expect(resolveKind(["--kind=workflow"], { TARGET_KIND: "prompt" }, 1)).toBe("workflow");
    expect(resolveKind([], { TARGET_KIND: "prompt" }, 1)).toBe("prompt");
    expect(resolveKind([], {}, 7)).toBe("workflow");
  });
});
