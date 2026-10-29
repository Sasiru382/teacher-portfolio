const { test, expect } = require('./editor-test.cjs');
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const base = path.resolve(__dirname, "..");
test("editor edits text and images, safely imports and exports usable content.js without executing uploaded code", async ({
  page,
}) => {
  await page.goto(pathToFileURL(path.join(base, "editor.html")).href);
  await page.getByLabel("Choose a chapter").selectOption("site");
  await page.getByLabel("Teacher name", { exact: true }).fill("Test Teacher");
  await page.getByRole("button", { name: "Pictures", exact: true }).click();
  await page
    .getByLabel("Upload picture for hero")
    .setInputFiles(path.join(base, "assets/classroom-photo.jpg"));
  await expect(page.locator(".picture-source").first()).toContainText(
    "Uploaded picture embedded in export",
  );
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export content.js", exact: true })
    .click();
  const download = await downloadPromise;
  const output = await download.path();
  const fs = require("node:fs");
  const text = fs.readFileSync(output, "utf8");
  expect(text).toContain("Test Teacher");
  expect(text).toContain("data:image/jpeg;base64,");
  const exported = { window: {} };
  require("node:vm").runInNewContext(text, exported);
  expect(exported.window.PORTFOLIO_CONTENT.site.name).toBe("Test Teacher");
  expect(exported.window.PORTFOLIO_CONTENT.pages).toHaveLength(12);
  await page.getByLabel("Import content.js").setInputFiles({
    name: "content.js",
    mimeType: "text/javascript",
    buffer: Buffer.from(text),
  });
  await expect(page.getByRole("status")).toContainText("Imported");
  await page.getByRole("button", { name: "Text & links", exact: true }).click();
  await expect(page.getByLabel("Teacher name", { exact: true })).toHaveValue(
    "Test Teacher",
  );
  await page.getByLabel("Import content.js").setInputFiles({
    name: "evil.js",
    mimeType: "text/javascript",
    buffer: Buffer.from('window.PORTFOLIO_CONTENT = {}; alert("evil");'),
  });
  await expect(page.getByRole("status")).toContainText("could not");
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Reset to loaded content", exact: true })
    .click();
  await expect(page.getByLabel("Teacher name", { exact: true })).toHaveValue(
    "Your Name",
  );
});
