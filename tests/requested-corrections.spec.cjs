const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const root = path.resolve(__dirname, "..");
const vm = require("node:vm");
function previousData() {
  const c = { window: {} };
  vm.runInNewContext(
    fs.readFileSync(
      path.join(root, "tests/previous-content.fixture.js"),
      "utf8",
    ),
    c,
  );
  const data = JSON.parse(JSON.stringify(c.window.PORTFOLIO_CONTENT));
  data.pages
    .find((p) => p.id === "testimonials")
    .documents.forEach((s, i) => {
      s.title = "Custom section " + i;
      s.files.forEach((f, j) => {
        f.title = "Custom document " + i + j;
        f.href =
          "data:application/pdf;base64," +
          Buffer.concat([
            fs.readFileSync(path.join(root, "tests/test-document.pdf")),
            Buffer.from(`\n% document ${i}${j}`),
          ]).toString("base64");
      });
    });
  return data;
}
const url = (file) => pathToFileURL(path.join(root, file)).href;
async function exported(page) {
  const waiting = page.waitForEvent("download");
  await page.locator("#export").click();
  const text = fs.readFileSync(await (await waiting).path(), "utf8");
  return JSON.parse(
    text
      .slice(text.indexOf("=") + 1)
      .trim()
      .replace(/;$/, ""),
  );
}
async function importData(page, data) {
  await page.getByLabel("Import content.js").setInputFiles({
    name: "content.js",
    mimeType: "text/javascript",
    buffer: Buffer.from(
      "window.PORTFOLIO_CONTENT = " + JSON.stringify(data) + ";",
    ),
  });
  await expect(page.getByRole("status")).toContainText("Imported");
}
test("old deployed content removes consent from public/editor and exports without dropping other PDF bytes", async ({
  page,
  context,
}) => {
  await page.goto(url("index.html") + "#testimonials");
  await expect(page.locator(".document-section")).toHaveCount(3);
  await expect(page.locator(".pdf-slot")).toHaveCount(4);
  await expect(
    page.getByRole("heading", {
      name: "Signed consent of principal and teacher",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.screenshot({
    path: path.join(root, "screenshots/requested-testimonials-default.png"),
    fullPage: true,
  });
  const old = previousData();
  await context.route("**/content.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: "window.PORTFOLIO_CONTENT = " + JSON.stringify(old) + ";",
    }),
  );
  await page.goto(url("index.html") + "#testimonials");
  await expect(page.locator(".document-section")).toHaveCount(3);
  await expect(page.locator(".pdf-slot")).toHaveCount(4);
  await expect(page.locator("main")).not.toContainText("Custom section 1");
  await page.goto(url("editor.html"));
  await page.locator("#chapter-choice").selectOption("testimonials");
  await expect(
    page.locator('input[type=file][accept="application/pdf"]'),
  ).toHaveCount(4);
  const expected = structuredClone(old);
  expected.pages.find((p) => p.id === "testimonials").documents.splice(1, 1);
  expect(await exported(page)).toEqual(expected);
  await page.screenshot({
    path: path.join(root, "screenshots/requested-testimonials-editor.png"),
    fullPage: true,
  });
  await importData(page, old);
  await expect(page.getByRole("status")).toContainText("consent");
  await page.locator("#save-draft").click();
  await expect(page.getByRole("status")).toContainText("Draft saved");
  await page.reload();
  expect(await exported(page)).toEqual(expected);
  const waiting = page.waitForEvent("popup");
  await page.locator("#preview").click();
  const preview = await waiting;
  await preview.goto(url("index.html") + "?preview=1#testimonials");
  await expect(preview.locator(".document-section")).toHaveCount(3);
  for (const section of expected.pages.find((p) => p.id === "testimonials")
    .documents) {
    for (const file of section.files) {
      const waiting = preview.waitForEvent("download");
      await preview
        .getByRole("link", { name: "Download PDF: " + file.title, exact: true })
        .click();
      expect(fs.readFileSync(await (await waiting).path())).toEqual(
        Buffer.from(file.href.split(",")[1], "base64"),
      );
    }
  }
  await preview.evaluate(() => {
    document.activeElement.blur();
    scrollTo(0, 0);
  });
  await preview.screenshot({
    path: path.join(root, "screenshots/requested-testimonials-preview.png"),
    fullPage: true,
  });
  // Re-open the export as the actual deployed baseline, then import the old file again.
  await context.unroute("**/content.js");
  await context.route("**/content.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: "window.PORTFOLIO_CONTENT = " + JSON.stringify(expected) + ";",
    }),
  );
  const fresh = await context.newPage();
  await fresh.goto(url("editor.html"));
  await importData(fresh, old);
  expect(await exported(fresh)).toEqual(expected);
});

