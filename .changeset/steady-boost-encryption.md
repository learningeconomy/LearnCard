---
"@learncard/lca-api-service": patch
"@learncard/network-brain-service": patch
"@learncard/network-plugin": patch
---

Encrypt signing-authority credentials using a single snapshot of each recipient's
X25519 keys. Keep DAG-JWE compatibility while eliminating repeated DID resolution
and post-encryption key-ID matching.

Carry status entries explicitly in serializable internal issuance results so copied
or cached credentials retain revocation metadata. Reject missing internal metadata,
and return false when persisted status JSON is malformed or fails validation.

Report an explicit Boost-authenticity warning when credential verification fails.
