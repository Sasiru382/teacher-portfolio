const { chromium } = require("@playwright/test");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const fs = require("node:fs");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1536, height: 1024 },
  });
  fs.mkdirSync("screenshots", { recursive: true });
  await page.goto(pathToFileURL(path.resolve("index.html")).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "screenshots/home-desktop.png",
    fullPage: true,
  });
  console.log(
    "Loaded local fonts:",
    await page.evaluate(() =>
      [...document.fonts].map((f) => ({ family: f.family, status: f.status })),
    ),
  );
  await page.goto(
    pathToFileURL(path.resolve("index.html")).href + "#teaching-in-action",
  );
  await page.screenshot({
    path: "screenshots/gallery-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pathToFileURL(path.resolve("index.html")).href);
  await page.screenshot({
    path: "screenshots/home-mobile.png",
    fullPage: true,
  });
  await page.goto(pathToFileURL(path.resolve("editor.html")).href);
  await page.screenshot({
    path: "screenshots/editor-mobile.png",
    fullPage: true,
  });
  await browser.close();
  console.log("Saved four screenshots in screenshots/");
})();
