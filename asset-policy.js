/* Shared allowlists for embedded or repository-local files. No remote media. */
(() => {
  "use strict";
  const local = (value, extensions) =>
    typeof value === "string" &&
    new RegExp(
      `^(assets|resources)/[a-zA-Z0-9_/-]+\\.(${extensions})$`,
      "i",
    ).test(value) &&
    !value.includes("..");
  const embedded = (value, types) =>
    typeof value === "string" &&
    new RegExp(`^data:(${types});base64,[A-Za-z0-9+/]+={0,2}$`, "i").test(
      value,
    );
  window.PortfolioAssets = {
    pdf: (value) => local(value, "pdf") || embedded(value, "application/pdf"),
    image: (value) =>
      local(value, "png|jpe?g|webp|gif|svg") ||
      embedded(value, "image/(png|jpeg|webp|gif)"),
    video: (value) =>
      local(value, "mp4|webm") || embedded(value, "video/(mp4|webm)"),
    // Inclusive UTF-8 bytes of compact JSON, including text, metadata and archives.
    maxContent: 100 * 1024 * 1024,
    maxPhoto: 8 * 1024 * 1024,
    maxPdf: 15 * 1024 * 1024,
    maxVideo: 15 * 1024 * 1024,
    // Separate transport envelope for assignment/comments and pretty-printing.
    maxImport: 101 * 1024 * 1024,
    maxGithubFile: 100 * 1024 * 1024,
    exportText(value, prefix) {
      const pretty = prefix + JSON.stringify(value, null, 2) + ";\n";
      return this.utf8Bytes(pretty) <= this.maxImport
        ? pretty
        : prefix + JSON.stringify(value) + ";\n";
    },
    contentLimitMessage:
      "Portfolio exceeds 100 MiB (104,857,600 bytes) of serialized content. Use local files instead.",
    utf8Bytes(text) {
      let bytes = text.length;
      // ASCII/base64 needs no allocation; count Unicode code points, not UTF-16 units.
      for (const match of text.matchAll(/[^\x00-\x7f]/gu)) {
        const point = match[0].codePointAt(0);
        bytes += point <= 0x7ff ? 1 : 2;
      }
      return bytes;
    },
    contentBytes(value) {
      return this.utf8Bytes(JSON.stringify(value));
    },
    checkContent(value) {
      if (this.contentBytes(value) > this.maxContent)
        throw Error(this.contentLimitMessage);
    },
    previewStore(mode, content) {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open("teacher-portfolio-preview", 1);
        request.onupgradeneeded = () =>
          request.result.createObjectStore("previews");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("previews", mode);
          const store = tx.objectStore("previews");
          const key = location.pathname.replace(/[^/]*$/, "");
          const result =
            mode === "readonly" ? store.get(key) : store.put(content, key);
          tx.oncomplete = () => {
            db.close();
            resolve(result.result);
          };
          tx.onerror = tx.onabort = () => {
            db.close();
            reject(tx.error);
          };
        };
      });
    },
    privacy:
      "Public website warning: signatures, signed consent, minors’ identities and private information will be public on GitHub Pages. Publish only authorised, redacted copies; keep original consent records private.",
  };
})();
