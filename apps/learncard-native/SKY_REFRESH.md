# Local-time sky refresh

October 18, 2026. Home, Passport, Inbox and Apps replace the compact weave/visible refresh label with a full-width flat sky illustration. The shared header remains the only LearnCard logo. The approved [concepts and exact imagegen prompts](design/SKY_REFRESH_BRIEF.md) guide the drawing; generated UI pixels are not bundled into the app.

## Local time and greetings

Home uses the device's local calendar/timezone and the web dashboard's greeting schedule. It updates while visible, when returning to the foreground and after significant clock/timezone changes. A missing/blank profile name uses the unnamed greeting. Named greetings isolate the person's text for mixed Arabic/Latin direction.

| Local time  | Home greeting  | Refresh scene                       |
| ----------- | -------------- | ----------------------------------- |
| 00:00–05:59 | Hello          | Night, crescent/stars/UFO           |
| 06:00–11:59 | Good morning   | Morning, sun/clouds/bird            |
| 12:00–17:59 | Good afternoon | Afternoon, clouds/colored balloon   |
| 18:00–20:59 | Good evening   | Dusk, setting sun/first stars/plane |
| 21:00–23:59 | Good evening   | Night, crescent/stars/UFO           |

These are illustrative time periods, not a weather or astronomical-sunset claim. No location or weather request is added. Sky colors follow the clock independently of the app's light/dark appearance. English, Spanish, French and Arabic have named/unnamed greetings.

## Drawing and motion

The strip fills its actual native refresh-control bounds. It adds no permanent page space, horizontal inset, extra gesture recognizer or manually imposed scroll inset. Native scrolling controls its reveal and collapse. Scene drawing clips to those bounds; visitors scale to the available height.

Simple flat shapes provide layered pill clouds, a bird, a colored balloon, a plane and a small UFO. Morning/afternoon add a couple of small distant bird silhouettes; afternoon has a small sun partly behind its distant cloud. A shared 3.6-second sine wave rolls through clouds, sun/moon and visitors, with staggered phases and small offsets. The dusk horizon gently follows it. All main visitors, including the second cow, travel left to right through the same 26-second loop, twice the original speed; wrap points remain outside the viewport. The bird has a small wing motion. Each visitor starts in a complete visible pose.

Stars keep fixed anchors in dusk and night: their brightness twinkles independently, with no sine-wave displacement. Night has thirteen stars and two short, straight shooting-star opportunities per eleven-second cycle. Dusk has five first stars and a small eight-ray firework bloom on alternate sides, with quiet gaps. Streaks and blooms fade in/out locally without lighting up the whole strip. At the still first pose there is no streak or bloom; Reduced Motion/VoiceOver show stationary stars and skip these accents. No second mosaic, arbitrary blocks, visible refresh words, progress percentage or illustrated success claim appear.

The scene and visitor are latched for the pull/release/refresh cycle, including a time-period boundary. They are not chosen on animation frames. Animation runs at up to 30 fps only during visible active refresh work. On completion it holds its last pose while the native space collapses. Offscreen/inactive animation pauses. Reduce Motion and VoiceOver keep a still scene; the existing native accessible refresh action and spoken refresh-start announcement remain.

Refresh finishes as soon as the existing async action finishes, including fast reads and failures. There is no minimum viewing delay. Page-level sync/error/retry feedback and cached credentials retain their existing behavior.

## Rare cow cameo

A rare pull replaces the usual visitor with a small spotted cow under a colored parachute. Sometimes a smaller second cow accompanies it. The sky still matches local time. The cameo is unannounced, carries no reward and changes no account state.

The in-process policy samples a uniform 0..<1000 roll: 18 values select one cow and two values select two cows (2% combined). A ten-minute cooldown is shared across all four tabs in that process. No account-linked preference or persistent viewing history is stored; restarting the process resets that cooldown. Short pulls that show a cameo count as an appearance. Selection stays steady through the cycle; the cameo never prolongs refresh.

## Source and review

- ios/NativeCore/Sources/LearnCardNativeCore/RefreshSky.swift: local day periods, cooldown/selection, cycle latching and normalized motion.
- ios/Sources/HomeGreeting.swift: isolated localized clock observation.
- ios/Sources/BrandRefreshScrollView.swift: existing native refresh action and scoped UIKit artwork host. Keep observation below the scroll owner: observing operation state on an outer modifier previously replaced/cancelled active work.
- ios/Sources/RefreshSkyView.swift, SkyVisitors.swift and SkyAtmosphere.swift: native Canvas illustration, fixed star fields, straight streaks and small dusk blooms.

Debug demo launches accept **--sky-phase morning|afternoon|dusk|night** and **--sky-cow none|one|two** for deterministic review. Both require **--demo** and compile out of Release. **--demo --sky-gallery** is an isolated gallery of the production drawing, with 72-point scene strips; it is not a staged real refresh. **--motion-reduced** keeps that drawing still. The actual gesture, lifetime and returned geometry are verified separately with the refresh UI cases.

## Native evidence

These captures use isolated demo service fixtures and the production drawing. Forced scenes/cows are Debug review settings; normal refresh chooses its scene from local time and its cameo from the rare policy.

- [Actual native pull, awaited read and collapse](design/sky-refresh-atmosphere-native.mp4), ten seconds cropped to the header/strip/Home content.
- [Cow cameo during Home refresh](design/sky-refresh-cow-home-native.png) and [dusk plane during Passport refresh](design/sky-refresh-dusk-passport-native.png), at the actual native control height.
- [All four scenes and the cameo in the isolated drawing gallery](design/sky-refresh-atmosphere-scenes-native.png), with [gallery motion](design/sky-refresh-atmosphere-gallery-native.mp4). The gallery uses 72-point strips for comparison; it does not establish native gesture geometry.

See [TESTING](TESTING.md#local-time-sky-refresh--october-18-2026) for final checks, installed-build proof and limitations. Broader changes to app sign-in, account/credential data, sharing, backend polling and native hosted CI are outside this visual pass.
