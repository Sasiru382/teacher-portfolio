# Local requested-correction verification

## Outcome and scope

Implemented locally on `main` at `60ea9f6`. No commit, push, branch switch, PR, merge, publication or remote operation was performed. Publishing tests intercept GitHub requests locally; they do not contact/write GitHub.

- Reflective Summary (`final-reflection`) now reuses the existing escaped paragraph renderer for its Introduction and each Paragraphs body field. Blank lines produce separate paragraphs in public HTML and editor preview. Header structure/decoration remains; the editor retains its keyboard-accessible multiline textarea.
- Testimonials now has three sections/four PDF slots: observation forms (2), timetable (1), completion letter (1). The principal/teacher consent section is removed from default content and editor/public views. Guide and README describe only the remaining slots and explain migration/privacy.
- Twelve routes, three video clips and the 15 MiB per-PDF limit are unchanged. The later aggregate-budget change raises the local content budget to 100 MiB compact-JSON UTF-8 bytes; see `AGGREGATE-VERIFICATION.md`. No actual teacher content was supplied or invented.

## Executed checks

Final `npm test`: **9 Node tests passed; 53 Chromium Playwright tests passed; 0 failed**.

`node node_modules/prettier/bin/prettier.cjs --check '*.html' '*.css' '*.js' 'tests/*.cjs' 'resources/*.html' 'resources/*.css'`: all matched files pass. This is the configured source scope; generated JSON-shaped `content.js` remains intentionally ignored. `git diff --check`: passed.

New targeted coverage:

- Introduction edited with actual Enter/Enter keyboard input, export, JSON-only import, Save draft, reopen, preview and exported content loaded as the ordinary public baseline. Blank-line body paragraphs also split; script/image-like markup displays literally and creates no injected elements.
- Current default and old deployed twelve-page content render only three sections/four slots; the old-baseline editor/export also removes consent.
- Previous exports with every section/file title customised preserve every other field, six lesson PDFs, four remaining evidence PDF byte strings, custom copy, photo metadata and clips. All four remaining evidence downloads match genuine synthetic PDF fixture bytes through import/save/reopen/preview.
- Actual original-format twelve-page IndexedDB records are restored, not merely newly saved migrated drafts. Custom embedded photo/video data survives. Saved base is normalised independently from the edited draft; the original SHA survives save/reopen. Matching old remote base passes comparison; changed SHA with identical normalised content still triggers a conflict and no write.
- Reopening exported content as the loaded baseline still accepts previous-format imports. A deployed archive-bearing baseline does not require incoming drafts to contain an archive.
- Known consent sections inside legacyArchive are discarded, not hidden in a deployed archive. Existing fourteen-page import and original stored-draft migration tests still pass.

The full suite also verifies the unchanged 30-photo/3-video limits, playback, file/HTTP routes, all weekly PDF bytes and size boundaries, responsive layouts, local-only public assets, email configuration, draft isolation/storage fallback, mocked publishing conflict/error/read-back behavior, and automated axe checks. Automated accessibility checks are not full accessibility certification.

## RED → GREEN evidence and issues

- Before renderer changes, the new summary test failed because `.page-intro p` had 0 paragraphs instead of 2. After reusing the existing escaped paragraph helper, it passed.
- A short imported Reflective Summary body field initially became a single-line INPUT. Its targeted regression failed with INPUT rather than TEXTAREA; all Reflective Summary paragraph entries now stay multiline regardless of current length, avoiding newline loss on re-edit.
- A mobile screenshot initially captured the sidebar halfway through its desktop-to-mobile slide-out transition. The capture now waits for the sidebar rectangle to leave the viewport and asserts no horizontal overflow.
- Before consent/schema changes, all three migration regressions failed: old sections were retained, the default was `[2,2,1,1]` instead of `[2,1,1]`, and archived consent remained. They passed after structural migration/default changes.
- A further old-deployed-baseline regression failed with four public sections instead of three; normalising loaded public/editor baselines made it pass.
- The first full run exposed an existing dynamic-email regression because normalisation cloned the public global content. Assigning the normalised loaded baseline back to the same public global restored the existing behavior; final full run passes.
- A new saved-draft test initially reloaded before the asynchronous save completed. It now waits for the explicit “Draft saved” status before reopen/read-back.
- Broad shell-expanded formatter commands hit the tool lifecycle scan budget. Direct Node invocation with quoted globs completed the same configured formatting check; no dependency or runtime workaround was added.

## Screenshots

Paths relative to `/home/sasiru/teacher-portfolio/` (generated/ignored verification artifacts, not deploy files):

- `screenshots/requested-summary-preview.png` — separate introduction/body paragraphs and literal escaped test markup, desktop.
- `screenshots/requested-summary-mobile.png` — exported content as public baseline, mobile.
- `screenshots/requested-testimonials-default.png` — actual current default, three blank sections/four slots.
- `screenshots/requested-testimonials-editor.png` — old content loaded into editor, only four remaining upload controls with customised labels.
- `screenshots/requested-testimonials-preview.png` — migrated test PDFs, only Custom section 0/2/3; section 1 is removed.

Desktop summary and migrated Testimonials screenshots were visually inspected: paragraph separation, heading/decoration and remaining PDF sections are visible without clipped content. Test screenshots use explicitly synthetic copy/media, not teacher evidence.

## Compatibility, privacy and limitations

Migration identifies the fixed old second section by the known four-section `[2,2,1,1]` structural layout, never by editable labels. It deliberately drops that section, including embedded consent PDF bytes, from active content and recognised nested legacyArchive portfolios. It preserves the other data and rejects malformed active fixed-slot layouts. Keep the original export offline as the private backup. Import/restore/initial editor messages and the guide disclose this intentional deletion.

The original fourteen-page archive mechanism remains for other displaced copy. Archives are still public if deployed: inspect them for unrelated private data. The cleanup is not a general document-content redactor and cannot detect consent copied into arbitrary custom fields or otherwise repurposed slots. It cannot erase an already deployed old content.js, repository history, previously saved browser data or standalone asset files; those require separate review/removal. Restoring does not silently overwrite the old stored browser record; explicit Save draft stores the migrated version.

No teacher-supplied updated content.js or private PDFs/videos were available. Verification uses synthetic fixtures. Browser coverage is Chromium, not Safari/Firefox. No live publishing/deployment was attempted; user approval is still required for any future remote action.
