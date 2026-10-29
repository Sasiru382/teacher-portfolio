(() => {
  'use strict';
  // Intentionally no persistent unlock flag or credential storage. Reload locks again.
  const form = document.querySelector('#editor-login-form');
  const message = document.querySelector('#editor-login-status');
  const submit = form.querySelector('button');
  const workspace = document.querySelector('#editor-workspace');
  const logout = document.querySelector('#editor-logout');
  const fromHex = value => Uint8Array.from(value.match(/../g), byte => parseInt(byte, 16));
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Editor could not load. Reload and try again.'));
      document.head.append(script);
    });
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    submit.disabled = true;
    message.textContent = 'Checking…';
    const username = form.elements.username.value;
    let password = form.elements.password.value;
    form.elements.password.value = '';
    try {
      if (!globalThis.crypto?.subtle) throw new Error('This browser cannot verify the password. Use a current browser on HTTPS or open the downloaded editor locally.');
      const access = window.PORTFOLIO_EDITOR_ACCESS;
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
      password = '';
      const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: fromHex(access.salt), iterations: access.iterations, hash: 'SHA-256' }, key, 256);
      const expected = fromHex(access.verifier);
      const actual = new Uint8Array(bits);
      let difference = actual.length ^ expected.length;
      for (let i = 0; i < actual.length; i++) difference |= actual[i] ^ expected[i];
      if (username !== access.username || difference !== 0) {
        message.textContent = 'Username or password is incorrect.';
        form.elements.password.focus();
        return;
      }
      message.textContent = 'Opening editor…';
      for (const src of ['asset-policy.js', 'content.js', 'schema.js', 'editor.js']) await loadScript(src);
      form.reset();
      document.querySelector('#editor-login').hidden = true;
      workspace.hidden = false;
      logout.hidden = false;
      workspace.querySelector('h1').tabIndex = -1;
      workspace.querySelector('h1').focus();
    } catch (error) {
      message.textContent = error.message;
    } finally {
      password = '';
      submit.disabled = false;
    }
  });
  logout.addEventListener('click', () => {
    // Remove token/unsaved UI immediately, then discard the entire in-memory session.
    document.querySelector('#github-token').value = '';
    workspace.hidden = true;
    logout.hidden = true;
    location.reload();
  });
  // A page restored from back/forward cache must not restore an unlocked editor.
  window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
})();
