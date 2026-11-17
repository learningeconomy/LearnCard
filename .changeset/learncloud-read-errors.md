---
'@learncard/learn-cloud-service': patch
---

LearnCloud `index.get` and `index.count` now return a 500 when the database read fails, instead of an empty page or 0. A failed read is no longer cached as an empty index page, so Passport counts and categories show the unavailable/retry state instead of 0 for up to a day (LC-2434). A failed user lookup also throws now, instead of counting only the signed-in DID.
