import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LangProvider } from "@/components/providers/LangProvider";
import { DetailView } from "@/components/detail/DetailView";
import { ContentDetailView } from "@/components/detail/ContentDetailView";
import { getByKind } from "@/lib/catalog";
import { getContentByKind } from "@/lib/content";
import { publisherSlug } from "@/lib/publishers";

const wrap = (ui: React.ReactNode) =>
  render(<ThemeProvider><LangProvider>{ui}</LangProvider></ThemeProvider>);

describe("detail author links", () => {
  it("DetailView links the author to its publisher page", () => {
    const e = getByKind("skill").find((x) => x.author)!;
    wrap(<DetailView entry={e} />);
    const link = screen.getAllByRole("link").find((a) => a.getAttribute("href") === `/p/${publisherSlug(e.author!)}`);
    expect(link).toBeTruthy();
    expect(link!).toHaveTextContent(e.author!);
  });

  it("ContentDetailView links the author to its publisher page", () => {
    const e = getContentByKind("prompt").find((x) => x.author);
    if (!e) return; // no authored prompt in the committed content catalog → skip
    wrap(<ContentDetailView entry={e} />);
    const link = screen.getAllByRole("link").find((a) => a.getAttribute("href") === `/p/${publisherSlug(e.author!)}`);
    expect(link).toBeTruthy();
    expect(link!).toHaveTextContent(e.author!);
  });
});
