---
'learn-card-base': patch
'scoutpass-app': patch
---

Stop `useGetCredentialList` from crashing on a malformed cached entry (LC-2330). The hook now drops a cache entry that isn't valid infinite-query data and refetches, `useGetRecordForUri` and `insertItem` skip or replace malformed entries, Scouts busts its persisted query cache on each app version, and Scouts' add-credential mutation now targets the real `useGetCredentialList` / `useGetCredentialCount` keys.
