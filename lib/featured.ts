import type { ExtensionKindT } from "@/contract/types";

// Editorially featured extensions per kind, surfaced in each homepage Index
// region. List entries by slug ("owner/repo"); unknown or wrong-kind slugs are
// ignored. Curated slugs lead; the Index then fills with the newest entry and
// top entries by stars, so a kind left empty here still renders sensible picks.
export const FEATURED_BY_KIND: Record<ExtensionKindT, string[]> = {
  skill: [],
  plugin: [],
  mcp: [],
};
