import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LangProvider } from "@/components/providers/LangProvider";
import { DetailView } from "@/components/detail/DetailView";
import { bySlug } from "@/lib/catalog";

const wrap = (ui: React.ReactNode) => render(<ThemeProvider><LangProvider>{ui}</LangProvider></ThemeProvider>);

describe("DetailView", () => {
  it("renders name, install command, and switches to the security tab", () => {
    const e = bySlug("microsoft/playwright-mcp")!;
    wrap(<DetailView entry={e} />);
    expect(screen.getByRole("heading", { name: "playwright-mcp" })).toBeInTheDocument();
    expect(screen.getByText("npx aleph add playwright-mcp")).toBeInTheDocument();
    fireEvent.click(screen.getByText(/安全|Security/));
    expect(screen.getByText(/审核|review/i)).toBeInTheDocument();
  });
});
