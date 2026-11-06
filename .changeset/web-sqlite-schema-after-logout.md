---
'learn-card-base': patch
'learn-card-app': patch
'scoutpass-app': patch
---

Fix "no such table: users" when creating an account on web after signing out in the same tab. Logout deletes the browser's SQLite store, but table setup was remembered for the whole page load; it is now re-checked each time the database is opened. Onboarding no longer fails when only the local user cache write fails.
