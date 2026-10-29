const { test, expect } = require('./editor-test.cjs');
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const crypto = require("node:crypto");
const hash = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
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
test("playable synthetic video at exactly 15 MiB survives save/reopen/export/import/IndexedDB preview; +1 refuses atomically", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto(
    pathToFileURL(path.resolve(__dirname, "../editor.html")).href,
  );
  const encoded = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 120;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, 160, 120);
    const stream = canvas.captureStream(10);
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp8",
    });
    const parts = [];
    recorder.ondataavailable = (e) => parts.push(e.data);
    const stopped = new Promise((resolve) => (recorder.onstop = resolve));
    recorder.start();
    let frame = 0;
    const timer = setInterval(() => {
      ctx.fillStyle = ++frame % 2 ? "blue" : "red";
      ctx.fillRect(0, 0, 160, 120);
    }, 50);
    await new Promise((resolve) => setTimeout(resolve, 700));
    clearInterval(timer);
    recorder.stop();
    await stopped;
    stream.getTracks().forEach((t) => t.stop());
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(new Blob(parts, { type: "video/webm" }));
    });
  });
  const recorded = Buffer.from(encoded.split(",")[1], "base64");
  const bytes = Buffer.concat([
    recorded,
    Buffer.alloc(15 * 1024 * 1024 - recorded.length),
  ]);
  await page.locator("#chapter-choice").selectOption("teaching-in-action");
  await page
    .getByRole("button", { name: "Add video clip", exact: true })
    .click();
  const input = page.getByLabel("Upload video 1", { exact: true });
  await input.setInputFiles({
    name: "synthetic-15mib.webm",
    mimeType: "video/webm",
    buffer: bytes,
  });
  await expect(page.locator("#editor-status")).toContainText("Media embedded");
  let out = await exportData(page);
  const videos = (data) =>
    data.pages.find((p) => p.id === "teaching-in-action").videos;
  expect(
    hash(Buffer.from(videos(out.data)[0].src.split(",")[1], "base64")),
  ).toBe(hash(bytes));
  const before = hash(JSON.stringify(out.data));
  await input.setInputFiles({
    name: "over.webm",
    mimeType: "video/webm",
    buffer: Buffer.concat([bytes, Buffer.from([0])]),
  });
  await expect(page.locator("#editor-status")).toContainText("15 MiB");
  expect(hash(JSON.stringify((await exportData(page)).data))).toBe(before);
  await page.locator("#save-draft").click();
  await expect(page.locator("#editor-status")).toContainText("Draft saved");
  await page.reload();
  await expect(page.locator("#editor-status")).toContainText("restored");
  expect(hash(JSON.stringify((await exportData(page)).data))).toBe(before);
  await page.locator("#import-file").setInputFiles({
    name: "content.js",
    mimeType: "text/javascript",
    buffer: Buffer.from(out.text),
  });
  await expect(page.locator("#editor-status")).toContainText("Imported");
  const wait = page.waitForEvent("popup");
  await page.locator("#preview").click();
  const preview = await wait;
  await preview.waitForLoadState();
  expect(preview.url()).toContain("previewStore=indexeddb");
  await preview.goto(preview.url().replace(/#.*$/, "#teaching-in-action"));
  const video = preview.locator("video").first();
  await expect(video).toBeVisible();
  expect(
    await video.evaluate(async (v) => {
      await v.play();
      await new Promise((resolve) => setTimeout(resolve, 100));
      v.pause();
      return v.currentTime;
    }),
  ).toBeGreaterThan(0);
  expect(
    hash(
      Buffer.from((await video.getAttribute("src")).split(",")[1], "base64"),
    ),
  ).toBe(hash(bytes));
  console.log(
    JSON.stringify({
      videoOriginalBytes: bytes.length,
      recordedPlayableBytes: recorded.length,
      serializedBytes: Buffer.byteLength(JSON.stringify(out.data)),
      sha256: hash(bytes),
    }),
  );
});
