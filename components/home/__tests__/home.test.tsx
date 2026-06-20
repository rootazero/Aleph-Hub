import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LangProvider } from "@/components/providers/LangProvider";
import Home from "@/app/page";
import { getAll, trending } from "@/lib/catalog";

describe("Home", () => {
  it("renders hero kicker, stats, and a trending card", () => {
    render(<ThemeProvider><LangProvider><Home /></LangProvider></ThemeProvider>);
    // kicker is intentionally identical in zh and en (per mockup line 334), so the
    // zh-default render still shows the English atlas line.
    expect(screen.getByText("The Agent Capability Atlas")).toBeInTheDocument();
    // projects count = getAll().length, asserted via a stable testid (not a bare
    // getByText(n), which would collide with card "▲n%" / category counts).
    expect(screen.getByTestId("stat-projects")).toHaveTextContent(String(getAll().length));
    // a trending entry's name renders somewhere on the page
    expect(screen.getAllByText(trending(6)[0].name).length).toBeGreaterThan(0);
  });
});
