---
"learn-card-app": patch
"@learncard/cli": patch
---

Persist saved profile changes before navigation without forcing profile refetches on every mount. Keep browser query-cache storage on localforage and native storage on SQLite across initialization and reload; native persistence failures never fall back to a stale second store. Revalidate installed apps after reload and apply nested tenant registry defaults correctly.

Add the disposable `lc verify` workflow with maintained user journeys, clean-checkout preparation, independently allocated service ports, confined local-service access, interruption-safe evidence, and ownership-checked crash recovery. Repair cold-start Vite loading, pin Astro's compatible Zod dependency, and load the example's CommonJS dependency correctly during server rendering. Build credential share links from the active tenant's configured host instead of the fixed development port.

Allow CLI schema/help loading before generated snippets exist; generate snippets atomically and load token snippets only when needed.
