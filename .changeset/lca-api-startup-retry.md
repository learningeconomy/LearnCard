---
"@learncard/lca-api-service": patch
---

lca-api Lambdas no longer cache a failed cold start. If startup work (WASM load, Mongo index setup) fails, only the requests waiting on it fail and the next request retries, instead of the container returning errors until it is recycled.
