// Existing editor regressions enter through the real login UI with a test-only verifier.
const base = require('@playwright/test');
const { installTestVerifier, unlockEditor } = require('./editor-auth-helper.cjs');
const test = base.test.extend({
  context: async ({ context }, use) => {
    await installTestVerifier(context);
    function prepare(page) {
      for (const action of ['goto', 'reload']) {
        const original = page[action].bind(page);
        page[action] = async (...args) => {
          // Page-level fixture routes take precedence over context routes.
          // Install last so broad mock-site routes cannot serve production credentials.
          await installTestVerifier(page);
          const response = await original(...args);
          if (/\/editor\.html(?:[?#]|$)/.test(page.url())) await unlockEditor(page);
          return response;
        };
      }
    }
    context.on('page', prepare);
    await use(context);
  },
});
module.exports = { test, expect: base.expect };
