---
'learn-card-app': patch
---

Fix the side menu's Issue Credentials button doing nothing on the Boost a Friend page. The Boost CMS no-op guard matched any path containing `/boost`, so it caught `/boost-a-friend` too. It now matches only `/boost` and `/boost/*`.
