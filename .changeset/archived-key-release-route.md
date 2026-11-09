---
"@learncard/lca-api-service": patch
---

Add `POST /keys/archived-key`, which releases an archived legacy key to the verified Firebase login that owns it so the SSS account upgrade does not depend on the legacy provider. Release is limited to accounts that still need the legacy key, verifies the decrypted key reproduces the archived DID (and any recorded primary DID), rate-limits per login and IP, and tags the archive `released`; SSS activation tags it `exhausted`. Disabled unless `LEGACY_KEY_ARCHIVE_ENABLED` is set.
