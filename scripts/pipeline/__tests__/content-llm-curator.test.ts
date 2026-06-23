import { describe, it, expect } from "vitest";
import { toContentResult } from "@/scripts/pipeline/content-llm-curator";

const full = {
  decision: "accept" as const, reason: "ok", name: "Summarizer", category: "writing" as const,
  tags: ["writing"], description_en: "e", description_zh: "z", long_en: "le", long_zh: "lz",
  sec_note_en: "se", sec_note_zh: "sz",
};

describe("toContentResult", () => {
  it("maps a complete accept into a proposal", () => {
    const r = toContentResult(full);
    expect(r.decision).toBe("accept");
    if (r.decision === "accept") expect(r.proposal.name).toBe("Summarizer");
  });
  it("treats an accept with a missing field as a reject", () => {
    const r = toContentResult({ ...full, sec_note_zh: null });
    expect(r.decision).toBe("reject");
  });
  it("passes a reject through with its reason", () => {
    const r = toContentResult({ ...full, decision: "reject", reason: "NSFW", name: null });
    expect(r).toEqual({ decision: "reject", reason: "NSFW" });
  });
});
