---
"learn-card-app": patch
"learn-card-base": patch
---

fix: eliminate the loading-screen flash on hard refresh and cold login. The wallet now survives the auth coordinator re-initialization that follows Firebase session restore (instead of being torn down and rebuilt while flashing the loader over the rendered app), and the coordinator bridges the login provider swap with a transitional state so the login screen no longer flashes between loaders.
