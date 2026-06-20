"use client";
import { useLang } from "@/components/providers/LangProvider";
import { STRINGS } from "@/lib/i18n";

export function Footer() {
  const { lang } = useLang();
  const t = STRINGS[lang];
  return (
    <footer style={{ borderTop: "1px solid var(--hair)", marginTop: 20, padding: "40px 48px", maxWidth: 1480, marginLeft: "auto", marginRight: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 26, color: "var(--orange)" }}>ℵ</span>
        <span style={{ fontSize: 12, letterSpacing: ".28em", fontWeight: 600 }}>ALEPH HUB</span>
      </div>
      <span style={{ fontSize: 12, color: "var(--taupe)", letterSpacing: ".04em" }}>{t.footer}</span>
      <span style={{ fontSize: 12, color: "var(--taupe)" }}>© 2026 · {t.footerTag}</span>
    </footer>
  );
}
