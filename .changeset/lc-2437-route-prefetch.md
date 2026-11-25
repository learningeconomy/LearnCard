---
'learn-card-app': patch
---

Stop poisoning route navigations when idle route prefetch fails (LC-2437). The ~30 routes in `ROUTE_PRELOAD` used to call `import()` during idle warm-up; a 503 or dropped connection left a failed module in Firefox and some Chromium versions, so the later real navigation errored or reloaded. Idle warm-up and early boot now use the same `fetch()` HTTP-cache warm helper as the My LearnCard modal (#2104); the first `import()` happens on real navigation. The shared helper also adds a 30s per-file fetch timeout and a 20s cooldown after failure so a hung or broken network can't leave an attempt pending forever or retry-storm on every hover.
