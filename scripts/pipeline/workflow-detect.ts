// Workflow detection signature (spec §4.1 / D4): a Claude Code Agent Workflow is a
// single .js file declaring `export const meta` AND calling at least one orchestration
// hook. This is a coarse classifier — the LLM curator applies the real policy gate.
const HOOKS = ["agent(", "pipeline(", "phase("];

export function isWorkflowScript(text: string): boolean {
  if (!text.includes("export const meta")) return false;
  return HOOKS.some((h) => text.includes(h));
}
