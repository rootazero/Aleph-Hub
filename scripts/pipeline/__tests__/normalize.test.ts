import { describe, it, expect } from "vitest";
import { rawToCandidate } from "@/scripts/pipeline/normalize";

describe("rawToCandidate", () => {
  it("maps via from the github source with the repo owner", () => {
    const c = rawToCandidate("github", "https://github.com/acme/foo", { readme: "x" });
    expect(c).toMatchObject({ repo_url: "https://github.com/acme/foo", via: "github:acme" });
  });
  it("maps via from clawhub regardless of owner", () => {
    expect(rawToCandidate("clawhub", "https://github.com/acme/foo", {})?.via).toBe("clawhub");
  });
  it("drops a non-github url (provenance, D7)", () => {
    expect(rawToCandidate("hermesatlas", "https://example.com/thing", {})).toBeNull();
  });
});
