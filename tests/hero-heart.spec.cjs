const { test, expect } = require('./editor-test.cjs');
const { pathToFileURL } = require("node:url");
const path = require("node:path");

test("home omits the large hero heart while retaining other decorations", async ({ page }) => {
  await page.goto(pathToFileURL(path.resolve(__dirname, "../index.html")).href + "#home");
  await expect(page.locator(".hero h1")).toBeVisible();
  await expect(page.locator(".hero-heart")).toHaveCount(0);
  await expect(page.locator(".welcome-copy .handwritten [aria-hidden]")).toHaveText("♡");
});
