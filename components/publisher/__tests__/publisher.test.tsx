import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LangProvider } from "@/components/providers/LangProvider";
import { PublisherView } from "@/components/publisher/PublisherView";
import { publishersIndex } from "@/lib/publishers";

const wrap = (ui: React.ReactNode) =>
  render(<ThemeProvider><LangProvider>{ui}</LangProvider></ThemeProvider>);

describe("PublisherView", () => {
  // Pick a multi-entry publisher from the real index (rootazero qualifies today).
  const pub = [...publishersIndex()].sort((a, b) => b.entries.length - a.entries.length)[0];

  it("renders the publisher name, entry count, and its entries", () => {
    expect(pub.entries.length).toBeGreaterThan(0);
    wrap(<PublisherView publisher={pub} />);
    // name shows in the header (and again as each card's author line)
    expect(screen.getAllByText(pub.name).length).toBeGreaterThan(0);
    // count line is rendered (zh "件作品" or en "entries")
    expect(screen.getByText(/件作品|entries/)).toBeInTheDocument();
    // the top entry's name renders via <Card>
    expect(screen.getAllByText(pub.entries[0].name).length).toBeGreaterThan(0);
  });

  it("links to the homepage when present", () => {
    if (!pub.homepage) return; // homepage is best-effort; skip if absent
    wrap(<PublisherView publisher={pub} />);
    const link = screen.getAllByRole("link").find((a) => a.getAttribute("href") === pub.homepage);
    expect(link).toBeTruthy();
  });
});
