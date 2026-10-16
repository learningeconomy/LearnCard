# Account transition motion

Launch, reconnect, locked, sending-code, verification and account recovery use one native motion surface rather than a grouped form with a spinner. The painted mark starts fully visible in the system launch pose, opens gently and gathers around the central L. After assembly, the formed mark switches to small held stop-motion poses at five frames per second: roughly ±1.6 points of translation and ±1.15° of rotation at the standard size, with less movement on the central L. Loose painted pieces fade in and float on independent smooth paths in the outer corridors. Ordinary app pages keep their approved neutral backgrounds.

## Timing and ownership

- The logo assembles over roughly 1.9 seconds with staggered cubic easing. Assembly is decorative: it never delays, initiates, retries or completes an account request.
- The actual operation controls the displayed message and when the screen disappears. There is no invented progress percentage and no minimum splash duration. A fast load can leave before the animation completes.
- Initial collection loading stays on this surface until its first result/error, rather than flashing a sparse Collection. Existing loaded content remains visible during profile saves and later actions.
- A 30 fps `TimelineView` transforms cached images. It pauses offscreen, when the scene is inactive/backgrounded, with VoiceOver and with Reduce Motion. The calm variant immediately displays a fully assembled mark; no fade-in is required to read it. Foregrounding restarts the decorative assembly only.
- Status and actions sit in a contrast-safe clear area. The longer-wait caption reserves its geometry to avoid jumping when it becomes visible. Long translations and accessibility text sizes scroll; the mark never mirrors in RTL.
- Existing error/retry, pending-code guidance, scan, Continue and sign-out behavior stays available in the appropriate states. Recovery secrets are cleared by the existing lifecycle handlers. Motion owns no authentication keys, profile mutations or credential operations.

## iOS system launch

An explicit `LearnCardLaunch.storyboard` replaces the automatic launch composition after the user reported a black, flat-logo frame before the painted light loading view. It uses the same adaptive canvas and textured painted mark as SwiftUI. The generator reads maximum width, responsive width fraction and vertical position from `BrandMotion.swift`; the running view uses those same metrics and preserves the logo position between launch/reconnect. The first animated frame has every tile fully visible in its assembled position, so it does not remove the system's logo before assembling again. Background pieces and status copy enter gently. Accessibility layouts use a smaller mark and remain scrollable.

No animation is attempted in the system launch screen and no minimum splash duration is introduced. See [Apple’s launch-screen configuration](https://developer.apple.com/documentation/xcode/specifying-your-apps-launch-screen) and [launching guidance](https://developer.apple.com/design/human-interface-guidelines/launching). The actual OS cold-launch handoff remains distinct from a SwiftUI review preview. The opening bloom is bounded above the status copy.

The black launch frame had a concrete asset cause: the source alpha string `"1"` compiled to `1/255`, leaving the launch canvas almost transparent. Use decimal `"1.000"`. `scripts/verify-launch-assets.ts` now inspects the **compiled** catalog for exact opaque light/dark RGBA, the launch configuration and compiled storyboard. Manual CI runs it after Debug and Release builds. The disposable simulator also retained a stale launch snapshot after uninstall/reinstall; restarting that test simulator exposed the corrected canvas. Preserve the real review account when checking launch caching; do not uninstall it. See Apple's [launch debugging guidance](https://developer.apple.com/documentation/technotes/tn3118-debugging-your-apps-launch-screen).

## Artwork and source

`design/account-motion-storyboard-2026-10-15.png` is the built-in image-generation composition reference. The eight original soft mosaic shapes and the central L are derived from the existing editable painted-mark SVG. `scripts/prepare-motion-artwork.ts` creates nine separate vector image assets, a textured static launch mark, adaptive launch color and launch storyboard. Run it explicitly when changing the artwork; generated assets are committed, so CI does not require the image-generation service.

`design/watercolor-pigment-source.png` is a generated grayscale watercolor material; the asset script packs it to 512 pixels for reuse. `PigmentTile` masks that material to each original colored shape and varies its orientation. The letter remains untextured. After user review the final palette uses more saturated Colorful hues, an 80% edge-accent opacity and a lighter 20% pigment overlay; do not copy the softer storyboard palette back into the app. The storyboard’s hand-drawn annotation arrows, slogans and fully painted paper backdrop are composition references only; they are not shipped UI.

- `ios/NativeCore/Sources/LearnCardNativeCore/BrandMotion.swift`: deterministic normalized transforms and animation policy.
- `ios/Sources/AccountTransitionView.swift`: native layout, timeline, texture masks, mode copy and accessibility.
- `AccountSignInView.swift`: operation-driven routing and the calmer matching sign-in/recovery header.
- `LearnCardNativeApp.swift`: DEBUG-only `--motion-review launch|reconnect|locked|sending|verifying|recovering` previews. Add `--motion-settled` to review the ongoing motion without assembly, or `--motion-reduced`, `--preview-dark`, `--locale ar` or `--large-type` for review without touching a live account.
- `ios/Info.plist`: static system-launch configuration.

## Verification and limits

Core tests check final logo positions, staggered assembly, held and changing settled poses, bounded jitter, visible floating paths outside the copy, finite transforms, time-independent Reduce Motion, lifecycle/VoiceOver gating and localized status copy. Simulator checks compare the actual mark pixels over time, prove the Reduce Motion mark remains still, and review Arabic accessibility layout. Production recovery/background/sign-out/pending-claim checks cover the routing change.

Actual cold-launch videos on the disposable iOS simulator verify the corrected system canvas in both appearances. Physical-device cold start, energy/frame pacing and a human VoiceOver review remain manual checks. Preview/debug flags do not prove real sign-in or credential mutation. Existing SDK, Keychain, claim journals and background disposal contracts remain unchanged.
