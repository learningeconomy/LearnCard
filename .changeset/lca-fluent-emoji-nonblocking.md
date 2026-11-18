---
'learn-card-app': patch
---

Load the Fluent Emoji font stylesheet from the app bundle after the first render instead of a render-blocking `@import` from GitHub Pages, so a slow or unreachable tetunori.github.io can no longer hold up startup.
