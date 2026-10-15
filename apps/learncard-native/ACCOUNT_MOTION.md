# Account transition motion

Launch, reconnect, locked, sending-code, verification and account recovery use one native motion surface rather than a grouped form with a spinner. Eight pigment blocks orbit inward and settle around the central L. After assembly, the formed mark switches to small held stop-motion poses at five frames per second: roughly ±1.6 points of translation and ±1.15° of rotation at the standard size, with less movement on the central L. Loose painted pieces float on wider, independent smooth paths in the outer corridors. Ordinary app pages keep their approved neutral backgrounds.

## Timing and ownership

- The logo assembles over roughly 1.9 seconds with staggered cubic easing. Assembly is decorative: it never delays, initiates, retries or completes an account request.
- The actual operation controls the displayed message and when the screen disappears. There is no invented progress percentage and no minimum splash duration. A fast load can leave before the animation completes.
- Initial collection loading stays on this surface until its first result/error, rather than flashing a sparse Collection. Existing loaded content remains visible during profile saves and later actions.
- A 30 fps `TimelineView` transforms cached images. It pauses offscreen, when the scene is inactive/backgrounded, with VoiceOver and with Reduce Motion. The calm variant immediately displays a fully assembled mark; no fade-in is required to read it. Foregrounding restarts the decorative assembly only.
- Status and actions sit in a contrast-safe clear area. The longer-wait caption reserves its geometry to avoid jumping when it becomes visible. Long translations and accessibility text sizes scroll; the mark never mirrors in RTL.
- Existing error/retry, pending-code guidance, scan, Continue and sign-out behavior stays available in the appropriate states. Recovery secrets are cleared by the existing lifecycle handlers. Motion owns no authentication keys, profile mutations or credential operations.

## iOS system launch

The system launch screen has a matching light/dark canvas and static mark. The live assembly starts in SwiftUI once app code runs. No animation is attempted in the system launch screen. See [Apple’s launch-screen configuration](https://developer.apple.com/documentation/xcode/specifying-your-apps-launch-screen) and [launching guidance](https://developer.apple.com/design/human-interface-guidelines/launching).

## Artwork and source

`design/account-motion-storyboard-2026-10-15.png` is the built-in image-generation composition reference. The eight original soft mosaic shapes and the central L are derived from the existing editable painted-mark SVG. `scripts/prepare-motion-artwork.ts` creates nine separate vector image assets, a static launch mark and the adaptive launch color. Run it explicitly when changing the artwork; generated assets are committed, so CI does not require the image-generation service.

`design/watercolor-pigment-source.png` is a generated grayscale watercolor material; the asset script packs it to 512 pixels for reuse. `PigmentTile` masks that material to each original colored shape and varies its orientation. The letter remains untextured. After user review the final palette uses more saturated Colorful hues, an 80% edge-accent opacity and a lighter 20% pigment overlay; do not copy the softer storyboard palette back into the app. The storyboard’s hand-drawn annotation arrows, slogans and fully painted paper backdrop are composition references only; they are not shipped UI.

- `ios/NativeCore/Sources/LearnCardNativeCore/BrandMotion.swift`: deterministic normalized transforms and animation policy.
- `ios/Sources/AccountTransitionView.swift`: native layout, timeline, texture masks, mode copy and accessibility.
- `AccountSignInView.swift`: operation-driven routing and the calmer matching sign-in/recovery header.
- `LearnCardNativeApp.swift`: DEBUG-only `--motion-review launch|reconnect|locked|sending|verifying|recovering` previews. Add `--motion-settled` to review the ongoing motion without assembly, or `--motion-reduced`, `--preview-dark`, `--locale ar` or `--large-type` for review without touching a live account.
- `ios/Info.plist`: static system-launch configuration.

## Verification and limits

Core tests check final logo positions, staggered assembly, held and changing settled poses, bounded jitter, visible floating paths outside the copy, finite transforms, time-independent Reduce Motion, lifecycle/VoiceOver gating and localized status copy. Simulator checks compare the actual mark pixels over time, prove the Reduce Motion mark remains still, and review Arabic accessibility layout. Production recovery/background/sign-out/pending-claim checks cover the routing change.

Physical device energy/frame pacing, the OS-controlled cold-launch snapshot and a human VoiceOver review remain manual checks. Preview/debug flags do not prove real sign-in or credential mutation. Existing SDK, Keychain, claim journals and background disposal contracts remain unchanged.
