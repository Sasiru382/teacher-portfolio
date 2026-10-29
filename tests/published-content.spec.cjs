const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
test('published JSON content validates losslessly and all twelve chapters render on desktop and mobile', async ({ page }) => {
  test.setTimeout(120000);
  const source = fs.readFileSync(path.join(root, 'content.js'), 'utf8');
  const data = JSON.parse(source.slice(source.indexOf('=') + 1).trim().replace(/;$/, ''));
  const context = { window: {} };
  for (const file of ['asset-policy.js', 'schema.js']) vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
  const normalized = context.window.PortfolioSchema.normalize(data, data);
  expect(JSON.stringify(normalized)).toBe(JSON.stringify(data));
  expect(data.pages).toHaveLength(12);
  expect(fs.statSync(path.join(root, 'content.js')).size).toBeLessThan(100 * 1024 * 1024);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    for (const chapter of data.pages) {
      await page.evaluate(id => { location.hash = id; }, chapter.id);
      await expect(page.locator('main h1')).toHaveText(chapter.title);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const broken = await page.locator('main img').evaluateAll(async images => {
        images.forEach(image => { image.loading = 'eager'; });
        await Promise.all(images.map(image => Promise.race([
          image.decode().catch(() => {}),
          new Promise(resolve => setTimeout(resolve, 10000)),
        ])));
        return images.filter(image => !image.naturalWidth).map(image => image.alt);
      });
      expect(broken).toEqual([]);
    }
  }
  expect(errors).toEqual([]);
  await page.goto(pathToFileURL(path.join(root, 'editor.html')).href);
  await expect(page.locator('input').first()).toBeVisible();
  expect(errors).toEqual([]);
});
