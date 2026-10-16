# Consumer Apps visual reference — 2026-10-13

The [October 16 rendered Apps direction and actual native captures](APPS_RENDERED_BRIEF.md) now lead the implemented composition. This board records the earlier reference; its tab order and utilities-first hierarchy are historical.

Reference board: `consumer-apps-concept-2026-10-13.png`. Generated with the built-in imagegen tool against the approved `secondary-concept-2026-10-12.png` reference. The board guides composition, native grouped surfaces, compact left-aligned app artwork, intentional cyan/pink accents, blue actions and the edge-to-edge bottom tray.

Publisher names, recipient names, app artwork and promotion on the board are illustrative. The live client uses only actual catalog metadata, promotion flags and consent recipients. Preserve the existing LearnCard navigation icon assets; the generated Home illustration is not a replacement. Families/AI Sessions/Pathways are separate feature work, not implemented tiles.

## Exact generation prompt

Use case: ui-mockup. Asset type: design reference board for the LearnCard native iOS consumer Apps section. Reference image is the already approved LearnCard Collection/Inbox/Account visual style; use its restrained native typography, accurate tiled multicolor L mark, outlined colorful icon language and edge-to-edge bottom navigation tray. Generate a polished board with three equally sized iPhone UI screens side by side, full readable screens with generous margins on a neutral backdrop. Screen 1: Apps, native segmented My apps / Discover, understated search, 'From LearnCard' with compact Data Sharing and Recognize someone tools plus a Resume Builder entry marked Web, then installed partner apps including Earth Cubs with distinctive app artwork. Bottom tray Collection, Inbox, Apps (selected rocket), Home. Screen 2: Discover selected, horizontal category navigation flush to screen edges, a single tasteful Earth Cubs editorial feature with its learning/nature artwork and a blue Get button, compact app rows below with distinct icons and short descriptions. Screen 3: native permissions review sheet for a learning app, header thumbnail left aligned and app title, readable recipient names, grouped sections 'Read from your collection' and 'Add to your collection', optional controls off unless chosen, selected-credential preview, a clear 'Agree & add app' blue CTA and Cancel. Keep chrome native and sleek, muted white flat background (no yellow page wash or green gradient), dark navy readable text, white grouped surfaces, cyan/pink/blue brand accents confined to intentional elements, SF-style typography, comfortable tappable controls, subtle depth but no glass stacking, no sales landing-page design, no gradients washing out contrast. No admin/developer portal features. Do not show Families, AI Sessions, or Pathways as already implemented. Exact prominent labels: Apps, My apps, Discover, From LearnCard, Earth Cubs, Data Sharing, Resume Builder, Web, Read from your collection, Add to your collection, Agree & add app. Illustrations and example app metadata are design-only, not proof of real partner capabilities.

## Implementation checks

- Flat adaptive page background; readable navy text and distinct white grouped surfaces in light mode, adaptive surfaces in dark mode.
- Real app icons load asynchronously with a visible placeholder and intentional fallback; text grows with Dynamic Type.
- Optional agreement controls start off, required controls remain on, and credentials are chosen explicitly.
- Catalog content and credentials are publisher content and are never translated by the native UI catalog.
- A bottom tray remains the common navigation shell. Web app content is shown in a separate in-app browser, with native account permission prompts.
