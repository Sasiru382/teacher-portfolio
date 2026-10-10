const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
test("local typography has separate regular and semibold files rather than rendering all text bold", () => {
  const folder = path.resolve(__dirname, "../assets/fonts");
  assert.ok(
    fs.existsSync(path.join(folder, "fonts.css")),
    "Correct local weight mapping exists",
  );
  const css = fs.readFileSync(path.join(folder, "fonts.css"), "utf8");
  for (const family of ["cormorant", "caveat", "nunito"])
    for (const weight of [400, 600, 700]) {
      assert.ok(fs.existsSync(path.join(folder, `${family}-${weight}.ttf`)));
      assert.ok(css.includes(`${family}-${weight}.ttf`));
    }
});
