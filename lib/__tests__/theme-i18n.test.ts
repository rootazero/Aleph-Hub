import { describe, it, expect } from "vitest";
import { PALETTES, paletteToCssVars } from "@/lib/theme";
import { STRINGS, CATEGORY_LABELS } from "@/lib/i18n";

describe("theme + i18n", () => {
  it("has light and dark palettes with the orange accent", () => {
    expect(PALETTES.light.orange).toBe("#C9501A");
    expect(PALETTES.dark.orange).toBe("#EE863F");
  });
  it("paletteToCssVars emits --orange etc.", () => {
    const vars = paletteToCssVars("light");
    expect(vars["--orange"]).toBe("#C9501A");
    expect(vars["--bg"]).toBe("#F4EBDD");
  });
  it("has zh and en strings for the submit label", () => {
    expect(STRINGS.zh.submit).toBe("提交");
    expect(STRINGS.en.submit).toBe("Submit");
  });
  it("has bilingual labels for all 13 categories", () => {
    expect(CATEGORY_LABELS.developer.en).toBe("Developer");
    expect(CATEGORY_LABELS.developer.zh).toBe("开发者");
    expect(Object.keys(CATEGORY_LABELS)).toHaveLength(13);
  });
});
