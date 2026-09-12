---
"@learncard/vc-plugin": minor
"@learncard/didkit-plugin": minor
"@learncard/didkit-plugin-node": minor
"@learncard/helpers": minor
"learn-card-base": patch
---

Compact VC-JWT verification and standard `text/plain` 1EdTech refresh (LC-2195)

-   Verified compact VC-JWT normalization: the exact signed token is the authority. `verifyCredentialJwt` (and `verifyCredential` for JWT-backed inputs) verifies the token through the pinned DIDKit/SSI implementation, reconciles registered `iss` / `sub` / `jti` / `iat` / `nbf` / `exp` claims against the embedded `vc` claim, and returns token-derived metadata plus a normalized credential that retains the signed bytes under `proof.jwt`. Contradictions, ambiguous multi-subject `sub`, malformed NumericDates, unsupported contexts, and unknown `proofFormat` fail closed.
-   Algorithm safety: `alg: none` and symmetric `HS256` / `HS384` / `HS512` are rejected before verification. Ed25519 `did:key` with JOSE `alg: EdDSA` is the supported positive fixture; other JWT algorithms are delegated to DIDKit but are not claimed supported. VCDM 2.0 is supported only as the legacy JOSE `vc`-claim wrapping profile (`vc-jwt-2.0-legacy`), not general VC-JOSE-COSE conformance. SD-JWT is out of scope.
-   Standard `text/plain` 1EdTech refresh: a bare compact VC-JWT body is accepted only for a verified `refreshService.type === '1EdTechCredentialRefresh'` with a `charset` of utf-8 / utf8 / us-ascii / ascii. JSON-LD credentials keep the existing JSON media types, and managed `LearnCardCredentialRefresh2026` stays JWE-only and rejects `text/plain` with `MALFORMED_RESPONSE`. The held credential is verified before any network request, and the signed token's `refreshService` (never display metadata) selects the endpoint.
-   Compact-JWT success now requires a verified JWS check; a linked-data proof alone can no longer authenticate token claims. This closes a fallback where an invalid or unmatched outer compact JWS could be accepted because the credential also carried a valid inner linked-data proof.
-   Iteration on LC-2195 adds an explicit, credential-only renewal-only verification mode through `verifyCredentialForRenewal` (DIDKit `allowExpiredCredential`). Only the held credential in `refreshCredential` uses it; the held JWS signature, issuer-authorized key, `nbf`, proof purpose, nonce and audience are still enforced while an expired `exp` is tolerated. A successful renewal-only result reports the additional `JWSRenewalExpired` check alongside `JWS` and is not ordinary credential validity. Replacements and ordinary verification remain strict even if an untyped caller supplies the low-level option, and the option is rejected for linked-data proofs and presentations. Expired and future replacements still fail closed.
-   The renewal capability ships with WASM and native artifacts rebuilt from the LC-2195 SSI and DIDKit fork commits. Those fork commits are local-only (unpushed) in this change, so the updated `lib/didkit` / `lib/ssi` gitlinks are not yet remotely reproducible. Publication order is SSI, then DIDKit, then LearnCard.
