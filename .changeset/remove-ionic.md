---
"learn-card-base": patch
"learn-card-app": patch
"scoutpass-app": patch
---

refactor: remove Ionic. learn-card-base, learn-card-app and scouts now run on the app-owned `learn-card-base/ui` components (AppRoot, AppShellRouter, AppTabs, overlays, controls, layout) with Ionic's global CSS vendored under `learn-card-base/ui/global`; `@ionic/react`, `@ionic/react-router`, `@ionic/core`, `ionicons` and `@ionic/cli` are no longer dependencies.
