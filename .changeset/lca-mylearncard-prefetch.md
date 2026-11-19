---
'learn-card-app': patch
---

Open the My LearnCard modal without waiting on its code download. The modal still loads separately from app startup, but the app now downloads its files into the browser cache once the dashboard has painted and the browser is idle, and again on hover, focus or press of the avatar, header profile button or side-menu Settings row. The prefetch uses plain `fetch()`, not `import()`, so a failed prefetch (for example a 503) can't leave a failed module behind for the real open; the open loads and recovers as before. If the modal opens while that download is still running, it waits for it (up to 3 seconds) instead of requesting the same files again alongside it.
