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
- Uploads are embedded in the exported data; large images are resized to a 1600-pixel maximum. The input limit is **8 MiB (8,388,608 bytes), inclusive**, before resizing; the complete embedded draft has a **100 MiB (104,857,600 bytes), inclusive, compact UTF-8 JSON budget**, including text, metadata and legacy archives. Keep originals backed up.
- A selected filename is not proof that a picture was accepted. Read the feedback directly below its upload control: success says **Picture embedded in draft**, and the thumbnail changes. Rejection explains the reason and keeps the previous picture and other edits intact. The file picker clears after acceptance/rejection so a rejected filename cannot look like a successful upload. After success, the optional local filename is blank because the image is embedded, not a separate local asset.
- Wait for processing before **Save draft** or **Preview changes**. Preview uses session storage where available and explicitly selects the IndexedDB fallback for larger drafts or blocked session storage. If both are unavailable, your edits remain in the tab: export a backup. Save draft/preview never changes the public website.
- Click **Export content.js**. Rename the download exactly `content.js` and replace the file next to index.html. Refresh the website.
- **Import content.js** resumes an exported draft. It parses JSON, never evaluates uploaded JavaScript, and validates the full twelve-page data structure. Original fourteen-page exports/drafts migrate safely; the original fourteen-page data is retained in non-rendered `legacyArchive`, which is included in exports and must be reviewed for privacy before publication.
- **Preview changes** is temporary and uses session storage, with IndexedDB fallback for large media drafts. Some browsers restrict storage for local files; export/replace/refresh is the fallback.
- **Save draft** writes text and embedded pictures to IndexedDB, scoped to this origin and editor path. Reopening restores the saved draft. It does not change the public site. Edits since the last save trigger a close warning (browser support varies). Save is explicit, not automatic.
- Reset returns to the loaded file in the editing tab; save afterward to replace the stored draft. It never updates GitHub.
- Private browsing, quota restrictions, browser data clearing or a different browser/device can make drafts unavailable. Export regularly. Drafts are visible to anyone using this browser profile on a shared device.

**The editor is public, not password protected.** Anyone can edit their own browser draft. Publishing requires a valid GitHub token with repository write permission; anonymous visitors cannot overwrite your deployment. Every file you deploy is public: never include credentials, consent records or private backups.

For precise image filenames, slots, page placements, sizes, caption edits, certificate/PDF replacement and publishing instructions, read **guide.html**. It documents all seven image slots. Most illustrations are original SVG placeholders; the empty classroom photo is an illustrative Unsplash image, not the teacher’s placement. See **ASSET-CREDITS.md**.

## Correction assumptions and compatibility

- “Home items 4 and 5” is interpreted as the fourth/fifth **My Teaching Journey in Numbers** metrics (weekly reflections and classroom experiences), not the fourth/fifth internship facts. Three metrics remain; all internship facts are preserved.
- The two requested class profiles are Grade 6 and Grade 9; existing shared characteristics, needs and support information remains.
- Achievements and Evidence Hub are removed from the twelve active routes. Reflective Summary keeps `final-reflection` for old deep links. The sample journal file/link is removed and its generator no longer creates it.
- No genuine school logo, photos, clips, PDFs or endorsements were supplied. Those new slots start blank. Media under `tests/` is explicitly synthetic test material, excluded from the deployment workflow.
- Complete original fourteen-page exports and saved IndexedDB drafts are migrated on import/restore; a `legacyArchive` retains other original content without rendering it. **An archive is not private:** its bytes are included in exported/published content. Review it before sharing; a developer can remove the `legacyArchive` property from a backed-up export if that history should not travel with the public file. Original SHA conflict checks remain intact.

Previous twelve-page exports and actual saved drafts with four Testimonials sections also migrate. The known second section (principal/teacher consent, identified by fixed slot order, not editable titles) and its PDF bytes are deliberately discarded, including in known nested `legacyArchive` portfolios. The remaining three sections/four PDFs, custom titles, copy, photos and up to three clips are preserved. Keep the original export offline if you need those consent records; they are not secretly retained in new exports. This does not erase already deployed files, repository history, old browser data or separate local assets: replace old public content and remove any sensitive standalone files separately. Saved base content is normalised consistently; original SHA conflict checks remain.

## All twelve pages

