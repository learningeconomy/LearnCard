---
"learn-card-base": patch
---

Add OID4VCI 1.0 Final `invalid_credential_request` body error code to the OID4VC resilience orchestrator's structured signer-failure dispatch table. Issuers like EUDI that return this generic OAuth2-style error code on proof JWT verification failures (e.g., when the holder DID can't be resolved from public infrastructure) now trigger the did:web → did:key signer fallback retry, instead of surfacing the error to the user immediately.
