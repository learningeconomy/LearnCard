---
"@learncard/types": patch
"@learncard/lca-api-service": patch
"learn-card-base": patch
"@learncard/lca-api-client": patch
---

Batch skill icon generation to fit request limits. `ai.generateSkillIcons` now rejects requests over 100 names or 2,500 total characters with BAD_REQUEST, and clients split large skill frameworks into batches under those limits.

`@learncard/lca-api-client` now caps batched GET URLs at 8,192 characters (`maxURLLength`), so concurrent queries like those icon batches are sent as separate requests instead of being merged into one URL that API Gateway rejects with HTTP 431.
