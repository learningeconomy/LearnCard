---
description: 'Core Concept: Refreshing Verifiable Credentials after issuance'
---

# Credential Refresh

Credentials describe the world as it was when they were signed — but the world changes. A transcript is provisional until final grades post, a certification gains an endorsement, a license renews. Credential refresh lets an issuer publish an _updated version_ of an already-issued Verifiable Credential (VC) and lets the holder's wallet pick that update up in place, without issuing a brand-new credential or cluttering the wallet with duplicates.

LearnCard implements refresh on **both sides** of the exchange, following open standards so third-party wallets and issuers can participate:

- **[W3C Verifiable Credentials Data Model 2.0 — Refreshing](https://www.w3.org/TR/vc-data-model-2.0/#refreshing)**: a credential may carry a `refreshService` property describing how a wallet can obtain a fresher version.
- **[1EdTech Credential Refresh Service 1.0](https://www.imsglobal.org/spec/vccr/v1p0/)**: the concrete service type (`1EdTechCredentialRefresh`) and interaction (a simple `GET` that returns the refreshed credential). Used by Open Badges 3.0 and CLR 2.0 ecosystems.

Refresh works for VCDM 1.1, VCDM 2.0, Open Badges 3.0, and CLR 2.0 credentials.

## The two flavors of refresh service

### Public / interoperable services

Any issuer can stand up a standards-compliant `1EdTechCredentialRefresh` endpoint that returns an updated, signed credential to anyone who asks. LearnCard wallets can consume the JSON credential responses from these services even if the issuer has no LearnCard integration — the wallet verifies the returned credential's proof, checks that the issuer and credential ID match the original, and replaces its local copy.

### LearnCard-managed services

A LearnCard issuer can ask the network to **host** the refresh service. The issuer allocates a service _before signing_ (the service URL is inside the signed credential, so it must exist first), then publishes new versions over time. The network stores each version **encrypted to the holder only** and serves it behind DID authentication, so no one — not even the network operator — can read credential content at rest or learn anything by probing the endpoint.

A managed service descriptor looks like this inside the signed credential:

```json
{
    "refreshService": {
        "id": "https://network.learncard.app/refresh/a1b2c3…",
        "type": "LearnCardCredentialRefresh2026",
        "authorization": { "type": "LearnCardDIDAuth" }
    }
}
```

The `authorization` extension tells compatible wallets to authenticate with a DID-auth challenge. This is a LearnCard-specific protocol, not the 1EdTech protocol. A standard 1EdTech client cannot consume the encrypted envelope or authenticate with this extension. The type expands to `https://learncard.com/refresh#LearnCardCredentialRefresh2026` in the signing context.

## How managed refresh works

### The refresh aggregate

Managed refresh is built around a dedicated **refresh aggregate** — a small record that owns authorization and concurrency for one refreshable credential:

- a cryptographically random, unguessable `refreshId` used in the public URL
- the issuer (publication authority) and the intended holder (read authority)
- the stable credential ID shared by every version
- an immutable chain of **versions**, with a single mutable **head** pointer
- a lifecycle state: `awaiting_claim` → `active` → `revoked`

Credential versions themselves are immutable. Publishing creates a new version and moves the head — history is never rewritten.

### The lifecycle

1. **Allocate** — before signing, the issuer allocates a refresh service bound to a holder and a credential ID. The returned service object is embedded in the credential and signed.
2. **Claim** — the aggregate starts `awaiting_claim`. The issuer may already publish updates, but nothing is served and nothing notifies anyone until the holder accepts the credential, which moves the aggregate to `active`.
3. **Publish** — the issuer publishes updates, either fully signed themselves or as unsigned claims signed by an authorized [signing authority](identities-and-keys/signing-authorities.md). Each publication is validated (proof, same issuer, same credential ID, no back-dating) and stored as a new immutable, holder-encrypted version.
4. **Serve** — the holder's wallet authenticates with a single-use DID challenge and receives the holder-encrypted current version (or `304 Not Modified` when its ETag is current).
5. **Revoke** — revocation stops all serving. The holder keeps their locally retained copy and history; the issuer keeps metadata-only audit history.

### Holder-side in-place replacement

When a wallet refreshes a credential, it does **not** add a new entry. It updates the same wallet record in one index write:

- the record's URI points at the newly verified, re-encrypted credential
- the previous URI is appended to an encrypted, holder-only **history** so old versions stay viewable ("View Previous Versions")
- on a failure before that index write, the current credential is left untouched; cross-device races follow the eventual-convergence limitation below

Refresh checks run **in the foreground only**: on app launch/resume and when a refresh notification is tapped. By default a credential is checked at most once per **24 hours** (a named, configurable interval — `CREDENTIAL_REFRESH_CHECK_INTERVAL_MS`) and at most once per foreground session. There is no native background scheduler in Phase 1.

## Privacy model

Managed refresh is designed so the network never holds plaintext credential content at rest:

- **Holder-encrypted at rest**: every stored version is a JWE encrypted to the holder's key. The brain service's own DID is deliberately **not** a recipient.
- **Transient plaintext only**: during publication the server briefly sees plaintext to verify proofs and compute materiality, but plaintext is never written to databases, caches, queues, logs, metrics, or error responses.
- **Non-disclosing endpoint**: the unauthenticated `401` challenge reveals nothing about whether a `refreshId` exists; authorization, existence, and lifecycle distinctions are only made _after_ authentication, to the authenticated holder alone.
- **Opaque identifiers**: ETags are derived from the encrypted payload; materiality digests are keyed with a server secret; logs and metrics carry only opaque IDs and safe outcome codes.
- **SSRF-hardened fetching**: the wallet treats `refreshService.id` as untrusted input — HTTPS-only, private/loopback/metadata IP rejection after DNS resolution, revalidated redirects, strict timeouts, bounded response size, and no credential forwarding across origins.

## Notification model

Issuers shouldn't spam holders, and holders shouldn't miss meaningful changes:

- After each publication, the service decides whether the change is **material** by comparing a canonical projection of user-visible content (subject claims, titles, evidence, results, expiration) — ignoring proofs, identifiers, timestamps, and the refresh machinery itself.
- The issuer can force (`notifyHolder: true`) or suppress (`notifyHolder: false`) notification.
- The first material update sends a push and creates an in-app notification. Repeat updates inside a configurable **24-hour delivery window** (`CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS`) update the same unread in-app record instead of stacking new ones; a new window starts a new record. Notification windows are fixed wall-clock buckets, not sliding rate limits: updates across a bucket boundary can notify separately even when only minutes apart.
- Revocation stays on its own lifecycle path — a status-only change never masquerades as an "updated" notification.

## Error semantics

Holder-side refresh never throws raw network or parsing failures at the caller. The result is a typed union:

| Status        | Meaning                                                                       |
| ------------- | ----------------------------------------------------------------------------- |
| `updated`     | A verified newer version was returned (carries the credential, ETag, version) |
| `unchanged`   | The service confirms the held credential is current                           |
| `unsupported` | The credential has no supported refresh service                               |
| `failed`      | A safe, machine-readable `code` plus a `retryable` flag                       |

Failure codes: `UNAVAILABLE`, `TIMEOUT`, `UNSUPPORTED_SERVICE`, `UNAUTHORIZED`, `MALFORMED_RESPONSE`, `INVALID_PROOF`, `ISSUER_MISMATCH`, `ID_MISMATCH`, `ROLLBACK` (the candidate is older than the held credential), `REVOKED`, and `UNSAFE_ENDPOINT`. Raw response bodies are never surfaced.

## Phase 1 limitations

- **Foreground-only**: no native background refresh; checks happen on launch/resume and notification taps. A credential-detail or pull-to-refresh control is a planned follow-up (the underlying forced-refresh mutation is already reusable).
- **Allocate-before-signing only**: managed refresh cannot be retrofitted onto credentials that were already signed, because `refreshService` is part of the signed payload.
- **Transient server-side plaintext**: publication validates proofs and computes materiality in memory on the server. A detached signed-manifest design may remove this in a later phase.
- **Cross-device convergence is eventual**: a pre-write comparison prevents obvious stale writes, but a true compare-and-swap across devices is future work; devices converge on their next foreground check.
- **24-hour defaults**: both the staleness interval and the notification collapse window are named, configurable values to be reviewed against real usage.

## Where to go next

- [Issue and Refresh a Managed Credential (How-To)](../how-to-guides/issue-and-refresh-a-managed-credential.md)
- [Credential Lifecycle](credentials-and-data/credential-lifecycle.md)
- [Credential Status & Bitstring Status Lists](credentials-and-data/credential-status-and-bitstring-status-lists.md)

Local history currently retains every prior URI on the encrypted index record. Bounding or moving that index is follow-up work; pruning must preserve access to retained versions, including after revocation, when server history is unavailable.

Managed refreshes now fingerprint the original subject identifier list at first send and reject changes before publication. Refreshes created before that fingerprint existed must be reissued before publishing further versions; their original encrypted contents cannot be safely reconstructed server-side for backfill.

## Standards scope and compatibility

Checked against W3C VCDM 1.1 §5.5 and the published VCDM 2.0 Recommendation (May 15, 2025) §5.4, plus the [1EdTech refresh protocol](https://www.imsglobal.org/spec/vccr/v1p0/#protocol).

The W3C property is an extension point; it does not prescribe LearnCard authentication, encryption, stable IDs, or history. Managed credentials use `LearnCardCredentialRefresh2026` for those requirements. Standard JSON services use `1EdTechCredentialRefresh`; credentials without IDs are supported when both the held and replacement credentials omit the ID. Issuer and subject identity must still match. LearnCard does not send its DID-auth proof to standard services.

Previously issued QA credentials advertising `1EdTechCredentialRefresh` for an encrypted managed endpoint must be reissued. Do not edit signed credentials or reinterpret that standard type as a managed protocol. Existing stored credentials and local history remain readable.

Local HTTP testing is explicitly non-conformant transport; interoperable deployment requires HTTPS with TLS 1.2 or 1.3. Foreground polling, notifications, and in-place history are LearnCard product behavior, not W3C requirements.

### Explicit format limitation

The standard service adapter currently supports signed JSON credentials only. It does not claim complete 1EdTech Refresh Service conformance: `text/plain` compact VC-JWT responses remain unsupported and fail closed. End-to-end JWT signature verification, registered-claim normalization, and preservation of the original signed token are tracked in [LC-2195](https://welibrary.atlassian.net/browse/LC-2195); base64 decoding alone must never be treated as verification. Unknown refresh types are ignored rather than interpreted as LearnCard services.
