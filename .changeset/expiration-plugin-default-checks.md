---
'@learncard/expiration-plugin': patch
---

Default verification checks to `proof` plus `credentialStatus` / `credentialSchema` when present. Verify-only LearnCards (no seed) previously skipped status checks and accepted revoked credentials.
