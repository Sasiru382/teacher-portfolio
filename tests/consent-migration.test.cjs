const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
function load(file) {
  const c = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, file), "utf8"), c);
  return JSON.parse(JSON.stringify(c.window.PORTFOLIO_CONTENT));
}
const current = () => load("content.js");
const previous = () => load("tests/previous-content.fixture.js");
const docs = (d) => d.pages.find((p) => p.id === "testimonials").documents;
const plain = (d) => JSON.parse(JSON.stringify(d));
function normalize(input, template = current()) {
  const c = { window: {} };
  for (const f of ["asset-policy.js", "schema.js"])
    vm.runInNewContext(fs.readFileSync(path.join(root, f), "utf8"), c);
  return plain(c.window.PortfolioSchema.normalize(input, template));
}
test("previous twelve-page exports remove only structural consent slots even with custom labels and preserve other bytes", () => {
  const old = previous();
  const pdf = fs.readFileSync(path.join(root, "tests/test-document.pdf"));
  docs(old).forEach((s, i) => {
    s.title = "Custom section " + i;
    s.files.forEach((f, j) => {
      f.title = "Custom file " + i + j;
      f.href =
        "data:application/pdf;base64," +
        Buffer.concat([pdf, Buffer.from(`\n% slot ${i}${j}`)]).toString(
          "base64",
        );
    });
  });
  old.site.name = "Custom teacher";
  old.pages
    .find((p) => p.id === "lesson-plans")
    .weeks.forEach((f, i) => {
      f.title = "Custom week " + i;
      f.href =
        "data:application/pdf;base64," +
        Buffer.concat([pdf, Buffer.from(`\n% week ${i}`)]).toString("base64");
    });
  old.images.portrait.src = "assets/custom-photo.jpg";
  old.pages.find((p) => p.id === "teaching-in-action").gallery = [
    {
      src: "assets/custom-photo.jpg",
      alt: "Custom photo",
      caption: "My caption",
      detail: "My details",
    },
  ];
  old.pages.find((p) => p.id === "final-reflection").intro = "First\n\nSecond";
  old.pages.find((p) => p.id === "teaching-in-action").videos = [
    {
      src: "assets/custom.webm",
      alt: "Custom",
      caption: "clip",
      detail: "details",
    },
  ];
  const expected = plain(old);
  docs(expected).splice(1, 1);
  const migrated = normalize(old);
  assert.deepEqual(migrated, expected);
  const text = JSON.stringify(migrated);
  docs(old)[1].files.forEach((f) => assert.ok(!text.includes(f.href)));
  assert.deepEqual(
    normalize(migrated, migrated),
    expected,
    "export loaded as new baseline accepts migrated data",
  );
  assert.deepEqual(
    normalize(old, migrated),
    expected,
    "new baseline still imports previous data",
  );
  assert.deepEqual(
    normalize(migrated, old),
    expected,
    "old deployed baseline also accepts new exports",
  );
});
test("current default has exactly three sections and four slots; strict shapes reject malformed fixed slots", () => {
  assert.deepEqual(
    docs(current()).map((s) => s.files.length),
    [2, 1, 1],
  );
  for (const change of [
    (d) => docs(d).pop(),
    (d) => docs(d)[0].files.pop(),
    (d) => docs(d).splice(1, 0, { title: "bad", files: [] }),
  ]) {
    const d = current();
    change(d);
    assert.throws(() => normalize(d));
  }
});
test("previous twelve-page consent slots inside legacyArchive are also discarded, not privately archived", () => {
  const d = current();
  d.legacyArchive = previous();
  const expected = plain(d);
  docs(expected.legacyArchive).splice(1, 1);
  assert.deepEqual(normalize(d), expected);
  const deployed = normalize(d);
  assert.deepEqual(
    normalize(previous(), deployed),
    (() => {
      const p = previous();
      docs(p).splice(1, 1);
      return p;
    })(),
    "archive-bearing deployed baseline does not require incoming old drafts to have an archive",
  );
});
