"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { Theme } from "@/lib/theme";

const Ctx = createContext<{ theme: Theme; toggle: () => void }>({ theme: "light", toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    const initial = (document.documentElement.dataset.theme as Theme) || "light";
    setTheme(initial);
  }, []);
  const toggle = () => setTheme((t) => {
    const next = t === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.theme = next; } catch {}
    return next;
  });
  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}
export const useTheme = () => useContext(Ctx);
