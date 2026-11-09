---
'learn-card-base': patch
'learn-card-app': patch
'scoutpass-app': patch
---

Recover from malformed persisted infinite-query cache entries (LC-2352). A shared restore-boundary guard drops known infinite-query roots that are not valid `{ pages, pageParams }` InfiniteData before hydrate (unknown keys, including credentials with a `pages` extension, are left alone), and every `useInfiniteQuery` hook (including managed boosts) drops a bad in-memory entry and refetches instead of crashing on `pages.length`.
