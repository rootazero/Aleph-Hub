import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LangProvider } from "@/components/providers/LangProvider";
import { TrustBadge } from "@/components/TrustBadge";
import { Sparkline } from "@/components/Sparkline";
import { Card } from "@/components/Card";
import { getAll } from "@/lib/catalog";

describe("card primitives", () => {
  it("TrustBadge shows 'Trusted' for verified (display alias)", () => {
    render(<TrustBadge tier="verified" />);
    expect(screen.getByText("Trusted")).toBeInTheDocument();
  });
  it("TrustBadge shows 'Community' for community tier", () => {
    render(<TrustBadge tier="community" />);
    expect(screen.getByText("Community")).toBeInTheDocument();
  });
  it("Sparkline renders nothing meaningful when empty", () => {
    const { container } = render(<Sparkline points={[]} color="var(--green)" />);
    expect(container.querySelector("polyline")).toBeNull();
  });
  it("Card renders entry name and links to its detail page", () => {
    const e = getAll()[0];
    const slug = e.id.replace(/^aleph-hub:/, "");
    render(<LangProvider><Card entry={e} /></LangProvider>);
    expect(screen.getByText(e.name)).toBeInTheDocument();
    expect(screen.getAllByRole("link").some((l) => l.getAttribute("href") === `/e/${slug}`)).toBe(true);
  });
});
