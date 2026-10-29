/* A static renderer: no fetch, framework, service worker or build step. */
(async () => {
  "use strict";
  // Normalise the loaded baseline too: an older content.js must not expose removed slots.
  window.PORTFOLIO_CONTENT = PortfolioSchema.normalize(
    window.PORTFOLIO_CONTENT,
    window.PORTFOLIO_CONTENT,
  );
  let data = window.PORTFOLIO_CONTENT;
  // The editor can open a session-only preview. Never replace exported content automatically.
  if (new URLSearchParams(location.search).has("preview")) {
    try {
      let draft;
      if (
        new URLSearchParams(location.search).get("previewStore") !== "indexeddb"
      ) {
        try {
          draft = sessionStorage.getItem("teacher-portfolio-preview");
        } catch (_) {
          // A blocked session store must not bypass the IndexedDB fallback.
        }
      }
      if (draft) data = JSON.parse(draft);
      else data = (await PortfolioAssets.previewStore("readonly")) || data;
    } catch (_) {
      /* file URL storage may be unavailable */
    }
  }
  try {
    if (data !== window.PORTFOLIO_CONTENT)
      data = PortfolioSchema.normalize(data, window.PORTFOLIO_CONTENT);
  } catch (_) {
    data = window.PORTFOLIO_CONTENT;
  }
  const $ = (s) => document.querySelector(s);
  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const paragraphs = (value) =>
    String(value)
      .split(/\n\s*\n/)
      .filter((s) => s.trim())
      .map((s) => `<p>${esc(s)}</p>`)
      .join("");
  const safeLink = (value) =>
    /^(https?:\/\/|mailto:|resources\/|assets\/)/i.test(value || "") &&
    !/[<>"\x00-\x1f]/.test(value)
      ? value
      : "";
  const image = (key, classes = "") => {
    const i = typeof key === "object" ? key : data.images[key];
    const src = PortfolioAssets.image(i?.src) ? i.src : "assets/portrait.svg";
    return `<img class="${classes}" src="${esc(src)}" alt="${esc(i?.alt)}" loading="${key === "hero" || key === "portrait" ? "eager" : "lazy"}">`;
  };
  const paths = [
    "M3 10 12 3l9 7v11h-6v-7H9v7H3z",
    "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21v-2a8 8 0 0 1 16 0v2",
    "M4 7h16v14H4zM9 7V3h6v4M8 12h8M12 10v5",
    "M4 5h16v16H4zM8 9h8M8 13h8M8 17h5",
    "M5 3h14v18H5zM8 7h8M8 11h8M8 15h5",
    "M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M2 21v-2a7 7 0 0 1 14 0v2M17 5a4 4 0 0 1 0 7M19 15a6 6 0 0 1 3 6",
    "M3 7h4l2-3h6l2 3h4v14H3zM16 14a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    "M3 4h18v12H9l-5 5v-5H3zM7 8h10M7 12h7",
    "M5 3h14v18H5zM8 8h8M8 12h8M8 16h5",
    "M4 21V13h4v8M10 21V9h4v12M16 21V4h4v17M3 8l6-5 4 2 7-4",
    "M7 3h10v7a5 5 0 0 1-10 0zM7 5H3v3a5 5 0 0 0 5 5M17 5h4v3a5 5 0 0 1-5 5M12 15v6M7 21h10",
    "M3 4h8l1 2 1-2h8v15h-8l-1 2-1-2H3zM7 9h2M15 9h2M7 13h2M15 13h2",
    "M5 3h14v18H5zM8 7h8M8 11h8M8 15h8M8 18h4",
    "M3 5h18v14H3zM3 5l9 7 9-7",
  ];
  const icon = (n = 0) =>
    `<svg class="line-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[n % paths.length]}"></path></svg>`;
  const list = (items) =>
    `<ul class="check-list">${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const facts = (items) =>
    `<dl class="facts">${items.map(([k, v], i) => `<div>${icon(i + 2)}<dt>${esc(k)}:</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`;
  const panel = (title, items, cls = "") =>
    `<section class="paper-panel ${cls}"><h2>${esc(title)}</h2>${list(items)}</section>`;
  const resource = (r) =>
    `<a class="resource-link" href="${esc(safeLink(r.href))}" target="_blank" rel="noopener">${icon(4)}<span><strong>${esc(r.title)}</strong><small>${esc(r.description)}</small></span><span aria-hidden="true">↗</span></a>`;
  const pdfSlot = (file) =>
    `<div class="pdf-slot"><h3>${esc(file.title)}</h3>${PortfolioAssets.pdf(file.href) ? `<a class="button" href="${esc(file.href)}" download="${esc(file.title)}.pdf">Download PDF: ${esc(file.title)}</a>` : '<p class="empty-state">PDF not added yet.</p>'}</div>`;
  const polaroid = (key, caption, modal = false, detail = "") =>
    `<${modal ? 'button type="button"' : "figure"} class="polaroid" ${modal ? `data-image="gallery-photo" data-caption="${esc(caption)}" data-detail="${esc(detail)}" aria-label="Enlarge ${esc(caption)}"` : ""}>${image(key)}<${modal ? "span" : "figcaption"}>${esc(caption)}</${modal ? "span" : "figcaption"}></${modal ? "button" : "figure"}>`;
  function home(p) {
    return `<section class="hero"><div class="hero-copy"><p class="handwritten hero-welcome">${esc(p.eyebrow)}</p><h1>${esc(p.title)}</h1><p class="hero-subtitle">${esc(data.site.subtitle)}</p><p class="hero-intro">${esc(p.intro)}</p><p class="handwritten teacher-name">${esc(data.site.name)}</p><p class="qualification">${esc(data.site.qualification)}</p></div><div class="hero-art">${image("hero")}<span class="art-tag">${esc(data.site.displayNotes.heroImage)}</span></div></section><section class="welcome-row"><div class="welcome-copy">${image("portrait", "portrait")}<div><h2>${esc(p.welcomeTitle)}</h2><p>${esc(p.welcome)}</p><p class="handwritten">${esc(p.handwritten)} <span aria-hidden="true">♡</span></p></div></div><section class="glance paper-panel"><h2>${icon(2)} ${esc(p.glanceTitle)}</h2>${data.images.schoolLogo?.src ? image("schoolLogo", "school-logo") : ""}${facts(p.facts)}</section></section><section class="journey-row"><section class="numbers"><h2>${esc(p.metricsTitle)}</h2><div class="mini-divider" aria-hidden="true">──── ♡ ────</div><div class="metrics">${p.metrics.map(([number, label], i) => `<div><span class="metric-icon">${icon(i + 3)}</span><strong>${esc(number)}</strong><p>${esc(label)}</p></div>`).join("")}</div><p class="sample-label">${esc(data.site.displayNotes.metrics)}</p></section><div class="home-polaroids">${p.polaroids.map(([key, caption]) => polaroid(key, caption)).join("")}</div><blockquote class="home-quote"><span class="quote-mark">“</span><p>${esc(p.quote)}</p><img src="assets/botanical.svg" alt=""></blockquote></section>`;
  }
  const renderers = {
    home: home,
    "about-me": (p) =>
      `<div class="about-layout"><section><h2>${esc(p.bioTitle)}</h2><p>${esc(p.bio)}</p><h2>${esc(p.timelineTitle)}</h2><ol class="timeline">${p.timeline.map(([date, text]) => `<li><span>${esc(date)}</span><p>${esc(text)}</p></li>`).join("")}</ol></section><aside>${image("portrait", "about-portrait")}<div class="sticky-note"><h2 class="handwritten">${esc(p.strengthsTitle)}</h2>${list(p.strengths)}</div></aside></div><section class="hobbies"><h2>${esc(p.hobbiesTitle)}</h2><div>${p.hobbies.map((s, i) => `<span>${icon(i + 3)}${esc(s)}</span>`).join("")}</div></section><p class="handwritten page-note">${esc(p.note)}</p>`,
    "my-internship": (p) =>
      `<div class="internship-top"><figure class="school-photo">${image("school")}<figcaption>${esc(data.site.displayNotes.schoolImage)}</figcaption></figure><section class="paper-panel">${facts(p.facts)}</section></div><div class="two-columns">${panel(p.responsibilitiesTitle, p.responsibilities)}${panel(p.learningTitle, p.learning)}</div>`,
    "teaching-philosophy": (p) =>
      `<div class="philosophy"><div class="lead-copy">${paragraphs(p.body)}</div><div class="principle-strips">${p.principles.map(([title, body], i) => `<section>${icon(i + 5)}<div><h2>${esc(title)}</h2><p>${esc(body)}</p></div></section>`).join("")}</div><p class="handwritten page-note">${esc(p.note)}</p></div>`,
    "lesson-plans": (p) =>
      `<div class="pdf-list">${p.weeks.map(pdfSlot).join("")}</div>`,
    "my-learners": (p) =>
      `${p.profiles.map((profile) => `<section class="paper-panel class-profile"><h2>${esc(profile.title)}</h2>${paragraphs(profile.intro)}</section>`).join("")}<div class="learners-top"><div class="grade-note"><h2>${esc(p.grade)}</h2><p>${esc(p.age)}</p></div>${panel(p.characteristicsTitle, p.characteristics)}</div><div class="two-columns">${panel(p.needsTitle, p.needs)}${panel(p.supportTitle, p.support)}</div><p class="handwritten page-note">${esc(p.note)}</p>`,
    "teaching-in-action": (p) =>
      `<div class="gallery">${p.gallery
        .filter((g) => PortfolioAssets.image(g.src))
        .map((g) => polaroid(g, g.caption, true, g.detail))
        .join(
          "",
        )}</div>${!p.gallery.some((g) => PortfolioAssets.image(g.src)) ? '<p class="empty-state">No photographs added yet.</p>' : ""}<div class="video-gallery">${p.videos
        .filter((v) => PortfolioAssets.video(v.src))
        .map(
          (v) =>
            `<figure><video controls preload="metadata" src="${esc(v.src)}" aria-label="${esc(v.alt || v.caption || "Teaching video")}"></video><figcaption><strong>${esc(v.caption)}</strong><p>${esc(v.detail)}</p><p>${esc(v.alt)}</p></figcaption></figure>`,
        )
        .join(
          "",
        )}</div>${!p.videos.some((v) => PortfolioAssets.video(v.src)) ? '<p class="empty-state">No video clips added yet.</p>' : ""}<p class="sample-label">${esc(data.site.displayNotes.gallery)}</p>`,
    testimonials: (p) =>
      `<p class="privacy-warning">${esc(PortfolioAssets.privacy)}</p>${p.documents.map((section) => `<section class="document-section paper-panel"><h2>${esc(section.title)}</h2>${section.files.map(pdfSlot).join("")}</section>`).join("")}`,
    "reflective-journey": (p) =>
      `<div class="reflection-grid">${p.sections.map((s, i) => panel(s.title, s.items, "tone-" + i)).join("")}</div><p class="handwritten page-note">${esc(p.note)}</p>`,
    "my-growth": (p) =>
      `<div class="growth-comparison">${panel(p.beforeTitle, p.before, "before")}${panel(p.afterTitle, p.after, "after")}</div><div class="two-columns growth-details">${panel(p.improvedTitle, p.improved)}${panel(p.futureTitle, p.future)}</div><p class="handwritten page-note">${esc(p.note)}</p>`,
    "final-reflection": (p) =>
      `<div class="final-layout"><div>${p.paragraphs.map(paragraphs).join("")}<blockquote class="reflection-quote"><p>${esc(p.quote)}</p></blockquote></div>${polaroid("reflection", p.caption)}</div>`,
    "contact-me": (p) =>
      `<div class="contact-layout"><section><p class="lead-copy">${esc(p.body)}</p><div class="contact-channels"><div>${icon(13)}<span>${data.site.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.site.email) ? `<a class="button" href="mailto:${esc(data.site.email)}">${esc(p.emailLabel)}</a><small>${esc(data.site.email)}</small>` : `<strong>${esc(p.disabledText)}</strong>`}</span></div><p class="email-note">${esc(p.emailNote)}</p><div>${icon(2)}<span><strong>${esc(p.locationLabel)}</strong><small>${esc(data.site.location)}</small></span></div>${safeLink(data.site.professionalLink) ? `<div>${icon(11)}<a href="${esc(safeLink(data.site.professionalLink))}" target="_blank" rel="noopener">${esc(data.site.professionalLabel)} ↗</a></div>` : ""}</div></section><div class="thank-you"><p class="handwritten">${esc(p.thanks)}</p><span aria-hidden="true">♡</span><img src="assets/botanical.svg" alt=""></div></div><blockquote class="closing-quote">${esc(p.closing)}</blockquote>`,
  };
  $("#brand-title").textContent = data.site.brand;
  $("#brand-subtitle").textContent = data.site.subtitle;
  $("#sidebar-quote").textContent = data.site.sidebarQuote;
  $("#footer-text").textContent = data.site.footer;
  $("#demo-notice").textContent = data.site.notice;
  $("#navigation").innerHTML = data.pages
    .map(
      (p, i) =>
        `<a href="#${esc(p.id)}">${icon(i)}<span>${esc(p.label)}</span></a>`,
    )
    .join("");
  const sidebar = $("#sidebar"),
    toggle = $("#menu-toggle"),
    overlay = $("#drawer-overlay");
  let menuOpen = false;
  function closeMenu(restoreFocus = true) {
    menuOpen = false;
    document.body.classList.remove("drawer-open");
    toggle.setAttribute("aria-expanded", "false");
    overlay.hidden = true;
    sidebar.inert = matchMedia("(max-width: 800px)").matches;
    if (restoreFocus) toggle.focus();
  }
  function openMenu() {
    menuOpen = true;
    sidebar.inert = false;
    document.body.classList.add("drawer-open");
    toggle.setAttribute("aria-expanded", "true");
    overlay.hidden = false;
    $("#menu-close").focus();
  }
  toggle.addEventListener("click", () => (menuOpen ? closeMenu() : openMenu()));
  $("#menu-close").addEventListener("click", () => closeMenu());
  overlay.addEventListener("click", () => closeMenu());
  document.addEventListener("keydown", (e) => {
    if (!menuOpen) return;
    if (e.key === "Escape") closeMenu();
    if (e.key === "Tab") {
      const els = [...sidebar.querySelectorAll("a,button")];
      const first = els[0],
        last = els.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  const media = matchMedia("(max-width: 800px)");
  media.addEventListener("change", () => closeMenu(false));
  closeMenu(false);
  function render(focus = false) {
    const id = location.hash.slice(1) || "home";
    const p = data.pages.find((p) => p.id === id);
    if (!p) {
      location.hash = "home";
      return;
    }
    $("#main").innerHTML =
      p.id === "home"
        ? home(p)
        : `<article class="chapter chapter-${esc(p.id)}"><header class="page-heading"><p class="eyebrow">${esc(p.eyebrow)}</p><h1>${esc(p.title)}</h1>${p.id === "final-reflection" ? `<div class="page-intro">${paragraphs(p.intro)}</div>` : `<p class="page-intro">${esc(p.intro)}</p>`}<img src="assets/botanical.svg" alt="" class="heading-botanical"></header>${renderers[p.id](p)}</article>`;
    document.title = `${p.title} · ${data.site.name}`;
    $("#navigation")
      .querySelectorAll("a")
      .forEach((a) => {
        if (a.hash === "#" + p.id) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      });
    closeMenu(false);
    window.scrollTo(0, 0);
    if (focus) $("#main").focus({ preventScroll: true });
  }
  $("#navigation").addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (link && link.hash === (location.hash || "#home")) {
      closeMenu(false);
      $("#main").focus({ preventScroll: true });
    }
  });
  window.addEventListener("hashchange", () => render(true));
  render();
  const dialog = $("#image-dialog");
  let imageTrigger;
  $("#main").addEventListener("click", (e) => {
    const b = e.target.closest("[data-image]");
    if (!b) return;
    imageTrigger = b;
    const img = b.querySelector("img");
    $("#dialog-image").src = img.src;
    $("#dialog-image").alt = img.alt;
    $("#dialog-caption").textContent = b.dataset.caption;
    $("#dialog-detail").textContent = b.dataset.detail;
    dialog.showModal();
  });
  $(".dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        dialog.close();
    }
  });
  dialog.addEventListener("close", () => imageTrigger?.focus());
})();
