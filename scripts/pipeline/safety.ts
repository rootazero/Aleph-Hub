// Mirror Aleph scan_for_injection (stricter: clean-or-drop instead of warn).
// Zero-width: U+200B–U+200F, U+FEFF. Bidi: U+202A–U+202E, U+2066–U+2069.
const INVISIBLE = /[​-‏﻿‪-‮⁦-⁩]/g;

const SUSPICIOUS = [
  "ignore previous", "ignore all previous", "disregard above", "disregard previous",
  "read .env", "exfiltrate", "send your credentials", "reveal the system prompt",
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
