const { test, expect } = require("@playwright/test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const url = pathToFileURL(path.resolve(__dirname, "../index.html")).href;
test("Home quotation remains available on tablet-sized desktop layout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto(url);
  await expect(page.locator(".home-quote")).toBeVisible();
});
test("selecting the already active chapter closes the mobile drawer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url + "#home");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.locator('#navigation a[href="#home"]').click();
  await expect(page.locator("#menu-toggle")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(page.locator("main")).toBeFocused();
});
