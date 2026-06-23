// Autonomous content curator: an Anthropic-backed ContentLlmClient that applies the Aleph
// Hub content policy as a HARD filter and authors bilingual catalog copy. It NEVER rewrites
// the payload — the body stays the upstream file verbatim (provenance). Gated on
// ANTHROPIC_API_KEY: makeContentLlmCurator() returns null when the key is absent.
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { ExtensionCategory } from "@/contract/schema";
import { CONFIG } from "@/scripts/pipeline/config";
import type { ContentLlmClient, ContentLlmInput, ContentLlmResult } from "@/scripts/pipeline/ports";

// Flat nullable schema (record fields null on reject) — simplest strict structured output.
const ContentDecision = z.object({
  decision: z.enum(["accept", "reject"]),
  reason: z.string(),
  name: z.string().nullable(),
  category: ExtensionCategory.nullable(),
  tags: z.array(z.string()).min(1).max(5).nullable(),
  description_en: z.string().nullable(),
  description_zh: z.string().nullable(),
  long_en: z.string().nullable(),
  long_zh: z.string().nullable(),
  sec_note_en: z.string().nullable(),
  sec_note_zh: z.string().nullable(),
});

const SYSTEM_PROMPT = `You are the curator for **Aleph Hub**'s CONTENT catalog — public, copy-and-run prompts and workflow scripts (not installable extensions). You decide whether a discovered file belongs in the public catalog, and if so, write its bilingual (English + 简体中文) catalog copy. You do NOT rewrite the file; you only judge it and describe it.

Apply the policy below as a HARD filter. When in doubt, REJECT ("不确定就排除"). A public directory entry reads as an endorsement.

## 铁律 (provenance)
- The unit must trace to the real upstream file you are given (repo_url + source_path). Never invent or obscure it.

## 硬排除 (hard exclude — regardless of quality)
- 占卜/玄学 (八字, 紫微, 塔罗, 星座算命, 风水预测) presented as knowledge/tools.
- 成人/NSFW.
- 灰帽/spam 营销: bulk cold outreach, link/backlink farms, fake reviews / engagement farming, scaled SEO manipulation. (Legitimate copywriting/analytics/scheduling are KEPT.)
- 厂商锁定薄壳: a prompt that is worthless off one commercial platform (essentially an ad).
- Content-specific: jailbreak / safety-bypass / prompt-injection payloads. "Evade AI detectors / strip AI fingerprints to pass machine output off as human-written" → REJECT (灰帽).

## 边界裁定
- AI writing: readability / style quality (removing clichés, "AI tone") → ACCEPT. Detection evasion → REJECT.
- Security: defensive (threat hunting, CTI, config/code auditing, regression monitoring) → ACCEPT. Offensive/exploitation (pentest frameworks, vuln-hunting fuzzers, exploit dev, CAPTCHA/anti-detection bypass, credentialed single-site scaled scraping) → REJECT.

## 质量门
- prompt: a genuine, reusable prompt with substantive content — not a stub, not a thin vendor shell.
- workflow: a real Claude Code Agent Workflow .js script (it declares meta and orchestrates agents). Judge what the script actually does.
- Describe HONESTLY ("描述照实写"). Put dependencies and risks into sec_note_en/sec_note_zh (e.g. "runs shell via agents", "needs an API key", "controls a browser"). Never empty.

## Output
- decision: "accept" or "reject".
- reason: one concise sentence; on reject, name the rule that excluded it.
- On ACCEPT, fill every field: name (display name); category (one of [search, developer, data, productivity, writing, communication, knowledge, files, design, automation, finance, utilities, other]); tags (2–5 short lowercase); description_en/zh (one faithful sentence each); long_en/zh (1–3 sentences each, factual); sec_note_en/zh (honest dependency/risk note).
- On REJECT, set all record fields to null.`;

function buildUserPrompt(input: ContentLlmInput): string {
  return [
    `kind: ${input.kind}`,
    `repo_url: ${input.repo_url}`,
    `full_name: ${input.full_name}`,
    `source_path: ${input.source_path}`,
    "",
    "FILE (the payload, truncated):",
    "```",
    input.body.slice(0, CONFIG.LLM_BODY_CHARS) || "(empty)",
    "```",
    "",
    "REPO README (context, truncated):",
    "```",
    input.readme.slice(0, CONFIG.LLM_README_CHARS) || "(empty)",
    "```",
  ].join("\n");
}

// Exported for unit testing (pure mapping; an accept with any missing field → reject).
export function toContentResult(parsed: z.infer<typeof ContentDecision>): ContentLlmResult {
  if (parsed.decision !== "accept") return { decision: "reject", reason: parsed.reason };
  const { name, category, tags, description_en, description_zh, long_en, long_zh, sec_note_en, sec_note_zh } = parsed;
  if (!name || !category || !tags || !description_en || !description_zh || !long_en || !long_zh || !sec_note_en || !sec_note_zh) {
    return { decision: "reject", reason: "accept with missing fields → treated as reject" };
  }
  return { decision: "accept", proposal: { name, category, tags, description_en, description_zh, long_en, long_zh, sec_note_en, sec_note_zh } };
}

export function makeContentLlmCurator(): ContentLlmClient | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const client = new Anthropic({ apiKey });
  return {
    async curate(input: ContentLlmInput): Promise<ContentLlmResult | null> {
      try {
        const response = await client.messages.parse({
          model: CONFIG.LLM_CURATOR_MODEL,
          max_tokens: 4096,
          thinking: { type: "adaptive" },
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: buildUserPrompt(input) }],
          output_config: { format: zodOutputFormat(ContentDecision) },
        });
        if (!response.parsed_output) return null;
        return toContentResult(response.parsed_output);
      } catch {
        return null;
      }
    },
  };
}
