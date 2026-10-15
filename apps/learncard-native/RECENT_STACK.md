# Recent credential stack

October 15, 2026. Collection’s **Latest issued** section browses up to five actual credentials in the current category, ordered by issue date. Family records remain separate. Equal dates preserve existing collection order; duplicate IDs cannot occupy multiple positions. This is read-only browsing, not dismissal, deletion or a change to personal indexing.

## Interaction and appearance

- In left-to-right layouts, swipe left for an older credential and right for a newer one. Arabic reverses the physical direction. Newer/Older controls and a position/dot indicator provide the same bounded navigation. The stack stops at either end.
- The active card follows a horizontal drag with a slight rotation. A completed swipe tosses that card beyond the screen edge, then the underlying credential settles forward. Short drags and attempted movement beyond an end spring back. Vertical intent is rejected before horizontal recognition, preserving Collection scrolling.
- The date changes with the active card. Tapping opens that exact credential, and returning from detail retains its position. Category changes and leaving search reset the stack to the newest eligible record. A collection refresh retains the active record if it remains in the latest five; otherwise it resets to the first.
- Covered cards keep contrasting Colorful sleeves, avoiding a pink-on-pink accent stack. Each uncovered card shows its own category color and supplied/fallback artwork. There are at most two visible covered layers, and no fabricated layers when a category has one credential.
- The ordinary list/grid omits only the currently active card, keeping every other loaded credential accessible. Background stack cards are hidden from hit-testing/VoiceOver and are not duplicate zoom sources.

The first stack comes from the currently loaded personal-index pages. If more pages remain, the caption says **Latest among loaded credentials**. Browsing this stack does not trigger an expensive whole-account scan. Use Load More to include later pages. This preserves the existing Collection boundary; the sharing picker has its own automatic filtered paging.

## Motion, accessibility and lifecycle

The horizontal pan uses iOS 18’s `UIGestureRecognizerRepresentable` and a delegate that refuses vertical intent. Fast intentional flicks and longer drags advance; a small accidental horizontal movement does not. The toss takes about 220 ms, followed by a short spring settlement. Input is serialized during settlement. Width-relative thresholds are bounded for different logical screen widths.

Reduce Motion switches the browsing position immediately with no drag transform or throw. Newer/Older targets are at least 44 points, with localized labels and VoiceOver custom actions. Single-card categories omit redundant controls. Six new String Catalog keys cover English, Spanish, French and Arabic, including formatted positions.

Leaving the screen, scrolling the stack out of view, backgrounding or changing Reduce Motion invalidates pending animation completions and resets transient drag state. A cancelled completion cannot advance another category. This stack has no ambient timeline animation. Credential **detail** retains its separate automatic nine-second tilt/sheen and isolated card.

## Source and regression landmarks

- `ios/NativeCore/Sources/LearnCardNativeCore/RecentCredentialDeck.swift`: latest-five selection, bounded cursor/reconciliation and horizontal-intent/commit rules.
- `ios/Sources/LatestCredentialStack.swift`: layers, toss/settlement, native horizontal recognizer, lifecycle cancellation, controls and navigation.
- `ios/Sources/CollectionView.swift`: category/search/list integration; passes at most five records so drag frames do not sort a large collection.
- `RecentCredentialDeckTests.swift`: category filtering, date order, deduplication, five-record cap, unchanged payloads, cursor bounds/refresh, vertical/short/fast gestures and RTL.
- `RecentDeckLocalizationTests.swift`: all four locales and position placeholders.
- `RecentStackUITests.swift`: actual swipes in both directions, bounds, active-card navigation/return, short-drag cancellation, vertical scrolling, search/category reset and Arabic Reduce Motion.

All new tests are discovered by the existing branch CI. See [TESTING](TESTING.md) for actual evidence; synthetic samples do not mutate a real collection.
