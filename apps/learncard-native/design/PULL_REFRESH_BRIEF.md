# Painted pull-to-refresh — October 17, 2026

The standard gray refresh wheel is replaced on Home, Passport, Inbox and Apps with a compact painted mosaic. The [generated motion board](pull-refresh-concept-2026-10-17.png) guides the feel; shipping artwork reuses the original editable painted logo assets, never crops from the board.

## Interaction contract

- Pulling gently stretches the nine small tiles; their geometry responds to the actual overscroll distance. The native control decides when a pull triggers refresh.
- During actual work, a diagonal ripple lifts the tiles in turn. The center L stays readable. The localized status says **Refreshing…**, with no invented percentage or success claim.
- The refresh completes as soon as its existing async action completes. Native scroll behavior collapses the space. A short pull does not trigger work; no decorative completion delay is added.
- Reduce Motion and VoiceOver retain the fully assembled, still mark and status. VoiceOver receives a localized announcement when actual refresh begins; the system refresh action stays available. Animation pauses offscreen and while the scene is inactive. The status supports English, Spanish, French and Arabic, with mirrored label layout and a stable logo orientation.
- Keep SwiftUI `.refreshable`, including its accessible action. A content anchor finds only its enclosing public `UIScrollView` and decorates its `UIRefreshControl`. Native gesture recognizers, content insets, refresh lifetime and scroll geometry remain owned by the system. No global appearance overrides or private class names.
- The page-level credential status and cross-tab sample strip continue to describe their actual operations. This is a compact refresh treatment, not a replacement for error/retry or permission review.

The small implementation intentionally omits the board's long trails, oversized release pose and decorative swoosh. At roughly 44 points, clear pigment tiles and a traveling ripple read better than layered effects, fit the native refresh area and avoid crowding the header.

Keep operation presentation in a stable reference observed only by the artwork child. Updating value state on the scroll owner, or observing the operation in an outer accessibility modifier, can replace the native refresh action and cancel its read. The UIKit artwork uses `UIHostingConfiguration`, with tint/observation cleanup. Refresh-control subviews are omitted from SwiftUI's accessibility tree; do not add invisible duplicate elements to obtain test handles. XCTest waits for native refresh to finish before returning from a pull, so test awaited reads, retry and returned geometry there. Verify active artwork from actual simulator recordings, without assuming a fixed system refresh height.

## Native evidence

- [Actual pull/ripple clip](pull-refresh-native.mp4), from the isolated demo app running the production rendering. The probe's old height assertion was later replaced with a completion check; the clip shows real motion, not a staged progress state.
- [Home during refresh](pull-refresh-home-native.png) and [after the read completes](pull-refresh-finished-native.png).
- [Actual Arabic dark accessibility3 with Reduce Motion](pull-refresh-arabic-accessibility-native.png). This is an enlarged accessibility stress test, not the default Arabic type size.
- [A failed read keeps cached credentials and inline retry](pull-refresh-retry-native.png).

The board below is generated with built-in image_gen; these captures and the clip are actual simulator output. [Exact verification and boundaries](../TESTING.md#painted-pull-to-refresh--october-17-2026).

## Generated reference

Generated with the built-in image_gen tool, using `home-recent-deck-native.png` as a composition/style reference. Prompt:

```text
Use case: ui-mockup
Asset type: motion design storyboard for LearnCard native iOS pull-to-refresh
Primary request: Design a delightful compact pull-to-refresh animation using LearnCard's nine soft watercolor mosaic squares. Make one polished landscape board with four equal frames, each showing just the top of an iPhone app (no phone hardware), from header through Home title. Frames: 1 PULL: a few tiny colored tiles gently stretch down with the finger; 2 RELEASE: the tiles draw into a compact 3x3 mosaic; 3 REFRESH: a small playful traveling ripple passes through the colored tiles, with short colored line accents, status 'Refreshing…'; 4 READY: the mosaic settles, the refresh space collapses and content is ready.
Input images: reference image is the current LearnCard Home screen; preserve its calm native visual language and header, but explore only the compact refresh area between header and page title.
Scene/backdrop: pale lavender/offwhite #EFF0F5, substantial navy #18224E native SF-style type, existing LearnCard header with painted mosaic and compact Add/profile pill.
Style/medium: high fidelity native app UI with tactile painted pigment tiles; rounded imperfect squares, rich teal, mint, cyan, lime, blue, yellow, pink, violet. Small and crisp on screen. Hand-drawn three-ray accents, sparse.
Composition: four top-of-app crops side by side. Refresh motif roughly 44 points, never a hero or large full-screen loader. Keep label secondary. At rest no refresh ornament occupies space.
Constraints: preserve recognizable LearnCard 3x3 mosaic with white center L; movement should feel springy, controlled and clear. No gray spinner, gradients, new mascot, progress percentages, giant logo, 3D panel shadows, arrows circling a logo or confetti explosion. Use art for a design reference; final implementation will be SwiftUI/UIKit motion.
```
