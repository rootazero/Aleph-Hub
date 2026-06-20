export type Theme = "light" | "dark";

// Palette values ported verbatim from the mockup (Aleph Hub.dc.html lines 270-271).
export const PALETTES: Record<Theme, Record<string, string>> = {
  light: { bg: "#F4EBDD", paper: "#FBF6EE", panel: "#FFFFFF", ink: "#241C16", "ink-soft": "#5C4F42", taupe: "#8A7B6B", hair: "#E4D9C8", "hair-strong": "#241C16", orange: "#C9501A", chip: "#EDE3D3", green: "#4E6B4A" },
  dark:  { bg: "#17120D", paper: "#1F1811", panel: "#271F17", ink: "#F2E8DA", "ink-soft": "#C3B4A1", taupe: "#8F8273", hair: "#372B20", "hair-strong": "#C3B4A1", orange: "#EE863F", chip: "#2C2218", green: "#83A971" },
};

export const THEME_VARS = Object.keys(PALETTES.light);

export function paletteToCssVars(theme: Theme): Record<string, string> {
  const p = PALETTES[theme];
  return Object.fromEntries(Object.keys(p).map((k) => [`--${k}`, p[k]]));
}
