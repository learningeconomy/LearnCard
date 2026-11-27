---
'learn-card-app': patch
'learn-card-base': patch
'scoutpass-app': patch
---

refactor: move from React Router 5 to React Router 8. learn-card-app now builds with React Router framework mode (SPA mode, `ssr: false`), prerendering static shells for `/login`, `/legal/terms` and `/legal/privacy`; the build fails if HTML for `/s/`, `/share-boost` or `/verify/resume` is ever emitted. Scouts and learn-card-base use React Router 8 in library mode.
