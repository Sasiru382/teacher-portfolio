const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
test('published footer is exact and every other content/media byte is preserved', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../content.js'), 'utf8');
  const data = JSON.parse(source.slice(source.indexOf('=') + 1).trim().replace(/;$/, ''));
  assert.equal(data.site.notice, 'Made with love and joy');
  delete data.site.notice;
  // Baseline db04595, JSON serialization with only site.notice omitted.
  assert.equal(createHash('sha256').update(JSON.stringify(data)).digest('hex'), '8acd0ba0ad8a392f67cc3c2572123ee91d9ea7748e793e9d008100d9c3c9d31a');
});
