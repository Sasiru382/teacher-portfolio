const { test, expect } = require('./editor-test.cjs');
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const { pathToFileURL } = require("node:url");
const root = path.resolve(__dirname, "..");
const url = pathToFileURL(path.join(root, "editor.html")).href;
const hash = (s) => crypto.createHash("sha256").update(s).digest("hex");
async function download(page) {
  const wait = page.waitForEvent("download");
  await page.locator("#export").click();
  return fs.readFileSync(await (await wait).path(), "utf8");
}
const parse = (text) =>
  JSON.parse(
    text
      .slice(text.indexOf("=") + 1)
      .trim()
      .replace(/;$/, ""),
  );
function populated(target) {
  const c = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, "content.js"), "utf8"), c);
  const data = c.window.PORTFOLIO_CONTENT;
  const weeks = data.pages.find((p) => p.id === "lesson-plans").weeks;
  const pdf = Buffer.alloc(15 * 1024 * 1024, 32);
  fs.readFileSync(path.join(__dirname, "test-document.pdf")).copy(pdf);
  for (let i = 0; i < 4; i++)
    weeks[i].href = "data:application/pdf;base64," + pdf.toString("base64");
  weeks[4].href = "data:application/pdf;base64,";
  const remaining = target - Buffer.byteLength(JSON.stringify(data));
  const tail = Buffer.alloc(Math.floor(remaining / 4) * 3, 32);
  fs.readFileSync(path.join(__dirname, "test-document.pdf")).copy(tail);
  weeks[4].href += tail.toString("base64");
  data.site.name += "a".repeat(
    target - Buffer.byteLength(JSON.stringify(data)),
  );
  return data;
}
test("exact 100 MiB real embedded PDFs survive save/reopen, IndexedDB preview and own formatted export/import; +1 is atomic and oversized GitHub file never PUT", async ({
  page,
}, testInfo) => {
  test.setTimeout(240000);
  let puts = 0;
  const base = fs.readFileSync(path.join(root, "content.js"), "utf8");
  await page.route("https://api.github.com/**", (route) => {
    if (route.request().method() === "PUT") {
      puts++;
      return route.fulfill({ status: 500 });
    }
    return route.fulfill({
      json: {
        sha: "base",
        encoding: "base64",
        content: Buffer.from(base).toString("base64"),
      },
    });
  });
  await page.goto(url);
  await expect(page.locator("#publish")).toBeEnabled();
  const data = populated(100 * 1024 * 1024);
  const compact = JSON.stringify(data);
  const digest = hash(compact);
  const scratchRoot = process.env.TMPDIR || testInfo.outputDir;
  fs.mkdirSync(scratchRoot, { recursive: true });
  const scratch = fs.mkdtempSync(path.join(scratchRoot, "portfolio-budget-"));
  async function importText(text, name) {
    const file = path.join(scratch, name);
    fs.writeFileSync(file, text);
    try {
      await page.locator("#import-file").setInputFiles(file);
      await expect(page.locator("#import-file")).toHaveValue("", {
        timeout: 30000,
      });
    } finally {
      fs.unlinkSync(file);
    }
  }
  await importText(compact, "large.json");
  await expect(page.locator("#editor-status")).toContainText("Imported");
  await page.locator("#save-draft").click();
  await expect(page.locator("#editor-status")).toContainText("Draft saved", {
    timeout: 30000,
  });
  await page.reload();
  await expect(page.locator("#editor-status")).toContainText("restored", {
    timeout: 30000,
  });
  let text = await download(page);
  expect(hash(JSON.stringify(parse(text)))).toBe(digest);
  expect(Buffer.byteLength(text)).toBeGreaterThan(100 * 1024 * 1024);
  await importText(text, "content.js");
  await expect(page.locator("#editor-status")).toContainText("Imported");
  const popup = page.waitForEvent("popup");
  await page.locator("#preview").click();
  const p = await popup;
  await p.waitForLoadState();
  expect(p.url()).toContain("previewStore=indexeddb");
  const mediaHashes = await p.evaluate(async () => {
    const data = await PortfolioAssets.previewStore("readonly");
    const weeks = data.pages.find((p) => p.id === "lesson-plans").weeks;
    return Promise.all(
      weeks.slice(0, 5).map(async (w) =>
        Array.from(
          new Uint8Array(
            await crypto.subtle.digest(
              "SHA-256",
              new TextEncoder().encode(w.href),
            ),
          ),
        )
          .map((n) => n.toString(16).padStart(2, "0"))
          .join(""),
      ),
    );
  });
  expect(mediaHashes).toEqual(
    data.pages
      .find((p) => p.id === "lesson-plans")
      .weeks.slice(0, 5)
      .map((w) => hash(w.href)),
  );
  await p.close();
  // Fixed-photo and PDF uploads roll back at the actual 100 MiB boundary.
  const png = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    canvas.getContext("2d").fillRect(0, 0, 128, 128);
    return canvas.toDataURL("image/png");
  });
  await page.locator("#picture-tab").click();
  await page.locator("#upload-hero").setInputFiles({
    name: "real.png",
    mimeType: "image/png",
    buffer: Buffer.from(png.split(",")[1], "base64"),
  });
  await expect(page.locator("#upload-hero-feedback")).toContainText("100 MiB");
  await page.locator("#text-tab").click();
  await page.locator("#chapter-choice").selectOption("lesson-plans");
  await page
    .getByLabel("Upload PDF for Week 06", { exact: true })
    .setInputFiles(path.join(__dirname, "test-document.pdf"));
  await expect(page.locator("#editor-status")).toContainText("100 MiB");
  expect(hash(JSON.stringify(parse(await download(page))))).toBe(digest);
  data.site.name += "a";
  await importText(JSON.stringify(data), "over.json");
  await expect(page.locator("#editor-status")).toContainText("100 MiB");
  expect(hash(JSON.stringify(parse(await download(page))))).toBe(digest);
  await page.locator("#github-token").fill("synthetic-test-token");
  page.on("dialog", (d) => d.accept());
  await page.locator("#publish").click();
  await expect(page.locator("#publish-status")).toContainText(
    "final content.js",
    { timeout: 30000 },
  );
  expect(puts).toBe(0);
  await expect(page.locator("#github-token")).toHaveValue("");
  await page.evaluate(() => {
    indexedDB.open = () => {
      throw new DOMException("quota", "QuotaExceededError");
    };
  });
  await page.locator("#save-draft").click();
  await expect(page.locator("#editor-status")).toContainText(
    "Export content.js",
  );
  text = await download(page);
  expect(hash(JSON.stringify(parse(text)))).toBe(digest);
  console.log(
    JSON.stringify({
      compactBytes: Buffer.byteLength(compact),
      exportBytes: Buffer.byteLength(text),
      mediaHashes,
    }),
  );
  fs.rmSync(scratch, { recursive: true, force: true });
});
