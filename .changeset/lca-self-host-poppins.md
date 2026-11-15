---
'learn-card-app': patch
---

Self-host Poppins and Jacques Francois (OFL) instead of render-blocking Google Fonts `@import`s, preload the three Poppins faces the login screen uses, and load Noto Sans from Google after the first render. A slow or unreachable fonts.googleapis.com can no longer hold up startup, and the first screen no longer flashes fallback text.
