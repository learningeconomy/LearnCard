---
'@learncard/network-brain-service': minor
---

Allow a new contract request after denial, cancellation, or the end of an accepted consent. Limit new requests to three per profile and contract in a rolling 30-day window by default. Exact pending retries reuse the current request ID.
