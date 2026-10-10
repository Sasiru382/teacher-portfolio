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
  function changed() {
    status("Unsaved changes in this tab. Export content.js to keep them.");
  }
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
        if (key === "id" || key === "image") return;
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
          String(val).length > 95 ? "textarea" : "input",
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
    walk(value, area);
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
      img.src = slot.src;
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
          img.src = slot.src;
          source.textContent =
            "Slot: " + key + " · Uploaded picture embedded in export";
          changed();
        } catch (_) {
          status(
            "This picture could not be read. Try a different JPG, PNG or WebP file.",
          );
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
        if (!path.value.startsWith("assets/")) {
          status(
            "Local image paths must start with assets/. Copy the picture into that folder too.",
          );
          return;
        }
        slot.src = path.value;
        img.src = slot.src;
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
      if (
        !imported.site ||
        !imported.images ||
        !Array.isArray(imported.pages) ||
        imported.pages.length !== 14 ||
        JSON.stringify(imported.pages.map((p) => p.id)) !==
          JSON.stringify(draft.pages.map((p) => p.id))
      )
        throw Error("schema");
      // Check the full shape, so missing properties cannot break the renderer.
      const shape = (base, value) => {
        if (base === null || typeof base !== "object")
          return typeof value === typeof base;
        if (Array.isArray(base))
          return (
            Array.isArray(value) &&
            value.length === base.length &&
            base.every((x, i) => shape(x, value[i]))
          );
        return (
          value &&
          Object.keys(base).every(
            (k) => Object.hasOwn(value, k) && shape(base[k], value[k]),
          )
        );
      };
      if (!shape(JSON.parse(original), imported)) throw Error("shape");
      draft = imported;
      choices();
      renderFields();
      pictureFields();
      status(
        "Imported your content. Review it, then export any further changes.",
      );
    } catch (_) {
      status(
        "Your file could not be imported. Choose a content.js exported by this editor; it must contain all fourteen chapters. No uploaded code was executed.",
      );
    }
    e.target.value = "";
  });
  $("#reset").addEventListener("click", () => {
    if (
      !confirm(
        "Discard current edits and return to the content loaded when this editor opened?",
      )
    )
      return;
    draft = JSON.parse(original);
    choices();
    renderFields();
    pictureFields();
    status(
      "Reset to the loaded content. No files on your computer were changed.",
    );
  });
  $("#preview").addEventListener("click", () => {
    try {
      sessionStorage.setItem(
        "teacher-portfolio-preview",
        JSON.stringify(draft),
      );
      window.open("index.html?preview=1#home", "_blank");
      status(
        "Preview opened. It is temporary; export content.js to save your changes.",
      );
    } catch (_) {
      status(
        "Your browser blocks local preview storage. Export content.js, replace the file, and open index.html instead.",
      );
    }
  });
  choices();
  renderFields();
})();
