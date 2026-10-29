const { test, expect } = require('./editor-test.cjs');
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const origin = "https://portfolio.test";
const api =
  "https://api.github.com/repos/Sasiru382/teacher-portfolio/contents/content.js";
const initial = fs.readFileSync(path.join(root, "content.js"), "utf8");
async function site(page) {
  await page.route(origin + "/**", (route) => {
    const p = new URL(route.request().url()).pathname;
    const file = path.join(root, p);
    return fs.existsSync(file)
      ? route.fulfill({ path: file })
      : route.fulfill({ status: 404 });
  });
}
test("authenticated publishing uses Unicode-safe content and verifies remote commit without storing token or claiming live", async ({
  page,
}) => {
  await site(page);
  let content = initial,
    sha = "base",
    put;
  await page.route(api + "**", async (r) => {
    if (r.request().method() === "PUT") {
      expect(r.request().headers().authorization).toBe(
        "Bearer test-token-only",
      );
      put = r.request().postDataJSON();
      content = Buffer.from(put.content, "base64").toString("utf8");
      sha = "updated";
      await r.fulfill({
        json: { content: { sha }, commit: { sha: "commit123" } },
      });
    } else
      await r.fulfill({
        json: { sha, content: Buffer.from(content).toString("base64") },
      });
  });
  await page.goto(origin + "/editor.html");
  await page.getByLabel("Teacher name", { exact: true }).fill("ගුරු 日本語 🌸");
  await page
    .getByLabel("GitHub token", { exact: true })
    .fill("test-token-only");
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Publish to website", exact: true })
    .click();
  await expect(page.locator("#publish-status")).toContainText(
    "Changes committed; deployment pending",
  );
  expect(put.branch).toBe("main");
  expect(put.sha).toBe("base");
  expect(content).toContain("ගුරු 日本語 🌸");
  await expect(page.getByLabel("GitHub token", { exact: true })).toHaveValue(
    "",
  );
  expect(
    await page.evaluate(() => JSON.stringify([localStorage, sessionStorage])),
  ).not.toContain("test-token-only");
  const storage = await page.evaluate(async () => {
    const db = await new Promise((ok, no) => {
      const r = indexedDB.open("teacher-portfolio-drafts", 1);
      r.onsuccess = () => ok(r.result);
      r.onerror = no;
    });
    return await new Promise((ok) => {
      const r = db.transaction("drafts").objectStore("drafts").getAll();
      r.onsuccess = () => ok(JSON.stringify(r.result));
    });
  });
  expect(storage).not.toContain("test-token-only");
  await expect(page.locator("#publish-status")).not.toContainText(
    "Website is live",
  );
});
test("processing a photo blocks publishing and saving until complete", async ({
  page,
}) => {
  await site(page);
  await page.route(api + "**", (r) =>
    r.fulfill({
      json: { sha: "base", content: Buffer.from(initial).toString("base64") },
    }),
  );
  await page.addInitScript(() => {
    const real = window.createImageBitmap;
    window.createImageBitmap = async (...args) => {
      await new Promise((r) => (window.finishImage = r));
      return real(...args);
    };
  });
  await page.goto(origin + "/editor.html");
  await expect(page.locator("#publish")).toBeEnabled();
  await page.getByRole("button", { name: "Pictures", exact: true }).click();
  await page
    .getByLabel("Upload picture for hero")
    .setInputFiles(path.join(root, "assets/classroom-photo.jpg"));
  await expect(page.locator("#publish")).toBeDisabled();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.locator("#editor-status")).toContainText(
    "Wait for picture",
  );
  await page.evaluate(() => window.finishImage());
  await expect(page.locator("#publish")).toBeEnabled();
});
test("imported edits trigger an unsaved-close warning", async ({ page }) => {
  await site(page);
  await page.route(api + "**", (r) =>
    r.fulfill({
      json: { sha: "base", content: Buffer.from(initial).toString("base64") },
    }),
  );
  await page.goto(origin + "/editor.html");
  await expect(page.getByLabel("Teacher name", { exact: true })).toBeVisible();
  await page.getByLabel("Import content.js").setInputFiles({
    name: "content.js",
    mimeType: "text/javascript",
    buffer: Buffer.from(initial.replace("Your Name", "Imported Teacher")),
  });
  await expect(page.locator("#editor-status")).toContainText("Imported");
  const warning = page.waitForEvent("dialog");
  const reload = page.reload();
  const dialog = await warning;
  expect(dialog.type()).toBe("beforeunload");
  await dialog.accept();
  await reload;
});
for (const code of [401, 403, 404, 409, 422]) {
  test(`GitHub ${code} refuses publish clearly and clears token without losing edits`, async ({
    page,
  }) => {
    await site(page);
    let writes = 0;
    await page.route(api + "**", (r) =>
      r.request().method() === "PUT"
        ? (writes++, r.fulfill({ status: code, json: { message: "rejected" } }))
        : r.fulfill({
            json: {
              sha: "base",
              content: Buffer.from(initial).toString("base64"),
            },
          }),
    );
    await page.goto(origin + "/editor.html");
    await page
      .getByLabel("Teacher name", { exact: true })
      .fill("Keep my edits");
    await page
      .getByLabel("GitHub token", { exact: true })
      .fill("error-test-token");
    page.once("dialog", (d) => d.accept());
    await page.locator("#publish").click();
    await expect(page.locator("#publish-status")).toContainText(String(code));
    await expect(page.getByLabel("GitHub token", { exact: true })).toHaveValue(
      "",
    );
    await expect(page.getByLabel("Teacher name", { exact: true })).toHaveValue(
      "Keep my edits",
    );
    expect(writes).toBe(1);
  });
}
test("stale saved base and remotely changed content refuse overwrite until explicit reload", async ({
  page,
}) => {
  await site(page);
  let version = initial,
    sha = "base",
    writes = 0;
  await page.route(api + "**", (r) => {
    if (r.request().method() === "PUT") writes++;
    return r.fulfill({
      json: { sha, content: Buffer.from(version).toString("base64") },
    });
  });
  await page.goto(origin + "/editor.html");
  await expect(page.locator("#publish-status")).toContainText(
    "Repository version checked",
  );
  await page.getByLabel("Teacher name", { exact: true }).fill("Local edit");
  await page.locator("#save-draft").click();
  await expect(page.locator("#editor-status")).toContainText("Draft saved");
  version = initial.replace("Your Name", "Other Teacher");
  sha = "other";
  await page.reload();
  await expect(page.locator("#publish-status")).toContainText("Conflict");
  await expect(page.getByLabel("Teacher name", { exact: true })).toHaveValue(
    "Local edit",
  );
  await page.getByLabel("GitHub token", { exact: true }).fill("conflict-token");
  await page.locator("#publish").click();
  await expect(page.locator("#publish-status")).toContainText("Conflict");
  expect(writes).toBe(0);
  page.once("dialog", (d) => d.accept());
  await page.locator("#reload-remote").click();
  await expect(page.getByLabel("Teacher name", { exact: true })).toHaveValue(
    "Other Teacher",
  );
});
test("PUT acceptance is not reported as committed success when read-back differs", async ({
  page,
}) => {
  await site(page);
  await page.route(api + "**", (r) =>
    r.fulfill({
      json:
        r.request().method() === "PUT"
          ? { content: { sha: "new" }, commit: { sha: "commit" } }
          : { sha: "base", content: Buffer.from(initial).toString("base64") },
    }),
  );
  await page.goto(origin + "/editor.html");
  await page.getByLabel("GitHub token", { exact: true }).fill("verify-token");
  page.once("dialog", (d) => d.accept());
  await page.locator("#publish").click();
  await expect(page.locator("#publish-status")).toContainText(
    "verification is incomplete",
  );
  await expect(page.locator("#publish-status")).not.toContainText(
    "Changes committed; deployment pending",
  );
});
test("storage failure keeps edits visible and offers export fallback", async ({
  page,
}) => {
  await site(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", {
      get() {
        throw Error("blocked");
      },
    });
  });
  await page.route(api + "**", (r) => r.abort());
  await page.goto(origin + "/editor.html");
  await page
    .getByLabel("Teacher name", { exact: true })
    .fill("Unsaved teacher");
  await page.locator("#save-draft").click();
  await expect(page.locator("#editor-status")).toContainText(
    "Export content.js now",
  );
  await expect(page.getByLabel("Teacher name", { exact: true })).toHaveValue(
    "Unsaved teacher",
  );
});
test("drafts are isolated by editor path and anonymous publish sends no write", async ({
  page,
}) => {
  await site(page);
  await page.route(origin + "/copy/**", (r) =>
    r.fulfill({
      path: path.join(
        root,
        new URL(r.request().url()).pathname.replace("/copy/", ""),
      ),
    }),
  );
  let writes = 0;
  await page.route(api + "**", (r) => {
    if (r.request().method() === "PUT") writes++;
    return r.fulfill({
      json: { sha: "base", content: Buffer.from(initial).toString("base64") },
    });
  });
  await page.goto(origin + "/editor.html");
  await page
    .getByLabel("Teacher name", { exact: true })
    .fill("First site draft");
  await page.locator("#save-draft").click();
  await expect(page.locator("#editor-status")).toContainText("Draft saved");
  await page.goto(origin + "/copy/editor.html");
  await expect(page.getByLabel("Teacher name", { exact: true })).toHaveValue(
    "Your Name",
  );
  await page.locator("#publish").click();
  await expect(page.locator("#publish-status")).toContainText(
    "Anonymous publishing is not allowed",
  );
  expect(writes).toBe(0);
});
test("network failure during publishing clears credentials and preserves draft", async ({
  page,
}) => {
  await site(page);
  let fail = false;
  await page.route(api + "**", (r) =>
    fail
      ? r.abort()
      : r.fulfill({
          json: {
            sha: "base",
            content: Buffer.from(initial).toString("base64"),
          },
        }),
  );
  await page.goto(origin + "/editor.html");
  await expect(page.locator("#publish-status")).toContainText(
    "Repository version checked",
  );
  await page.getByLabel("Teacher name", { exact: true }).fill("Network draft");
  fail = true;
  await page.getByLabel("GitHub token", { exact: true }).fill("network-token");
  page.once("dialog", (d) => d.accept());
  await page.locator("#publish").click();
  await expect(page.locator("#publish-status")).toContainText(
    "Network request failed",
  );
  await expect(page.getByLabel("GitHub token", { exact: true })).toHaveValue(
    "",
  );
  await expect(page.getByLabel("Teacher name", { exact: true })).toHaveValue(
    "Network draft",
  );
});
test("repository changing after initialization blocks PUT and concurrent publish is disabled", async ({
  page,
}) => {
  await site(page);
  let version = initial,
    writes = 0,
    release;
  await page.route(api + "**", async (r) => {
    if (r.request().method() === "PUT") writes++;
    if (version !== initial) await new Promise((ok) => (release = ok));
    await r.fulfill({
      json: {
        sha: version === initial ? "base" : "new",
        content: Buffer.from(version).toString("base64"),
      },
    });
  });
  await page.goto(origin + "/editor.html");
  await expect(page.locator("#publish-status")).toContainText(
    "Repository version checked",
  );
  version = initial.replace("Your Name", "New remote teacher");
  await page
    .getByLabel("GitHub token", { exact: true })
    .fill("late-conflict-token");
  page.once("dialog", (d) => d.accept());
  await page.locator("#publish").click();
  await expect(page.locator("#publish")).toBeDisabled();
  await expect.poll(() => !!release).toBe(true);
  release();
  await expect(page.locator("#publish-status")).toContainText("Conflict");
  expect(writes).toBe(0);
});
test("Save draft persists text and embedded photos after reopening, never changes public content", async ({
  page,
}) => {
  await site(page);
  await page.route(api + "**", (r) =>
    r.fulfill({
      json: { sha: "base", content: Buffer.from(initial).toString("base64") },
    }),
  );
  await page.goto(origin + "/editor.html");
  await page.getByLabel("Teacher name", { exact: true }).fill("Draft Teacher");
  await page.getByRole("button", { name: "Pictures", exact: true }).click();
  await page
    .getByLabel("Upload picture for hero")
    .setInputFiles(path.join(root, "assets/classroom-photo.jpg"));
  await expect(page.locator(".picture-source").first()).toContainText(
    "Uploaded picture",
  );
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.locator("#editor-status")).toContainText("Draft saved");
  await page.reload();
  await expect(page.getByLabel("Teacher name", { exact: true })).toHaveValue(
    "Draft Teacher",
  );
  await page.getByRole("button", { name: "Pictures", exact: true }).click();
  await expect(page.locator(".picture-card img").first()).toHaveAttribute(
    "src",
    /^data:image/,
  );
  await page.goto(origin + "/index.html");
  await expect(page.locator(".teacher-name")).toHaveText("Your Name");
});
