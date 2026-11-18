---
'learn-card-base': patch
'learn-card-app': patch
---

Passport/Home counts and the visibility backfill now read the whole wallet index in 100-record pages instead of 1000, matching LearnCloud's new `index.get` page limit. 1000-record pages could exceed the 6 MB response limit on large accounts (LC-2428).
