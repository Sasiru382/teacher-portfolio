# Local correction verification

## Outcome and scope

All requested correction slices are implemented locally. The branch remains `main` at `d9c091e`; no commit, push, publication, branch switch or GitHub-state change was performed. Existing publishing configuration remains fixed to `Sasiru382/teacher-portfolio`, `content.js`, `main`. The workflow was edited **locally only** to include the two new runtime scripts in future packaging.

Assumption: Home items 4 and 5 mean the fourth/fifth “My Teaching Journey in Numbers” metrics: weekly reflections and classroom experiences. The three earlier metrics and all Internship at a Glance facts remain.

## Executed checks

Final full run: `npm test`

- Node: **6 passed, 0 failed** (`248.090068 ms`).
- Playwright Chromium: **34 passed, 0 failed** after the pre-commit review fix. The additional regression exercises an accepted `resources/` image path through editor export, preview, image decoding and enlargement; rendering now uses the same shared image policy as validation.
- Automated axe WCAG 2/2.1 A/AA checks report no violations across the twelve public chapters, editor and guide. This is not full accessibility certification.
- All twelve public deep links work offline; images decode; no public-site console/page errors or failed resources were reported.
- HTTP static-host preview and ordinary unchanged public content are both exercised.
- Real one-page PDF fixture upload/download was verified byte-for-byte, along with export/import round trips. The fixture was independently read with pypdf: one page containing “TEST FIXTURE ONLY - NOT TEACHER EVIDENCE”. It is not supplied teacher evidence.
- Six weekly PDF slots, four document sections/six slots, removal, invalid PDF signatures, oversized PDFs, unsafe imported URLs and blank-state hiding are exercised.
- Thirty uploaded photos and three actual WebM clips were imported/exported without data loss. A clip was actually played and paused. Caption, image description/details, gallery modal/focus handling and photo/video removal are exercised.
- Mobile tests cover all public chapters at 390/320 px, and a populated 30-photo/3-video gallery at 320 px, including video elements with a 1920px width attribute. No horizontal overflow.
- Philosophy and Grade 6/Grade 9 profile introductions preserve blank-line paragraph divisions; literal script-like text remains escaped, with no injected script element.
- School-logo blank state, actual upload, clearing, and rejection of unsafe local picture paths are exercised. No genuine logo is included in default content.
- Original fourteen-chapter JSON export and actual original-format IndexedDB saved draft both migrate to twelve active chapters. Custom copy and uploaded legacy gallery photos survive; the archive round-trips.
- Existing publishing/security tests are retained: Unicode bytes, no stored token, no anonymous write, stale-base/SHA conflicts, explicit reload, HTTP 401/403/404/409/422 errors, failed network/verification, action locking, local storage failure, persisted drafts and unchanged public content. GitHub writes in these tests are intercepted Playwright responses, not actual GitHub operations.

Formatting: `npx prettier --check *.html *.css *.js tests/*.cjs resources/*.html resources/*.css` — **all matched files pass**. `content.js` remains intentionally excluded so its assignment stays JSON-parseable.

Whitespace: `git diff --check` — passed.

Resource generation: `python tests/generate-resources.py` — **Created 7 genuine printable sample resources**. Verified that `resources/sample-reflection.html` was not recreated. Retained optional templates return to Home, not a retired route; they are no longer presented as active uploaded evidence.

Captures: `node tests/capture-all.cjs` — **24 captures for 12 chapters**. Parsed `screenshots/all-pages/manifest.json` and verified each listed file exists and no removed chapter is listed.

## RED → GREEN evidence

Each implementation slice was preceded by a failing regression, followed by a passing run. Observed missing behavior included: 14 rather than 12 routes; absent separate class profiles; no PDF upload controls; absent Add photo control; missing migration schema; overflow from wide videos; broken empty logo preview; missing aggregate limit on fixed-image uploads; obsolete routes in capture tooling; and misleading session-only preview wording.

A real maximum-media run exposed browser sessionStorage quota exhaustion. The implemented fallback stores large previews locally in origin/path-scoped IndexedDB; an explicit status warns that this preview cache can persist. Export/replace remains the fallback if browser storage is unavailable. A first Prettier check required a second formatting pass for the long new regression file; the final check passes.

## Review screenshots

All paths are relative to `/home/sasiru/teacher-portfolio/`:

- `screenshots/corrections-home-default.png` — actual blank-logo default Home.
- `screenshots/corrections-home-desktop.png` — migrated **test draft**, using an empty-classroom photo in the logo upload slot to prove upload; this is not a genuine logo.
- `screenshots/corrections-gallery-mobile.png` — 30 repeated test photos and 3 short black test clips, not real teacher media.
- `screenshots/all-pages/05-lesson-plans-desktop.png` — six weekly blank PDF rows.
- `screenshots/all-pages/06-my-learners-mobile.png` — separate Grade 6/Grade 9 profiles and retained shared support information.
- `screenshots/all-pages/08-testimonials-desktop.png` — four document sections, six blank PDF slots and public-privacy warning.
- `screenshots/all-pages/manifest.json` — current desktop/mobile chapter capture list.

Home, mobile populated gallery, mobile learner profiles and document sections were visually inspected. No visible overflow or broken media was found in those inspected views.

## Compatibility and remaining limits

- The active schema fixes twelve ordered route IDs. `final-reflection` is retained, with label/title **Reflective Summary**. Achievements/Evidence Hub are not public routes; the reflection journal link/file is removed.
- Complete original exports/drafts migrate on JSON-only import/restore. The full original object remains in non-rendered `legacyArchive` to avoid silent data loss. Original sample gallery illustrations are not promoted to real photos. Migrated active document slots start blank, rather than guessing old HTML resources are PDFs. Saved base content is normalised for comparison; saved SHA guards remain.
- **Non-rendered does not mean private:** legacyArchive is included in exports and would be public if deployed. Review it and remove private archived information before publication. Keep an offline original backup if removing the archive.
- No genuine school logo, classroom photos, videos, PDF documents or endorsements were supplied. New asset/document sections are honestly blank. Test fixtures live under tests/ and are excluded from deployment packaging.
- Public GitHub Pages cannot protect signed consent, signatures or minors. Both editor and public document page warn to keep originals private and use only authorised, properly redacted copies.
- Per-upload limits: photos 8 MB (resized to 1600px), PDFs 5 MB, MP4/WebM clips 6 MB. Embedded draft limit: 40 MB. Base64 adds overhead; browser quotas may be lower. Larger media can use safe local assets/resources paths, but export does not copy those local files. Large previews may persist in browser IndexedDB; clear site data on shared devices.
- Video codecs must be supported by the visitor’s browser. Native controls and descriptions/details are supplied; content owners must provide suitable speech captions/transcripts. Safari/Firefox were not exercised.
- Live GitHub publishing and deployment were deliberately not exercised; they remain subject to explicit user approval after this report.
