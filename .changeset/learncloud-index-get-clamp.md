---
'@learncard/learn-cloud-service': patch
---

LearnCloud `index.get` now returns at most 100 records per page. A larger `limit` is clamped instead of rejected, so older clients keep paging with `hasMore`/`cursor`. Pages cached under the old, larger limit are no longer served, since the cache key uses the clamped limit (LC-2428).
