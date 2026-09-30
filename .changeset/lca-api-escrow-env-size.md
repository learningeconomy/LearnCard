---
"@learncard/lca-api-service": patch
"@learncard/sss-key-manager": patch
---

Fix lca-api deploys failing on Lambda's 4KB environment limit: escrow variables are now attached only to the trpc/api functions, omitted when unset, and enclave settings are gated on `ESCROW_ENCLAVE_MODE`. SSS client errors now include the HTTP status code (HTTP/2 responses have an empty `statusText`).
