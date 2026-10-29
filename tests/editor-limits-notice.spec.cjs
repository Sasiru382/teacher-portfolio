const { test, expect } = require('./editor-test.cjs');
const path = require("node:path");
const { pathToFileURL } = require("node:url");
test("clear limits notice precedes editor controls and stays visible/readable on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(
    pathToFileURL(path.resolve(__dirname, "../editor.html")).href,
  );
  const notice = page.getByRole("region", { name: "Upload limits" });
  await expect(notice).toBeVisible();
  for (const text of [
    "Photos: 8 MiB",
    "PDFs: 15 MiB",
    "Videos: 15 MiB",
    "30 photos + 3 clips",
    "1600 px",
    "100 MiB",
    "70 MiB",
    "not guaranteed",
    "storage quotas may be lower",
    "Keep exports",
  ])
    await expect(notice).toContainText(text);
  expect(
    await notice.evaluate(
      (el) =>
        !!(
          el.compareDocumentPosition(
            document.querySelector(".editor-toolbar"),
          ) & Node.DOCUMENT_POSITION_FOLLOWING
        ),
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const box = await notice.boundingBox();
  expect(box.y).toBeLessThan(812);
  await page.locator("#picture-tab").click();
  await expect(notice).toBeVisible();
});
