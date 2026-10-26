(() => {
  "use strict";
  const original = JSON.stringify(window.PORTFOLIO_CONTENT);
  let draft = JSON.parse(original);
  const $ = (s) => document.querySelector(s);
  const status = (text) => ($("#editor-status").textContent = text);
  const friendly = {
    name: "Teacher name",
    brand: "Sidebar portfolio title",
    subtitle: "Portfolio subtitle",
    qualification: "Qualification or professional description",
    notice: "Demo-content notice (keep until all samples are replaced)",
    footer: "Footer thank-you message",
    email: "Email address (blank disables email)",
    location: "City or region",
    professionalLink: "Professional profile URL",
    professionalLabel: "Professional profile link label",
    sidebarQuote: "Sidebar quotation",
    href: "Link or local resource path",
    src: "Image filename or embedded image",
    alt: "Image description",
    label: "Navigation label",
    intro: "Introduction",
    eyebrow: "Handwritten introduction",
  };
  const human = (key) =>
    friendly[key] ||
    key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, (x) => x.toUpperCase());
  let dirty = false;
  let baseContent = original;
  let baseSha = null;
  let processing = 0;
  let busy = false;
  const draftKey = location.pathname;
  function changed() {
    dirty = true;
    status(
      "Unsaved changes. Choose Save draft to keep them in this browser, or Publish to website.",
    );
  }
  window.addEventListener("beforeunload", (event) => {
    if (dirty || processing || busy) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  function draftStore(mode, value) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("teacher-portfolio-drafts", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("drafts");
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(Error("Storage blocked"));
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("drafts", mode);
        const store = tx.objectStore("drafts");
        const operation =
          mode === "readonly"
            ? store.get(draftKey)
            : store.put(value, draftKey);
        tx.oncomplete = () => {
          db.close();
          resolve(operation.result);
        };
        tx.onerror = tx.onabort = () => {
          db.close();
          reject(tx.error);
        };
      };
    });
  }
  async function saveDraft() {
    if (processing) {
      status("Wait for picture processing before saving.");
      return false;
    }
    const snapshot = JSON.stringify(draft);
    try {
      await draftStore("readwrite", {
        content: JSON.parse(snapshot),
        baseContent,
        baseSha,
      });
      if (snapshot === JSON.stringify(draft)) dirty = false;
      status(
        "Draft saved in this browser only. The public website has not changed.",
      );
      return true;
    } catch (_) {
      status(
        "Draft could not be saved: browser storage is blocked or full. Export content.js now as a backup. Your edits remain in this tab.",
      );
      return false;
    }
  }
  $("#save-draft").addEventListener("click", saveDraft);
  function renderFields() {
    const area = $("#text-fields");
    area.replaceChildren();
    const chapter = $("#chapter-choice").value;
    const value =
      chapter === "site"
        ? draft.site
        : draft.pages.find((p) => p.id === chapter);
    const heading = document.createElement("h2");
    heading.textContent =
      chapter === "site" ? "Portfolio identity & contact" : value.label;
    area.append(heading);
    let counter = 0;
    function walk(obj, container, prefix = "") {
      Object.entries(obj).forEach(([key, val]) => {
        if (
          key === "id" ||
          key === "image" ||
          (chapter === "teaching-in-action" &&
            ["gallery", "videos"].includes(key))
        )
          return;
        if (
          key === "href" &&
          Object.hasOwn(obj, "title") &&
          (chapter === "lesson-plans" || chapter === "testimonials")
        ) {
          pdfField(obj, container);
          return;
        }
        if (val && typeof val === "object") {
          const group = document.createElement("fieldset");
          const legend = document.createElement("legend");
          legend.textContent = isNaN(Number(key))
            ? human(key)
            : `Item ${Number(key) + 1}`;
          group.append(legend);
          container.append(group);
          walk(val, group, prefix + human(key) + " ");
          return;
        }
        const field = document.createElement("div");
        field.className = "edit-field";
        const label = document.createElement("label");
        const id = "field-" + counter++;
        label.htmlFor = id;
        label.textContent = isNaN(Number(key))
          ? human(key)
          : `Text ${Number(key) + 1}`;
        const input = document.createElement(
          ["body", "intro"].includes(key) || String(val).length > 95
            ? "textarea"
            : "input",
        );
        input.id = id;
        input.value = val;
        if (input.tagName === "TEXTAREA") input.rows = 3;
        else input.type = "text";
        input.addEventListener("input", () => {
          obj[key] = input.value;
          changed();
        });
        field.append(label, input);
        if (["href", "professionalLink"].includes(key)) {
          const note = document.createElement("small");
          note.textContent =
            "Use resources/your-file.pdf, assets/your-file.pdf or a full https:// address. Leave optional certificate/profile links empty to hide them.";
          field.append(note);
        }
        container.append(field);
      });
    }
    if (chapter === "testimonials") {
      const note = document.createElement("p");
      note.className = "privacy-warning";
      note.textContent = PortfolioAssets.privacy;
      area.append(note);
    }
    walk(value, area);
    if (chapter === "teaching-in-action") mediaFields(value, area);
  }
  function mediaFields(page, area) {
    const note = document.createElement("p");
    note.textContent =
      PortfolioAssets.privacy +
      " Photos: JPG/PNG/WebP up to 8 MB, resized to 1600 px. Clips: MP4/WebM up to 6 MB each. PDFs: 5 MB each. Embedded content total: 40 MB. Large media should use local assets/ paths; export does not copy local files. Browser preview/storage may have lower quotas.";
    area.append(note);
    [
      ["gallery", "photo", 30],
      ["videos", "video", 3],
    ].forEach(([key, kind, max]) => {
      const section = document.createElement("section");
      area.append(section);
      const heading = document.createElement("h3");
      heading.textContent = kind === "photo" ? "Photographs" : "Video clips";
      section.append(heading);
      page[key].forEach((record, index) => {
        const n = index + 1;
        const group = document.createElement("fieldset");
        const legend = document.createElement("legend");
        legend.textContent = kind + " " + n;
        group.append(legend);
        section.append(group);
        const field = (label, type = "text") => {
          const id = `media-${kind}-${n}-${group.children.length}`;
          const l = document.createElement("label");
          l.htmlFor = id;
          l.textContent = label;
          const input = document.createElement(
            type === "textarea" ? "textarea" : "input",
          );
          input.id = id;
          if (type !== "textarea") input.type = type;
          group.append(l, input);
          return input;
        };
        const upload = field(`Upload ${kind} ${n}`, "file");
        upload.accept =
          kind === "photo"
            ? "image/jpeg,image/png,image/webp"
            : "video/mp4,video/webm";
        const state = document.createElement("p");
        state.textContent = record.src ? "Media added" : "No file added";
        group.append(state);
        upload.addEventListener("change", async () => {
          const f = upload.files[0];
          if (!f || busy || processing) return;
          const types =
            kind === "photo"
              ? ["image/jpeg", "image/png", "image/webp"]
              : ["video/mp4", "video/webm"];
          if (
            !types.includes(f.type) ||
            f.size > (kind === "photo" ? 8 : 6) * 1024 * 1024
          ) {
            status(
              "Unsupported file or too large: photos up to 8 MB; MP4/WebM clips up to 6 MB.",
            );
            return;
          }
          const previous = record.src;
          processing++;
          $("#publish").disabled = true;
          try {
            if (kind === "photo") {
              const bitmap = await createImageBitmap(f);
              const scale = Math.min(
                1,
                1600 / Math.max(bitmap.width, bitmap.height),
              );
              const canvas = document.createElement("canvas");
              canvas.width = Math.round(bitmap.width * scale);
              canvas.height = Math.round(bitmap.height * scale);
              canvas
                .getContext("2d")
                .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
              bitmap.close();
              record.src = canvas.toDataURL(
                f.type === "image/png" ? "image/png" : "image/jpeg",
                0.88,
              );
            } else record.src = await readFile(f);
            if (JSON.stringify(draft).length > PortfolioAssets.maxContent)
              throw Error("40 MB total exceeded. Use local files.");
            state.textContent = "Media added";
            changed();
            status("Media embedded in draft. Save or export to keep it.");
          } catch (error) {
            record.src = previous;
            status("Media could not be added. " + error.message);
          } finally {
            processing--;
            $("#publish").disabled = busy || !ready;
            upload.value = "";
          }
        });
        [
          ["caption", `Caption for ${kind} ${n}`],
          [
            "alt",
            `${kind === "photo" ? "Image" : "Video"} description for ${kind} ${n}`,
          ],
          ["detail", `Details for ${kind} ${n}`],
        ].forEach(([key, label]) => {
          const input = field(label, key === "detail" ? "textarea" : "text");
          input.value = record[key];
          input.addEventListener("input", () => {
            record[key] = input.value;
            changed();
          });
        });
        const path = field(`Local path for ${kind} ${n}`);
        path.value = record.src.startsWith("data:") ? "" : record.src;
        path.placeholder =
          kind === "photo" ? "assets/photo.jpg" : "assets/clip.webm";
        path.addEventListener("change", () => {
          if (
            !path.value ||
            PortfolioAssets[kind === "photo" ? "image" : "video"](path.value)
          ) {
            record.src = path.value;
            state.textContent = record.src ? "Media added" : "No file added";
            changed();
          } else status("Choose a safe local assets/ media path.");
        });
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = `Remove ${kind} ${n}`;
        remove.addEventListener("click", () => {
          if (busy || processing) return;
          page[key].splice(index, 1);
          changed();
          renderFields();
        });
        group.append(remove);
      });
      const add = document.createElement("button");
      add.type = "button";
      add.textContent = kind === "photo" ? "Add photo" : "Add video clip";
      add.disabled = page[key].length >= max;
      add.addEventListener("click", () => {
        if (busy || processing || page[key].length >= max) return;
        page[key].push({ src: "", alt: "", caption: "", detail: "" });
        changed();
        renderFields();
      });
      section.append(add);
    });
  }
  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(Error("File could not be read"));
      reader.readAsDataURL(file);
    });
  }
  function pdfField(file, container) {
    const group = document.createElement("div");
    group.className = "edit-field";
    const id =
      "pdf-" +
      document.querySelectorAll('input[type="file"][accept="application/pdf"]')
        .length;
    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = "Upload PDF for " + file.title;
    const input = document.createElement("input");
    input.type = "file";
    input.id = id;
    input.accept = "application/pdf";
    const state = document.createElement("p");
    state.textContent = file.href ? "PDF added" : "PDF not added yet";
    input.addEventListener("change", async () => {
      const f = input.files[0];
      if (!f || busy || processing) return;
      if (f.type !== "application/pdf" || f.size > 5 * 1024 * 1024) {
        status("Choose a PDF smaller than 5 MB.");
        return;
      }
      processing++;
      $("#publish").disabled = true;
      const previous = file.href;
      try {
        if (!(await f.slice(0, 5).text()).startsWith("%PDF-"))
          throw Error("Not a PDF");
        file.href = await readFile(f);
        if (JSON.stringify(draft).length > PortfolioAssets.maxContent)
          throw Error(
            "Portfolio exceeds 40 MB total. Use local files instead.",
          );
        state.textContent = "PDF added";
        changed();
        status(
          "PDF embedded in draft. Save draft or export content.js; the website has not changed.",
        );
      } catch (error) {
        file.href = previous;
        status("PDF could not be added. " + error.message);
      } finally {
        processing--;
        $("#publish").disabled = busy || !ready;
        input.value = "";
      }
    });
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove PDF for " + file.title;
    remove.addEventListener("click", () => {
      if (busy || processing) return;
      file.href = "";
      state.textContent = "PDF not added yet";
      changed();
    });
    const pathLabel = document.createElement("label");
    pathLabel.htmlFor = id + "-path";
    pathLabel.textContent = "Local PDF path for " + file.title;
    const path = document.createElement("input");
    path.id = id + "-path";
    path.value = file.href.startsWith("data:") ? "" : file.href;
    path.placeholder = "resources/your-file.pdf";
    path.addEventListener("change", () => {
      if (!path.value || PortfolioAssets.pdf(path.value)) {
        file.href = path.value;
        state.textContent = file.href ? "PDF added" : "PDF not added yet";
        changed();
      } else
        status(
          "Use a safe resources/ or assets/ PDF path. Copy the file into that folder too.",
        );
    });
    group.append(label, input, state, remove, pathLabel, path);
    container.append(group);
  }
  function choices() {
    const previous = $("#chapter-choice").value;
    $("#chapter-choice").replaceChildren();
    [
      { id: "site", label: "Portfolio identity & contact" },
      ...draft.pages,
    ].forEach((p) => {
      const o = document.createElement("option");
      o.value = p.id;
      o.textContent = p.label;
      $("#chapter-choice").append(o);
    });
    if ([...$("#chapter-choice").options].some((o) => o.value === previous))
      $("#chapter-choice").value = previous;
  }
  function pictureFields() {
    const area = $("#picture-fields");
    area.replaceChildren();
    Object.entries(draft.images).forEach(([key, slot]) => {
      const card = document.createElement("section");
      card.className = "picture-card";
      const img = document.createElement("img");
      if (slot.src) img.src = slot.src;
      else img.hidden = true;
      img.alt = slot.alt;
      const fields = document.createElement("div");
      const h = document.createElement("h3");
      h.textContent = slot.label;
      fields.append(h);
      const source = document.createElement("p");
      source.className = "picture-source";
      source.textContent = `Slot: ${key} · ${slot.src.startsWith("data:") ? "Uploaded picture embedded in export" : slot.src}`;
      fields.append(source);
      const uploadLabel = document.createElement("label");
      uploadLabel.htmlFor = "upload-" + key;
      uploadLabel.textContent = "Upload picture for " + key;
      const input = document.createElement("input");
      input.type = "file";
      input.id = "upload-" + key;
      input.accept = "image/jpeg,image/png,image/webp";
      input.addEventListener("change", async () => {
        const f = input.files[0];
        if (!f) return;
        if (
          !["image/jpeg", "image/png", "image/webp"].includes(f.type) ||
          f.size > 8 * 1024 * 1024
        ) {
          status("Please choose a JPG, PNG or WebP picture smaller than 8 MB.");
          return;
        }
        if (busy || processing) {
          status("Wait for the current action to finish.");
          return;
        }
        processing++;
        $("#publish").disabled = true;
        status("Processing picture… wait before saving or publishing.");
        const previous = slot.src;
        try {
          const bitmap = await createImageBitmap(f);
          const scale = Math.min(
            1,
            1600 / Math.max(bitmap.width, bitmap.height),
          );
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(bitmap.width * scale);
          canvas.height = Math.round(bitmap.height * scale);
          canvas
            .getContext("2d")
            .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          bitmap.close();
          slot.src = canvas.toDataURL(
            f.type === "image/png" ? "image/png" : "image/jpeg",
            0.88,
          );
          if (JSON.stringify(draft).length > PortfolioAssets.maxContent)
            throw Error("40 MB total exceeded. Use local files.");
          img.src = slot.src;
          img.hidden = false;
          source.textContent =
            "Slot: " + key + " · Uploaded picture embedded in export";
          changed();
        } catch (error) {
          slot.src = previous;
          status(
            "This picture could not be added. Try a JPG, PNG or WebP file; keep embedded content below 40 MB. " +
              error.message,
          );
        } finally {
          processing--;
          $("#publish").disabled = busy || !ready;
        }
      });
      fields.append(uploadLabel, input);
      const altLabel = document.createElement("label");
      altLabel.htmlFor = "alt-" + key;
      altLabel.textContent = "Image description for " + key;
      const alt = document.createElement("input");
      alt.id = "alt-" + key;
      alt.type = "text";
      alt.value = slot.alt;
      alt.addEventListener("input", () => {
        slot.alt = alt.value;
        img.alt = alt.value;
        changed();
      });
      fields.append(altLabel, alt);
      const pathLabel = document.createElement("label");
      pathLabel.htmlFor = "path-" + key;
      pathLabel.textContent = "Optional local filename for " + key;
      const path = document.createElement("input");
      path.type = "text";
      path.id = "path-" + key;
      path.value = slot.src.startsWith("data:") ? "" : slot.src;
      path.placeholder = "assets/my-photo.jpg";
      path.addEventListener("change", () => {
        if (
          path.value &&
          (!path.value.startsWith("assets/") ||
            !PortfolioAssets.image(path.value))
        ) {
          status(
            "Use a safe assets/ image path without traversal. Copy the picture into that folder too.",
          );
          return;
        }
        slot.src = path.value;
        if (slot.src) {
          img.src = slot.src;
          img.hidden = false;
        } else {
          img.removeAttribute("src");
          img.hidden = true;
        }
        source.textContent = "Slot: " + key + " · " + slot.src;
        changed();
      });
      fields.append(pathLabel, path);
      card.append(img, fields);
      area.append(card);
    });
  }
  function tab(pictures) {
    $("#text-panel").hidden = pictures;
    $("#picture-panel").hidden = !pictures;
    $("#text-tab").setAttribute("aria-pressed", String(!pictures));
    $("#picture-tab").setAttribute("aria-pressed", String(pictures));
    if (pictures) pictureFields();
  }
  $("#text-tab").addEventListener("click", () => tab(false));
  $("#picture-tab").addEventListener("click", () => tab(true));
  $("#chapter-choice").addEventListener("change", renderFields);
  $("#export").addEventListener("click", () => {
    const text =
      "/* Exported with the local Portfolio Editor. Replace content.js with this file. */\nwindow.PORTFOLIO_CONTENT = " +
      JSON.stringify(draft, null, 2) +
      ";\n";
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/javascript;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "content.js";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    status(
      "Exported content.js. Move the downloaded file into your portfolio folder to apply changes.",
    );
  });
  $("#import-file").addEventListener("change", async (e) => {
    if (processing || busy) {
      status("Wait for the current action to finish.");
      e.target.value = "";
      return;
    }
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (file.size > 40 * 1024 * 1024) throw Error("size");
      const text = await file.text();
      const stripped = text.replace(/^\s*\/\*[\s\S]*?\*\/\s*/, "");
      const match = stripped.match(
        /^\s*window\.PORTFOLIO_CONTENT\s*=\s*([\s\S]+?)\s*;?\s*$/,
      );
      const imported = JSON.parse(match ? match[1] : stripped);
      draft = PortfolioSchema.normalize(imported, JSON.parse(original));
      dirty = true;
      choices();
      renderFields();
      pictureFields();
      status(
        draft.legacyArchive
          ? "Imported and migrated legacy content to twelve chapters. Original data preserved in legacyArchive in exports: review archived private content before publishing."
          : "Imported your content. Review it, then Save draft, export a backup, or publish.",
      );
    } catch (_) {
      status(
        "Your file could not be imported. Choose a content.js exported by this editor; it must contain all twelve chapters. No uploaded code was executed.",
      );
    }
    e.target.value = "";
  });
  $("#reset").addEventListener("click", () => {
    if (processing || busy) {
      status("Wait for the current action to finish.");
      return;
    }
    if (
      !confirm(
        "Discard current edits and return to the content loaded when this editor opened?",
      )
    )
      return;
    draft = JSON.parse(original);
    changed();
    choices();
    renderFields();
    pictureFields();
    status(
      "Reset to the loaded content. No files on your computer were changed.",
    );
  });
  $("#preview").addEventListener("click", async () => {
    if (processing || busy) {
      status("Wait for file processing to finish.");
      return;
    }
    try {
      try {
        sessionStorage.setItem(
          "teacher-portfolio-preview",
          JSON.stringify(draft),
        );
      } catch (_) {
        sessionStorage.removeItem("teacher-portfolio-preview");
        await PortfolioAssets.previewStore("readwrite", draft);
      }
      window.open("index.html?preview=1#home", "_blank");
      status(
        "Preview opened; the public website is unchanged. A large draft may remain in this browser’s local preview cache. Save draft or export to keep a deliberate backup; clear site data on shared devices.",
      );
    } catch (_) {
      status(
        "Your browser blocks local preview storage. Export content.js, replace the file, and open index.html instead.",
      );
    }
  });
  // Fixed publishing scope. Fork owners must update this and the visible setup text.
  const repository = "Sasiru382/teacher-portfolio";
  const branch = "main";
  const api = `https://api.github.com/repos/${repository}/contents/content.js`;
  const publishStatus = (message) =>
    ($("#publish-status").textContent = message);
  let conflict = false;
  let ready = false;
  function parseContent(text) {
    const stripped = text.replace(/^\s*\/\*[\s\S]*?\*\/\s*/, "");
    const match = stripped.match(
      /^\s*window\.PORTFOLIO_CONTENT\s*=\s*([\s\S]+?)\s*;?\s*$/,
    );
    const value = JSON.parse(match ? match[1] : stripped);
    return PortfolioSchema.normalize(value, JSON.parse(original));
  }
  const serialize = () =>
    "/* Portfolio content. */\nwindow.PORTFOLIO_CONTENT = " +
    JSON.stringify(draft, null, 2) +
    ";\n";
  function encode(text) {
    let binary = "";
    for (const byte of new TextEncoder().encode(text))
      binary += String.fromCharCode(byte);
    return btoa(binary);
  }
  function decode(text) {
    return new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(atob(text.replace(/\s/g, "")), (c) => c.charCodeAt(0)),
    );
  }
  async function request(url, token = "", options = {}) {
    let response;
    try {
      response = await fetch(url, {
        ...options,
        cache: "no-store",
        signal: AbortSignal.timeout(25000),
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });
    } catch (_) {
      throw Error(
        "Network request failed or timed out. Keep/export your draft; check GitHub before retrying if a commit may have been sent.",
      );
    }
    if (!response.ok) {
      const messages = {
        401: "GitHub rejected the token (401). Create a new unexpired token.",
        403: "GitHub denied permission or rate limited this request (403). Check repository write access, token Contents read/write, approval requirements, or try later.",
        404: "Repository or content.js not found or inaccessible (404). Check account access and token repository selection.",
        409: "Conflict (409): repository changed. Export your draft, then explicitly reload remote content.",
        422: "GitHub refused this update (422). Possible conflict or branch protection: export your draft, check repository rules, then reload remote content.",
      };
      if ([409, 422].includes(response.status)) conflict = true;
      throw Error(
        messages[response.status] ||
          `GitHub request failed (${response.status}). Keep your draft and check repository status.`,
      );
    }
    return response;
  }
  async function remote(token = "") {
    const url = `${api}?ref=${branch}&t=${Date.now()}`;
    const data = await (await request(url, token)).json();
    let text;
    if (data.encoding === "none" || !data.content) {
      text = await (
        await request(url, token, {
          headers: { Accept: "application/vnd.github.raw+json" },
        })
      ).text();
    } else text = decode(data.content);
    if (!data.sha)
      throw Error("GitHub did not return a file version. Publishing stopped.");
    return {
      sha: data.sha,
      text,
      canonical: JSON.stringify(parseContent(text)),
    };
  }
  function checkBase(current) {
    if (
      current.canonical !== baseContent ||
      (baseSha && current.sha !== baseSha)
    ) {
      conflict = true;
      publishStatus(
        "Conflict: remote content changed since your base version. Export your draft as a backup, then choose Reload remote content. Reapply your edits to the new version; no overwrite was sent.",
      );
      return false;
    }
    baseSha = current.sha;
    conflict = false;
    return true;
  }
  function lock(value) {
    busy = value;
    document.querySelectorAll("button,input,textarea,select").forEach((el) => {
      el.disabled = value;
    });
    $("#publish").disabled = value || processing > 0 || !ready;
  }
  $("#publish").addEventListener("click", async () => {
    if (busy || processing || !ready) return;
    let token = $("#github-token").value.trim();
    $("#github-token").value = "";
    let committed = false;
    try {
      if (!token) {
        publishStatus(
          "Enter your GitHub token to publish. Anonymous publishing is not allowed.",
        );
        return;
      }
      if (conflict) {
        publishStatus(
          "Conflict: export your draft first, then Reload remote content before publishing.",
        );
        return;
      }
      if (
        !confirm(
          `Publish all current text and embedded photos publicly to ${repository}, content.js on ${branch}? This replaces website content after tests and deployment. New local files are not uploaded. Confirm you have reviewed privacy and have permission to publish.`,
        )
      )
        return;
      lock(true);
      publishStatus("Checking the latest repository version…");
      const current = await remote(token);
      if (!checkBase(current)) return;
      await saveDraft();
      const text = serialize();
      publishStatus("Sending content to GitHub. Do not close this tab…");
      const result = await (
        await request(api, token, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "Update portfolio content from editor",
            content: encode(text),
            sha: current.sha,
            branch,
          }),
        })
      ).json();
      committed = true;
      publishStatus(
        "GitHub accepted the update; verifying the committed content…",
      );
      const verified = await remote(token);
      if (
        !result.content?.sha ||
        verified.sha !== result.content.sha ||
        verified.text !== text
      ) {
        conflict = true;
        throw Error(
          "Commit may exist, but remote verification did not match. Do not assume success or retry blindly. Check GitHub Actions and content.js; export your draft before reloading remote content.",
        );
      }
      baseContent = verified.canonical;
      baseSha = verified.sha;
      const saved = await saveDraft();
      publishStatus(
        `Changes committed; deployment pending${result.commit?.sha ? " (commit " + result.commit.sha.slice(0, 12) + ")" : ""}. ${saved ? "Draft saved locally." : "Local save failed: export a backup."} Open GitHub Actions and wait for this commit’s Test and deploy portfolio run to succeed, then refresh and check the website. This editor has not verified the live website.`,
      );
    } catch (error) {
      publishStatus(
        (committed
          ? "Update sent, but verification is incomplete. "
          : "Publishing stopped. ") +
          error.message +
          " Your draft is still available.",
      );
    } finally {
      token = "";
      $("#github-token").value = "";
      lock(false);
    }
  });
  $("#reload-remote").addEventListener("click", async () => {
    if (busy || processing) return;
    let token = $("#github-token").value.trim();
    $("#github-token").value = "";
    try {
      if (
        !confirm(
          "Export content.js FIRST to back up your edits. Reload remote content will REPLACE this draft with the current GitHub version, not merge it. Continue?",
        )
      )
        return;
      lock(true);
      const current = await remote(token);
      draft = parseContent(current.text);
      baseContent = current.canonical;
      baseSha = current.sha;
      conflict = false;
      dirty = true;
      choices();
      renderFields();
      pictureFields();
      await saveDraft();
      publishStatus(
        "Remote content loaded. Reapply edits from your exported backup carefully. This did not publish anything.",
      );
    } catch (error) {
      publishStatus(error.message + " Your previous draft remains available.");
    } finally {
      token = "";
      $("#github-token").value = "";
      lock(false);
    }
  });
  async function initialize() {
    try {
      const saved = await draftStore("readonly");
      if (saved) {
        draft = parseContent(JSON.stringify(saved.content));
        if (typeof saved.baseContent !== "string")
          throw Error("Invalid saved base");
        baseContent = JSON.stringify(parseContent(saved.baseContent));
        baseSha = saved.baseSha;
        status(
          draft.legacyArchive
            ? "Saved legacy draft restored and migrated. Original data retained in legacyArchive; review privacy before publishing. Not published."
            : "Saved draft restored from this browser. Not published.",
        );
      } else status("Ready. Save draft keeps edits in this browser only.");
    } catch (_) {
      status(
        "Browser draft storage unavailable. Export content.js before closing to keep your work.",
      );
    }
    choices();
    renderFields();
    if (location.protocol !== "file:") {
      try {
        if (checkBase(await remote()))
          publishStatus(
            "Repository version checked. Publishing requires your GitHub token and confirmation.",
          );
      } catch (error) {
        publishStatus(
          "Could not check repository now. " +
            error.message +
            " It will be checked again before publishing.",
        );
      }
    } else
      publishStatus(
        "Offline editing available. Publishing requires an internet connection and a fresh repository version check.",
      );
    ready = true;
    $("#publish").disabled = processing > 0;
  }
  initialize();
})();
