import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LangProvider } from "@/components/providers/LangProvider";
import { Header } from "@/components/Header";

const wrap = (ui: React.ReactNode) => render(<ThemeProvider><LangProvider>{ui}</LangProvider></ThemeProvider>);

describe("Header", () => {
  it("renders brand and a submit control", () => {
    wrap(<Header />);
    expect(screen.getByText("ALEPH HUB")).toBeInTheDocument();
    expect(screen.getByText("提交")).toBeInTheDocument(); // zh default
  });
  it("switches language label to English", () => {
    wrap(<Header />);
    fireEvent.click(screen.getByText("EN"));
    expect(screen.getByText("Submit")).toBeInTheDocument();
  });
});
