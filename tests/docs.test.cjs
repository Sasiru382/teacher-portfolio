const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
test("friendly guide lists every picture slot and includes publication and privacy instructions", () => {
  assert.ok(
    fs.existsSync(path.join(root, "guide.html")),
    "Personalisation guide exists",
  );
  const guide = fs.readFileSync(path.join(root, "guide.html"), "utf8");
  const c = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, "content.js"), "utf8"), c);
  for (const [key, slot] of Object.entries(c.window.PORTFOLIO_CONTENT.images)) {
    assert.ok(guide.includes(key), "Missing slot " + key);
    assert.ok(guide.includes(slot.src), "Missing filename " + slot.src);
  }
  assert.match(guide, /Netlify/);
  assert.match(guide, /consent/i);
  assert.match(guide, /content\.js/);
  assert.ok(fs.existsSync(path.join(root, "README.md")));
});
