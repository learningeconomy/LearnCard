---
"@learncard/types": minor
"@learncard/helpers": minor
"@learncard/vc-plugin": minor
"@learncard/network-plugin": minor
"@learncard/network-brain-service": minor
"@learncard/lca-api-service": minor
"@learncard/credential-library": patch
"learn-card-base": patch
"learn-card-app": patch
---

Managed credential refresh (LC-2117, LC-2135, LC-2136)

-   Holder refresh through the W3C `refreshService` extension point: standard `1EdTechCredentialRefresh` signed JSON responses and a separate `LearnCardCredentialRefresh2026` encrypted, DID-authenticated managed protocol. Includes SSRF guards, proof/issuer/subject/ID/freshness validation, and typed failures. Compact VC-JWT support is deferred to LC-2195; full 1EdTech protocol conformance is not claimed. Previously issued managed QA credentials must be reissued with the new signed service type.
-   Managed issuer refresh service in brain-service: allocate-before-signing, issuer-signed and signing-authority publication, immutable holder-encrypted (JWE-only) version chain, holder-authenticated `/refresh/:refreshId` endpoint with ETag/304, history, and revocation gating.
-   In-place holder wallet replacement with encrypted previous-version history, foreground-only staleness scanning (24h default, configurable), and per-record concurrency safety.
-   Privacy-safe `CREDENTIAL_REFRESHED` notifications with materiality detection, issuer overrides, and one collapsed record per configurable delivery window.
-   App surfaces: refresh listener, Updated indicator, notification card, and previous-versions history UI; provisional-to-final CLR demo in the credential viewer.
