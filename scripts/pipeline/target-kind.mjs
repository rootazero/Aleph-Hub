// Weekly kind partition — the single source of truth for the cron and content entrypoint.
// ISO day-of-week: 1=Mon … 7=Sun. skill/prompt weighted ×2 (highest volume).
const BY_DAY = { 1: "skill", 2: "skill", 3: "plugin", 4: "mcp", 5: "prompt", 6: "prompt", 7: "workflow" };
const CONTENT_KINDS = new Set(["prompt", "workflow"]);

export function kindForDay(day) {
  return BY_DAY[Number(day)] ?? "skill";
}

export function isContentKind(kind) {
  return CONTENT_KINDS.has(kind);
}

// Precedence: explicit --kind=<k> arg > TARGET_KIND env > weekday default.
export function resolveKind(argv, env, day) {
  for (const a of argv ?? []) {
    const m = /^--kind=(.+)$/.exec(a);
    if (m) return m[1];
  }
  return (env && env.TARGET_KIND) || kindForDay(day);
}

// CLI: `node scripts/pipeline/target-kind.mjs 5` → prints "prompt" (no newline).
if (import.meta.url === `file://${process.argv[1]}`) {
  process.stdout.write(kindForDay(process.argv[2]));
}
