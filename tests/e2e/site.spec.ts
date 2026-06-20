import { test, expect } from "@playwright/test";

test("home renders and navigates to a detail page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("ALEPH HUB").first()).toBeVisible();
  await page.getByText("goose").first().click();
  await expect(page).toHaveURL(/\/e\/block\/goose/);
  await expect(page.getByRole("heading", { name: "goose" })).toBeVisible();
});

test("language toggle switches submit label", async ({ page }) => {
  await page.goto("/");
  await page.getByText("EN", { exact: true }).click();
  await expect(page.getByText("Submit").first()).toBeVisible();
});

test("theme toggle flips data-theme with no FOUC flag", async ({ page }) => {
  await page.goto("/");
  const before = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.locator("header span", { hasText: /☾|☼/ }).click();
  const after = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(before).not.toBe(after);
});

test("category page filters by search", async ({ page }) => {
  await page.goto("/c/mcp");
  await page.getByPlaceholder(/搜索|Search/).fill("supabase");
  await expect(page.getByText("supabase-mcp")).toBeVisible();
  await expect(page.getByText("playwright-mcp")).toHaveCount(0);
});

test("contract artifact is served as valid JSON", async ({ request }) => {
  const res = await request.get("/catalog.json");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/json");
  const json = await res.json();
  expect(json.manifest.hub_id).toBe("aleph-hub");
  expect(json.entries).toHaveLength(12);
});
