---
"@learncard/types": patch
"@learncard/sss-key-manager": patch
---

Add optional `KeyDerivationStrategy.fetchArchivedKey()`, implemented by the SSS strategy against `POST /keys/archived-key`. It returns `null` on any failure or unavailable response, so callers can fall back to legacy key derivation.
