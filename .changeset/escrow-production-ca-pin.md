---
"@learncard/lca-api-service": patch
---

Pin the production escrow enclave CA for `escrow-enclave.production.internal`, so the remote enclave transport can reach production over PrivateLink once escrow is enabled there. Escrow stays off in production until `ESCROW_ENCLAVE_MODE` is set.
