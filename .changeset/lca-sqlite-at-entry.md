---
'learn-card-base': patch
'learn-card-app': patch
---

Start native SQLite initialization at app entry (`startNativeSQLiteInit`) instead of after the lazy app shell's first commit, so the cached-key read on the auth cold-start path doesn't wait behind it. `sqliteInit()` joins the in-flight attempt or retries a failed one.
