// Mirror Aleph scan_for_injection (stricter: clean-or-drop instead of warn).
// Zero-width: U+200B–U+200F, U+FEFF. Bidi: U+202A–U+202E, U+2066–U+2069.
const INVISIBLE = /[​-‏﻿‪-‮⁦-⁩]/g;

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
  return cleaned;
}