| Chapter             | Deep link                        | Composition                                                                                              |
| ------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Home                | `index.html#home`                | Classroom hero, portrait welcome, internship glance, three sample metrics, two polaroids, quote          |
| About Me            | `index.html#about-me`            | Biography, timeline, portrait, strengths sticky note, hobbies                                            |
| My Internship       | `index.html#my-internship`       | School image, facts, responsibilities, learning                                                          |
| Teaching Philosophy | `index.html#teaching-philosophy` | Intro and four principle strips                                                                          |
| Lesson Plans        | `index.html#lesson-plans`        | Week 01–06, one uploadable/downloadable PDF each                                                         |
| My Learners         | `index.html#my-learners`         | Separate Grade 6/Grade 9 profiles with multi-paragraph introductions, characteristics, needs and support |
| Teaching in Action  | `index.html#teaching-in-action`  | Up to 30 photos and 3 playable video clips; captions/descriptions/details and accessible image viewer    |
| Testimonials        | `index.html#testimonials`        | Three PDF sections: observations (2), timetable (1), completion letter (1) |
| Reflective Journey  | `index.html#reflective-journey`  | Four reflection panels; no sample journal download                                                       |
| My Growth           | `index.html#my-growth`           | Before/after, improvement and further development                                                        |
| Reflective Summary  | `index.html#final-reflection`    | Reflective Summary narrative, handwritten quote and journal polaroid                                     |
| Contact Me          | `index.html#contact-me`          | Disabled-until-configured email, region, optional professional link, closing thanks                      |

Hash navigation needs no server rewrite rules. Unknown hashes return Home. Browser back/forward and direct deep links work.

## File map

- `content.js`: central visitor-facing portfolio content (`site`, `images`, `pages`). Keep stable page IDs and data keys when manually editing.
- `index.html`: semantic shell, sidebar, mobile drawer, modal.
- `asset-policy.js`, `schema.js`: shared safe file allowlists, twelve-route validation and original-export migration.
- `app.js`: safe static renderer, routing, drawer focus management, image modal.
- `styles.css`: responsive design, local typography, reduced-motion and print styles.
- `editor.html`, `editor.js`, `editor.css`: local editor and content export/import.
- `guide.html`, `guide.css`: illustrated personalisation and publishing guide.
- `assets/`: original illustration placeholders, design SVGs, classroom photo, local fonts and font licences.
- `resources/`: seven unused printable HTML templates (not linked as evidence) and their stylesheet.
- `tests/`: Node content/document tests, Playwright offline browser tests, asset/resource regeneration scripts. `npm test` runs the original demo regressions in an isolated temporary copy using `tests/demo-content.fixture.js`, then validates the actual root `content.js` and renders all twelve personalized chapters on desktop/mobile. This keeps editable names, document labels and embedded-media sizes from changing the demo test assumptions; it never replaces the published content.
- `screenshots/`: verification captures when present; not required for production.

Portfolio copy is data-driven. Static interface instructions, editor labels, demo safety reminders and printable resource bodies are in their relevant HTML/JS files. To substantially change layouts, edit the renderer and CSS rather than content.js. The twelve route IDs and fixed document/profile counts are validated; gallery arrays can grow/shrink within 30 photos and 3 clips. Blank lines split philosophy, class-profile introductions, and Reflective Summary introduction/body paragraphs, with HTML escaped. Use Enter twice in the multiline editor; save or export to keep the paragraph breaks.

## Documents and contact

Upload actual PDFs in Lesson Plans (Week 01–06) and Testimonials (two observation forms, timetable, completion letter). Blank slots have no download. Uploaded PDFs are embedded and download directly; alternatively use safe local `resources/*.pdf` or `assets/*.pdf` paths and copy those files separately.

Teaching in Action has Add photo / Add video clip controls, per-item upload, caption, description, details and removal. Up to **30 photos + 3 clips**; no pretend photos/videos appear in blank slots. Limits: photos **8 MiB** input, resized to **1600 px**; PDFs **15 MiB (15,728,640 bytes)**; MP4/WebM videos **15 MiB (15,728,640 bytes), inclusive**; complete embedded draft **100 MiB of compact UTF-8 JSON**. Base64 adds overhead. Use compressed files/short clips or safe local paths for larger media. Browser storage quotas may be lower. Provide descriptions/transcripts and captions for spoken video. The school logo is optional and blank until a genuine logo is uploaded in Pictures → schoolLogo.

**Signatures, signed consent and minors’ information become public on GitHub Pages. Keep originals private; use authorised, properly redacted copies only. Review legacyArchive too: non-rendered data is still public if deployed.**

Email remains disabled until a valid email address is set. The enabled button uses `mailto:` and opens the visitor’s configured email application; **the website does not submit or store messages**. Profile links support full `https://` URLs. Local resources should start `resources/` or `assets/`. Script URLs are not accepted.

## Size planning and local versus published capacity

