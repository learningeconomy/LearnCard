---
'@learncard/lca-api-service': patch
---

Load optional per-stage runtime secrets before Lambda initialization and scope authentication environment settings by function to avoid Lambda's 4KB limit. Preserve the Firebase environment fallback for stages without a bundle.
