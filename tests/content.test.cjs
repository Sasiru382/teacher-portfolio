const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
test("content provides twelve populated editable chapters and explicit demo identity", () => {
  assert.ok(
    fs.existsSync(path.join(root, "content.js")),
    "Editable content.js must exist",
  );
  const context = { window: {} };
  vm.runInNewContext(
    fs.readFileSync(path.join(root, "content.js"), "utf8"),
    context,
  );
  const data = context.window.PORTFOLIO_CONTENT;
  assert.equal(data.pages.length, 12);
  assert.equal(new Set(data.pages.map((p) => p.id)).size, 12);
  for (const p of data.pages) {
    assert.ok(p.title);
    assert.ok(p.intro);
  }
  assert.match(data.site.notice, /demo/i);
  assert.equal(data.site.email, "");
  assert.ok(
    data.site.displayNotes,
    "Illustrative captions and resource notes must also be editable",
  );
  for (const key of [
    "heroImage",
    "metrics",
    "schoolImage",
    "lessonResources",
    "gallery",
    "evidence",
    "documentButton",
  ])
    assert.ok(data.site.displayNotes[key]);
});
