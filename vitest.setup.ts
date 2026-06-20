import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// next/link needs the App Router context, which jsdom unit tests don't mount.
// Render it as a plain anchor so component tests (Header/Card/CategoryView/DetailView)
// can assert hrefs without "invariant: app router not mounted".
vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    __esModule: true,
    default: ({ href, children, ...props }: { href: unknown; children: React.ReactNode }) =>
      React.createElement(
        "a",
        { href: typeof href === "string" ? href : "#", ...props },
        children,
      ),
  };
});

// jsdom lacks matchMedia; the pre-paint theme script reads prefers-color-scheme.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
