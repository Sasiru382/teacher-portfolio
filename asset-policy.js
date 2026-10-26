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
    maxContent: 40 * 1024 * 1024,
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
