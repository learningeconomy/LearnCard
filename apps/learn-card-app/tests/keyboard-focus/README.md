# Keyboard and focus review

This standalone fixture uses the shared KeyboardFocusManager and the app's real
styles without authentication or backend calls. With the frontend running:

```sh
node tests/keyboard-focus/check.mjs
```

The check runs Chromium and WebKit with a simulated visual viewport reduction,
covering the last field, switching focused fields, a composite field's rounded
focus ring, and restoring the modal on dismissal. Native geometry and event
handling tests live in `packages/learn-card-base/src/components/keyboard/`.
These browser checks supplement a real software-keyboard pass; they do not emulate
the operating system's keyboard animation or autocorrect.

For a native review, open the iOS Simulator's **I/O → Keyboard** menu and disable
**Connect Hardware Keyboard** so tapping a field shows the software keyboard.
In Resume Builder, try the personal-details panel, decorated Location/LinkedIn
fields, long summaries, inline editing, and adding a self-attested item. Switch
between bottom fields without dismissing the keyboard. Repeat in a few other
modals and check that the focused field stays above the keyboard and action bar,
the background does not scroll, and each field has one focus ring following its
visible border. Verify dismissal restores the full modal and keyboard Tab still
shows focus. The shared dialog's backdrop should not acquire a rectangular outline.

The review build can use a local frontend with the production tenant config.
Sign-in and saved changes then use the production services. The standalone
fixture is available at `/tests/keyboard-focus/form.html` on the local server.
