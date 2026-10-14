---
"@learncard/lca-api-service": minor
"@learncard/network-brain-service": patch
---

Add a trusted-service `ensureManagedSigningAuthority` route (`POST /signing-authority/managed`) that returns or creates a named signing authority for an owner DID through the standard encrypted-seed path. Brain service now provisions app signing authorities through this route instead of writing plaintext seeds to the LCA API database.
