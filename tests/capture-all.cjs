const { chromium } = require("@playwright/test");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const fs = require("node:fs");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const context = { window: {} };
  require("node:vm").runInNewContext(
    fs.readFileSync(path.resolve("content.js"), "utf8"),
    context,
  );
  const chapters = context.window.PORTFOLIO_CONTENT.pages.map((p) => p.id);
  const output = path.resolve("screenshots/all-pages");
  fs.mkdirSync(output, { recursive: true });
  const manifest = [];
  for (const [layout, viewport] of [
    ["desktop", { width: 1536, height: 1024 }],
    ["mobile", { width: 390, height: 844 }],
  ]) {
    await page.setViewportSize(viewport);
    for (const [i, chapter] of chapters.entries()) {
      await page.goto(
        pathToFileURL(path.resolve("index.html")).href + "#" + chapter,
      );
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(
          [...document.images].map((img) => img.decode().catch(() => {})),
        );
      });
      await page.waitForTimeout(150);
      const filename = `${String(i + 1).padStart(2, "0")}-${chapter}-${layout}.png`;
      await page.screenshot({
        path: path.join(output, filename),
        fullPage: true,
      });
      manifest.push({ chapter, layout, filename });
    }
  }
  fs.writeFileSync(
    path.join(output, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  await browser.close();
  console.log(
    JSON.stringify({
      count: manifest.length,
      output,
      chapters: chapters.length,
    }),
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
