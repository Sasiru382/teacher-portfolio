const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const vm = require("node:vm");
const http = require("node:http");
const { pathToFileURL } = require("node:url");
const root = path.resolve(__dirname, "..");
const scratch =
  process.env.TMPDIR || path.join(os.homedir(), ".hermes/cache/scratch");
const pdfBytes = fs.readFileSync(path.join(__dirname, "test-document.pdf"));
const pdf = (buffer = pdfBytes, mimeType = "application/pdf") => ({
  name: "lesson.pdf",
  mimeType,
  buffer,
});
const embedded = (bytes) =>
  "data:application/pdf;base64," + bytes.toString("base64");
const weeks = (data) => data.pages.find((p) => p.id === "lesson-plans").weeks;
const serialize = (data) =>
  "window.PORTFOLIO_CONTENT = " + JSON.stringify(data) + ";\n";
function original() {
  const scope = { window: {} };
  vm.runInNewContext(
    fs.readFileSync(path.join(root, "content.js"), "utf8"),
    scope,
  );
  return JSON.parse(JSON.stringify(scope.window.PORTFOLIO_CONTENT));
}
async function exportData(page) {
  const wait = page.waitForEvent("download");
  await page.locator("#export").click();
  const text = fs.readFileSync(await (await wait).path(), "utf8");
  return {
    text,
    data: JSON.parse(
      text
        .slice(text.indexOf("=") + 1)
        .trim()
        .replace(/;$/, ""),
    ),
  };
}
async function openEditor(page, url) {
  await page.goto(url + "editor.html");
  await expect(page.locator("#editor-status")).not.toContainText(
    "Opening your saved",
  );
  await page.locator("#chapter-choice").selectOption("lesson-plans");
}
async function preview(page) {
  const wait = page.waitForEvent("popup");
  await page.locator("#preview").click();
  const popup = await wait;
  await popup.waitForLoadState();
  await popup.goto(popup.url().replace(/#.*$/, "#lesson-plans"));
  return popup;
}
async function assertDownloads(page, expected) {
  await expect(page.locator(".pdf-slot")).toHaveCount(6);
  for (let i = 0; i < 6; i++) {
    const slot = page.locator(".pdf-slot").nth(i);
    await expect(slot.locator("h3")).toHaveText(expected[i].title);
    if (!expected[i].href) {
      await expect(slot).toContainText("PDF not added yet");
      continue;
    }
    const wait = page.waitForEvent("download");
    await slot.locator("a[download]").click();
    expect(fs.readFileSync(await (await wait).path())).toEqual(
      Buffer.from(expected[i].href.split(",")[1], "base64"),
    );
  }
}
async function fixture(data, hosted = false) {
  const dir = fs.mkdtempSync(path.join(scratch, "lesson-pdf-"));
  for (const name of [
    "editor.html",
    "editor.js",
    "editor.css",
    "index.html",
    "app.js",
    "styles.css",
    "schema.js",
    "asset-policy.js",
  ])
    fs.copyFileSync(path.join(root, name), path.join(dir, name));
  fs.symlinkSync(path.join(root, "assets"), path.join(dir, "assets"));
  fs.writeFileSync(path.join(dir, "content.js"), serialize(data));
  let server;
  let url = pathToFileURL(dir + path.sep).href;
  if (hosted) {
    server = http.createServer((req, res) => {
      const pathname = new URL(req.url, "http://localhost").pathname;
      const file = path.join(dir, pathname);
      if (
        !file.startsWith(dir + path.sep) ||
        !fs.existsSync(file) ||
        !fs.statSync(file).isFile()
      ) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.setHeader(
        "Content-Type",
        { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" }[
          path.extname(file)
        ] || "application/octet-stream",
      );
      fs.createReadStream(file).pipe(res);
    });
    await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
    url = "http://127.0.0.1:" + server.address().port + "/";
  }
  return {
    dir,
    url,
    close: async () => {
      if (server) await new Promise((ok) => server.close(ok));
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}
// Ranking: slot/label mapping; validation; persistence surfaces; customised baseline; stale draft.
for (const hosted of [false, true]) {
  for (let target = 0; target < 6; target++) {
    test(`${hosted ? "HTTP" : "offline"} customised week ${target + 1} preserves PDF bytes through save/reopen/export/import/preview`, async ({
      page,
      context,
    }) => {
      // No external requests, including GitHub reads/writes, leave this test.
      await context.route("https://**/*", (route) => route.abort());
      const data = original();
      weeks(data).forEach((w, i) => {
        w.title = `Week ${String(i + 1).padStart(2, "0")} : Grade 6 & 9`;
        w.href =
          i === target
            ? ""
            : embedded(
                Buffer.concat([pdfBytes, Buffer.from(`\n% baseline ${i}\n`)]),
              );
      });
      const f = await fixture(data, hosted);
      try {
        await openEditor(page, f.url);
        const titles = weeks(data).map((w) => w.title);
        const inputs = page.locator(
          'input[type="file"][accept="application/pdf"]',
        );
        await expect(inputs).toHaveCount(6);
        expect(await inputs.evaluateAll((els) => els.map((e) => e.id))).toEqual(
          ["pdf-0", "pdf-1", "pdf-2", "pdf-3", "pdf-4", "pdf-5"],
        );
        const replacement = Buffer.concat([
          pdfBytes,
          Buffer.from(`\n% replacement ${target}\n`),
        ]);
        await page
          .getByLabel("Upload PDF for " + titles[target], { exact: true })
          .setInputFiles(pdf(replacement));
        await expect(page.locator("#editor-status")).toContainText(
          "PDF embedded",
        );
        weeks(data)[target].href = embedded(replacement);
        expect((await exportData(page)).data).toEqual(data);
        await page.locator("#save-draft").click();
        await expect(page.locator("#editor-status")).toContainText(
          "Draft saved",
        );
        await page.close();
        page = await context.newPage();
        await openEditor(page, f.url);
        await expect(page.locator("#editor-status")).toContainText("restored");
        const out = await exportData(page);
        expect(out.data).toEqual(data);
        const p = await preview(page);
        await assertDownloads(p, weeks(data));
        await p.close();
        await page.getByLabel("Import content.js").setInputFiles({
          name: "content.js",
          mimeType: "text/javascript",
          buffer: Buffer.from(out.text),
        });
        await expect(page.locator("#editor-status")).toContainText("Imported");
        expect((await exportData(page)).data).toEqual(data);
        const importedPreview = await preview(page);
        await assertDownloads(importedPreview, weeks(data));
        await importedPreview.close();
        const publicPage = await context.newPage();
        await publicPage.goto(f.url + "index.html#lesson-plans");
        await assertDownloads(
          publicPage,
          weeks(original()).map((w, i) => ({
            ...w,
            title: titles[i],
            href: i === target ? "" : weeks(data)[i].href,
          })),
        );
        // Export becomes the loaded baseline only in the isolated scratch folder.
        fs.writeFileSync(path.join(f.dir, "content.js"), out.text);
        await publicPage.reload();
        await assertDownloads(publicPage, weeks(data));
        await publicPage.close();
      } finally {
        await f.close();
      }
    });
  }
}
test("blank baseline accepts each of the six slots independently, including editing the Week02 title", async ({
  page,
}) => {
  const data = original();
  const f = await fixture(data);
  try {
    await openEditor(page, f.url);
    const title = page.getByLabel("Title", { exact: true }).nth(2);
    await title.fill("Week 02 : Grade 6 & 9");
    // Labels remain from the last render, but the closure must still target the right record.
    for (let i = 0; i < 6; i++) {
      await page
        .locator('input[type=file][accept="application/pdf"]')
        .nth(i)
        .setInputFiles(pdf());
      await expect(page.locator("#editor-status")).toContainText(
        "PDF embedded",
      );
      const out = weeks((await exportData(page)).data);
      expect(out.map((w) => w.href)).toEqual(
        Array.from({ length: 6 }, (_, n) => (n <= i ? embedded(pdfBytes) : "")),
      );
    }
    expect(weeks((await exportData(page)).data)[1].title).toBe(
      "Week 02 : Grade 6 & 9",
    );
  } finally {
    await f.close();
  }
});
test("PDF rejection reasons are visible beside Week02 and preserve a previously saved PDF", async ({
  page,
}, testInfo) => {
  const data = original();
  weeks(data)[1].href = embedded(pdfBytes);
  const f = await fixture(data);
  try {
    await openEditor(page, f.url);
    const input = page.getByLabel("Upload PDF for Week 02", { exact: true });
    const group = input.locator("..");
    const cases = [
      [
        pdf(pdfBytes, ""),
        "Choose a PDF identified by the browser as application/pdf",
      ],
      [
        pdf(pdfBytes, "application/octet-stream"),
        "Choose a PDF identified by the browser as application/pdf",
      ],
      [
        pdf(
          Buffer.concat([
            pdfBytes,
            Buffer.alloc(15 * 1024 * 1024 + 1 - pdfBytes.length),
          ]),
        ),
        "15 MiB (15,728,640 bytes) per-file limit",
      ],
      [pdf(Buffer.from("not a PDF")), "Not a PDF"],
    ];
    for (const [file, reason] of cases) {
      await input.scrollIntoViewIfNeeded();
      // Use the browser File API so an empty MIME is not inferred from .pdf by Playwright.
      if (file.mimeType) await input.setInputFiles(file);
      else
        await input.evaluate(
          (el, file) => {
            const transfer = new DataTransfer();
            transfer.items.add(
              new File([new Uint8Array(file.buffer.data)], file.name, {
                type: file.mimeType,
              }),
            );
            el.files = transfer.files;
            el.dispatchEvent(new Event("change", { bubbles: true }));
          },
          { ...file, buffer: { data: Array.from(file.buffer) } },
        );
      await expect(page.locator("#editor-status")).toContainText(reason);
      // The global message is above the viewport while the user is at Week02.
      await expect(page.locator("#editor-status")).not.toBeInViewport();
      await expect(group).toContainText(reason);
      await expect(group.locator(".pdf-feedback")).toBeInViewport();
      if (file.mimeType === "")
        await page.screenshot({
          path: testInfo.outputPath("week02-inline-rejection.png"),
        });
      expect(weeks((await exportData(page)).data)[1].href).toBe(
        embedded(pdfBytes),
      );
    }
    await page.evaluate(() => (PortfolioAssets.maxContent = 1000));
    await input.setInputFiles(pdf());
    await expect(group).toContainText("40 MB");
    expect(weeks((await exportData(page)).data)[1].href).toBe(
      embedded(pdfBytes),
    );
    await page.evaluate(() => (PortfolioAssets.maxContent = 40 * 1024 * 1024));
    await input.setInputFiles(pdf());
    await expect(group.locator(".pdf-feedback")).toContainText("PDF embedded");
    await input.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: testInfo.outputPath("week02-inline-feedback.png"),
    });
  } finally {
    await f.close();
  }
});
test("saved draft restores its old Week02 independently of a newer loaded baseline", async ({
  page,
}) => {
  const data = original();
  const f = await fixture(data);
  try {
    await openEditor(page, f.url);
    await page.locator("#save-draft").click();
    await expect(page.locator("#editor-status")).toContainText("Draft saved");
    weeks(data)[1].href = embedded(pdfBytes);
    fs.writeFileSync(path.join(f.dir, "content.js"), serialize(data));
    await page.reload();
    await expect(page.locator("#editor-status")).toContainText("restored");
    expect(weeks((await exportData(page)).data)[1].href).toBe("");
    page.once("dialog", (d) => d.accept());
    await page.locator("#reset").click();
    expect(weeks((await exportData(page)).data)[1].href).toBe(
      embedded(pdfBytes),
    );
  } finally {
    await f.close();
  }
});
