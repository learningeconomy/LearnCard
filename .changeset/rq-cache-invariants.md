---
"learn-card-app": patch
"scoutpass-app": patch
"learn-card-base": patch
---

React Query cache fixes (LC-2349 to LC-2355): managed-boost writes use the same key as the list, LearnCard App drops saved caches from other app versions, ScoutPass waits for SQLite instead of dropping saves, malformed cached lists no longer crash readers, web logout deletes the saved cache before redirect, profile switches reset non-profile-scoped queries, and delete restores stale-time on the profile it pinned.