- **Before encoding:** aim for roughly **70 MiB combined original media**, not 100 MiB of originals. Base64-only arithmetic gives a theoretical **75 MiB** ceiling for a 100 MiB serialized budget, with no room for text, metadata or archives. This is not guaranteed: large custom text/archives reduce available media space. Photos are resized/re-encoded, so their original input sizes do not map exactly to embedded sizes. The per-file **8/15/15 MiB** caps apply directly to each selected original photo/PDF/clip (video increased from 6 to 15 MiB; photo and PDF limits unchanged).
- **Exact budget:** `PortfolioAssets.maxContent` is **104,857,600 UTF-8 bytes of `JSON.stringify(content)`**, with no indentation, assignment, comment or trailing semicolon. It counts base64, text, metadata and legacy archives, using actual non-ASCII bytes rather than JavaScript string length. Uploads and both pre-/post-migration schema checks use the shared sizing policy.
- **Import/export envelope:** imports separately allow up to **101 MiB (105,906,176 bytes)** on disk for the assignment/comment/formatting envelope, then enforce the 100 MiB parsed-content budget. The editor's own exports remain re-importable at the boundary: if pretty formatting would exceed the envelope, export uses compact JSON. Arbitrarily whitespace-padded external files above 101 MiB are refused without replacing the draft.
- **Device limits:** save/preview/export/import may hold several copies in memory, so large drafts can be slow and require much more than 100 MiB RAM. IndexedDB/session storage quotas, private mode and available device space vary. A 100 MiB editor budget is not a storage guarantee. Keep portable exports; local paths require separately copying the referenced files.
- **Publishing is separate:** [GitHub blocks files larger than 100 MiB](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github). That is the **final content.js file**, including assignment and formatting overhead, not the compact draft budget. The editor refuses a final file above that threshold before a remote write. [GitHub Contents API limits](https://docs.github.com/en/rest/repos/contents#get-repository-content), request-body/base64 overhead, browser memory and repository rules can impose further restrictions. No promise is made that a maximum local draft can be published; reduce media or use local asset paths instead.

## If a lesson PDF does not appear

- Check the feedback directly below that week's upload control. Rejected files leave the previous PDF untouched. The editor requires the browser to identify the file as `application/pdf`, a `%PDF-` header, no more than 15 MiB (15,728,640 bytes) per PDF, and a complete draft within the 100 MiB serialized content budget. An empty/other browser MIME type is rejected even if the filename ends in `.pdf`; the editor does not silently relax validation.
- The **15 MiB per-PDF limit is not a capacity promise for every slot**: the **100 MiB aggregate** includes base64 expansion (about one third) and all other draft content. Two maximum-sized PDFs now fit; five already use 100 MiB in base64 before metadata, so the fifth cannot fit at full size. Use authorised local `resources/` or `assets/` paths (copy files separately) or compress files when needed. Browser storage quotas can impose additional limits.
- **PDF embedded** means the upload reached this tab's draft, not the public website. Use **Save draft** and reopen the same browser/path to verify a local save; use **Preview changes** to check the draft. Export/import preserves a portable backup. An ordinary `index.html` still uses its loaded `content.js` until that file is replaced or an authorised publish/deployment completes.
- A saved browser draft restores its own earlier content, even if the loaded `content.js` has changed. Export it before choosing **Reset to loaded content** or **Reload remote content**; those actions replace rather than merge edits.
- For diagnosis, retain the failing PDF, the exact editor URL/browser, the feedback text, and the relevant exported `content.js` or saved draft privately. A screenshot of a blank public slot alone cannot identify whether upload validation, local saving, file replacement or deployment failed. Never upload private teacher/student documents to a public issue.

## Publish

GitHub repository: https://github.com/Sasiru382/teacher-portfolio

Shareable site: https://sasiru382.github.io/teacher-portfolio/

GitHub Actions runs the Node and Chromium/Playwright tests on pushes and pull requests. Successful pushes to `main` automatically publish only website files to GitHub Pages. See `.github/workflows/pages.yml`. To update content without using Git locally: export `content.js` from the editor, open it in the GitHub repository, select Edit or Upload files, replace it, and commit to main. Wait for the Actions run to succeed, then refresh the live site. Alternatively use **Publish to website** in the editor. Save draft alone does not update the hosted site. See the setup below.

The initial deployment contains clearly labelled demo content. Replace and verify it before sharing as a real professional portfolio.

For Netlify drag-and-drop, create a clean folder containing index.html, content.js, asset-policy.js, schema.js, app.js, styles.css, assets/ and resources/. Optional editor/help pages can also be included, but they are public; if excluded, remove their utility links from index.html. Omit node_modules, tests, screenshots, private documents and backups. Visit `https://app.netlify.com/drop`, sign into your own account and drop the folder with index.html at its top level. No build command is required. Update the existing site by manually redeploying the changed folder. guide.html has the friendly walkthrough.

## GitHub publishing setup (owner and teacher)

1. Open the trusted editor at https://sasiru382.github.io/teacher-portfolio/editor.html. In a **separate tab**, sign into your own GitHub account. GitHub login alone does not authenticate this editor.
2. Your account needs write access to **Sasiru382/teacher-portfolio**. Owner: open repository **Settings → Collaborators → Add people**, invite the teacher's GitHub username, and have them accept the invitation. No invitation is sent by this project. Review permissions carefully.
3. In GitHub, open **Settings (your account) → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**. Choose a short expiry; select the repository's resource owner and **Only select repositories → teacher-portfolio**. Grant **Repository permissions → Contents → Read and write**. Metadata read is automatic. **Do not grant Workflows write**; updating content.js does not require it. Organisation approval, branch rules or GitHub account restrictions can still prevent direct updates.
4. **GitHub currently does not support fine-grained tokens for outside/repository collaborators.** See [GitHub’s documented limitations](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#fine-grained-personal-access-tokens-limitations). If teacher-portfolio is not selectable under the correct owner, stop: the owner can publish using their own restricted token, or the teacher can fork/own the site and have a developer update the fixed publishing configuration and visible instructions. Do not broaden token scope or share the owner's token with the teacher.
5. Copy your token into the editor's masked **GitHub token** field only. Do not put it in content, chat, a URL, files or screenshots. The editor sends it only as an Authorization header to api.github.com, retains it only during the action, and clears the input after every attempt/cancel. It never saves tokens to drafts, browser storage or exports. Browser extensions/password managers are outside this guarantee; decline any save-password prompt. Revoke tokens in GitHub when done.
6. Review text, photos, privacy and links; **Save draft** and export a portable backup. Click **Publish to website** and confirm the fixed scope: **content.js, Sasiru382/teacher-portfolio, main**. Embedded uploaded photos, videos and PDFs travel with this file; upload new local-path assets/PDFs separately in GitHub before linking them.
7. The editor checks the repository version before every write and verifies the exact new remote file afterward. If remote content or the saved base version changed, publishing stops. **Export your current draft first**, choose **Reload remote content**, confirm replacing the draft, then carefully reapply edits from the backup. Importing an old export does not bypass version conflicts. No silent merge or force overwrite occurs.
8. **Changes committed; deployment pending** means GitHub contains the update, NOT that the website is live. Open the Actions link, find the matching commit's **Test and deploy portfolio** run, and wait for test/package/deploy to succeed. If pending, wait; if failed, keep your draft and ask the owner to inspect the failed job. The editor does not poll CI or automatically claim live success. Once the run succeeds, refresh the public site and check actual content (caches may lag).
9. For 401 use a new unexpired token; for 403 check token permissions, repository access, rate limits or approval; for 404 check repository selection/access; for 409/422 export and reload remote content, checking branch protection with the owner. On a network error after sending an update, check GitHub before retrying: the commit may already exist. Your draft remains available.

Fine-grained tokens are not restricted to one file: Contents write permits other repository content changes. Keep them short-lived and limited to this repository. This is a static public client, not an OAuth login/backend. Use only a trusted browser/site. The offline export → replace/upload workflow remains available without a token. Forks require a developer to update the repository/branch constants in editor.js, matching UI/docs links, and Pages setup.

## Privacy and demo checklist

Before publishing, replace name/qualifications, school/dates, all sample metrics, biography/reflections, seven fixed image slots and all supplied gallery/PDF content. Verify claims and resource links. Keep the demo notice until no misleading samples remain.

Never publish identifiable minors without school approval, appropriate parent/guardian consent and applicable privacy compliance. Consider learner assent as well. Remove names, grade records, ID numbers, signatures, private feedback and image location metadata. Materials-only/empty-room photos are safer when permissions are unavailable. Redact PDFs properly and obtain permission for copyrighted materials and quoted feedback. Do not upload consent records themselves. This is practical guidance, not legal advice.

## Optional developer verification

Requirements: Node.js and npm. Production does not require either.

```sh
cd /home/sasiru/teacher-portfolio
npm ci
npx playwright install chromium
npm test
```

The browser tests run against file:// URLs, exercising offline operation. Coverage includes twelve navigation targets, deep-link refresh, image decoding, console errors, disabled contact, actual PDF upload/download, 30-photo/3-video round trips, remaining printable resources, 390/320-pixel overflow, mobile drawer focus trap/Escape, gallery modal Escape/backdrop/focus restoration, and editor image upload/export/import/reset with malicious-code rejection. Additional verification captures demonstrate desktop/mobile presentation.

To serve locally if desired (not necessary for normal use):

```sh
python3 -m http.server 8765 --directory /home/sasiru/teacher-portfolio
```

Then open `http://localhost:8765`. Stop the server with Ctrl+C.

Design posture: Decide/Learn with asymmetric home composition; quiet lavender chosen from the brief, Cormorant Garamond editorial headlines, Caveat handwritten annotations, Nunito Sans body, restrained paper texture and botanical linework. No remote runtime assets.
