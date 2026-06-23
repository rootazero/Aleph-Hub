// Autonomous curator (Phase 2): an Anthropic-backed LlmClient that applies the
// Aleph Hub curation policy as a HARD filter and proposes a bilingual curation record
// or rejects with a reason. Provenance: accepted records are persisted with
// curated_by="llm" so a human can audit/override later (the "review buffer").
//
// Gated on ANTHROPIC_API_KEY: makeLlmCurator() returns null when the key is absent,
// which disables auto-curation entirely (the run still emits human + first-party entries).
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { ExtensionKind, ExtensionCategory } from "@/contract/schema";
import { CONFIG } from "@/scripts/pipeline/config";
import type { LlmClient, LlmCurationInput, LlmCurationResult } from "@/scripts/pipeline/ports";

// Flat schema (nullable record fields) instead of a discriminated union — simplest shape
// for strict JSON-schema structured output. On reject the record fields come back null.
const CurationDecision = z.object({
  decision: z.enum(["accept", "reject"]),
  reason: z.string(),                  // why (esp. which policy rule excluded it)
  name: z.string().nullable(),
  kind: ExtensionKind.nullable(),
  category: ExtensionCategory.nullable(),
  tags: z.array(z.string()).min(1).max(5).nullable(),  // match curate()'s Curated schema (1–5)
  description_en: z.string().nullable(),
  description_zh: z.string().nullable(),
  long_en: z.string().nullable(),
  long_zh: z.string().nullable(),
  sec_note_en: z.string().nullable(),
  sec_note_zh: z.string().nullable(),
});

const SYSTEM_PROMPT = `You are the curator for **Aleph Hub**, a centralized, public directory of Aleph extensions (skills / plugins / MCP servers). You decide whether a discovered GitHub repository belongs in the public catalog, and if so, write its bilingual (English + 简体中文) catalog copy.

Apply the policy below as a HARD filter. When in doubt, REJECT ("不确定就排除"). A public directory entry reads as an endorsement, so the bar is high.

## 铁律 (Iron rule — provenance)
- The entry must trace to a real upstream repository. You are given repo_url; never invent or obscure it.

## 硬排除 (Hard exclude — reject regardless of stars or engineering quality)
- 占卜/玄学: 八字, 紫微, 塔罗, 星座算命, 风水预测 and other pseudoscience presented as knowledge/tools.
- 成人/NSFW: pornography, adult-content generation, sexual "edge" content.
- 灰帽/spam 营销: bulk cold outreach, link farms / backlink spam, fake reviews / engagement farming, scaled SEO manipulation. (Legitimate marketing tools — copywriting, analytics, scheduling — are KEPT; exclude only manipulation/farming.)
- 厂商锁定薄壳 (vendor-lock thin shells): a prompt-only shell that depends entirely on one commercial platform's paid API and is near-worthless off that platform (essentially an ad).

## 边界裁定 (Boundary rulings — apply consistently)
- AI writing: goal = readability / style quality (removing clichés, boilerplate, "AI tone") → ACCEPT. Goal = evading AI detectors / erasing AI fingerprints to pass machine output off as human-written → grey-hat, REJECT.
- Security: defensive (threat hunting, CTI analysis, config/code auditing, regression monitoring) → ACCEPT. Offensive/exploitation (pentest frameworks, vulnerability-hunting fuzzers, exploit development, CAPTCHA/anti-detection bypass, credentialed single-site scaled scraping) → REJECT from a public directory (easy to misuse, and listing equals endorsement).

## 质量门 (Quality gate — judge each repo that clears the rules above)
- Must be a genuine SINGLE extension: a skill repo must have a root SKILL.md. Awesome-lists and multi-skill collections without a root SKILL.md are NOT a single entry → REJECT.
- Substantive content, legitimate provenance, not a thin wrapper.
- Describe it HONESTLY ("描述照实写"): do not oversell. Put dependencies and risks into sec_note_en/sec_note_zh (e.g. "executes shell commands", "needs an API key", "controls a real browser").

## Output
- decision: "accept" or "reject".
- reason: one concise sentence; on reject, name the rule that excluded it.
- On ACCEPT, fill every field:
  - name: human-friendly display name.
  - kind: skill | plugin | mcp (best fit from the repo).
  - category: one of [search, developer, data, productivity, writing, communication, knowledge, files, design, automation, finance, utilities, other].
  - tags: 2–5 short lowercase tags.
  - description_en / description_zh: one faithful sentence each.
  - long_en / long_zh: 1–3 sentences each, factual.
  - sec_note_en / sec_note_zh: honest dependency/risk note (never empty).
- On REJECT, set all record fields to null.`;

function buildUserPrompt(input: LlmCurationInput): string {
  const readme = input.readme.slice(0, CONFIG.LLM_README_CHARS);
  return [
    `repo_url: ${input.repo_url}`,
    `full_name: ${input.full_name}`,
    `stars: ${input.stars}`,
    `license: ${input.license ?? "(none)"}`,
    "",
    "README (truncated):",
    "```",
    readme || "(empty)",
    "```",
  ].join("\n");
}

function toResult(parsed: z.infer<typeof CurationDecision>): LlmCurationResult {
  if (parsed.decision !== "accept") return { decision: "reject", reason: parsed.reason };
  // Accept requires every record field; a null means the model contradicted itself → reject.
  const { name, kind, category, tags, description_en, description_zh, long_en, long_zh, sec_note_en, sec_note_zh } = parsed;
  if (!name || !kind || !category || !tags || !description_en || !description_zh || !long_en || !long_zh || !sec_note_en || !sec_note_zh) {
    return { decision: "reject", reason: "accept with missing fields → treated as reject" };
  }
  return {
    decision: "accept",
    proposal: { name, kind, category, tags, description_en, description_zh, long_en, long_zh, sec_note_en, sec_note_zh },
  };
}

export function makeLlmCurator(): LlmClient | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;                 // no key → auto-curation disabled
  const client = new Anthropic({ apiKey });
  return {
    async curate(input: LlmCurationInput): Promise<LlmCurationResult | null> {
      try {
        const response = await client.messages.parse({
          model: CONFIG.LLM_CURATOR_MODEL,
          max_tokens: 4096,
          thinking: { type: "adaptive" },
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: buildUserPrompt(input) }],
          output_config: { format: zodOutputFormat(CurationDecision) },
        });
        if (!response.parsed_output) return null;   // parse failure → leave queued
        return toResult(response.parsed_output);
      } catch {
        return null;                                // transport/rate-limit error → leave queued
      }
    },
  };
}
