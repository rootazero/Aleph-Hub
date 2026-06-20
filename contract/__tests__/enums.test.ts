import { describe, it, expect } from "vitest";
import {
  ExtensionKind, ExtensionCategory, TrustTier, McpTransport, EnvDecl, HeaderDecl,
} from "@/contract/schema";

describe("contract enums", () => {
  it("kind accepts the three wire values", () => {
    for (const k of ["skill", "plugin", "mcp"]) expect(ExtensionKind.parse(k)).toBe(k);
    expect(() => ExtensionKind.parse("workflow")).toThrow();
  });
  it("category accepts all 13 values and rejects others", () => {
    const cats = ["search","developer","data","productivity","writing","communication","knowledge","files","design","automation","finance","utilities","other"];
    for (const c of cats) expect(ExtensionCategory.parse(c)).toBe(c);
    expect(() => ExtensionCategory.parse("misc")).toThrow();
  });
  it("trust_tier accepts the four tiers, not 'trusted'", () => {
    for (const t of ["official","verified","community","unverified"]) expect(TrustTier.parse(t)).toBe(t);
    expect(() => TrustTier.parse("trusted")).toThrow();
  });
  it("McpTransport is stdio|streamable_http|sse and rejects 'http'", () => {
    for (const t of ["stdio","streamable_http","sse"]) expect(McpTransport.parse(t)).toBe(t);
    expect(() => McpTransport.parse("http")).toThrow();
  });
  it("EnvDecl defaults required/secret to false", () => {
    expect(EnvDecl.parse({ name: "X" })).toEqual({ name: "X", required: false, secret: false });
  });
  it("HeaderDecl defaults secret to false", () => {
    expect(HeaderDecl.parse({ name: "Authorization" })).toEqual({ name: "Authorization", secret: false });
  });
});
