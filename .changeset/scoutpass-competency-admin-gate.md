---
"scoutpass-app": patch
"learn-card-base": patch
---

Restrict ScoutPass competency framework administration to accounts with a Global Admin ID. Hide the Admin Panel and management actions for other users, guard editor entry points, and preserve competency selection when creating badges. Document the remaining shared API authorization gap.

Provide modal instance ownership to modal content so revoked competency access closes only the affected modal, including its fullscreen shell, without closing unrelated overlays or invoking save callbacks.
