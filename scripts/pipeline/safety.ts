// Mirror Aleph scan_for_injection (stricter: clean-or-drop instead of warn).
// Zero-width: U+200B–U+200F, U+FEFF. Bidi: U+202A–U+202E, U+2066–U+2069.
const INVISIBLE = /[​-‏﻿‪-‮⁦-⁩]/g;

// NOTE: SUSPICIOUS + JAILBREAK are a coarse DROP-net, not a complete filter. They
// catch obvious override/jailbreak phrasing; residual whitespace/separator evasion
// is accepted and backstopped by human curation review before an entry ships.

// SUSPICIOUS: injection phrases that try to override instructions (prompt-injection vector).
const SUSPICIOUS = [
  "ignore previous", "ignore all previous", "disregard above", "disregard previous",
  "read .env", "exfiltrate", "send your credentials", "reveal the system prompt",
];

// JAILBREAK: safety-bypass phrases specific to jailbreak attempts.
// Kept attack-specific to avoid false positives (e.g., "developer mode" is legitimate tooling language).
const JAILBREAK = [
  "ignore your safety", "bypass your safety", "ignore all safety",
  "jailbreak", "do anything now", "dan mode",
  "without any restrictions", "pretend you have no rules", "act as an unfiltered",
];

// EVASION: "make AI output pass as human / defeat AI detectors" (灰帽, content kinds §4.3).
// Coarse net — the LLM curator applies the nuanced AI-writing boundary ruling.
const EVASION = [
  "evade ai detect", "bypass ai detect", "avoid ai detect", "beat ai detector",
  "pass as human-written", "humanize ai text", "remove ai fingerprint", "undetectable by ai",
];

export function sanitize(text: string): string {
  return text.replace(INVISIBLE, "");
}

export function scanInjection(text: string): boolean {
  if (INVISIBLE.test(text)) { INVISIBLE.lastIndex = 0; return true; }
  const lower = text.toLowerCase();
  return SUSPICIOUS.some((p) => lower.includes(p));
}

// Producer policy (§4.6): clean invisibles; drop (null) if a suspicious phrase survives.
export function safeOrNull(text: string): string | null {
  const cleaned = sanitize(text);
  const lower = cleaned.toLowerCase();
  if (SUSPICIOUS.some((p) => lower.includes(p))) return null;
  return cleaned;
}

// Producer policy for content payloads: clean invisibles; drop (null) if any injection
// OR jailbreak phrase survives. Used by content curation (prompt body / workflow script).
export function safeBodyOrNull(text: string): string | null {
  const cleaned = sanitize(text);
  const lower = cleaned.toLowerCase();
  if (SUSPICIOUS.some((p) => lower.includes(p))) return null;
  if (JAILBREAK.some((p) => lower.includes(p))) return null;
  if (EVASION.some((p) => lower.includes(p))) return null;
  return cleaned;
}
