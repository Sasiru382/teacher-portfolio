// Test-only credentials replace the public verifier, never the gate logic.
const { pbkdf2Sync } = require('node:crypto');
const username = 'fixture-editor';
const password = 'test-only-editor-password';
const salt = '2fe5a0cef08e74494223893465eb417075a58e7179b2b10fb';
const config = { username, salt, iterations: 600000, verifier: pbkdf2Sync(password, Buffer.from(salt, 'hex'), 600000, 32, 'sha256').toString('hex') };
async function installTestVerifier(context) {
  await context.route(/\/editor-access\.js(?:\?.*)?$/, route => route.fulfill({ contentType: 'text/javascript', body: 'window.PORTFOLIO_EDITOR_ACCESS = ' + JSON.stringify(config) + ';' }));
}
async function unlockEditor(page) {
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Unlock editor', exact: true }).click();
  await require('@playwright/test').expect(page.locator('#editor-workspace')).toBeVisible({ timeout: 30000 });
  await require('@playwright/test').expect(page.locator('#chapter-choice option')).not.toHaveCount(0, { timeout: 30000 });
}
module.exports = { installTestVerifier, unlockEditor, username, password };
