const { test, expect } = require("@playwright/test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const fs = require("node:fs");
const vm = require("node:vm");
const base = path.resolve(__dirname, "..");
const url = pathToFileURL(path.join(base, "index.html")).href;
test("every local lesson and evidence resource exists, contains real printable content and opens offline", async ({
  page,
}) => {
  const c = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(base, "content.js"), "utf8"), c);
  const links = [];
  function walk(o) {
    if (o && typeof o === "object")
      Object.entries(o).forEach(([k, v]) => {
        if (k === "href" && v) links.push(v);
        else walk(v);
      });
  }
  walk(c.window.PORTFOLIO_CONTENT);
  links.push(
    ...fs
      .readdirSync(path.join(base, "resources"))
      .filter((f) => f.endsWith(".html"))
      .map((f) => "resources/" + f),
  );
  for (const href of [...new Set(links)]) {
    expect(fs.existsSync(path.join(base, href)), href).toBeTruthy();
    await page.goto(pathToFileURL(path.join(base, href)).href);
    await expect(page.locator("h1")).toBeVisible();
    expect((await page.locator("main").innerText()).length).toBeGreaterThan(
      350,
    );
    await expect(
      page.getByRole("button", { name: "Print / Save as PDF" }),
    ).toBeVisible();
  }
});
test("mobile drawer traps focus, closes with Escape, and all chapters fit without horizontal scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.locator("#menu-close")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("link", { name: "Edit portfolio", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#menu-close")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#menu-toggle")).toBeFocused();
  const ids = await page
    .locator("#navigation a")
    .evaluateAll((a) => a.map((x) => x.hash));
  for (const id of ids) {
    await page.goto(url + id);
    await expect(page.locator("main h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      id,
    ).toBeTruthy();
  }
  await page.setViewportSize({ width: 320, height: 700 });
  for (const id of ids) {
    await page.goto(url + id);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      id + " at 320",
    ).toBeTruthy();
  }
});
test("gallery modal is labelled, restores focus and closes using Escape or backdrop", async ({
  page,
}) => {
  await page.goto(url);
  await page.evaluate(() => {
    const data = structuredClone(window.PORTFOLIO_CONTENT);
    data.pages.find((p) => p.id === "teaching-in-action").gallery = [
      {
        src: "assets/lesson.svg",
        alt: "Test illustration",
        caption: "Lesson in progress",
        detail: "Test modal",
      },
    ];
    sessionStorage.setItem("teacher-portfolio-preview", JSON.stringify(data));
  });
  await page.goto(url + "?preview=1#teaching-in-action");
  const b = page.getByRole("button", { name: "Enlarge Lesson in progress" });
  await b.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveAccessibleName(
    "Lesson in progress",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(b).toBeFocused();
  await b.click();
  await page.mouse.click(2, 2);
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