test("actual previous twelve-page IndexedDB drafts retain their saved base/SHA and custom media through migration", async ({
  page,
}) => {
  const origin = "http://portfolio.test";
  const base = previousData();
  const draft = structuredClone(base);
  draft.site.name = "Saved custom teacher";
  draft.images.portrait.src =
    "data:image/jpeg;base64," +
    fs
      .readFileSync(path.join(root, "assets/classroom-photo.jpg"))
      .toString("base64");
  const action = draft.pages.find((p) => p.id === "teaching-in-action");
  action.gallery = [
    {
      src: draft.images.portrait.src,
      alt: "Saved photo",
      caption: "Custom caption",
      detail: "Custom details",
    },
  ];
  action.videos = [
    {
      src:
        "data:video/webm;base64," +
        fs
          .readFileSync(path.join(root, "tests/test-clip.webm"))
          .toString("base64"),
      alt: "Saved clip",
      caption: "Video caption",
      detail: "Video details",
    },
  ];
  let sha = "saved-sha",
    writes = 0;
  await page.route("**/*", (route) => {
    const request = route.request();
    if (request.url().startsWith("https://api.github.com/")) {
      if (request.method() !== "GET") {
        writes++;
        return route.abort();
      }
      return route.fulfill({
        json: {
          sha,
          content: Buffer.from(
            "window.PORTFOLIO_CONTENT = " + JSON.stringify(base) + ";",
          ).toString("base64"),
        },
      });
    }
    if (request.url().startsWith(origin + "/")) {
      const file = path.join(root, new URL(request.url()).pathname);
      return fs.existsSync(file)
        ? route.fulfill({ path: file })
        : route.fulfill({ status: 404 });
    }
    return route.abort();
  });
  await page.goto(origin + "/editor.html");
  await expect(page.locator("#publish-status")).toContainText("Conflict");
  await page.evaluate(
    async ({ base, draft }) => {
      await new Promise((resolve, reject) => {
        const r = indexedDB.open("teacher-portfolio-drafts", 1);
        r.onsuccess = () => {
          const db = r.result,
            tx = db.transaction("drafts", "readwrite");
          tx.objectStore("drafts").put(
            {
              content: draft,
              baseContent: JSON.stringify(base),
              baseSha: "saved-sha",
            },
            location.pathname,
          );
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = reject;
        };
        r.onerror = reject;
      });
    },
    { base, draft },
  );
  await page.reload();
  await expect(page.getByRole("status")).toContainText("Saved draft restored");
  await expect(page.getByRole("status")).toContainText("consent");
  await expect(page.locator("#publish-status")).toContainText(
    "Repository version checked",
  );
  const expected = structuredClone(draft);
  expected.pages.find((p) => p.id === "testimonials").documents.splice(1, 1);
  expect(await exported(page)).toEqual(expected);
  await page.locator("#save-draft").click();
  await expect(page.getByRole("status")).toContainText("Draft saved");
  await page.reload();
  expect(await exported(page)).toEqual(expected);
  const saved = await page.evaluate(
    async () =>
      await new Promise((resolve) => {
        const r = indexedDB.open("teacher-portfolio-drafts", 1);
        r.onsuccess = () => {
          const db = r.result,
            get = db
              .transaction("drafts")
              .objectStore("drafts")
              .get(location.pathname);
          get.onsuccess = () => {
            resolve(get.result);
            db.close();
          };
        };
      }),
  );
  expect(saved.baseSha).toBe("saved-sha");
  const expectedBase = structuredClone(base);
  expectedBase.pages
    .find((p) => p.id === "testimonials")
    .documents.splice(1, 1);
  expect(JSON.parse(saved.baseContent)).toEqual(expectedBase);
  sha = "changed-sha-with-same-normalized-content";
  await page.reload();
  await expect(page.locator("#publish-status")).toContainText("Conflict");
  expect(await exported(page)).toEqual(expected);
  expect(writes).toBe(0);
});

