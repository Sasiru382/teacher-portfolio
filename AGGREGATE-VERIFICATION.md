# Aggregate and video budget verification (local changes)

## Outcomes

- Shared `PortfolioAssets` policy: photos 8 MiB original input (unchanged), PDFs 15 MiB original input (unchanged), videos **15 MiB original input, inclusive** (raised from 6 MiB), content **100 MiB / 104,857,600 bytes**, 30 gallery photos and 3 clips unchanged.
- Content is measured as actual UTF-8 bytes of compact `JSON.stringify(content)`, including embedded base64, all text/metadata and legacy archives. All upload aggregate checks and strict pre-/post-migration checks share the helper. Non-ASCII is no longer undercounted as UTF-16 string length.
- Import has a separate **101 MiB / 105,906,176-byte transport envelope** for the assignment/comment/whitespace. Parsed and migrated content must each fit the 100 MiB budget. Export uses compact JSON if pretty formatting would exceed the transport envelope, preserving re-importability of valid boundary drafts.
- A visible, named **Upload limits** region precedes the editor toolbar and fields, not inside either editing tab. It lists original-file caps, 30 photos + 3 clips, 1600 px resize, encoded total, roughly 70 MiB original-media planning guidance (not guaranteed), lower storage quotas, export and privacy guidance.
- README/guide explain the theoretical 75 MiB base64-only original ceiling, approximate 70 MiB planning target, re-encoded photos, archives/text overhead, memory/slowness/device quota limits, and local versus published capacity.
- Before a publish write, final serialized content.js bytes are checked independently against GitHub's 100 MiB final-file limit; oversized output is refused without a PUT. SHA/conflict checks, JSON-only imports, media allowlists/counts, fixed document slots and privacy migrations remain intact.
- Prior pending fixed-picture feedback/path synchronization and blocked-session-storage/IndexedDB preview fixes were preserved and exercised by the full suite.

## TDD and exact evidence

- RED: `tests/content-budget.test.cjs` failed on old 41,943,040-byte cap/missing shared sizing helper; new export-envelope tracer failed before implementation. GREEN: four unit cases pass, including actual 100 MiB acceptance and +1-byte refusal, Unicode/supplementary/lone-surrogate sizing, envelope compaction and both schema/migration budget checks.
- RED: `tests/aggregate-budget.spec.cjs` refused the populated large import at the former 40 MiB import cap. GREEN: runtime-generated valid, padded synthetic PDFs fill exactly **104,857,600 compact UTF-8 bytes**, with **104,861,920 exported bytes** (4,320 bytes of assignment/comment/formatting overhead). Save draft/reload, own formatted export/import and IndexedDB preview retain all five PDF data URLs exactly, verified through hashes and whole-content digest. Extra fixed PNG/PDF uploads and a +1-byte content import are rejected without changing the draft. A simulated quota/storage failure still permits an identical export. Mocked GitHub publishing refuses the oversized final file with **zero PUTs** and clears the synthetic token.
- The first four padded PDFs share SHA-256 of their complete data URL: `964faad08358bcd6e20c4ce3ddad7c958ba5aa9d90e6ce0e6e559c4a3dd313a2`. The fifth is `96d39042312e3fb940689cff1abb2dbc0cbdc6c64800212ab057f3227d3a4c07`.
- `tests/picture-regression.spec.cjs` now verifies a real PNG upload crosses the former 40 MiB cap successfully on a populated real-PDF draft, with decoded blue pixels in editor and IndexedDB preview. Old synthetic aggregate-rejection tests still reject against the shared policy; the actual 100 MiB rejection is covered above.
- `tests/lesson-pdf-limits.spec.cjs` now verifies two maximum-sized 15 MiB PDFs both fit and retain exact bytes (the old second-file rejection is no longer valid).
- RED: `tests/video-budget.spec.cjs` rejected the synthetic playable 15 MiB WebM at the former 6 MiB limit. GREEN: an animated canvas/MediaRecorder WebM, padded at runtime to **15,728,640 original bytes**, is accepted, exported with exact bytes, saved/reopened, imported and played in IndexedDB preview (`currentTime > 0`). **15,728,641 bytes** is refused atomically. Final full-suite run produced a **20,984,513-byte compact draft** and media-byte SHA-256 `5a01b5f8d879bb3d5e39feb338275df7f7a2e20347078a91fa20f21c17989b93` (recorded WebM headers/timing may vary across runs).
- RED: `tests/editor-limits-notice.spec.cjs` could not find the required top-level region. GREEN: the 375 px mobile test verifies its visibility, exact values, ordering before controls, no horizontal overflow and availability after changing tabs.

## Final checks executed

- `npm run format` completed. A second targeted Prettier pass was needed on the new video test; final configured-glob `npx prettier --check '*.html' '*.css' '*.js' 'tests/*.cjs' 'resources/*.html' 'resources/*.css'` passed.
- `npm test`: **13 Node tests passed; 66 Chromium/Playwright tests passed** (3.8 minutes browser suite). Includes automated accessibility checks, all existing picture/preview regressions, PDF boundary tests, token clearing/conflict/SHA readback tests, route/security and offline/HTTP cases.
- `git diff --check` passed.

## Scope and limitations

- All large media is synthetic and generated at runtime. No large fixture is committed or added to the working tree. Above Playwright's 50 MB in-memory-upload limit the test writes transient files under the configured scratch directory and passes file paths.
- No actual teacher photo/video/PDF was supplied to this implementation task. Synthetic WebM playback does not prove the user's own codecs/files will play. PDF padding and WebM trailing padding are boundary-test construction, not a recommendation for production media.
- Storage failure is simulated, not a claim of exhausting real disk quota. Browser performance/storage and other browsers/devices are not guaranteed at the maximum size. Text/archives can reduce the approximate original-media budget.
- GitHub's separate repository file cap includes wrapper/formatting. Its Contents API, base64 request overhead and other service limits can be more restrictive; no maximum-draft publication promise is made. Official references: https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github and https://docs.github.com/en/rest/repos/contents#get-repository-content . GitHub's browser upload UI separately limits files to 25 MiB.
- No commit, branch operation, push, PR, merge or deploy was performed by this implementation subagent. Parent handles the subsequently approved remote workflow after independent review.
