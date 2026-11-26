---
"learn-card-app": patch
---

refactor: replace `IonIcon` in learn-card-app with an app-owned `AppIcon` that renders ionicons SVGs in light DOM through an allowlist (no shadow DOM, no `innerHTML`, no fetches)
