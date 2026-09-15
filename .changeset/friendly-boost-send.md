---
"@learncard/network-brain-service": patch
---

Restore sending pre-signed and ordinary credentials without a `boostId` claim.
Preserve the signed payload unchanged and reject explicit conflicting Boost claims;
credentials without signed association metadata do not gain Boost authenticity.
