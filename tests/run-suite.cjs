// Keep demo regression tests independent of the owner's editable public content.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'teacher-suite-'));
function run(args, cwd) {
  const result = spawnSync(process.execPath, args, { cwd, stdio: 'inherit', env: process.env });
  if (result.status !== 0) throw Error(`Test process failed (${result.status})`);
}
try {
  for (const name of fs.readdirSync(root)) {
    if (['.git', 'node_modules', 'test-results', 'playwright-report', 'screenshots', 'content.js'].includes(name)) continue;
    fs.cpSync(path.join(root, name), path.join(temp, name), { recursive: true });
  }
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  fs.copyFileSync(path.join(root, 'tests/demo-content.fixture.js'), path.join(temp, 'content.js'));
  const units = fs.readdirSync(path.join(temp, 'tests')).filter(x => x.endsWith('.test.cjs')).map(x => 'tests/' + x);
  run(['--test', ...units], temp);
  // The 100 MiB boundary test can exhaust a memory-limited runner when another
  // media-heavy browser runs beside it. Allow serialization without skipping tests.
  const workers = process.env.PORTFOLIO_TEST_WORKERS || '2';
  run([path.join(root, 'node_modules/@playwright/test/cli.js'), 'test', '--workers=' + workers], temp);
  // Validate the real deployment too, rather than testing only the demo fixture.
  run(['--test', 'tests/published-notice.check.cjs'], root);
  run([path.join(root, 'node_modules/@playwright/test/cli.js'), 'test', 'tests/published-content.spec.cjs', 'tests/hero-heart.spec.cjs', '--workers=1'], root);
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
