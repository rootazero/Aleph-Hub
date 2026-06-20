import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LangProvider } from "@/components/providers/LangProvider";
import Home from "@/app/page";

describe("Home", () => {
  it("renders hero kicker, stats, and a trending card", () => {
    render(<ThemeProvider><LangProvider><Home /></LangProvider></ThemeProvider>);
    // kicker is intentionally identical in zh and en (per mockup line 334), so the
    // zh-default render still shows the English atlas line.
    expect(screen.getByText("The Agent Capability Atlas")).toBeInTheDocument();
    // projects count = getAll().length = 12, asserted via a stable testid (not a
    // bare getByText("12"), which would collide with card "▲12%" / cats "13").
    expect(screen.getByTestId("stat-projects")).toHaveTextContent("12");
    // an entry name appears in trending/collection (langgraph is in trending(6))
    expect(screen.getAllByText("langgraph").length).toBeGreaterThan(0);
  });
});
