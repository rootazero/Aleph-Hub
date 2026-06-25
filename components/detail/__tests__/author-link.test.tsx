import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LangProvider } from "@/components/providers/LangProvider";
import { DetailView } from "@/components/detail/DetailView";
import { ContentDetailView } from "@/components/detail/ContentDetailView";
import { getByKind } from "@/lib/catalog";
import { getAllContent } from "@/lib/content";
import type { ContentSiteEntryT } from "@/contract/content-site";
import { publisherSlug } from "@/lib/publishers";

const wrap = (ui: React.ReactNode) =>
  render(<ThemeProvider><LangProvider>{ui}</LangProvider></ThemeProvider>);

describe("detail author links", () => {
  it("DetailView links the author to its publisher page", () => {
    const e = getByKind("skill").find((x) => x.author);
    expect(e).toBeDefined();
    wrap(<DetailView entry={e!} />);
    const link = screen.getAllByRole("link").find((a) => a.getAttribute("href") === `/p/${publisherSlug(e!.author!)}`);
    expect(link).toBeTruthy();
    expect(link!).toHaveTextContent(e!.author!);
  });

  it("ContentDetailView links the author to its publisher page", () => {
    // Inject a synthetic authored content entry built from a real catalog entry,
    // so the link path is always exercised regardless of whether the committed
    // catalog happens to contain an authored prompt.
    const base = getAllContent()[0];
    expect(base).toBeDefined();
    const synthetic = { ...base, author: "test-author" } as ContentSiteEntryT;
    wrap(<ContentDetailView entry={synthetic} />);
    const link = screen.getAllByRole("link").find((a) => a.getAttribute("href") === `/p/${publisherSlug("test-author")}`);
    expect(link).toBeTruthy();
    expect(link!).toHaveTextContent("test-author");
  });
});
