import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LangProvider } from "@/components/providers/LangProvider";
import { TagView } from "@/components/tag/TagView";
import { tagsIndex } from "@/lib/tags";

const wrap = (ui: React.ReactNode) =>
  render(<ThemeProvider><LangProvider>{ui}</LangProvider></ThemeProvider>);

describe("TagView", () => {
  // Pick the most-populated tag from the real index.
  const tag = [...tagsIndex()].sort((a, b) => b.entries.length - a.entries.length)[0];

  it("renders the tag label, entry count, and its entries", () => {
    expect(tag.entries.length).toBeGreaterThan(0);
    wrap(<TagView tag={tag} />);
    expect(screen.getByText(`#${tag.name}`)).toBeInTheDocument();
    // count line is rendered (zh "件作品" or en "entries")
    expect(screen.getByText(/件作品|entries/)).toBeInTheDocument();
    // the top entry's name renders via <Card>
    expect(screen.getAllByText(tag.entries[0].name).length).toBeGreaterThan(0);
  });
});
