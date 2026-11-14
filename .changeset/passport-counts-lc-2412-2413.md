---
'learn-card-base': patch
'learn-card-app': patch
---

Keep Passport and Home counts visible from the cached index walk during background refetches and after a failed refresh (LC-2412), reuse the walk for 5 minutes, and take 100-record pages after the first page so the complete walk needs far fewer round trips (LC-2413).
