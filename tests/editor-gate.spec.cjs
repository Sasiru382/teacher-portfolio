const { test, expect } = require('@playwright/test');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const url = name => pathToFileURL(path.resolve(__dirname, '..', name)).href;
const { installTestVerifier, unlockEditor, username, password } = require('./editor-auth-helper.cjs');
test.beforeEach(async ({ context }) => installTestVerifier(context));

test('wrong credentials stay locked; correct credentials unlock; logout and reload lock again', async ({ page }) => {
  await page.goto(url('editor.html'));
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page.getByLabel('Password', { exact: true }).fill('wrong-test-password');
  await page.getByRole('button', { name: 'Unlock editor', exact: true }).click();
  await expect(page.locator('#editor-login-status')).toHaveText('Username or password is incorrect.');
  await expect(page.locator('#editor-workspace')).toBeHidden();
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('');
  await page.getByLabel('Username', { exact: true }).fill('wrong-user');
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Unlock editor', exact: true }).click();
  await expect(page.locator('#editor-login-status')).toHaveText('Username or password is incorrect.');
  await unlockEditor(page);
  await expect(page.getByRole('button', { name: 'Save draft', exact: true })).toBeVisible();
  await page.locator('#github-token').fill('test-token-never-save');
  expect(await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }))).toEqual({ local: [], session: [] });
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await expect(page.locator('#editor-login')).toBeVisible();
  await expect(page.locator('#editor-workspace')).toBeHidden();
  await unlockEditor(page);
  await page.reload();
  await expect(page.locator('#editor-login')).toBeVisible();
});

test('public portfolio and its Edit portfolio link remain accessible without login', async ({ page }) => {
  await page.goto(url('index.html'));
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('#editor-login')).toHaveCount(0);
  await page.getByRole('link', { name: 'Edit portfolio', exact: true }).click();
  await expect(page.locator('#editor-login')).toBeVisible();
  await expect(page.locator('#editor-workspace')).toBeHidden();
});

test('unlock and logout work when browser storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    for (const name of ['localStorage', 'sessionStorage', 'indexedDB']) Object.defineProperty(window, name, { configurable: true, get() { throw new DOMException('Storage blocked', 'SecurityError'); } });
  });
  await page.goto(url('editor.html'));
  await unlockEditor(page);
  await expect(page.locator('#editor-status')).toContainText('unavailable');
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await expect(page.locator('#editor-login')).toBeVisible();
});

test('logout discards unsaved in-memory edits and clears token without a stuck page', async ({ page }) => {
  await page.goto(url('editor.html'));
  await unlockEditor(page);
  await page.getByLabel('Teacher name', { exact: true }).fill('Unsaved logout change');
  await page.locator('#github-token').fill('test-token-never-save');
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await expect(page.locator('#editor-login')).toBeVisible();
  await unlockEditor(page);
  await expect(page.getByLabel('Teacher name', { exact: true })).not.toHaveValue('Unsaved logout change');
  await expect(page.locator('#github-token')).toHaveValue('');
});

test('locked editor has no automated accessibility violations', async ({ page }) => {
  await page.goto(url('editor.html'));
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const violations = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })).violations.map(v => v.id));
  expect(violations).toEqual([]);
});

test('direct editor access is locked before editor scripts or content load', async ({ page }) => {
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto(url('editor.html'));
  await expect(page.getByRole('heading', { name: 'Unlock portfolio editor' })).toBeVisible();
  await expect(page.locator('main.editor-main')).toBeHidden();
  expect(requests.some(value => /\/(content|schema|editor)\.js$/.test(value))).toBe(false);
});
