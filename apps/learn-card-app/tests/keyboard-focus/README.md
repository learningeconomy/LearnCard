# Keyboard and focus review

This standalone fixture uses the shared KeyboardFocusManager and the app's real
styles without authentication or backend calls. With the frontend running:

```sh
node tests/keyboard-focus/check.mjs
```

The check runs Chromium and WebKit with a simulated visual viewport reduction,
covering the last field, switching focused fields, a composite field's rounded
focus ring, preserving custom ring thickness, ignoring simulated pinch zoom/panning,
and restoring the modal on dismissal. It also renders the real Resume
Builder toolbar and Summary field at 320, 375, 430, and 1280px, checking touch
targets, horizontal overflow, header position, closed desktop panel spacing, and the Summary focus ring.
Screenshots go to the system temporary directory; set `KEYBOARD_REVIEW_OUTPUT`
to an existing directory to retain them elsewhere. Native geometry and event
handling tests live in `packages/learn-card-base/src/components/keyboard/`.
These browser checks supplement a real software-keyboard pass; they do not emulate
the operating system's keyboard animation or autocorrect.

For a native review, disable the simulated hardware keyboard and enable the
software keyboard in the Simulator's Keyboard menu (under Device in Xcode's
Device Hub, or I/O in older Simulator versions).
In Resume Builder, try the personal-details panel, decorated Location/LinkedIn
fields, long summaries, inline editing, and adding a self-attested item. Switch
between bottom fields without dismissing the keyboard. Repeat in a few other
modals and check that the focused field stays above the keyboard and action bar,
the background does not scroll, and each field has one focus ring following its
visible border. Verify dismissal restores the full modal and keyboard Tab still
shows focus. The shared dialog's backdrop should not acquire a rectangular outline.
In Resume Builder, the navigation and Preview / Publish (or Save) controls should
stay above the scrollable resume while editing. Expand About publishing to read
the publishing notices, and check that history, download, and sharing still work.
Viewport panning does not re-reveal the focused field; focus and resize events do.
Oversized textareas remain anchored at the top. Tracking a caret near the end of
an overflowing textarea is not covered by the current reveal geometry.

The review build can use a local frontend with the production tenant config.
Sign-in and saved changes then use the production services. The standalone
fixtures are available at `/tests/keyboard-focus/form.html` and
`/tests/keyboard-focus/resume.html` on the local server.

## Native keyboard animation

`animation.html` is a backend-free native fixture with a full-height Ionic page,
Search and Lower field inputs, and a Dismiss keyboard button. Load it from a
local frontend in a Debug Simulator shell with Capgo auto-update disabled. Keep
the software keyboard enabled. `?focusManager=0` disables only the shared focus
manager for an A/B comparison with Capacitor's own resizing.

For a repeatable native recording, with that Debug shell installed and pointing
to the fixture, run from this app directory:

```sh
ruby tests/keyboard-focus/native/review.rb <Simulator-UDID> /tmp
```

This uses the CocoaPods `xcodeproj` gem to generate an isolated XCTest runner in
a temporary directory, opens and dismisses the real software keyboard twice,
and retains a native MP4 plus XCTest results there. No account is needed. Inspect
the video at reduced speed: the page should fill the exposed space during both
keyboard animations without the old half-second white rectangle. These checks
exercise iOS itself; the browser script cannot prove native animation timing.
The Swift test verifies keyboard interaction, not pixel correctness. Review the
recording as well.

The iOS fix is a version-specific Bun patch to `@capacitor/keyboard@8.0.6`.
Native mode follows a UIKit animation guide on opening; dismissal restores the
full WebView before the keyboard exposes it, avoiding WebKit's asynchronous
paint lag during expansion. The shared focus manager still reveals covered
fields, but does not impose a second host height in iOS native resize mode.
Browser and native overlay mode retain their viewport sizing fallback. Revisit
the patch when upgrading this dependency; it requires rebuilding the native
binary and cannot be delivered by a frontend-only OTA update.
