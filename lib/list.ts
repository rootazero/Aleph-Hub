import { getAll, getByKind } from "@/lib/catalog";
import { getAllContent, getContentByKind } from "@/lib/content";
import type { ListEntry } from "@/lib/entry";
import type { SiteEntryT } from "@/contract/site";
import type { ContentSiteEntryT } from "@/contract/content-site";
import type { ExtensionKindT } from "@/contract/types";
import type { ContentKindT } from "@/contract/content-schema";

type AnyKind = ExtensionKindT | ContentKindT;
function isContentKind(k: AnyKind): k is ContentKindT {
  return k === "prompt" || k === "workflow";
}

// Project a full catalog entry down to the browse-list shape, dropping the heavy
// fields (body, long_*, sec_note_*, install_spec) that only the detail page needs.
// IMPORTANT: this module imports the full catalog JSON, so it must be used only from
// Server Components / scripts — never a "use client" component — so the heavy data
// stays server-side and out of the route's client bundle.
function commonFields(e: SiteEntryT | ContentSiteEntryT) {
  return {
    id: e.id,
    name: e.name,
    author: e.author,
    trust_tier: e.trust_tier,
    description_zh: e.description_zh,
    description_en: e.description_en,
    category: e.category,
    tags: e.tags,
  };
}
export function installToList(e: SiteEntryT): ListEntry {
  return { ...commonFields(e), kind: e.kind, stars: e.stars, trend: e.trend, spark: e.spark };
}
export function contentToList(e: ContentSiteEntryT): ListEntry {
  return { ...commonFields(e), kind: e.kind, format: e.format };
}

// Slim union of both catalogs for the "/all" browse page.
export function listAll(): ListEntry[] {
  return [...getAll().map(installToList), ...getAllContent().map(contentToList)];
}

// Slim entries for a single kind's "/c/[kind]" page.
export function listByKind(kind: AnyKind): ListEntry[] {
  return isContentKind(kind) ? getContentByKind(kind).map(contentToList) : getByKind(kind).map(installToList);
}
