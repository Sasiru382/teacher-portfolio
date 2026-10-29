const { test, expect } = require('./editor-test.cjs');
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const url = pathToFileURL(path.resolve(__dirname, "../index.html")).href;
test("every sidebar deep link renders a populated chapter offline with no broken images or console errors", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("requestfailed", (request) => errors.push(request.url()));
  await page.goto(url);
  await expect(page.locator("#navigation a")).toHaveCount(12);
  const links = await page.locator("#navigation a").evaluateAll((a) =>
    a.map((x) => ({
      href: x.getAttribute("href"),
      label: x.textContent.trim(),
    })),
  );
  for (const link of links) {
    await page.locator(`#navigation a[href="${link.href}"]`).click();
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator("main")).toContainText(/./);
    expect((await page.locator("main").innerText()).length).toBeGreaterThan(
      100,
    );
    await expect(
      page.locator(`#navigation a[href="${link.href}"]`),
    ).toHaveAttribute("aria-current", "page");
    await page
      .locator("main img")
      .evaluateAll((imgs) => Promise.all(imgs.map((i) => i.decode())));
  }
  expect(errors).toEqual([]);
  await page.reload();
  await expect(page.locator("main h1")).toHaveText("Let’s Connect");
  await expect(
    page.getByRole("link", { name: "Email me", exact: true }),
  ).toHaveCount(0);
});
