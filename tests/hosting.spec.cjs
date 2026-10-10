const { test, expect } = require("@playwright/test");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
let server, origin;
const root = path.resolve(__dirname, "..");
test.beforeAll(async () => {
  server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    const filename = path.join(
      root,
      url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname),
    );
    if (!filename.startsWith(root + path.sep) || !fs.existsSync(filename)) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const mime = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
      ".svg": "image/svg+xml",
      ".jpg": "image/jpeg",
      ".ttf": "font/ttf",
      ".png": "image/png",
    };
    res.writeHead(200, {
      "Content-Type":
        mime[path.extname(filename)] || "application/octet-stream",
    });
    fs.createReadStream(filename).pipe(res);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  origin = "http://127.0.0.1:" + server.address().port;
});
test.afterAll(async () => {
  await new Promise((r) => server.close(r));
});
test("static hosting uses only local runtime assets and honours direct deep links and configured email", async ({
  page,
}) => {
  const errors = [],
    remote = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("request", (r) => {
    if (!r.url().startsWith(origin)) remote.push(r.url());
  });
  await page.goto(origin + "/index.html#lesson-plans");
  await expect(page.locator("h1")).toHaveText("Selected Lesson Plans");
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    PORTFOLIO_CONTENT.site.email = "teacher@example.com";
    PORTFOLIO_CONTENT.site.professionalLink = "https://example.com/teacher";
    location.hash = "contact-me";
  });
  await expect(
    page.getByRole("link", { name: "Email me", exact: true }),
  ).toHaveAttribute("href", "mailto:teacher@example.com");
  await expect(
    page.getByRole("link", { name: "Professional profile ↗" }),
  ).toHaveAttribute("href", "https://example.com/teacher");
  expect(remote).toEqual([]);
  expect(errors).toEqual([]);
});
test("editor preview reflects unsaved text without changing the default portfolio", async ({
  page,
}) => {
  await page.goto(origin + "/editor.html");
  await page
    .getByLabel("Teacher name", { exact: true })
    .fill("Preview Teacher");
  const popup = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Preview changes" }).click();
  const preview = await popup;
  await expect(preview.locator(".teacher-name")).toHaveText("Preview Teacher");
  await page.goto(origin + "/index.html");
  await expect(page.locator(".teacher-name")).toHaveText("Your Name");
});
