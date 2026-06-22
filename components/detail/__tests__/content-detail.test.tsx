import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LangProvider } from "@/components/providers/LangProvider";
import { ContentDetailView } from "@/components/detail/ContentDetailView";
import { getContentByKind } from "@/lib/content";

const wrap = (ui: React.ReactNode) => render(<ThemeProvider><LangProvider>{ui}</LangProvider></ThemeProvider>);

describe("ContentDetailView", () => {
  it("renders the body, provenance, and copies the body to the clipboard", () => {
    const e = getContentByKind("prompt")[0];
    const writeText = vi.fn();
    Object.assign(navigator, { clipboard: { writeText } });
    wrap(<ContentDetailView entry={e} />);
    // name + body text present. The body is multiline; pass an identity normalizer so
    // testing-library does not collapse its newlines before the exact string compare
    // (the default normalizer would collapse "\n\n" to " " on the element side only).
    expect(screen.getByRole("heading", { name: e.name })).toBeInTheDocument();
    expect(screen.getByText(e.body, { normalizer: (s) => s })).toBeInTheDocument();
    // provenance link points at the source file in the repo
    const src = screen.getByRole("link", { name: /来源文件|Source/ });
    expect(src.getAttribute("href")).toBe(`${e.repo_url}/blob/HEAD/${e.source_path}`);
    // copy button copies the body verbatim
    fireEvent.click(screen.getByText(/复制提示词|Copy prompt/));
    expect(writeText).toHaveBeenCalledWith(e.body);
  });
});
