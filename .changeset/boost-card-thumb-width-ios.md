---
'@learncard/react': patch
---

Fix boost/credential grid card header collapsing on iOS 18 (LC-2066)

The thumbnail wrapper added in #1366 for the revoked/suspended grayscale
treatment had no width of its own and relied on the card `<button>` stretching
it. iOS 18 WebKit lays a bare block child of a `<button>` flex container out
shrink-to-fit (UA `align-items: flex-start` per the HTML spec), so the badge —
which sizes itself with `width: 100%` — collapsed to the width of its 116px
circle: the header artwork stopped spanning the card and the options ("...")
button appeared to push it aside instead of overlaying it. iOS 26+ and desktop
engines compute `align-items: normal` and stretch the wrapper, which is why
the bug only appeared on older devices. The wrapper is now explicitly
`width: 100%` (verified by A/B on an iOS 18.1 simulator).
