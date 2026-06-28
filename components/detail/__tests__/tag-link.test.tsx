import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LangProvider } from "@/components/providers/LangProvider";
import { DetailView } from "@/components/detail/DetailView";
import { ContentDetailView } from "@/components/detail/ContentDetailView";
import { getByKind } from "@/lib/catalog";
import { getAllContent } from "@/lib/content";
import type { ContentSiteEntryT } from "@/contract/content-site";
import { tagSlug } from "@/lib/tags";

const wrap = (ui: React.ReactNode) =>
  render(<ThemeProvider><LangProvider>{ui}</LangProvider></ThemeProvider>);

describe("detail tag links", () => {
  it("DetailView links each tag to its tag page", () => {
    const e = getByKind("skill").find((x) => x.tags.length > 0);
    expect(e).toBeDefined();
    wrap(<DetailView entry={e!} />);
    const tg = e!.tags[0];
    const link = screen.getAllByRole("link").find((a) => a.getAttribute("href") === `/t/${tagSlug(tg)}`);
    expect(link).toBeTruthy();
    expect(link!).toHaveTextContent(`#${tg}`);
  });

  it("ContentDetailView links each tag to its tag page", () => {
    const base = getAllContent().find((x) => x.tags.length > 0) ?? getAllContent()[0];
    const synthetic = { ...base, tags: ["video"] } as ContentSiteEntryT;
    wrap(<ContentDetailView entry={synthetic} />);
    const link = screen.getAllByRole("link").find((a) => a.getAttribute("href") === `/t/${tagSlug("video")}`);
    expect(link).toBeTruthy();
    expect(link!).toHaveTextContent("#video");
  });
});
