# EducationOS integration authentication

This is separate from LearnCard DID presentations, Profile principals and AuthGrants.
Only `integrationService.readGroup` is exposed: `id`, `name`, `type`, `parent` metadata.
All subject-data and unclassified operations are denied in Phase C.

## Operator onboarding

An OWNER/ADMIN with `app-store:write` calls
`installIntent.issueServiceAccountCredential({serviceAccountId})`. Save the returned
32-byte random secret immediately: there is no read-back endpoint. The database holds
only an account-bound HMAC-SHA256 verifier and expiry. Reissuing advances the live
credential generation, invalidating previous secrets and bearer tokens.

The partner calls `installIntent.exchangeServiceAccountToken({serviceAccountId, secret})`
without LearnCard authentication. Fixed-window limits apply independently to account
and source IP (unknown transports share a fail-closed caller bucket). Inputs containing
the secret are not attached to Sentry. The returned bearer token lasts five minutes.
PROVISIONED accounts may exchange tokens but cannot perform operations until ENABLED.

`installIntent.emergencyRevokeServiceAccount` disables authority and removes the
verifier, independent of the reconciler kill switch. Operator/invariant-disabled
accounts never auto-recover; reinstall through a newly approved intent.

## Signing material and rotation

Brain currently has a deployment `SEED`, not an asymmetric KMS signing API. As permitted
by this implementation's task, HMAC-SHA256 domain separation derives a dedicated
Ed25519 signing seed (`educationos/v1/integration-signing`) from that existing root.
The verifier uses a different derived key (`educationos/v1/renewal-verifier`). No new
key store or partner DID allowlist exists. This is **local seed-backed signing**, not
non-exportable KMS signing; deployment seed protection remains the trust boundary.

JWTs use EdDSA, issuer `educationos-platform`, type `educationos-integration+jwt`,
audience `educationos-integration`, and `sub`, `installId`, `ecosystemId`, `gen`, `kid`,
`iat`, `exp`. `kid` is the SHA-256 fingerprint of the public SPKI key and appears in
both protected header and claims. Verification accepts only the current key.

`installIntent.integrationSigningKey({})` publishes the public JWK and `kid` only.
Operators should distribute/pin it over their trusted deployment channel. Rotating
the deployment SEED changes `kid`, immediately rejects all old tokens, and invalidates
old secret verifiers: coordinate partner public-key updates and credential reissue.
There is deliberately no old-key overlap or automatic trust of a token-supplied key.

## Enablement and health contract

The pinned signed manifest may declare a draft-07 JSON `configSchema`; strict Ajv
validation fails closed on malformed/unsupported schemas, including unknown formats.
No schema means valid. Platform `declarationId` metadata is excluded from config validation.
Enablement requires valid config and an issued unexpired credential. Scoped installs
also require `endpoints.healthUrl`. Zero-grant installs may enable without an endpoint.
Intent/target READY means materialized, **not** operational; inspect SA status/enableCause.

Probes use only the pinned manifest endpoint, HTTPS, no redirects, a two-second
timeout, and public IP destinations (DNS checked on connection to prevent rebinding).
Only test mode allows HTTP to literal `localhost`.

The `x-educationos-health-challenge` header carries an EdDSA JWT with type
`educationos-health+jwt`, audience equal to the exact endpoint URL, a fresh `jti`,
30-second expiry, and account/install/ecosystem/generation claims. The partner verifies
the pinned platform key, issuer, type, audience, expiry and install identity, then
returns HTTP 2xx with `x-educationos-health-response: <jti>`. Health JWTs cannot be
used as API bearer tokens. HTTPS authenticates the responding endpoint.

Three consecutive failures disable authority, advance token generation and degrade
the intent with cause HEALTH and an audit record. A success resets the counter.
Health-disabled recovery runs the full enable gate; a stale in-flight probe cannot
undo operator revocation or removal. Expired credentials return to PROVISIONED for
operator rotation rather than trapping the account in an unrenewable disabled state.

Live validated runtime settings:

- `SERVICE_ACCOUNT_CREDENTIAL_DAYS`: default 90, positive and at most 365.
- `INSTALL_INTENT_RECONCILER_HEALTH_FAILURE_THRESHOLD`: positive integer, default 3.

General webhook delivery, consent-composed subject release, Mongo-backed configuration
revision migration, and non-exportable KMS signing are outside this Part 2 boundary.
