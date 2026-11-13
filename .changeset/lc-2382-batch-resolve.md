---
'learn-card-base': patch
'@learncard/learn-cloud-service': patch
---

Batch /wallet credential resolution through LearnCloud storage.batchResolve so Passport no longer fires one storage.resolve POST per URI (LC-2382). storage.batchResolve now resolves Redis misses from MongoDB by credential ID and rejects URIs for other hosts.
Also fix in-app credential facts: look up the account-scoped resolved-credential RQ key, and on miss join fetchResolvedCredential (batch coalescer) instead of raw wallet.read.get so a cold facts backfill cannot race the wallet warmer with standalone storage.resolve.
Also: prefetch shares per-URI in-flight React Query work with individual readers; failed refreshes of invalidated entries return unresolved slots; same-host batches run independently of foreign/network reads; and batchResolve cold-miss lookups skip malformed IDs so they cannot empty the rest of the batch.
Also fix the qualification-category backfill: when a QueryClient is provided, resolve legacy records through tryFetchResolvedCredential (join the batch coalescer / reuse a warm RQ cache) instead of serial wallet.read.get, which re-issued standalone storage.resolve after a successful batchResolve (LC-2382 retake3).