test("Reflective Summary blank-line introduction and body escape HTML in preview and exported public baseline, saving and reopening", async ({
  page,
  context,
}) => {
  await page.goto(url("editor.html"));
  await page.locator("#chapter-choice").selectOption("final-reflection");
  const intro = page.getByLabel("Introduction", { exact: true });
  await expect(intro).toHaveJSProperty("tagName", "TEXTAREA");
  await intro.fill('First <script>bad()</script> & "intro"');
  await intro.press("End");
  await intro.press("Enter");
  await intro.press("Enter");
  await intro.pressSequentially("Second intro");
  const value = await intro.inputValue();
  const data = await exported(page);
  const summary = data.pages.find((p) => p.id === "final-reflection");
  expect(summary.intro).toBe(value);
  summary.paragraphs[0] = "Body <img src=x onerror=bad()>\n \nSecond body";
  await importData(page, data);
  const bodyField = page.getByLabel("Text 1", { exact: true });
  await expect(bodyField).toHaveJSProperty("tagName", "TEXTAREA");
  await expect(bodyField).toHaveValue(summary.paragraphs[0]);
  await bodyField.fill(summary.paragraphs[0]);
  await page.locator("#save-draft").click();
  await expect(page.getByRole("status")).toContainText("Draft saved");
  await page.reload();
  await page.locator("#chapter-choice").selectOption("final-reflection");
  await expect(page.getByLabel("Introduction", { exact: true })).toHaveValue(
    value,
  );
  expect(await exported(page)).toEqual(data);
  const popup = page.waitForEvent("popup");
  await page.locator("#preview").click();
  const preview = await popup;
  await preview.goto(url("index.html") + "?preview=1#final-reflection");
  async function check(p) {
    await expect(p.locator(".page-intro p")).toHaveCount(2);
    await expect(p.locator(".page-intro p").first()).toHaveText(
      'First <script>bad()</script> & "intro"',
    );
    await expect(p.locator(".page-intro p").last()).toHaveText("Second intro");
    await expect(p.locator(".final-layout > div > p")).toHaveCount(4);
    await expect(p.locator("main script, main img[onerror]")).toHaveCount(0);
    await expect(p.locator(".final-layout")).toContainText(
      "Body <img src=x onerror=bad()>",
    );
    await expect(p.locator(".page-heading > h1")).toHaveText(
      "Reflective Summary",
    );
    await expect(p.locator(".page-heading > .heading-botanical")).toHaveCount(
      1,
    );
  }
  await check(preview);
  await preview.screenshot({
    path: path.join(root, "screenshots/requested-summary-preview.png"),
    fullPage: true,
  });
  const publicPage = await context.newPage();
  await publicPage.route("**/content.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: "window.PORTFOLIO_CONTENT = " + JSON.stringify(data) + ";",
    }),
  );
  await publicPage.goto(url("index.html") + "#final-reflection");
  await check(publicPage);
  await publicPage.setViewportSize({ width: 390, height: 844 });
  // Wait for the responsive sidebar's slide-out transition before capturing content.
  await expect
    .poll(() =>
      publicPage
        .locator("#sidebar")
        .evaluate((el) => el.getBoundingClientRect().right),
    )
    .toBeLessThanOrEqual(0);
  expect(
    await publicPage.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await publicPage.screenshot({
    path: path.join(root, "screenshots/requested-summary-mobile.png"),
    fullPage: true,
  });
});
