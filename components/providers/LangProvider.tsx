"use client";
import { createContext, useContext, useState } from "react";
import type { Lang } from "@/lib/i18n";

const Ctx = createContext<{ lang: Lang; set: (l: Lang) => void }>({ lang: "zh", set: () => {} });

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("zh");
  const set = (l: Lang) => { setLang(l); try { localStorage.lang = l; } catch {} };
  return <Ctx.Provider value={{ lang, set }}>{children}</Ctx.Provider>;
}
export const useLang = () => useContext(Ctx);
