# My Teaching Journey — English Teacher Portfolio

A complete lavender-and-cream teaching scrapbook, inspired by the supplied compositions. All biographical copy, statistics, endorsements and achievements are **explicitly demonstration content**, not statements about a real teacher.

## Open it — no installation needed

1. Extract the complete folder if received as a ZIP.
2. Double-click **index.html** in a modern browser with JavaScript enabled.
3. Double-click **guide.html** for illustrated, beginner-friendly replacement instructions.
4. Double-click **editor.html** to edit words, links and pictures without coding.

All images and fonts are stored locally. The website works with `file://` and static hosting. There are **no production dependencies, API keys, backend, database, analytics or build steps**. Node/Playwright are only optional developer test tools.

## Personalise it

- In the editor, select **Text & links → Portfolio identity & contact** to set name, qualification, contact and site-wide copy.
- Select each chapter to change its text. Home and My Internship have separate fact lists; update both. Small image/resource safety notes are editable under **Portfolio identity & contact → Display Notes**; update them when the corresponding demonstration material is replaced.
- Choose **Pictures** to upload JPG/PNG/WebP images, add accurate image descriptions and optionally set a local image filename.
- Uploads are embedded in the exported data; large images are resized to a 1600-pixel maximum. Files over 8 MB are rejected. Keep originals backed up.
- Click **Export content.js**. Rename the download exactly `content.js` and replace the file next to index.html. Refresh the website.
- **Import content.js** resumes an exported draft. It parses JSON, never evaluates uploaded JavaScript, and validates the full fourteen-page data structure.
- **Preview changes** is temporary and uses session storage. Some browsers restrict storage for local files; export/replace/refresh is the fallback.
- Reset discards current tab edits only. The editor does not auto-save or write to your filesystem.

**The editor is not password protected and is not a hosted admin system.** Visitors cannot use it to overwrite your deployment. Anyone can open it and edit their own browser draft. Every file you deploy is public: never include credentials, consent records or private backups.

For precise image filenames, slots, page placements, sizes, caption edits, certificate/PDF replacement and publishing instructions, read **guide.html**. It documents all eighteen image slots. Most illustrations are original SVG placeholders; the empty classroom photo is an illustrative Unsplash image, not the teacher’s placement. See **ASSET-CREDITS.md**.

## All fourteen pages

| Chapter | Deep link | Composition |
| --- | --- | --- |
| Home | `index.html#home` | Classroom hero, portrait welcome, internship glance, five sample metrics, two polaroids, quote |
| About Me | `index.html#about-me` | Biography, timeline, portrait, strengths sticky note, hobbies |
| My Internship | `index.html#my-internship` | School image, facts, responsibilities, learning |
| Teaching Philosophy | `index.html#teaching-philosophy` | Intro and four principle strips |
| Lesson Plans | `index.html#lesson-plans` | Objectives, sequence, materials, printable lesson and worksheet |
| My Learners | `index.html#my-learners` | Grades, characteristics, needs and support |
| Teaching in Action | `index.html#teaching-in-action` | Six captioned polaroids and accessible image viewer |
| Testimonials | `index.html#testimonials` | Three explicitly sample quotations |
| Reflective Journey | `index.html#reflective-journey` | Four reflection panels and journal resource |
| My Growth | `index.html#my-growth` | Before/after, improvement and further development |
| Achievements | `index.html#achievements` | Six explicitly sample certificate previews; optional document links |
| Evidence Hub | `index.html#evidence-hub` | Eight working printable resource categories |
| Final Reflection | `index.html#final-reflection` | Narrative, handwritten quote and journal polaroid |
| Contact Me | `index.html#contact-me` | Disabled-until-configured email, region, optional professional link, closing thanks |

Hash navigation needs no server rewrite rules. Unknown hashes return Home. Browser back/forward and direct deep links work.

## File map

- `content.js`: central visitor-facing portfolio content (`site`, `images`, `pages`). Keep stable page IDs and data keys when manually editing.
- `index.html`: semantic shell, sidebar, mobile drawer, modal.
- `app.js`: safe static renderer, routing, drawer focus management, image modal.
- `styles.css`: responsive design, local typography, reduced-motion and print styles.
- `editor.html`, `editor.js`, `editor.css`: local editor and content export/import.
- `guide.html`, `guide.css`: illustrated personalisation and publishing guide.
- `assets/`: original illustration placeholders, design SVGs, classroom photo, local fonts and font licences.
- `resources/`: eight genuine printable HTML templates and their stylesheet.
- `tests/`: Node content/document tests, Playwright offline browser tests, asset/resource regeneration scripts.
- `screenshots/`: verification captures when present; not required for production.

