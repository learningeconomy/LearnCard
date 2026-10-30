---
"@learncard/types": minor
"@learncard/network-brain-service": minor
"@learncard/network-brain-client": minor
"@learncard/network-plugin": minor
"@learncard/lca-api-service": patch
---

Add campaign test-to-me and paced audience notification dispatch, ANNOUNCEMENT metadata, delivery acknowledgement bookkeeping, and retry-safe inbox deduplication.

Deploy lca-api's enum and campaign deduplication support before enabling brain-service dispatch. Push retains the existing best-effort delivery behavior.
