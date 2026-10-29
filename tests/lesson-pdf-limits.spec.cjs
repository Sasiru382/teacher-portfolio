const { test, expect } = require('./editor-test.cjs');
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
test("Week02 accepts a PDF at exactly the 15 MiB boundary and restores identical bytes", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const bytes = Buffer.alloc(15 * 1024 * 1024, 32);
  fs.readFileSync(path.join(__dirname, "test-document.pdf")).copy(bytes);
  await page.goto(
    pathToFileURL(path.resolve(__dirname, "../editor.html")).href,
  );
  await page.locator("#chapter-choice").selectOption("lesson-plans");
  await page
    .getByLabel("Upload PDF for Week 02", { exact: true })
    .setInputFiles({
      name: "limit.pdf",
      mimeType: "application/pdf",
      buffer: bytes,
    });
  await expect(page.locator("#editor-status")).toContainText("PDF embedded");
  await page.locator("#save-draft").click();
  await expect(page.locator("#editor-status")).toContainText("Draft saved");
  await page.reload();
  await expect(page.locator("#editor-status")).toContainText("restored");
  const popup = page.waitForEvent("popup");
  await page.locator("#preview").click();
  const preview = await popup;
  await preview.waitForLoadState();
  await preview.goto(preview.url().replace(/#.*$/, "#lesson-plans"));
  const wait = preview.waitForEvent("download");
  await preview
    .getByRole("link", { name: "Download PDF: Week 02", exact: true })
    .click();
  expect(fs.readFileSync(await (await wait).path())).toEqual(bytes);
  await preview.close();
  await page.locator("#chapter-choice").selectOption("lesson-plans");
  // A second maximum-sized PDF now fits: the old 40 MiB cap rejected it.
  const first = page.getByLabel("Upload PDF for Week 01", { exact: true });
  await first.setInputFiles({
    name: "another-limit.pdf",
    mimeType: "application/pdf",
    buffer: bytes,
  });
  await expect(first.locator("..").locator(".pdf-feedback")).toContainText(
    "PDF embedded",
  );
  const exportWait = page.waitForEvent("download");
  await page.locator("#export").click();
  const text = fs.readFileSync(await (await exportWait).path(), "utf8");
  const data = JSON.parse(
    text
      .slice(text.indexOf("=") + 1)
      .trim()
      .replace(/;$/, ""),
  );
  const weeks = data.pages.find((p) => p.id === "lesson-plans").weeks;
  expect(Buffer.from(weeks[0].href.split(",")[1], "base64")).toEqual(bytes);
  expect(Buffer.from(weeks[1].href.split(",")[1], "base64")).toEqual(bytes);
});
