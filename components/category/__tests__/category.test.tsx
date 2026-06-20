import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LangProvider } from "@/components/providers/LangProvider";
import { CategoryView } from "@/components/category/CategoryView";

const wrap = (ui: React.ReactNode) => render(<ThemeProvider><LangProvider>{ui}</LangProvider></ThemeProvider>);

describe("CategoryView", () => {
  it("lists mcp entries and filters by search query", () => {
    wrap(<CategoryView kind="mcp" />);
    expect(screen.getByText("playwright-mcp")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/搜索|Search/), { target: { value: "supabase" } });
    expect(screen.queryByText("playwright-mcp")).toBeNull();
    expect(screen.getByText("supabase-mcp")).toBeInTheDocument();
  });
  it("shows no-results for an impossible query", () => {
    wrap(<CategoryView kind="mcp" />);
    fireEvent.change(screen.getByPlaceholderText(/搜索|Search/), { target: { value: "zzzzz" } });
    expect(screen.getByText(/没有找到|No matching/)).toBeInTheDocument();
  });
});
