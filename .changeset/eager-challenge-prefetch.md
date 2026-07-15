---
"@learncard/network-brain-client": patch
"@learncard/learn-cloud-client": patch
"@learncard/simple-signing-client": patch
"@learncard/lca-api-client": patch
---

perf: eagerly prefetch DID-Auth challenges with single-flight refills so client setup overlaps network latency without duplicate pools when the first request races construction.
