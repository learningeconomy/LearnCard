# Native loading feedback — October 23, 2026

The refresh sky keeps its existing flat scenes, visitors, stars and rare cow cameo. Its reveal now uses only the visible space above the scroll content. The artwork no longer assumes that the full system refresh-control frame is clear of the page heading during native release/collapse. A continuous exposed-height fade softens the first and last portion of the reveal. Drawing retains its full control size while the clipping aperture moves, instead of squashing clouds/visitors into each partial height.

[BrandRefreshScrollView](ios/Sources/BrandRefreshScrollView.swift) converts the actual scroll viewport and content anchor into the public UIKit control coordinates. [RefreshReveal](ios/NativeCore/Sources/LearnCardNativeCore/LoadingPresentation.swift) intersects those bounds above the content and computes opacity. No fixed refresh height, manual content inset, added page spacer, pan recognizer or viewing delay is introduced. SwiftUI's refresh action/VoiceOver announcement and existing lifetime remain. Keep operation observation isolated below the ScrollView modifier; observing it on the scroll owner previously cancelled reads.

## Shared inline loading

[BrandProgressStyle](ios/Sources/BrandProgressStyle.swift) replaces SwiftUI's indeterminate spinner with three small outlined teal, pink and yellow tiles in a staggered wave. It is deliberately separate from the logo and sky scene. Contextual text sits beside the glyph with leading alignment and wraps for large text/RTL. Existing mini/small contexts use a smaller glyph; fixed image geometry remains. The style is installed at the app root, so buttons, rows, image placeholders, account preparation and standalone statuses share one treatment.

The wave is bounded, not progress. Its timeline pauses when the view disappears or the app is inactive, and remains still for Reduce Motion/VoiceOver. Label-free indicators retain a localized loading label; existing explicitly hidden decorative indicators stay hidden. Determinate progress, including real sample synchronization counts, keeps the system linear bar and its actual fraction. No operation duration, success state or backend behavior changes.

On the career screen, first availability checks use a leading inline status. A recheck with existing data uses the existing search button's busy state, preserving the search/results layout. Search already has contextual busy feedback in that button, so its duplicate standalone spinner is removed. Other bespoke placement refinements can be addressed against concrete manual-test examples; the shared style does not claim a complete spacing audit of every screen.

## Simulator compatibility

The installed Xcode 27.1 iOS 27.1 runtime reports only iPhone Duo in its supported device types. The globally installed iPhone 17 Pro type cannot be created with that runtime. [simulator.sh](scripts/simulator.sh) now chooses from the selected runtime's actual supported iPhone types, preserving preferred ordinary devices when compatible and accepting newer types without selecting an incompatible global entry. Existing named available devices and explicit IDs retain their normal reuse behavior.

No account reset, login/credential/consent write, provider enablement, TestFlight change or hosted native CI is part of this visual pass. Native fixture evidence and exact local checks are recorded in [TESTING](TESTING.md).

## Actual native review

The [Home pull/release clip](design/sky-refresh-reveal-native.mp4) is cropped from a real native gesture on the iOS 27.1 simulator. It shows the opening/closing aperture, moving clouds/cows and the heading remaining below the strip. This is a deliberately slow in-memory read fixture; production timing is unchanged. The crop excludes the Duo simulator’s separate system-status area and lower page.

![Native refresh during collapse; the heading remains below the sky](design/sky-refresh-reveal-native.png)

The following iOS 18.1 captures use an isolated DEBUG loading gallery with the production progress style. They compare standard English with Arabic dark accessibility3/Reduce Motion; the Arabic image is an accessibility stress test, not the default Arabic text size. The English bar shows actual 40% fractional progress.

| Standard English                                                    | Arabic accessibility / Reduce Motion                                                                   |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| ![Native inline loading examples](design/inline-loading-native.png) | ![Native Arabic accessibility loading examples](design/inline-loading-arabic-accessibility-native.png) |

The gallery opens only with `--demo --loading-gallery`. It performs no provider or account operation. Exact test results and installation limits are in [TESTING](TESTING.md#loading-feedback--october-23-2026).
