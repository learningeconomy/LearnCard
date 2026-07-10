---
"@learncard/network-brain-client": patch
"@learncard/learn-cloud-client": patch
"@learncard/simple-signing-client": patch
"@learncard/lca-api-client": patch
---

perf: fetch DID-Auth challenges lazily on first request instead of eagerly at client construction, with in-flight deduplication so concurrent first requests share one challenge fetch. Cuts ~22 boot-time getChallenges calls down to one per actively-used client.
