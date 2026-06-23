// File-level collection explosion (plan decision): a repo's prompt files / workflow
// scripts each become one candidate unit. Intra-file multi-prompt extraction is a non-goal.

// Common repo docs that are not prompt units even though they are markdown.
const DOC_STEMS = new Set([
  "readme", "license", "licence", "contributing", "code_of_conduct",
  "changelog", "security", "authors", "notice", "support",
]);
const PROMPT_EXTS = [".md", ".markdown", ".mdx", ".txt", ".prompt"];

export function isPromptFile(path: string): boolean {
  const base = (path.split("/").pop() ?? path).toLowerCase();
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return false;                       // no extension (or dotfile) → skip
  if (!PROMPT_EXTS.includes(base.slice(dot))) return false;
  return !DOC_STEMS.has(base.slice(0, dot));
}

// Path-stable, repo-unique slug: strip extension, lowercase, non-alnum → '-'.
// '/' becomes '-' so the resulting content site-slug is exactly owner/repo/<unit>.
export function unitSlug(path: string): string {
  return path
    .replace(/\.[^./]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