Portfolio copy is data-driven. Static interface instructions, editor labels, demo safety reminders and printable resource bodies are in their relevant HTML/JS files. To substantially change layouts, edit the renderer and CSS rather than content.js. The beginner editor keeps the existing item counts; a developer can extend arrays manually if needed, but exported imports are intentionally constrained to the original schema.

## Documents and contact

Every lesson/evidence link opens a genuine local printable HTML resource in a new tab. Click **Print / Save as PDF** and choose the browser’s Save as PDF option to download. To use your own PDF, copy it to `resources/` and update the appropriate `href` in the editor. Shared sample resources have separate links on different pages: change each one.

Certificate preview image slots are separate from the optional certificate `href`. Use a redacted JPG/PNG preview and an optional `resources/my-certificate.pdf` link. A blank certificate link shows no download button.

Email remains disabled until a valid email address is set. The enabled button uses `mailto:` and opens the visitor’s configured email application; **the website does not submit or store messages**. Profile links support full `https://` URLs. Local resources should start `resources/` or `assets/`. Script URLs are not accepted.

## Publish

GitHub repository: https://github.com/Sasiru382/teacher-portfolio

Shareable site: https://sasiru382.github.io/teacher-portfolio/

GitHub Actions runs the Node and Chromium/Playwright tests on pushes and pull requests. Successful pushes to `main` automatically publish only website files to GitHub Pages. See `.github/workflows/pages.yml`. To update content without using Git locally: export `content.js` from the editor, open it in the GitHub repository, select Edit or Upload files, replace it, and commit to main. Wait for the Actions run to succeed, then refresh the live site. Browser-only editor changes do not update the hosted site until the exported file is committed.

The initial deployment contains clearly labelled demo content. Replace and verify it before sharing as a real professional portfolio.

For Netlify drag-and-drop, create a clean folder containing index.html, content.js, app.js, styles.css, assets/ and resources/. Optional editor/help pages can also be included, but they are public; if excluded, remove their utility links from index.html. Omit node_modules, tests, screenshots, private documents and backups. Visit `https://app.netlify.com/drop`, sign into your own account and drop the folder with index.html at its top level. No build command is required. Update the existing site by manually redeploying the changed folder. guide.html has the friendly walkthrough.

## Privacy and demo checklist

Before publishing, replace name/qualifications, school/dates, all sample metrics, biography/reflections, eighteen image slots, six certificate placeholders and three sample testimonials. Verify claims and resource links. Keep the demo notice until no misleading samples remain.

Never publish identifiable minors without school approval, appropriate parent/guardian consent and applicable privacy compliance. Consider learner assent as well. Remove names, grade records, ID numbers, signatures, private feedback and image location metadata. Materials-only/empty-room photos are safer when permissions are unavailable. Redact PDFs properly and obtain permission for copyrighted materials and quoted feedback. Do not upload consent records themselves. This is practical guidance, not legal advice.

## Optional developer verification

Requirements: Node.js and npm. Production does not require either.

```sh
cd /home/sasiru/teacher-portfolio
npm ci
npx playwright install chromium
npm test
```

The browser tests run against file:// URLs, exercising offline operation. Coverage includes fourteen navigation targets, deep-link refresh, image decoding, console errors, disabled contact, working resources, 390/320-pixel overflow, mobile drawer focus trap/Escape, gallery modal Escape/backdrop/focus restoration, and editor image upload/export/import/reset with malicious-code rejection. Additional verification captures demonstrate desktop/mobile presentation.

To serve locally if desired (not necessary for normal use):

```sh
python3 -m http.server 8765 --directory /home/sasiru/teacher-portfolio
```

Then open `http://localhost:8765`. Stop the server with Ctrl+C.

Design posture: Decide/Learn with asymmetric home composition; quiet lavender chosen from the brief, Cormorant Garamond editorial headlines, Caveat handwritten annotations, Nunito Sans body, restrained paper texture and botanical linework. No remote runtime assets.
