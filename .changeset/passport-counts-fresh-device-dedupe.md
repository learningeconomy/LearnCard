---
'@learncard/learn-cloud-plugin': patch
'learn-card-base': patch
'learn-card-app': patch
---

LearnCloud `index.add` skips a record whose `uri` is already indexed (one count lookup per add, by the existing `uri` field hash) and returns `true`, so new duplicate uri rows can't inflate index counts. Passport and Home counts no longer wait for this device's visibility backfill: a finished backfill leaves a LearnCloud marker, a fresh device reads it in the same batched request as the counts, and accounts with no marker count from one 1000-record index read instead of the paged walk (LC-2413).
