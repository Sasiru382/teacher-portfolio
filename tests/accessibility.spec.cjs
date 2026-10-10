const { test, expect } = require("@playwright/test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
test("all chapters and editing/help surfaces have no automated WCAG A/AA violations", async ({
  page,
}) => {
  const url = pathToFileURL(path.resolve(__dirname, "../index.html")).href;
  await page.goto(url);
  const ids = await page
    .locator("#navigation a")
    .evaluateAll((a) => a.map((x) => x.hash));
  for (const target of [
    ...ids.map((id) => url + id),
    pathToFileURL(path.resolve(__dirname, "../editor.html")).href,
    pathToFileURL(path.resolve(__dirname, "../guide.html")).href,
  ]) {
    await page.goto(target);
    await page.evaluate(() => document.fonts.ready);
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    const violations = await page.evaluate(async () => {
      const r = await axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
        },
      });
      return r.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => n.target),
      }));
    });
    expect(violations, target).toEqual([]);
  }
});
