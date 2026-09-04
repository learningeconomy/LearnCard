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

-   Standards-based holder refresh via `refreshService` / `1EdTechCredentialRefresh` for VCDM 1.1/2.0, Open Badges 3.0, and CLR 2.0: generic `learnCard.invoke.refreshCredential` primitive with DID-auth challenge support, SSRF-hardened fetching, proof/issuer/ID/freshness validation, and safe typed failure codes.
-   Managed issuer refresh service in brain-service: allocate-before-signing, issuer-signed and signing-authority publication, immutable holder-encrypted (JWE-only) version chain, holder-authenticated `/refresh/:refreshId` endpoint with ETag/304, history, and revocation gating.
-   In-place holder wallet replacement with encrypted previous-version history, foreground-only staleness scanning (24h default, configurable), and per-record concurrency safety.
-   Privacy-safe `CREDENTIAL_REFRESHED` notifications with materiality detection, issuer overrides, and one collapsed record per configurable delivery window.
-   App surfaces: refresh listener, Updated indicator, notification card, and previous-versions history UI; provisional-to-final CLR demo in the credential viewer.
