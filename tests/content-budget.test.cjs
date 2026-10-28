const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
function setup() {
  const c = { window: {} };
  for (const file of ["content.js", "asset-policy.js", "schema.js"])
    vm.runInNewContext(fs.readFileSync(path.join(root, file), "utf8"), c);
  return c.window;
}
test("100 MiB compact UTF-8 content budget is inclusive; one byte over is refused", () => {
  const w = setup(),
    p = w.PortfolioAssets;
  assert.equal(p.maxContent, 100 * 1024 * 1024);
  const value = { text: "" };
  value.text = "a".repeat(
    p.maxContent - Buffer.byteLength(JSON.stringify(value)),
  );
  assert.equal(p.contentBytes(value), p.maxContent);
  assert.doesNotThrow(() => p.checkContent(value));
  value.text += "a";
  assert.throws(() => p.checkContent(value), /100 MiB/);
});
test("UTF-8 sizing counts non-ASCII, supplementary and lone surrogate JSON correctly", () => {
  const p = setup().PortfolioAssets;
  const value = { text: "é සි 😀 \ud800" };
  assert.equal(p.contentBytes(value), Buffer.byteLength(JSON.stringify(value)));
  p.maxContent = JSON.stringify(value).length;
  assert.throws(() => p.checkContent(value), /100 MiB/);
});
test("export envelope falls back to compact JSON if formatting would exceed import cap", () => {
  const p = setup().PortfolioAssets;
  assert.equal(p.maxImport, 101 * 1024 * 1024);
  const value = { text: "a".repeat(100) };
  p.maxImport = 140;
  const text = p.exportText(value, "window.PORTFOLIO_CONTENT = ");
  assert.ok(Buffer.byteLength(text) <= p.maxImport);
  assert.deepEqual(
    JSON.parse(
      text
        .slice(text.indexOf("=") + 1)
        .trim()
        .replace(/;$/, ""),
    ),
    value,
  );
});
test("strict schema and post-migration enforce shared byte budget without mutating input", () => {
  const w = setup(),
    p = w.PortfolioAssets;
  const value = w.PORTFOLIO_CONTENT;
  p.maxContent = p.contentBytes(value);
  assert.doesNotThrow(() => w.PortfolioSchema.normalize(value, value));
  value.site.name += "é";
  assert.throws(() => w.PortfolioSchema.normalize(value, value), /100 MiB/);
  const legacy = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "legacy-content.fixture.json"),
      "utf8",
    ),
  );
  p.maxContent = p.contentBytes(legacy);
  assert.throws(
    () => w.PortfolioSchema.normalize(legacy, w.PORTFOLIO_CONTENT),
    /100 MiB/,
  );
});
