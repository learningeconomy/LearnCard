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
-   Known limitation: a signature-valid but expired compact VC-JWT cannot be distinguished from an invalid one because the pinned DIDKit/SSI `jwt_matches` predicate enforces `nbf` / `exp` unconditionally. Expired compact tokens fail closed (`INVALID_PROOF`, zero network requests); expired JSON-LD held credentials may renew after signature, issuer authorization, and claim binding pass. The minimal fix is an opt-in temporal policy in the pinned fork with rebuilt WASM/native artifacts; it is not implemented here.
