import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LangProvider } from "@/components/providers/LangProvider";
import { AllView } from "@/components/all/AllView";
import { getAll, getByKind } from "@/lib/catalog";
import { listAll } from "@/lib/list";

const wrap = (ui: React.ReactNode) => render(<ThemeProvider><LangProvider>{ui}</LangProvider></ThemeProvider>);

describe("AllView", () => {
  it("lists entries across every install kind", () => {
    expect(getByKind("skill").length).toBeGreaterThan(0);
    expect(getByKind("mcp").length).toBeGreaterThan(0);
    wrap(<AllView entries={listAll()} />);
    expect(screen.getAllByText(getByKind("skill")[0].name).length).toBeGreaterThan(0);
    expect(screen.getAllByText(getByKind("mcp")[0].name).length).toBeGreaterThan(0);
  });

  it("filters by search query", () => {
    const first = getAll()[0];
    wrap(<AllView entries={listAll()} />);
    expect(screen.getAllByText(first.name).length).toBeGreaterThan(0);
    fireEvent.change(screen.getByPlaceholderText(/搜索|Search/), { target: { value: "zzzzz-no-match" } });
    expect(screen.queryByText(first.name)).toBeNull();
    expect(screen.getByText(/没有找到|No matching/)).toBeInTheDocument();
  });

  it("narrows to a single kind via the kind filter", () => {
    const mcp = getByKind("mcp")[0];
    wrap(<AllView entries={listAll()} />);
    // Picking "Skills" hides an MCP entry.
    fireEvent.click(screen.getByText(/^(技能|Skills)$/));
    expect(screen.queryByText(mcp.name)).toBeNull();
  });
});
