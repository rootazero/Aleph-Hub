import { describe, it, expect, vi, afterEach } from "vitest";
import { makeGitHub } from "@/scripts/pipeline/adapters";

// Minimal fake Response; headers.get is case-insensitive for "etag".
function res(init: { status: number; etag?: string; body?: unknown }): Response {
  return {
    status: init.status,
    ok: init.status >= 200 && init.status < 300,
    headers: { get: (h: string) => (h.toLowerCase() === "etag" ? init.etag ?? null : null) },
    json: async () => init.body,
    text: async () => "",
  } as unknown as Response;
}

afterEach(() => vi.unstubAllGlobals());

describe("makeGitHub conditional requests", () => {
  it("sends If-None-Match when an etag is supplied and maps 304 to notModified", async () => {
    const fetchMock = vi.fn(async () => res({ status: 304, etag: "e1" }));
    vi.stubGlobal("fetch", fetchMock);
    const got = await makeGitHub().getRepo("acme/foo", "e1");
    const headers = ((fetchMock.mock.calls[0] as unknown[])[1] as RequestInit).headers as Record<string, string>;
    expect(headers["If-None-Match"]).toBe("e1");
    expect(got).toEqual({ meta: null, etag: "e1", notModified: true });
  });

  it("returns meta and the response etag on a 200, with no If-None-Match when no etag", async () => {
    const body = { full_name: "acme/foo", name: "foo", owner: { login: "acme" }, stargazers_count: 5, pushed_at: "2026-01-01T00:00:00Z", default_branch: "main", fork: false };
    const fetchMock = vi.fn(async () => res({ status: 200, etag: "e2", body }));
    vi.stubGlobal("fetch", fetchMock);
    const got = await makeGitHub().getRepo("acme/foo");
    expect(got?.notModified).toBe(false);
    expect(got?.etag).toBe("e2");
    expect(got?.meta?.full_name).toBe("acme/foo");
    expect(got?.meta?.stars).toBe(5);
    const headers = ((fetchMock.mock.calls[0] as unknown[])[1] as RequestInit).headers as Record<string, string>;
    expect(headers["If-None-Match"]).toBeUndefined();
  });
});
