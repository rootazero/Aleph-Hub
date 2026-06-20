import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LangProvider } from "@/components/providers/LangProvider";
import { DetailView } from "@/components/detail/DetailView";
import { getByKind } from "@/lib/catalog";

const wrap = (ui: React.ReactNode) => render(<ThemeProvider><LangProvider>{ui}</LangProvider></ThemeProvider>);

describe("DetailView", () => {
  it("renders name, install command, and switches to the security tab", () => {
    const e = getByKind("mcp")[0];
    wrap(<DetailView entry={e} />);
    expect(screen.getByRole("heading", { name: e.name })).toBeInTheDocument();
    expect(screen.getByText(e.install_cmd)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/安全|Security/));
    // the security tab always shows the static "review before install" note
    expect(screen.getByText(/审核|review/i)).toBeInTheDocument();
  });
});
