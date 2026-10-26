const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
function content() {
  const c = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, "content.js"), "utf8"), c);
  return JSON.parse(JSON.stringify(c.window.PORTFOLIO_CONTENT));
}
test("legacy exports migrate without losing copy; current schema rejects missing routes, malformed assets and excessive media", () => {
  const c = { window: { PORTFOLIO_CONTENT: content() } };
  assert.ok(
    fs.existsSync(path.join(root, "schema.js")),
    "shared schema and migration must exist",
  );
  vm.runInNewContext(
    fs.readFileSync(path.join(root, "asset-policy.js"), "utf8"),
    c,
  );
  vm.runInNewContext(fs.readFileSync(path.join(root, "schema.js"), "utf8"), c);
  const legacy = JSON.parse(
    fs.readFileSync(
      path.join(root, "tests/legacy-content.fixture.json"),
      "utf8",
    ),
  );
  legacy.site.name = "Preserved teacher";
  legacy.pages.find((p) => p.id === "teaching-in-action").gallery[0].caption =
    "My real lesson";
  legacy.images.gallery1.src = "assets/real.jpg";
  const migrated = c.window.PortfolioSchema.normalize(legacy, content());
  assert.equal(migrated.pages.length, 12);
  assert.equal(migrated.site.name, "Preserved teacher");
  assert.equal(migrated.legacyArchive.site.name, "Preserved teacher");
  assert.equal(
    migrated.pages.find((p) => p.id === "teaching-in-action").gallery[0].src,
    "assets/real.jpg",
  );
  assert.equal(
    migrated.pages.find((p) => p.id === "lesson-plans").weeks.length,
    6,
  );
  for (const mutate of [
    (d) => d.pages.pop(),
    (d) => d.pages.reverse(),
    (d) =>
      (d.pages.find((p) => p.id === "lesson-plans").weeks[0].href =
        "javascript:alert(1)"),
    (d) => (d.images.hero.src = "data:image/svg+xml;base64,PHN2Zz4="),
    (d) =>
      (d.pages.find((p) => p.id === "teaching-in-action").videos = Array.from(
        { length: 4 },
        () => ({ src: "", alt: "", caption: "", detail: "" }),
      )),
    (d) => delete d.pages.find((p) => p.id === "my-learners").profiles,
  ]) {
    const d = content();
    mutate(d);
    assert.throws(() => c.window.PortfolioSchema.normalize(d, content()));
  }
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(c.window.PortfolioSchema.normalize(migrated, content())),
    ),
    JSON.parse(JSON.stringify(migrated)),
  );
});
test("capture and generation tools target only active routes/resources and stage shared runtime scripts", () => {
  const capture = fs.readFileSync(
    path.join(root, "tests/capture-all.cjs"),
    "utf8",
  );
  assert.ok(!capture.includes('"achievements"'));
  assert.ok(!capture.includes('"evidence-hub"'));
  assert.ok(
    !fs
      .readFileSync(path.join(root, "tests/generate-resources.py"), "utf8")
      .includes("sample-reflection.html"),
  );
  const workflow = fs.readFileSync(
    path.join(root, ".github/workflows/pages.yml"),
    "utf8",
  );
  assert.match(workflow, /cp .*asset-policy\.js schema\.js/);
  assert.match(workflow, /branches: \[main\]/);
});
test("requested twelve-page structure removes retired routes, metrics and journal resource", () => {
  const d = content();
  assert.equal(d.pages.length, 12);
  assert.equal(d.pages.find((p) => p.id === "home").metrics.length, 3);
  assert.equal(d.images.schoolLogo.src, "");
  assert.equal(
    d.pages.find((p) => p.id === "final-reflection").title,
    "Reflective Summary",
  );
  assert.ok(
    !d.pages.some((p) => ["achievements", "evidence-hub"].includes(p.id)),
  );
  assert.ok(!JSON.stringify(d).includes("sample-reflection.html"));
  assert.ok(
    !fs.existsSync(path.join(root, "resources/sample-reflection.html")),
  );
});
