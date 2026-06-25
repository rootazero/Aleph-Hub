import { describe, it, expect } from "vitest";
import { generateStaticParams } from "@/app/p/[slug]/page";
import { allPublisherSlugs } from "@/lib/publishers";

describe("publisher route params", () => {
  it("generates one static param per publisher slug", () => {
    const params = generateStaticParams();
    expect(params.length).toBeGreaterThan(0);
    expect(params.map((p) => p.slug).sort()).toEqual([...allPublisherSlugs()].sort());
  });
});
