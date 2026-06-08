---
"@learncard/openid4vc-plugin": minor
"learn-card-app": patch
---

Split OID4VCI auth-code flow into two retry-safe phases. New plugin methods `exchangeAuthCodeForToken` and `requestCredentialsFromAuthCodeToken` let the resilient wrapper exchange the OAuth code exactly once and reuse the resulting access_token across signer-axis retries. Fixes a bug where the orchestrator's did:web → did:key fallback would fail with `invalid_grant: Code inactive` when EUDI (and other RFC 6749-strict issuers) rejected the second exchange attempt. `completeCredentialOfferAuthCode` continues to work as a one-shot convenience method.

Pre-authorized-code issuance now exposes the same split via `exchangePreAuthCodeForToken` and `requestCredentialsFromPreAuthToken`, allowing resilient signer fallback to reuse a single-use pre-auth token exchange before storing credentials.
