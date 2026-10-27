const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const root = path.resolve(__dirname, "..");
const url = (file) => pathToFileURL(path.join(root, file)).href;
const pdf = {
  name: "verified-test.pdf",
  mimeType: "application/pdf",
  buffer: fs.readFileSync(path.join(root, "tests/test-document.pdf")),
};
async function exportData(page) {
  const wait = page.waitForEvent("download");
  await page.locator("#export").click();
  const download = await wait;
  const text = fs.readFileSync(await download.path(), "utf8");
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
test("six lesson PDFs and four evidence sections upload, download, clear and round-trip safely", async ({
  page,
  context,
}) => {
  await page.goto(url("editor.html"));
  await page.locator("#chapter-choice").selectOption("lesson-plans");
  await expect(
    page.locator('input[type=file][accept="application/pdf"]'),
  ).toHaveCount(6);
  await page
    .getByLabel("Upload PDF for Week 01", { exact: true })
    .setInputFiles(pdf);
  await expect(page.getByRole("status")).toContainText("embedded");
  await page.locator("#chapter-choice").selectOption("testimonials");
  await expect(
    page.locator('input[type=file][accept="application/pdf"]'),
  ).toHaveCount(6);
  await expect(page.locator("#text-fields")).toContainText("signatures");
  await page
    .getByLabel("Upload PDF for Observation form 1", { exact: true })
    .setInputFiles(pdf);
  const out = await exportData(page);
  expect(
    out.data.pages.find((p) => p.id === "lesson-plans").weeks[0].href,
  ).toMatch(/^data:application\/pdf;base64,/);
  await page.getByLabel("Import content.js").setInputFiles({
    name: "content.js",
    mimeType: "text/javascript",
    buffer: Buffer.from(out.text),
  });
  await expect(page.getByRole("status")).toContainText("Imported");
  const again = await exportData(page);
  expect(again.data).toEqual(out.data);
  const p = await preview(page, context);
  await p.goto(url("index.html") + "?preview=1#lesson-plans");
  await expect(p.locator(".pdf-slot")).toHaveCount(6);
  await expect(
    p.getByRole("link", { name: "Download PDF: Week 01" }),
  ).toHaveAttribute("download", "Week 01.pdf");
  const downloaded = p.waitForEvent("download");
  await p.getByRole("link", { name: "Download PDF: Week 01" }).click();
  expect(fs.readFileSync(await (await downloaded).path())).toEqual(pdf.buffer);
  await p.goto(url("index.html") + "?preview=1#testimonials");
  await expect(p.locator(".document-section")).toHaveCount(4);
  await expect(
    p.getByRole("link", { name: "Download PDF: Observation form 1" }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Remove PDF for Observation form 1",
      exact: true,
    })
    .click();
  expect(
    (await exportData(page)).data.pages.find((p) => p.id === "testimonials")
      .documents[0].files[0].href,
  ).toBe("");
});
test("accepted resources gallery photo renders in editor preview and enlargement", async ({
  page,
  context,
}) => {
  const fixtureDir = fs.mkdtempSync(path.join(root, "resources/gallery-test-"));
  const fixture = path.join(fixtureDir, "class-photo.jpg");
  fs.copyFileSync(path.join(root, "assets/classroom-photo.jpg"), fixture);
  const src = path.relative(root, fixture).split(path.sep).join("/");
  try {
    await page.goto(url("editor.html"));
    await page.locator("#chapter-choice").selectOption("teaching-in-action");
    await page.getByRole("button", { name: "Add photo", exact: true }).click();
    await page.getByLabel("Local path for photo 1", { exact: true }).fill(src);
    await page.getByLabel("Local path for photo 1", { exact: true }).blur();
    await page
      .getByLabel("Caption for photo 1", { exact: true })
      .fill("Resources classroom photo");
    await page
      .getByLabel("Image description for photo 1", { exact: true })
      .fill("Classroom from resources");
    await page
      .getByLabel("Details for photo 1", { exact: true })
      .fill("Resources photo details");
    expect(
      (await exportData(page)).data.pages.find(
        (p) => p.id === "teaching-in-action",
      ).gallery[0].src,
    ).toBe(src);

    const p = await preview(page, context);
    await p.goto(url("index.html") + "?preview=1#teaching-in-action");
    const thumbnail = p.locator(".gallery img");
    await expect(thumbnail).toHaveAttribute("src", src);
    await expect(thumbnail).toHaveAttribute("alt", "Classroom from resources");
    await thumbnail.evaluate((img) => img.decode());
    await p
      .getByRole("button", {
        name: "Enlarge Resources classroom photo",
        exact: true,
      })
      .click();
    await expect(p.locator("#image-dialog")).toBeVisible();
    await expect(p.locator("#dialog-image")).toHaveAttribute(
      "src",
      url(path.relative(root, fixture)),
    );
    await expect(p.locator("#dialog-image")).toHaveAttribute(
      "alt",
      "Classroom from resources",
    );
    await p.locator("#dialog-image").evaluate((img) => img.decode());
    await expect(p.locator("#dialog-caption")).toHaveText(
      "Resources classroom photo",
    );
    await expect(p.locator("#dialog-detail")).toHaveText(
      "Resources photo details",
    );
  } finally {
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  }
});
test("gallery supports thirty real photos and three playable clips, metadata, removal and round-trip", async ({
  page,
  context,
}) => {
  test.setTimeout(120000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url("editor.html"));
  await page.locator("#chapter-choice").selectOption("teaching-in-action");
  await expect(
    page.getByRole("button", { name: "Add photo", exact: true }),
  ).toBeVisible();
  for (let i = 0; i < 30; i++) {
    await page.getByRole("button", { name: "Add photo", exact: true }).click();
    await page
      .getByLabel(`Upload photo ${i + 1}`, { exact: true })
      .setInputFiles(path.join(root, "assets/classroom-photo.jpg"));
    await expect(page.getByRole("status")).toContainText("embedded");
  }
  await expect(
    page.getByRole("button", { name: "Add photo", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("Caption for photo 1", { exact: true })
    .fill("Lesson in progress");
  await page
    .getByLabel("Image description for photo 1", { exact: true })
    .fill("Empty test classroom");
  await page
    .getByLabel("Details for photo 1", { exact: true })
    .fill("Test details only");
  for (let i = 0; i < 3; i++) {
    await page
      .getByRole("button", { name: "Add video clip", exact: true })
      .click();
    await page
      .getByLabel(`Upload video ${i + 1}`, { exact: true })
      .setInputFiles(path.join(root, "tests/test-clip.webm"));
    await expect(page.getByRole("status")).toContainText("embedded");
  }
  await expect(
    page.getByRole("button", { name: "Add video clip", exact: true }),
  ).toBeDisabled();
  const out = await exportData(page);
  await page.getByLabel("Import content.js").setInputFiles({
    name: "content.js",
    mimeType: "text/javascript",
    buffer: Buffer.from(out.text),
  });
  await expect(page.getByRole("status")).toContainText("Imported");
  expect((await exportData(page)).data).toEqual(out.data);
  const p = await preview(page, context);
  await expect(page.getByRole("status")).toContainText("local preview cache");
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await p.goto(url("index.html") + "?preview=1#teaching-in-action");
  await expect(p.locator(".gallery img")).toHaveCount(30);
  await expect(p.locator("video[controls]")).toHaveCount(3);
  await p
    .locator("video")
    .first()
    .evaluate(async (v) => {
      await v.play();
      v.pause();
    });
  await p
    .getByRole("button", { name: "Enlarge Lesson in progress", exact: true })
    .click();
  await expect(p.locator("#dialog-detail")).toHaveText("Test details only");
  await p.keyboard.press("Escape");
  await p
    .locator("video")
    .evaluateAll((videos) => videos.forEach((v) => (v.width = 1920)));
  await p.setViewportSize({ width: 320, height: 700 });
  expect(
    await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  await p.screenshot({
    path: path.join(root, "screenshots/corrections-gallery-mobile.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Remove photo 30", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Remove video 3", exact: true })
    .click();
  const removed = (await exportData(page)).data.pages.find(
    (p) => p.id === "teaching-in-action",
  );
  expect(removed.gallery).toHaveLength(29);
  expect(removed.videos).toHaveLength(2);
  expect(errors).toEqual([]);
});
test("legacy import and saved browser drafts migrate, school logo starts blank and uploads, invalid files are rejected", async ({
  page,
  context,
}) => {
  await page.goto(url("editor.html"));
  await page
    .getByLabel("Import content.js")
    .setInputFiles(path.join(root, "tests/legacy-content.fixture.json"));
  await expect(page.getByRole("status")).toContainText("migrated");
  await page.locator("#chapter-choice").selectOption("site");
  await page
    .getByLabel("Teacher name", { exact: true })
    .fill("Migrated draft teacher");
  await page.locator("#save-draft").click();
  await expect(page.getByRole("status")).toContainText("Draft saved");
  await page.reload();
  await expect(page.getByLabel("Teacher name", { exact: true })).toHaveValue(
    "Migrated draft teacher",
  );
  await page.locator("#picture-tab").click();
  await expect(page.locator("#upload-schoolLogo")).toBeVisible();
  await page
    .getByLabel("Upload picture for schoolLogo")
    .setInputFiles(path.join(root, "assets/classroom-photo.jpg"));
  await expect(page.getByRole("status")).toContainText("Unsaved");
  const out = await exportData(page);
  expect(out.data.images.schoolLogo.src).toMatch(/^data:image/);
  expect(out.data.legacyArchive.pages).toHaveLength(14);
  const p = await preview(page, context);
  await expect(p.locator(".glance img.school-logo")).toBeVisible();
  await p.screenshot({
    path: path.join(root, "screenshots/corrections-home-desktop.png"),
    fullPage: true,
  });
  await page.locator("#text-tab").click();
  await page.locator("#chapter-choice").selectOption("lesson-plans");
  await page
    .getByLabel("Upload PDF for Week 01", { exact: true })
    .setInputFiles({
      name: "not.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("not a PDF"),
    });
  await expect(page.getByRole("status")).toContainText("could not be added");
  const bad = structuredClone(out.data);
  bad.pages.find((p) => p.id === "lesson-plans").weeks[0].href =
    "data:text/html;base64,PHNjcmlwdD4=";
  await page.getByLabel("Import content.js").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(bad)),
  });
  await expect(page.getByRole("status")).toContainText("could not be imported");
});
test("original stored fourteen-page draft restores with its base and custom copy intact", async ({
  page,
}) => {
  await page.goto(url("editor.html"));
  await expect(page.locator("#chapter-choice")).toBeVisible();
  const legacy = JSON.parse(
    fs.readFileSync(
      path.join(root, "tests/legacy-content.fixture.json"),
      "utf8",
    ),
  );
  legacy.site.name = "Original saved teacher";
  await page.evaluate(async (legacy) => {
    await new Promise((ok, no) => {
      const r = indexedDB.open("teacher-portfolio-drafts", 1);
      r.onsuccess = () => {
        const db = r.result;
        const tx = db.transaction("drafts", "readwrite");
        tx.objectStore("drafts").put(
          {
            content: legacy,
            baseContent: JSON.stringify(legacy),
            baseSha: "old-sha",
          },
          location.pathname,
        );
        tx.oncomplete = () => {
          db.close();
          ok();
        };
        tx.onerror = no;
      };
      r.onerror = no;
    });
  }, legacy);
  await page.reload();
  await expect(page.getByRole("status")).toContainText(
    "legacy draft restored and migrated",
  );
  await expect(page.getByLabel("Teacher name", { exact: true })).toHaveValue(
    "Original saved teacher",
  );
  expect((await exportData(page)).data.pages).toHaveLength(12);
});
test("blank public assets are honest and oversized or unsafe uploads never change the draft", async ({
  page,
}) => {
  await page.goto(url("index.html"));
  await expect(page.locator(".glance img.school-logo")).toHaveCount(0);
  await page.screenshot({
    path: path.join(root, "screenshots/corrections-home-default.png"),
    fullPage: true,
  });
  await page.goto(url("index.html") + "#teaching-in-action");
  await expect(page.locator(".gallery img,video")).toHaveCount(0);
  await page.goto(url("index.html") + "#lesson-plans");
  await expect(page.locator("main a[download]")).toHaveCount(0);
  await page.goto(url("editor.html"));
  await page.locator("#chapter-choice").selectOption("lesson-plans");
  await page
    .getByLabel("Upload PDF for Week 01", { exact: true })
    .setInputFiles({
      name: "large.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(15 * 1024 * 1024 + 1),
    });
  await expect(page.getByRole("status")).toContainText(
    "15 MiB (15,728,640 bytes) per-file limit",
  );
  await page.locator("#chapter-choice").selectOption("teaching-in-action");
  await page
    .getByRole("button", { name: "Add video clip", exact: true })
    .click();
  await page.getByLabel("Upload video 1", { exact: true }).setInputFiles({
    name: "large.webm",
    mimeType: "video/webm",
    buffer: Buffer.alloc(6 * 1024 * 1024 + 1),
  });
  await expect(page.getByRole("status")).toContainText("too large");
  await page
    .getByLabel("Local path for video 1", { exact: true })
    .fill("assets/../private.webm");
  await page.getByLabel("Local path for video 1", { exact: true }).blur();
  await expect(page.getByRole("status")).toContainText("safe local");
  expect(
    (await exportData(page)).data.pages.find(
      (p) => p.id === "teaching-in-action",
    ).videos[0].src,
  ).toBe("");
});
test("logo can be cleared and unsafe fixed picture paths are refused without broken empty previews", async ({
  page,
}) => {
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url("editor.html"));
  await page.locator("#picture-tab").click();
  await expect(page.locator('#picture-fields img[src=""]')).toHaveCount(0);
  await page
    .getByLabel("Optional local filename for schoolLogo", { exact: true })
    .fill("assets/../private.svg");
  await page
    .getByLabel("Optional local filename for schoolLogo", { exact: true })
    .blur();
  await expect(page.getByRole("status")).toContainText("safe");
  await page
    .getByLabel("Upload picture for schoolLogo")
    .setInputFiles(path.join(root, "assets/classroom-photo.jpg"));
  await expect(page.getByRole("status")).toContainText("Unsaved");
  await page
    .getByLabel("Optional local filename for schoolLogo", { exact: true })
    .fill("assets/logo.png");
  await page
    .getByLabel("Optional local filename for schoolLogo", { exact: true })
    .fill("");
  await page
    .getByLabel("Optional local filename for schoolLogo", { exact: true })
    .blur();
  expect((await exportData(page)).data.images.schoolLogo.src).toBe("");
  expect(errors).toEqual([]);
});
test("fixed picture uploads also enforce the aggregate draft limit", async ({
  page,
}) => {
  await page.goto(url("editor.html"));
  await page.locator("#picture-tab").click();
  await page.evaluate(() => (window.PortfolioAssets.maxContent = 1000));
  await page
    .getByLabel("Upload picture for hero", { exact: true })
    .setInputFiles(path.join(root, "assets/classroom-photo.jpg"));
  await expect(page.getByRole("status")).toContainText("40 MB");
  expect((await exportData(page)).data.images.hero.src).toBe(
    "assets/classroom-photo.jpg",
  );
});
async function preview(page, context) {
  const popup = page.waitForEvent("popup");
  await page.locator("#preview").click();
  const p = await popup;
  await p.waitForLoadState();
  return p;
}
test("philosophy and separate class profiles preserve blank-line paragraphs and escape markup", async ({
  page,
  context,
}) => {
  await page.goto(url("editor.html"));
  await page.locator("#chapter-choice").selectOption("teaching-philosophy");
  const body = page.getByLabel("Body", { exact: true });
  await expect(body).toHaveJSProperty("tagName", "TEXTAREA");
  await body.fill("First paragraph <script>bad()</script>\n\nSecond paragraph");
  await page.locator("#chapter-choice").selectOption("my-learners");
  const profiles = page
    .locator("fieldset")
    .filter({ has: page.locator("legend", { hasText: "Profiles" }) });
  await expect(
    profiles.getByLabel("Introduction", { exact: true }),
  ).toHaveCount(2);
  await profiles
    .getByLabel("Introduction", { exact: true })
    .first()
    .fill("Grade six first\n\nGrade six second");
  const p = await preview(page, context);
  await p.goto(url("index.html") + "?preview=1#teaching-philosophy");
  await expect(p.locator(".philosophy .lead-copy p")).toHaveCount(2);
  await expect(p.locator("main script")).toHaveCount(0);
  await expect(p.locator(".philosophy")).toContainText(
    "<script>bad()</script>",
  );
  await p.goto(url("index.html") + "?preview=1#my-learners");
  await expect(
    p.getByRole("heading", { name: "Grade 6 Class Profile" }),
  ).toBeVisible();
  await expect(
    p.getByRole("heading", { name: "Grade 9 Class Profile" }),
  ).toBeVisible();
  await expect(p.locator(".class-profile").first().locator("p")).toHaveCount(2);
});
