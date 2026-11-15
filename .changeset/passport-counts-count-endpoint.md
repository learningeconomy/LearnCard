---
'@learncard/learn-cloud-plugin': minor
'learn-card-base': patch
'learn-card-app': patch
---

LearnCloud index `getPage`/`getCount` accept `$ne`, `$nin` and `$in` on encrypted fields (sent as `fields.$nin` / `fields.$in` hashes; equality-only queries are unchanged). Internal index records (verifiable data, Self-Assigned Skills, internal categories) are written with `hidden: true`, a one-time per-account client backfill marks existing ones, and Passport and Home counts come from one index count request per tile instead of walking the whole index once the backfill is done (LC-2412, LC-2413).
