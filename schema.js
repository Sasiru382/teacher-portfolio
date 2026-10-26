/* Strict JSON-only schema, fixed route order and lossless legacy migration. */
(() => {
  "use strict";
  const ids = [
    "home",
    "about-me",
    "my-internship",
    "teaching-philosophy",
    "lesson-plans",
    "my-learners",
    "teaching-in-action",
    "testimonials",
    "reflective-journey",
    "my-growth",
    "final-reflection",
    "contact-me",
  ];
  const legacyIds = [
    ...ids.slice(0, 10),
    "achievements",
    "evidence-hub",
    ...ids.slice(10),
  ];
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const sameIds = (pages, expected) =>
    Array.isArray(pages) &&
    JSON.stringify(pages.map((p) => p?.id)) === JSON.stringify(expected);
  function shape(base, value, path = "") {
    if (typeof base === "string") return typeof value === "string";
    if (Array.isArray(base)) {
      if (!Array.isArray(value)) return false;
      if (
        (base.length === 0 || Object.hasOwn(base[0] || {}, "src")) &&
        (path.endsWith(".gallery") || path.endsWith(".videos"))
      )
        return (
          value.length <= (path.endsWith(".gallery") ? 30 : 3) &&
          value.every(
            (v) =>
              v &&
              ["src", "alt", "caption", "detail"].every(
                (k) => typeof v[k] === "string",
              ),
          )
        );
      return (
        value.length === base.length &&
        base.every((v, i) => shape(v, value[i], path + "." + i))
      );
    }
    if (base && typeof base === "object")
      return (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        Object.keys(base).every(
          (k) =>
            Object.hasOwn(value, k) && shape(base[k], value[k], path + "." + k),
        )
      );
    return typeof value === typeof base;
  }
  function tree(value, depth = 0) {
    if (depth > 30) throw Error("Content nested too deeply");
    if (value && typeof value === "object")
      for (const [key, item] of Object.entries(value)) {
        if (["__proto__", "constructor", "prototype"].includes(key))
          throw Error("Unsafe content key");
        tree(item, depth + 1);
      }
    else if (
      !["string", "number", "boolean"].includes(typeof value) &&
      value !== null
    )
      throw Error("Invalid JSON value");
  }
  function normalize(input, template) {
    tree(input);
    if (JSON.stringify(input).length > window.PortfolioAssets.maxContent)
      throw Error("Content exceeds 40 MB");
    let value = clone(input);
    if (sameIds(value.pages, legacyIds)) {
      if (!shape(legacyShape, value))
        throw Error("Incomplete legacy portfolio");
      const archived = clone(value);
      const oldPages = value.pages;
      const base = clone(template);
      value.pages = ids.map((id) => {
        const old = oldPages.find((p) => p.id === id);
        const fresh = base.pages.find((p) => p.id === id);
        if (id === "lesson-plans")
          return { ...fresh, label: old.label, eyebrow: old.eyebrow };
        if (id === "testimonials")
          return { ...fresh, label: old.label, eyebrow: old.eyebrow };
        if (id === "home") return { ...old, metrics: old.metrics.slice(0, 3) };
        if (id === "my-learners")
          return {
            ...old,
            profiles: [
              { title: "Grade 6 Class Profile", intro: old.intro },
              { title: "Grade 9 Class Profile", intro: "" },
            ],
          };
        if (id === "teaching-in-action")
          return {
            ...fresh,
            label: old.label,
            title: old.title,
            eyebrow: old.eyebrow,
            gallery: old.gallery
              .filter(
                (g) =>
                  value.images[g.image]?.src &&
                  !/^assets\/(lesson|group|materials|board|workshop|event)\.svg$/.test(
                    value.images[g.image].src,
                  ),
              )
              .map((g) => ({
                src: value.images[g.image].src,
                alt: value.images[g.image].alt,
                caption: g.caption,
                detail: g.detail,
              })),
          };
        if (id === "reflective-journey") {
          const { resource, ...rest } = old;
          return rest;
        }
        if (id === "final-reflection")
          return {
            ...old,
            label: "Reflective Summary",
            title: "Reflective Summary",
          };
        return old;
      });
      value.images.schoolLogo = base.images.schoolLogo;
      value.legacyArchive = archived;
    }
    if (!sameIds(value.pages, ids) || !shape(template, value))
      throw Error("Expected the complete twelve-chapter portfolio");
    for (const slot of Object.values(value.images))
      if (
        !slot ||
        typeof slot.src !== "string" ||
        typeof slot.alt !== "string" ||
        typeof slot.label !== "string" ||
        (slot.src && !window.PortfolioAssets.image(slot.src))
      )
        throw Error("Unsafe image");
    for (const page of value.pages) {
      if (page.id === "lesson-plans")
        for (const file of page.weeks)
          if (file.href && !window.PortfolioAssets.pdf(file.href))
            throw Error("Unsafe PDF");
      if (page.id === "testimonials")
        for (const section of page.documents)
          for (const file of section.files)
            if (file.href && !window.PortfolioAssets.pdf(file.href))
              throw Error("Unsafe PDF");
      if (page.id === "teaching-in-action")
        for (const [key, kind] of [
          ["gallery", "image"],
          ["videos", "video"],
        ])
          for (const media of page[key])
            if (media.src && !window.PortfolioAssets[kind](media.src))
              throw Error("Unsafe media");
    }
    if (JSON.stringify(value).length > window.PortfolioAssets.maxContent)
      throw Error(
        "Migrated content exceeds 40 MB. Keep your original export and ask for help.",
      );
    return value;
  }
  // Legacy shape is an inert string-only skeleton, never executable imported code.
  const legacyShape = {
    site: {
      name: "",
      brand: "",
      subtitle: "",
      qualification: "",
      notice: "",
      footer: "",
      email: "",
      location: "",
      professionalLink: "",
      professionalLabel: "",
      sidebarQuote: "",
      displayNotes: {
        heroImage: "",
        metrics: "",
        schoolImage: "",
        lessonResources: "",
        gallery: "",
        evidence: "",
        documentButton: "",
      },
    },
    images: {
      hero: { src: "", alt: "", label: "" },
      portrait: { src: "", alt: "", label: "" },
      school: { src: "", alt: "", label: "" },
      homeLesson: { src: "", alt: "", label: "" },
      homeKindness: { src: "", alt: "", label: "" },
      gallery1: { src: "", alt: "", label: "" },
      gallery2: { src: "", alt: "", label: "" },
      gallery3: { src: "", alt: "", label: "" },
      gallery4: { src: "", alt: "", label: "" },
      gallery5: { src: "", alt: "", label: "" },
      gallery6: { src: "", alt: "", label: "" },
      certificate1: { src: "", alt: "", label: "" },
      certificate2: { src: "", alt: "", label: "" },
      certificate3: { src: "", alt: "", label: "" },
      certificate4: { src: "", alt: "", label: "" },
      certificate5: { src: "", alt: "", label: "" },
      certificate6: { src: "", alt: "", label: "" },
      reflection: { src: "", alt: "", label: "" },
    },
    pages: [
      {
        id: "",
        label: "",
        title: "",
        eyebrow: "",
        intro: "",
        welcomeTitle: "",
        welcome: "",
        handwritten: "",
        glanceTitle: "",
        facts: [
          ["", ""],
          ["", ""],
          ["", ""],
          ["", ""],
          ["", ""],
        ],
        metricsTitle: "",
        metrics: [
          ["", ""],
          ["", ""],
          ["", ""],
          ["", ""],
          ["", ""],
        ],
        polaroids: [
          ["", ""],
          ["", ""],
        ],
        quote: "",
      },
      {
        id: "",
        label: "",
        title: "",
        eyebrow: "",
        intro: "",
        bioTitle: "",
        bio: "",
        timelineTitle: "",
        timeline: [
          ["", ""],
          ["", ""],
          ["", ""],
          ["", ""],
          ["", ""],
        ],
        strengthsTitle: "",
        strengths: ["", "", "", "", ""],
        hobbiesTitle: "",
        hobbies: ["", "", "", "", ""],
        note: "",
      },
      {
        id: "",
        label: "",
        title: "",
        eyebrow: "",
        intro: "",
        facts: [
          ["", ""],
          ["", ""],
          ["", ""],
          ["", ""],
          ["", ""],
        ],
        responsibilitiesTitle: "",
        responsibilities: ["", "", "", "", ""],
        learningTitle: "",
        learning: ["", "", "", "", ""],
      },
      {
        id: "",
        label: "",
        title: "",
        eyebrow: "",
        intro: "",
        body: "",
        principles: [
          ["", ""],
          ["", ""],
          ["", ""],
          ["", ""],
        ],
        note: "",
      },
      {
        id: "",
        label: "",
        title: "",
        eyebrow: "",
        intro: "",
        lessonTitle: "",
        level: "",
        objectivesTitle: "",
        objectives: ["", "", ""],
        activitiesTitle: "",
        activities: ["", "", "", "", ""],
        materialsTitle: "",
        materials: "",
        resources: [
          { title: "", description: "", href: "" },
          { title: "", description: "", href: "" },
        ],
      },
      {
        id: "",
        label: "",
        title: "",
        eyebrow: "",
        intro: "",
        grade: "",
        age: "",
        characteristicsTitle: "",
        characteristics: ["", "", "", ""],
        needsTitle: "",
        needs: ["", "", "", ""],
        supportTitle: "",
        support: ["", "", "", ""],
        note: "",
      },
      {
        id: "",
        label: "",
        title: "",
        eyebrow: "",
        intro: "",
        gallery: [
          { image: "", caption: "", detail: "" },
          { image: "", caption: "", detail: "" },
          { image: "", caption: "", detail: "" },
          { image: "", caption: "", detail: "" },
          { image: "", caption: "", detail: "" },
          { image: "", caption: "", detail: "" },
        ],
      },
      {
        id: "",
        label: "",
        title: "",
        eyebrow: "",
        intro: "",
        testimonials: [
          { quote: "", author: "", role: "" },
          { quote: "", author: "", role: "" },
          { quote: "", author: "", role: "" },
        ],
      },
      {
        id: "",
        label: "",
        title: "",
        eyebrow: "",
        intro: "",
        sections: [
          { title: "", items: ["", "", "", ""] },
          { title: "", items: ["", "", "", ""] },
          { title: "", items: ["", "", "", ""] },
          { title: "", items: ["", "", "", ""] },
        ],
        note: "",
        resource: { title: "", description: "", href: "" },
      },
      {
        id: "",
        label: "",
        title: "",
        eyebrow: "",
        intro: "",
        beforeTitle: "",
        before: ["", "", "", ""],
        afterTitle: "",
        after: ["", "", "", ""],
        improvedTitle: "",
        improved: ["", "", "", ""],
        futureTitle: "",
        future: ["", "", "", ""],
        note: "",
      },
      {
        id: "",
        label: "",
        title: "",
        eyebrow: "",
        intro: "",
        certificates: [
          { image: "", title: "", detail: "", href: "" },
          { image: "", title: "", detail: "", href: "" },
          { image: "", title: "", detail: "", href: "" },
          { image: "", title: "", detail: "", href: "" },
          { image: "", title: "", detail: "", href: "" },
          { image: "", title: "", detail: "", href: "" },
        ],
      },
      {
        id: "",
        label: "",
        title: "",
        eyebrow: "",
        intro: "",
        resources: [
          { title: "", description: "", href: "" },
          { title: "", description: "", href: "" },
          { title: "", description: "", href: "" },
          { title: "", description: "", href: "" },
          { title: "", description: "", href: "" },
          { title: "", description: "", href: "" },
          { title: "", description: "", href: "" },
          { title: "", description: "", href: "" },
        ],
        note: "",
      },
      {
        id: "",
        label: "",
        title: "",
        eyebrow: "",
        intro: "",
        paragraphs: ["", "", ""],
        quote: "",
        caption: "",
      },
      {
        id: "",
        label: "",
        title: "",
        eyebrow: "",
        intro: "",
        body: "",
        emailLabel: "",
        disabledText: "",
        emailNote: "",
        locationLabel: "",
        closing: "",
        thanks: "",
      },
    ],
  };
  window.PortfolioSchema = { normalize };
})();
