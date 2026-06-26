import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LangProvider } from "@/components/providers/LangProvider";
import { ContentIndex } from "@/components/home/ContentIndex";
import { flagshipContent } from "@/lib/content";
import { homeModel } from "@/lib/home";

const wrap = (ui: React.ReactNode) => render(<ThemeProvider><LangProvider>{ui}</LangProvider></ThemeProvider>);

describe("ContentIndex", () => {
  it("renders a Prompts region with the flagship prompt", () => {
    wrap(<ContentIndex regions={homeModel().contentRegions} />);
    // region label (zh default) for the prompt axis
    expect(screen.getByText("提示词")).toBeInTheDocument();
    const flagship = flagshipContent("prompt");
    expect(flagship).toBeDefined();
    expect(screen.getAllByText(flagship!.name).length).toBeGreaterThan(0);
  });
});
