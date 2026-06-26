"use client";
import { useEffect, useRef, useState } from "react";

export const PAGE_SIZE = 60;

// Reveal a large filtered list incrementally: render the first `page` items, then grow
// by `page` whenever a sentinel scrolls near the viewport. `resetKey` snaps the window
// back to the first page when the caller's filters change, so a freshly narrowed result
// set starts from the top. Where IntersectionObserver is unavailable (SSR, jsdom tests,
// no-JS), it degrades to rendering everything — correct, just not lazy.
export function useInfiniteScroll<T>(items: T[], resetKey: string, page = PAGE_SIZE) {
  const [count, setCount] = useState(page);
  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCount(page);
  }, [resetKey, page]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setCount(items.length);
      return;
    }
    const node = sentinel.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setCount((c) => Math.min(c + page, items.length));
      },
      { rootMargin: "600px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [items.length, page]);

  return {
    visible: items.slice(0, count),
    hasMore: count < items.length,
    sentinel,
  };
}
