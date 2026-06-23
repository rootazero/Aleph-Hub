import { describe, it, expect } from "vitest";
import { isWorkflowScript } from "@/scripts/pipeline/workflow-detect";

describe("isWorkflowScript", () => {
  it("accepts a script with meta + an orchestration hook", () => {
    expect(isWorkflowScript("export const meta = {};\nawait agent('do x')")).toBe(true);
    expect(isWorkflowScript("export const meta={}\nawait pipeline(items, s1)")).toBe(true);
    expect(isWorkflowScript("export const meta={}\nphase('Scan')")).toBe(true);
  });
  it("rejects a plain .js module with no meta", () => {
    expect(isWorkflowScript("export function add(a,b){return a+b}")).toBe(false);
  });
  it("rejects meta without any orchestration hook", () => {
    expect(isWorkflowScript("export const meta = { name: 'x' }; console.log('hi')")).toBe(false);
  });
});
