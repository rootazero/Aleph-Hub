import type { ContentCandidate } from "@/scripts/pipeline/content-model";

// The committed content queue (data/queue/content-to-curate.json) is a BOUNDED review buffer the
// curation routine consumes — NOT the full backlog. Each candidate embeds its file body, so writing
// the entire discovered set blows GitHub's 100MB file limit (a full prompt discovery is ~200MB).
// slimContentQueue makes it committable + productive: drop already-rejected and over-cap-body units,
// truncate READMEs (curator context only — the verbatim body is kept intact), then cap the count.
export function slimContentQueue(
  queue: ContentCandidate[],
  rejectedIds: ReadonlySet<string>,
  opts: { cap: number; bodyMax: number; readmeChars: number },
): ContentCandidate[] {
  const idOf = (c: ContentCandidate): string => `aleph-hub:${c.owner}/${c.repo}#${c.slug}`;
  return queue
    .filter((c) => !rejectedIds.has(idOf(c)))          // a rejected unit must not reclaim a buffer slot
    .filter((c) => c.raw.text.length <= opts.bodyMax)  // over-cap bodies would be dropped at curate time anyway
    .slice(0, opts.cap)
    .map((c) => (c.readme && c.readme.length > opts.readmeChars
      ? { ...c, readme: c.readme.slice(0, opts.readmeChars) }  // immutable copy; never mutate the source
      : c));
}
