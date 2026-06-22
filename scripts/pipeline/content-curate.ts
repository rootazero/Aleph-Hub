import { z } from "zod";
import { ExtensionCategory } from "@/contract/schema";
import { ContentKind, ContentFormat } from "@/contract/content-schema";
import { CONFIG } from "@/scripts/pipeline/config";
import { safeOrNull, safeBodyOrNull } from "@/scripts/pipeline/safety";
import type { ContentCurationRecord } from "@/scripts/pipeline/ports";
import type { ContentCuratedEntry } from "@/scripts/pipeline/content-model";

// Re-validate the record against the content contract's value space.
const Curated = z.object({
  id: z.string().min(1),
  full_name: z.string().min(1),
  slug: z.string().min(1),
  source_path: z.string().min(1),
  kind: ContentKind,
  category: ExtensionCategory,
  name: z.string().min(1),
  tags: z.array(z.string()).max(5),
  format: ContentFormat,
  body: z.string().min(1).max(CONFIG.CONTENT_BODY_MAX),
  description_en: z.string().min(1), description_zh: z.string().min(1),
  long_en: z.string().min(1), long_zh: z.string().min(1),
  sec_note_en: z.string().min(1), sec_note_zh: z.string().min(1),
});

export function curateContent(record: ContentCurationRecord): ContentCuratedEntry | null {
  const parsed = Curated.safeParse(record);
  if (!parsed.success) return null;            // bad enum / over-cap body / missing field → drop
  const c = parsed.data;
  const [owner, repo] = c.full_name.split("/");
  if (!owner || !repo) return null;            // unresolvable upstream → drop (provenance)

  // Safety (§4.6 + content): clean/drop name, descriptions, and the payload body.
  const safeName = safeOrNull(c.name);
  const safeEn = safeOrNull(c.description_en);
  const safeZh = safeOrNull(c.description_zh);
  const safeLongEn = safeOrNull(c.long_en);
  const safeLongZh = safeOrNull(c.long_zh);
  const safeSecEn = safeOrNull(c.sec_note_en);
  const safeSecZh = safeOrNull(c.sec_note_zh);
  const safeBody = safeBodyOrNull(c.body);
  if (!safeName || !safeEn || !safeZh || !safeLongEn || !safeLongZh || !safeSecEn || !safeSecZh || !safeBody) return null;

  return {
    id: c.id, kind: c.kind, category: c.category, name: safeName, author: owner,
    tags: c.tags, repo_url: `https://github.com/${owner}/${repo}`, source_path: c.source_path,
    via: `github:${owner}`, body: safeBody, format: c.format,
    description_en: safeEn, description_zh: safeZh,
    long_en: safeLongEn, long_zh: safeLongZh,
    sec_note_en: safeSecEn, sec_note_zh: safeSecZh,
  };
}
