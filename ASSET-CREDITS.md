# Asset sources and licences

## Original illustrations

All SVG files in assets/ were created for this demonstration portfolio: book logo, botanical branches, paper/watercolor textures, portrait, school, lesson, values poster, group activity, teaching materials, board work, workshop, school event, reflection journal and six certificate placeholders. They contain no reference-image pixels or photographs of real teachers/students. They are editable source assets and may be used and adapted with this portfolio. Sample certificate illustrations do not represent issued credentials.

`tests/generate-assets.py` reproduces these original illustrations. It does not change the separately downloaded classroom photograph or font files.

## Illustrative empty-classroom photograph

- File: `assets/classroom-photo.jpg`
- Download source: https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1400&q=85&fit=crop
- Source service: Unsplash
- Licence reference: https://unsplash.com/license
- Purpose: visual placeholder only; this is not the teacher’s internship school or an assertion of association.
- No students or teachers are in the classroom scene. A small framed wall portrait is part of the room furnishing.
- Photographer attribution was not recovered during the direct image download; no photographer name has been invented.

Replace with an approved photo of your own classroom/desk for a personalised portfolio. The site does not contact Unsplash at runtime; this file is local.

## Local fonts

Downloaded from the Google Fonts CSS/font service, with regular, semibold and bold weights explicitly mapped in `assets/fonts/fonts.css`:

- Cormorant Garamond → PortfolioSerif: `cormorant-400.ttf`, `cormorant-600.ttf`, `cormorant-700.ttf`.
- Caveat → PortfolioHand: `caveat-400.ttf`, `caveat-600.ttf`, `caveat-700.ttf`.
- Nunito Sans → PortfolioSans: `nunito-400.ttf`, `nunito-600.ttf`, `nunito-700.ttf`.

All three are distributed under the SIL Open Font License. Full upstream copyright and licence texts are included as `Cormorant-LICENSE.txt`, `Caveat-LICENSE.txt` and `NunitoSans-LICENSE.txt` in assets/fonts/. Keep these licences when redistributing the fonts.

Upstream licence sources:
- https://github.com/google/fonts/tree/main/ofl/cormorantgaramond
- https://github.com/google/fonts/tree/main/ofl/caveat
- https://github.com/google/fonts/tree/main/ofl/nunitosans

`tests/download-fonts.py` is an optional one-time developer download utility. The production website uses only the downloaded local font files and has no Google Fonts network dependency.
