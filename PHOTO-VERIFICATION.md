# Photo selection investigation (local only)

## Confirmed outcomes

- Fixed-picture upload rejection previously updated only `#editor-status`, above the long Pictures section, and left the rejected filename selected. A valid PNG padded to 8 MiB + 1 byte reproduces the old-thumbnail/selected-filename combination shown in the screenshots. Rejection preserves the prior source; it is not a successful upload.
- Successful embedding previously left the optional local filename displaying the old asset path even though the thumbnail and draft source had changed. It now clears that field. Plain focus/blur did not restore the old source; no automatic overwrite was reproduced.
- Preview had two independent blocked-storage defects: `sessionStorage.removeItem()` throwing prevented IndexedDB writes, and `getItem()` throwing skipped IndexedDB reads and silently rendered loaded content. Both were reproduced RED before changes. The fallback now survives those exceptions and opens `?preview=1&previewStore=indexeddb#home` so a stale readable session snapshot cannot override the newer IndexedDB snapshot.
- Fixed pictures now have adjacent polite live feedback for processing, acceptance and rejection. Acceptance names the embedded file and explains Save/export versus the unchanged public website. Rejection states the reason and that the previous picture was kept. Completed/rejected file selections are cleared, including early type/size/busy rejection.
- Per-file picture limits remain unchanged: input images at most 8 * 1024 * 1024 bytes and image resize at most 1600 px. The subsequent aggregate-budget change raises `PortfolioAssets.maxContent` to 100 * 1024 * 1024 compact-JSON UTF-8 bytes, counting actual non-ASCII bytes and base64 overhead; see `AGGREGATE-VERIFICATION.md`.

## Ranked hypotheses and evidence

1. **Off-screen rejection / misleading selection:** confirmed defect, compatible with screenshot. Original file size/type/encoding and total draft size remain unknown.
2. **Preview fallback blocked or stale:** confirmed independent defects under deterministic storage exceptions. These explain stale public preview, not an already unchanged editor thumbnail.
3. **Save/Preview before decoding finishes:** existing guards work. Controlled pending `createImageBitmap()` test verifies no preview opens and Save/Preview report Wait; once decoding completes, preview pixels match the new image.
4. **Stale local filename overwrites the uploaded image:** inaccurate display confirmed and fixed; unedited focus/blur does not overwrite. Deliberate committed local-path edits still replace the source as designed.

## RED / GREEN

Before each corresponding fix, the targeted tests failed on:

- Missing `.picture-feedback` after oversized selection.
- `#path-hero` still `assets/classroom-photo.jpg` after successful decoding.
- Blocked session read rendering old `assets/classroom-photo.jpg` rather than the IndexedDB image.
- Blocked session removal reporting preview storage failure without attempting usable IndexedDB.

The new `tests/picture-regression.spec.cjs` has 10 deterministic Chromium cases covering real canvas-generated raster PNGs, decoded source/pixels, two consecutive edits/previews/reloads, Save/close/reopen, export/JSON-only import, exact 8 MiB acceptance and +1-byte rejection, corrupt raster/MIME rejection, pending decoding, full storage failure, crossing the former 40 MiB boundary with populated real PDFs and IndexedDB preview, and customised previous-export baseline with PDF/gallery/copy preservation. Whole exported content is compared after failed upload; prior thumbnail and preview pixels stay intact. All fixtures are synthetic/local, not supplied private files.

The populated fixture retains 4096 bytes of headroom below the former 40 MiB boundary before adding a larger real PNG. Under the subsequent 100 MiB UTF-8 budget this upload now succeeds; real 100 MiB rejection and rollback are covered separately in `tests/aggregate-budget.spec.cjs`. The original picture/preview fix did not itself raise limits.

One pre-existing clearing test depended on the inaccurate old path value: it typed a path and undid it before blur. With the field correctly blank after upload, that produces no change event. The test now commits an existing valid local path before clearing it, verifying actual replacement/clearing without requesting a nonexistent image.

## Final verification

- `npm test`: **9 Node + 63 Chromium Playwright tests passed, 0 failed** (includes 10 new photo regressions and all prior PDF/privacy/publishing/accessibility checks).
- `npm run format` executed; a second targeted Prettier write was needed for the new test. Final configured-scope check passed: `node node_modules/prettier/bin/prettier.cjs --check '*.html' '*.css' '*.js' 'tests/*.cjs' 'resources/*.html' 'resources/*.css'`.
- `git diff --check`: passed.
- `git diff --exit-code -- content.js assets`: passed; original content and assets unchanged.
- No commits, branch switches, pushes, PRs, merges or deployment. Publishing tests intercept network requests locally.

Screenshots (ignored artifacts, relative to repository):

- `screenshots/picture-rejected.png`: old classroom kept; inline 8 MiB rejection and cleared picker; visually inspected.
- `screenshots/picture-success.png`: changed blue synthetic thumbnail, filename-bearing inline acceptance and blank optional path; visually inspected.
- `screenshots/picture-preview.png`: changed blue synthetic hero after consecutive edits/reload.

## Limits of diagnosis

The supplied screenshots show `Untitled Design (6).png` selected, old classroom thumbnail/source, old optional local path, and no visible inline result. A selected filename alone does not establish acceptance. Neither the actual image nor the friend's latest exported `content.js` / saved draft was supplied, so this investigation cannot say whether that original selection exceeded 8 MiB, exceeded aggregate capacity, had an unsupported/empty MIME, failed decoding, or used a different browser/version. Obtain those inputs privately (review/redact portfolio evidence before sharing) to reproduce the original cause. Chromium automation is not Safari/Firefox/device coverage. Nothing here changes the deployed website.
