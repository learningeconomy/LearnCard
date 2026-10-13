---
"scoutpass-app": patch
"learn-card-base": patch
---

Keep membership ID storage URIs separate from signed credentials so direct Boost IDs verify without JSON-LD data-loss errors. Preserve legacy wrapped IDs and avoid restoring the old combined objects from the persisted query cache.
