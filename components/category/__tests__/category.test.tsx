import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LangProvider } from "@/components/providers/LangProvider";
import { CategoryView } from "@/components/category/CategoryView";
import { getByKind } from "@/lib/catalog";
import { getContentByKind } from "@/lib/content";
import { listByKind } from "@/lib/list";

const wrap = (ui: React.ReactNode) => render(<ThemeProvider><LangProvider>{ui}</LangProvider></ThemeProvider>);

describe("CategoryView", () => {
  it("lists mcp entries and filters by search query", () => {
    const mcp = getByKind("mcp");
    expect(mcp.length).toBeGreaterThan(0);
    const first = mcp[0];
    wrap(<CategoryView kind="mcp" entries={listByKind("mcp")} />);
    expect(screen.getAllByText(first.name).length).toBeGreaterThan(0);
    // searching the entry's own name keeps it...
    fireEvent.change(screen.getByPlaceholderText(/搜索|Search/), { target: { value: first.name } });
    expect(screen.getAllByText(first.name).length).toBeGreaterThan(0);
    // ...and a non-matching query removes it
    fireEvent.change(screen.getByPlaceholderText(/搜索|Search/), { target: { value: "zzzzz-no-match" } });
    expect(screen.queryByText(first.name)).toBeNull();
  });
  it("shows no-results for an impossible query", () => {
    wrap(<CategoryView kind="mcp" entries={listByKind("mcp")} />);
    fireEvent.change(screen.getByPlaceholderText(/搜索|Search/), { target: { value: "zzzzz" } });
    expect(screen.getByText(/没有找到|No matching/)).toBeInTheDocument();
  });
  it("lists prompt entries on the content kind page", () => {
    const prompts = getContentByKind("prompt");
    expect(prompts.length).toBeGreaterThan(0);
    wrap(<CategoryView kind="prompt" entries={listByKind("prompt")} />);
    expect(screen.getAllByText(prompts[0].name).length).toBeGreaterThan(0);
  });
});
