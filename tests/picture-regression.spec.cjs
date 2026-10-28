const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { pathToFileURL } = require("node:url");
const root = path.resolve(__dirname, "..");
const url = (name) => pathToFileURL(path.join(root, name)).href;
async function open(page) {
  await page.goto(url("editor.html"));
  await expect(page.locator("#editor-status")).not.toHaveText("");
  await page.locator("#picture-tab").click();
}
async function raster(page, color = "#e02030", size) {
  const data = await page.evaluate((color) => {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 96;
    const ctx = c.getContext("2d");
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 128, 96);
    ctx.fillStyle = "#182838";
    ctx.fillRect(64, 0, 64, 96);
    return c.toDataURL("image/png");
  }, color);
  const bytes = Buffer.from(data.split(",")[1], "base64");
  return {
    name: "synthetic-photo.png",
    mimeType: "image/png",
    buffer: size
      ? Buffer.concat([bytes, Buffer.alloc(size - bytes.length)])
      : bytes,
  };
}
async function exported(page) {
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
async function pixels(img, expected) {
  await expect(img).toHaveAttribute("src", /^data:image/);
  expect(
    await img.evaluate(async (img) => {
      await img.decode();
      const c = document.createElement("canvas");
      c.width = c.height = 1;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);
      return [...ctx.getImageData(0, 0, 1, 1).data];
    }),
  ).toEqual(expected);
}
async function preview(page) {
  const wait = page.waitForEvent("popup");
  await page.locator("#preview").click();
  const p = await wait;
  await p.waitForLoadState();
  return p;
}
test("successful fixed photo synchronizes filename and survives consecutive preview, save/reopen and import", async ({
  page,
  context,
}) => {
  await open(page);
  await page.locator("#upload-hero").setInputFiles(await raster(page));
  const img = page.locator(".picture-card img").first();
  await pixels(img, [224, 32, 48, 255]);
  await expect(page.locator("#path-hero")).toHaveValue("");
  await expect(page.locator("#upload-hero-feedback")).toContainText(
    "synthetic-photo.png",
  );
  await page.locator("#path-hero").focus();
  await page.locator("#path-hero").blur();
  let p = await preview(page);
  await pixels(p.locator(".hero-art img"), [224, 32, 48, 255]);
  await p.close();
  await page
    .locator("#upload-hero")
    .setInputFiles(await raster(page, "#2040e0"));
  await pixels(img, [32, 64, 224, 255]);
  await page
    .locator(".picture-card")
    .first()
    .screenshot({ path: path.join(root, "screenshots/picture-success.png") });
  p = await preview(page);
  await pixels(p.locator(".hero-art img"), [32, 64, 224, 255]);
  await p.reload();
  await pixels(p.locator(".hero-art img"), [32, 64, 224, 255]);
  await p.screenshot({
    path: path.join(root, "screenshots/picture-preview.png"),
    fullPage: true,
  });
  await p.close();
  const out = await exported(page);
  await page.locator("#save-draft").click();
  await expect(page.locator("#editor-status")).toContainText("Draft saved");
  await page.close();
  page = await context.newPage();
  await page.goto(url("editor.html"));
  await expect(page.locator("#editor-status")).toContainText("restored");
  await page.locator("#picture-tab").click();
  await pixels(page.locator(".picture-card img").first(), [32, 64, 224, 255]);
  await page.locator("#import-file").setInputFiles({
    name: "content.js",
    mimeType: "text/javascript",
    buffer: Buffer.from(out.text),
  });
  await expect(page.locator("#editor-status")).toContainText("Imported");
  expect((await exported(page)).data).toEqual(out.data);
  await pixels(page.locator(".picture-card img").first(), [32, 64, 224, 255]);
});
test("preview reads IndexedDB when sessionStorage access throws", async ({
  page,
}) => {
  await open(page);
  await page.locator("#upload-hero").setInputFiles(await raster(page));
  await pixels(page.locator(".picture-card img").first(), [224, 32, 48, 255]);
  const data = (await exported(page)).data;
  await page.evaluate(
    (data) => PortfolioAssets.previewStore("readwrite", data),
    data,
  );
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("blocked", "SecurityError");
    };
  });
  await page.goto(url("index.html") + "?preview=1#home");
  await pixels(page.locator(".hero-art img"), [224, 32, 48, 255]);
});
test("preview writes IndexedDB when sessionStorage set and remove throw", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = Storage.prototype.removeItem = () => {
      throw new DOMException("blocked", "SecurityError");
    };
  });
  await open(page);
  await page.locator("#upload-hero").setInputFiles(await raster(page));
  await pixels(page.locator(".picture-card img").first(), [224, 32, 48, 255]);
  const popup = page.waitForEvent("popup");
  await page.locator("#preview").click();
  await expect(page.locator("#editor-status")).toContainText("Preview opened");
  const p = await popup;
  await p.waitForLoadState();
  await pixels(p.locator(".hero-art img"), [224, 32, 48, 255]);
});
test("exactly 8 MiB raster is accepted; decode errors preserve existing custom content", async ({
  page,
}) => {
  await open(page);
  await page
    .locator("#upload-hero")
    .setInputFiles(await raster(page, undefined, 8 * 1024 * 1024));
  await pixels(page.locator(".picture-card img").first(), [224, 32, 48, 255]);
  const before = (await exported(page)).data;
  for (const mimeType of ["image/png", "text/plain"]) {
    await page.locator("#upload-hero").setInputFiles({
      name: "invalid.png",
      mimeType,
      buffer: Buffer.from("not an image"),
    });
    await expect(page.locator("#upload-hero-feedback")).toContainText(
      "Previous picture kept",
    );
    expect((await exported(page)).data).toEqual(before);
    await pixels(page.locator(".picture-card img").first(), [224, 32, 48, 255]);
  }
});
test("save and preview refuse pending image decode and use the new image after completion", async ({
  page,
}) => {
  await open(page);
  await page.evaluate(() => {
    const decode = window.createImageBitmap;
    window.createImageBitmap = async (...args) => {
      await new Promise((resolve) => {
        window.finishDecode = resolve;
      });
      return decode(...args);
    };
  });
  await page.locator("#upload-hero").setInputFiles(await raster(page));
  await expect(page.locator("#upload-hero-feedback")).toContainText(
    "Processing",
  );
  await page.locator("#save-draft").click();
  await expect(page.locator("#editor-status")).toContainText("Wait");
  await page.locator("#preview").click();
  await expect(page.locator("#editor-status")).toContainText("Wait");
  expect(page.context().pages()).toHaveLength(1);
  await page.evaluate(() => window.finishDecode());
  await pixels(page.locator(".picture-card img").first(), [224, 32, 48, 255]);
  const p = await preview(page);
  await pixels(p.locator(".hero-art img"), [224, 32, 48, 255]);
});
test("explicit IndexedDB preview ignores stale session snapshot across consecutive edits and reloads", async ({
  page,
}) => {
  await open(page);
  await page.locator("#upload-hero").setInputFiles(await raster(page));
  await pixels(page.locator(".picture-card img").first(), [224, 32, 48, 255]);
  let p = await preview(page);
  await p.close();
  await page.evaluate(() => {
    Storage.prototype.setItem = Storage.prototype.removeItem = () => {
      throw new DOMException("blocked", "SecurityError");
    };
  });
  for (const [color, expected] of [
    ["#2040e0", [32, 64, 224, 255]],
    ["#e02030", [224, 32, 48, 255]],
  ]) {
    await page.locator("#upload-hero").setInputFiles(await raster(page, color));
    await pixels(page.locator(".picture-card img").first(), expected);
    p = await preview(page);
    expect(p.url()).toContain("previewStore=indexeddb");
    await pixels(p.locator(".hero-art img"), expected);
    await p.reload();
    await pixels(p.locator(".hero-art img"), expected);
    await p.close();
  }
});
test("blocked session and IndexedDB storage keeps edits exportable and reports failure", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = Storage.prototype.removeItem = () => {
      throw Error("blocked");
    };
    IDBFactory.prototype.open = () => {
      throw Error("blocked");
    };
  });
  await open(page);
  await page.locator("#upload-hero").setInputFiles(await raster(page));
  await pixels(page.locator(".picture-card img").first(), [224, 32, 48, 255]);
  await page.locator("#save-draft").click();
  await expect(page.locator("#editor-status")).toContainText(
    "could not be saved",
  );
  await page.locator("#preview").click();
  await expect(page.locator("#editor-status")).toContainText(
    "blocks local preview",
  );
  expect((await exported(page)).data.images.hero.src).toMatch(/^data:image/);
});
test("40 MiB populated portfolio now accepts extra raster and previews the new photo via IndexedDB", async ({
  page,
}) => {
  test.setTimeout(120000);
  await open(page);
  await page.locator("#upload-hero").setInputFiles(await raster(page));
  await pixels(page.locator(".picture-card img").first(), [224, 32, 48, 255]);
  const data = (await exported(page)).data;
  const weeks = data.pages.find((p) => p.id === "lesson-plans").weeks;
  const pdfBytes = Buffer.alloc(9 * 1024 * 1024, 32);
  fs.readFileSync(path.join(__dirname, "test-document.pdf")).copy(pdfBytes);
  const pdf = pdfBytes.toString("base64");
  weeks[0].href = "data:application/pdf;base64," + pdf;
  weeks[1].href = weeks[0].href;
  weeks[2].href = "data:application/pdf;base64,";
  const spare =
    40 * 1024 * 1024 - Buffer.byteLength(JSON.stringify(data)) - 4096;
  const tail = Buffer.alloc(Math.floor(spare / 4) * 3, 32);
  fs.readFileSync(path.join(__dirname, "test-document.pdf")).copy(tail);
  weeks[2].href += tail.toString("base64");
  await page.locator("#import-file").setInputFiles({
    name: "populated.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await expect(page.locator("#editor-status")).toContainText("Imported");
  // This crosses the former 40 MiB cap, but is within the new 100 MiB budget.
  const photo = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 1600;
    const x = c.getContext("2d");
    x.fillStyle = "#2040e0";
    x.fillRect(0, 0, 1600, 1600);
    return c.toDataURL("image/png");
  });
  await page.locator("#upload-hero").setInputFiles({
    name: "larger.png",
    mimeType: "image/png",
    buffer: Buffer.from(photo.split(",")[1], "base64"),
  });
  await expect(page.locator("#upload-hero-feedback")).toContainText(
    "Picture embedded in draft",
  );
  const updated = (await exported(page)).data;
  expect(Buffer.byteLength(JSON.stringify(updated))).toBeGreaterThan(
    40 * 1024 * 1024,
  );
  data.images.hero.src = updated.images.hero.src;
  expect(updated).toEqual(data);
  await pixels(page.locator(".picture-card img").first(), [32, 64, 224, 255]);
  const p = await preview(page);
  expect(p.url()).toContain("previewStore=indexeddb");
  await pixels(p.locator(".hero-art img"), [32, 64, 224, 255]);
});
test("custom previous export loaded as baseline retains PDFs, gallery and copy after fixed photo update", async ({
  page,
}) => {
  const baseline = { window: {} };
  vm.runInNewContext(
    fs.readFileSync(path.join(root, "content.js"), "utf8"),
    baseline,
  );
  const data = baseline.window.PORTFOLIO_CONTENT;
  data.site.name = "Synthetic custom teacher";
  data.pages
    .find((p) => p.id === "teaching-in-action")
    .gallery.push({
      src: "assets/classroom-photo.jpg",
      alt: "Synthetic baseline gallery",
      caption: "Existing custom photo",
      detail: "Preserve this existing record",
    });
  data.pages.find((p) => p.id === "lesson-plans").weeks[1].href =
    "data:application/pdf;base64," +
    fs
      .readFileSync(path.join(__dirname, "test-document.pdf"))
      .toString("base64");
  await page.addInitScript((data) => {
    Object.defineProperty(window, "PORTFOLIO_CONTENT", {
      get: () => data,
      set: () => {},
      configurable: true,
    });
  }, data);
  await open(page);
  await page.locator("#upload-hero").setInputFiles(await raster(page));
  await pixels(page.locator(".picture-card img").first(), [224, 32, 48, 255]);
  const out = await exported(page);
  const expected = structuredClone(data);
  expected.images.hero.src = out.data.images.hero.src;
  expect(out.data).toEqual(expected);
  await page.locator("#save-draft").click();
  await expect(page.locator("#editor-status")).toContainText("Draft saved");
  await page.reload();
  await expect(page.locator("#editor-status")).toContainText("restored");
  expect((await exported(page)).data).toEqual(expected);
  await page.locator("#import-file").setInputFiles({
    name: "content.js",
    mimeType: "text/javascript",
    buffer: Buffer.from(out.text),
  });
  await expect(page.locator("#editor-status")).toContainText("Imported");
  expect((await exported(page)).data).toEqual(expected);
});
test("oversized fixed photo rejection is inline, clears misleading selection and preserves all data", async ({
  page,
}) => {
  await open(page);
  const before = (await exported(page)).data;
  const file = page.locator("#upload-hero");
  await file.setInputFiles(await raster(page, undefined, 8 * 1024 * 1024 + 1));
  await expect(page.locator("#editor-status")).toContainText("8");
  await expect(file.locator("..").locator(".picture-feedback")).toContainText(
    "8 MiB (8,388,608 bytes)",
  );
  await expect(file).toHaveValue("");
  expect((await exported(page)).data).toEqual(before);
  await page
    .locator(".picture-card")
    .first()
    .screenshot({ path: path.join(root, "screenshots/picture-rejected.png") });
});
