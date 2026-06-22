import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LangProvider } from "@/components/providers/LangProvider";
import { Card } from "@/components/Card";
import { getByKind } from "@/lib/catalog";
import { getContentByKind } from "@/lib/content";

const wrap = (ui: React.ReactNode) => render(<ThemeProvider><LangProvider>{ui}</LangProvider></ThemeProvider>);

describe("Card", () => {
  it("renders an install entry with its star count and detail link", () => {
    const e = getByKind("mcp")[0];
    wrap(<Card entry={e} />);
    expect(screen.getByText(e.name)).toBeInTheDocument();
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe(`/e/${e.id.replace(/^aleph-hub:/, "")}`);
  });
  it("renders a content entry with its format and a path-safe detail link", () => {
    const e = getContentByKind("prompt")[0];
    wrap(<Card entry={e} />);
    expect(screen.getByText(e.name)).toBeInTheDocument();
    expect(screen.getByText(e.format)).toBeInTheDocument();
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe(`/e/${e.id.replace(/^aleph-hub:/, "").replace("#", "/")}`);
  });
});
