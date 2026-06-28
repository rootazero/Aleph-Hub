import { describe, it, expect } from "vitest";
import { generateStaticParams } from "@/app/t/[slug]/page";
import { allTagSlugs } from "@/lib/tags";

describe("tag route params", () => {
  it("generates one static param per tag slug", () => {
    const params = generateStaticParams();
    expect(params.length).toBeGreaterThan(0);
    expect(params.map((p) => p.slug).sort()).toEqual([...allTagSlugs()].sort());
  });
});
