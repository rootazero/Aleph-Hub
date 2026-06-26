import {
  getAll, trending, editorsPick, editorialPicks,
  kindCounts, flagshipOfKind, featuredOfKind, newestOfKind,
} from "@/lib/catalog";
import { getAllContent, contentKindCounts, flagshipContent, featuredContent } from "@/lib/content";
import { installToList } from "@/lib/list";
import type { ListEntry } from "@/lib/entry";
import type { SiteEntryT } from "@/contract/site";
import type { ContentSiteEntryT } from "@/contract/content-site";
import type { ExtensionKindT } from "@/contract/types";
import type { ContentKindT, ContentFormatT } from "@/contract/content-schema";

// Slim view models for the homepage sections. Like lib/list, this imports the full
// catalog JSON and must be used ONLY from the server page so the heavy detail-only
// fields (body, long_*, install_spec) stay out of the homepage client bundle. Each
// section only ever reads card-level fields plus cover_color (and install_cmd for the
// editor's pick), so that is all we project.

export type HomeInstallCard = {
  id: string; name: string; author?: string; kind: ExtensionKindT; stars: number;
  cover_color: string; install_cmd: string; description_zh: string; description_en: string; isNew: boolean;
};
export type HomeContentCard = {
  id: string; name: string; author?: string; kind: ContentKindT; format: ContentFormatT;
  cover_color: string; description_zh: string; description_en: string;
};
export type HomeFeatRow = { id: string; name: string; author?: string; stars: number; isNew: boolean };
export type HomeContentRow = { id: string; name: string; author?: string; format: ContentFormatT };

export type InstallRegion = { kind: ExtensionKindT; count: number; main: HomeInstallCard | null; rows: HomeFeatRow[] };
export type ContentRegion = { kind: ContentKindT; count: number; main: HomeContentCard | null; rows: HomeContentRow[] };
export type CollectionPick = { category: string; entry: HomeInstallCard };

export type HomeModel = {
  total: number;
  editorsPick: HomeInstallCard;
  trending: ListEntry[];
  installRegions: InstallRegion[];
  contentRegions: ContentRegion[];
  collection: CollectionPick[];
};

function installCard(e: SiteEntryT, newestId?: string): HomeInstallCard {
  return {
    id: e.id, name: e.name, author: e.author, kind: e.kind, stars: e.stars,
    cover_color: e.cover_color, install_cmd: e.install_cmd,
    description_zh: e.description_zh, description_en: e.description_en, isNew: e.id === newestId,
  };
}
function featRow(e: SiteEntryT, newestId?: string): HomeFeatRow {
  return { id: e.id, name: e.name, author: e.author, stars: e.stars, isNew: e.id === newestId };
}
function contentCard(e: ContentSiteEntryT): HomeContentCard {
  return {
    id: e.id, name: e.name, author: e.author, kind: e.kind, format: e.format,
    cover_color: e.cover_color, description_zh: e.description_zh, description_en: e.description_en,
  };
}
function contentRow(e: ContentSiteEntryT): HomeContentRow {
  return { id: e.id, name: e.name, author: e.author, format: e.format };
}

const INSTALL_ORDER: ExtensionKindT[] = ["skill", "mcp", "plugin"];
const CONTENT_ORDER: ContentKindT[] = ["prompt", "workflow"];

export function homeModel(): HomeModel {
  const kc = kindCounts();
  const cc = contentKindCounts();
  return {
    total: getAll().length + getAllContent().length,
    editorsPick: installCard(editorsPick()),
    trending: trending(6).map(installToList),
    installRegions: INSTALL_ORDER.map((k) => {
      const newestId = newestOfKind(k)?.id;
      const main = flagshipOfKind(k);
      const rows = main ? featuredOfKind(k, 7).filter((e) => e.id !== main.id).slice(0, 6) : [];
      return { kind: k, count: kc[k], main: main ? installCard(main, newestId) : null, rows: rows.map((e) => featRow(e, newestId)) };
    }),
    contentRegions: CONTENT_ORDER.map((k) => {
      const main = flagshipContent(k);
      const rows = main ? featuredContent(k, 6) : [];
      return { kind: k, count: cc[k], main: main ? contentCard(main) : null, rows: rows.map(contentRow) };
    }),
    collection: editorialPicks(3).map(({ category, entry }) => ({ category, entry: installCard(entry) })),
  };
}
