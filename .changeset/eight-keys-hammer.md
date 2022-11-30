---
'@learncard/core': minor
---

Fix Multi-Plane issues:

-   Fix race condition in `get`
-   Dedupe `index.all` results by `id` rather than by object reference
-   Fix race condition in cache `get` methods
