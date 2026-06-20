import { describe, it, expect } from "vitest";
import { CONFIG, via } from "@/scripts/pipeline/config";

describe("pipeline config", () => {
  it("maps via from source id, not module name", () => {
    expect(via("github", "acme")).toBe("github:acme");
    expect(via("clawhub")).toBe("clawhub");
    expect(via("hermesatlas")).toBe("hermes-atlas");
  });
  it("exposes the floor-gate + budget thresholds", () => {
    expect(CONFIG.MIN_ENTRIES).toBeGreaterThan(0);
    expect(CONFIG.MAX_DROP_PCT).toBeGreaterThan(0);
    expect(CONFIG.MAX_DROP_PCT).toBeLessThanOrEqual(1);
    expect(CONFIG.SOURCE_PRIORITY[0]).toBe("github");
  });
});
