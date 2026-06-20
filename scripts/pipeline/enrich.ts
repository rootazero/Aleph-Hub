import { CONFIG } from "@/scripts/pipeline/config";
import type { RepoMeta } from "@/scripts/pipeline/ports";
import type { EnrichData } from "@/scripts/pipeline/model";

// Cover palette (warm tones echoing the site's design).
const PALETTE = ["#C9542A", "#9E5B2E", "#7A4A2B", "#C98A3C", "#B5562B", "#A86A3A", "#8C5430", "#9C5A2C", "#B0703C", "#7E4A2A", "#A0612F", "#86512C"];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function coverColorFor(fullName: string): string {
  return PALETTE[hash(fullName) % PALETTE.length];
}

export function nextHistory(history: number[], stars: number): number[] {
  return [...history, stars].slice(-CONFIG.STARS_HISTORY_KEEP);
}

export interface EnrichInput { fullName: string; meta: RepoMeta; history: number[]; installCmd: string; }

export function enrich(input: EnrichInput): EnrichData {
  const stars = input.meta.stars;
  const prev = input.history.length ? input.history[input.history.length - 1] : null;
  const trend = prev && prev > 0 ? Math.round(((stars - prev) / prev) * 100) : null;
  const spark = input.history.length ? [...input.history, stars] : [];
  return {
    stars,
    license: input.meta.license ?? undefined,
    updated: input.meta.pushed_at.slice(0, 10),
    trend,
    spark,
    cover_color: coverColorFor(input.fullName),
    install_cmd: input.installCmd,
  };
}
