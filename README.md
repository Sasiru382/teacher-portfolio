# My Teaching Journey — English Teacher Portfolio

A complete lavender-and-cream teaching scrapbook, inspired by the supplied compositions. All biographical copy, statistics, endorsements and achievements are **explicitly demonstration content**, not statements about a real teacher.

## Open it — no installation needed

1. Extract the complete folder if received as a ZIP.
2. Double-click **index.html** in a modern browser with JavaScript enabled.
3. Double-click **guide.html** for illustrated, beginner-friendly replacement instructions.
4. Double-click **editor.html** to edit words, links and pictures without coding.

All images and fonts are stored locally. The website works with `file://` and static hosting. There are **no production dependencies, embedded API keys, backend, analytics or build steps**. The editor uses IndexedDB for local drafts and optionally calls GitHub directly for authenticated publishing. Node/Playwright are only optional developer test tools.

## Personalise it

- In the editor, select **Text & links → Portfolio identity & contact** to set name, qualification, contact and site-wide copy.
- Select each chapter to change its text. Home and My Internship have separate fact lists; update both. Small image/resource safety notes are editable under **Portfolio identity & contact → Display Notes**; update them when the corresponding demonstration material is replaced.
- Choose **Pictures** to upload JPG/PNG/WebP images, add accurate image descriptions and optionally set a local image filename.
- Uploads are embedded in the exported data; large images are resized to a 1600-pixel maximum. Files over 8 MB are rejected. Keep originals backed up.
- Click **Export content.js**. Rename the download exactly `content.js` and replace the file next to index.html. Refresh the website.
- **Import content.js** resumes an exported draft. It parses JSON, never evaluates uploaded JavaScript, and validates the full fourteen-page data structure.
- **Preview changes** is temporary and uses session storage. Some browsers restrict storage for local files; export/replace/refresh is the fallback.
- **Save draft** writes text and embedded pictures to IndexedDB, scoped to this origin and editor path. Reopening restores the saved draft. It does not change the public site. Edits since the last save trigger a close warning (browser support varies). Save is explicit, not automatic.
- Reset returns to the loaded file in the editing tab; save afterward to replace the stored draft. It never updates GitHub.
- Private browsing, quota restrictions, browser data clearing or a different browser/device can make drafts unavailable. Export regularly. Drafts are visible to anyone using this browser profile on a shared device.

**The editor is public, not password protected.** Anyone can edit their own browser draft. Publishing requires a valid GitHub token with repository write permission; anonymous visitors cannot overwrite your deployment. Every file you deploy is public: never include credentials, consent records or private backups.

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

GitHub Actions runs the Node and Chromium/Playwright tests on pushes and pull requests. Successful pushes to `main` automatically publish only website files to GitHub Pages. See `.github/workflows/pages.yml`. To update content without using Git locally: export `content.js` from the editor, open it in the GitHub repository, select Edit or Upload files, replace it, and commit to main. Wait for the Actions run to succeed, then refresh the live site. Alternatively use **Publish to website** in the editor. Save draft alone does not update the hosted site. See the setup below.

The initial deployment contains clearly labelled demo content. Replace and verify it before sharing as a real professional portfolio.

For Netlify drag-and-drop, create a clean folder containing index.html, content.js, app.js, styles.css, assets/ and resources/. Optional editor/help pages can also be included, but they are public; if excluded, remove their utility links from index.html. Omit node_modules, tests, screenshots, private documents and backups. Visit `https://app.netlify.com/drop`, sign into your own account and drop the folder with index.html at its top level. No build command is required. Update the existing site by manually redeploying the changed folder. guide.html has the friendly walkthrough.

## GitHub publishing setup (owner and teacher)

1. Open the trusted editor at https://sasiru382.github.io/teacher-portfolio/editor.html. In a **separate tab**, sign into your own GitHub account. GitHub login alone does not authenticate this editor.
2. Your account needs write access to **Sasiru382/teacher-portfolio**. Owner: open repository **Settings → Collaborators → Add people**, invite the teacher's GitHub username, and have them accept the invitation. No invitation is sent by this project. Review permissions carefully.
3. In GitHub, open **Settings (your account) → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**. Choose a short expiry; select the repository's resource owner and **Only select repositories → teacher-portfolio**. Grant **Repository permissions → Contents → Read and write**. Metadata read is automatic. **Do not grant Workflows write**; updating content.js does not require it. Organisation approval, branch rules or GitHub account restrictions can still prevent direct updates.
4. **GitHub currently does not support fine-grained tokens for outside/repository collaborators.** See [GitHub’s documented limitations](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#fine-grained-personal-access-tokens-limitations). If teacher-portfolio is not selectable under the correct owner, stop: the owner can publish using their own restricted token, or the teacher can fork/own the site and have a developer update the fixed publishing configuration and visible instructions. Do not broaden token scope or share the owner's token with the teacher.
5. Copy your token into the editor's masked **GitHub token** field only. Do not put it in content, chat, a URL, files or screenshots. The editor sends it only as an Authorization header to api.github.com, retains it only during the action, and clears the input after every attempt/cancel. It never saves tokens to drafts, browser storage or exports. Browser extensions/password managers are outside this guarantee; decline any save-password prompt. Revoke tokens in GitHub when done.
6. Review text, photos, privacy and links; **Save draft** and export a portable backup. Click **Publish to website** and confirm the fixed scope: **content.js, Sasiru382/teacher-portfolio, main**. Only embedded uploaded photos travel with this file; upload new assets/PDFs separately in GitHub before linking them.
7. The editor checks the repository version before every write and verifies the exact new remote file afterward. If remote content or the saved base version changed, publishing stops. **Export your current draft first**, choose **Reload remote content**, confirm replacing the draft, then carefully reapply edits from the backup. Importing an old export does not bypass version conflicts. No silent merge or force overwrite occurs.
8. **Changes committed; deployment pending** means GitHub contains the update, NOT that the website is live. Open the Actions link, find the matching commit's **Test and deploy portfolio** run, and wait for test/package/deploy to succeed. If pending, wait; if failed, keep your draft and ask the owner to inspect the failed job. The editor does not poll CI or automatically claim live success. Once the run succeeds, refresh the public site and check actual content (caches may lag).
9. For 401 use a new unexpired token; for 403 check token permissions, repository access, rate limits or approval; for 404 check repository selection/access; for 409/422 export and reload remote content, checking branch protection with the owner. On a network error after sending an update, check GitHub before retrying: the commit may already exist. Your draft remains available.

Fine-grained tokens are not restricted to one file: Contents write permits other repository content changes. Keep them short-lived and limited to this repository. This is a static public client, not an OAuth login/backend. Use only a trusted browser/site. The offline export → replace/upload workflow remains available without a token. Forks require a developer to update the repository/branch constants in editor.js, matching UI/docs links, and Pages setup.

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
