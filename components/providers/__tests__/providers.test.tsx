import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, useTheme } from "@/components/providers/ThemeProvider";
import { LangProvider, useLang } from "@/components/providers/LangProvider";

function Probe() {
  const { theme, toggle } = useTheme();
  const { lang, set } = useLang();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="lang">{lang}</span>
      <button onClick={toggle}>t</button>
      <button onClick={() => set("en")}>en</button>
    </div>
  );
}

describe("providers", () => {
  it("toggles theme and sets lang", () => {
    render(<ThemeProvider><LangProvider><Probe /></LangProvider></ThemeProvider>);
    expect(screen.getByTestId("theme").textContent).toBe("light");
    fireEvent.click(screen.getByText("t"));
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    fireEvent.click(screen.getByText("en"));
    expect(screen.getByTestId("lang").textContent).toBe("en");
  });
});
