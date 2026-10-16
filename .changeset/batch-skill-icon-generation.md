---
"@learncard/types": patch
"@learncard/lca-api-service": patch
"learn-card-base": patch
---

Batch skill icon generation to fit request limits. `ai.generateSkillIcons` now rejects requests over 100 names or 2,500 total characters with BAD_REQUEST, and clients split large skill frameworks into batches under those limits.
