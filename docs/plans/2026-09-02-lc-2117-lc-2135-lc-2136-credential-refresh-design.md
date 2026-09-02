# Managed Credential Refresh Design

**Tickets:** LC-2117, LC-2135, LC-2136
**Status:** Approved design
**Date:** 2026-09-02

## Summary

LearnCard will support the W3C Verifiable Credentials `refreshService` property on
both sides of the exchange:

-   Issuers can opt into a LearnCard-managed refresh service when issuing a credential,
    then publish immutable updated versions without sending a redundant credential.
-   Holders can refresh credentials from LearnCard-managed or compatible external
    1EdTech refresh services and replace the current wallet entry in place.
-   Material changes can produce a privacy-safe `CREDENTIAL_REFRESHED` notification,
    while prior encrypted versions remain available to the holder and metadata remains
    available to the issuer for audit.

The initial use case is a provisional CLR 2.0 transcript that later becomes final,
but the design applies equally to VCDM 1.1, VCDM 2.0, and Open Badges 3.0 credentials.

## Goals

1. Preserve standards interoperability by using `1EdTechCredentialRefresh` and the
   standard `GET` interaction.
2. Let an issuer allocate a managed refresh service before a credential is signed.
3. Publish validated, immutable credential versions and atomically advance a current
   head.
4. Serve managed versions only to the accepted holder using DID authentication.
5. Replace the holder's existing LearnCloud wallet record rather than adding a
   duplicate.
6. Notify the holder only for material, user-visible changes, with explicit issuer
   overrides and lifecycle-event separation.
7. Retain holder-visible encrypted history and issuer-visible metadata history.
8. Fail safely: an unavailable or invalid refresh must never damage the currently
   held credential.

## Non-goals

-   OID4VCI deferred issuance or refresh-token support
-   W3C Verifiable Presentation Request flows for refresh authorization
-   Server-initiated background refresh on a sleeping native application
-   A manual or pull-to-refresh control in this ticket set
-   Retrofitting a managed service into credentials that have already been signed
-   A detached signed-manifest protocol that prevents all transient plaintext access
-   General-purpose versioning for arbitrary LearnCloud records

The refresh mutation will be reusable by a future manual control, and the managed
authorization extension is deliberately compatible with a future VPR flow.

## Standards basis

-   [W3C Verifiable Credentials Data Model 2.0, Refreshing](https://www.w3.org/TR/vc-data-model-2.0/#refreshing)
-   [1EdTech Credential Refresh Service 1.0](https://www.imsglobal.org/spec/vccr/v1p0/)
-   [1EdTech Open Badges 3.0](https://www.imsglobal.org/spec/ob/v3p0/)

The managed service uses `type: "1EdTechCredentialRefresh"`, accepts `GET`, and
returns a refreshed credential. The service object may contain an additional
authorization descriptor, which is permitted by the extensible 1EdTech model.

## Architectural choice

Use a dedicated managed-refresh aggregate instead of placing mutable refresh state
directly on existing credential nodes.

```text
Issuer SDK
   |
   | allocate + inject before signing
   v
CredentialRefresh ----HEAD----> Credential version N
   |                              ^
   |                              |
   +----ROOT----> Credential 1 --REFRESHED_TO--> ...
   |
   +---- issuer / intended holder / lifecycle / delivery metadata

Holder wallet
   |
   | authenticated GET or interoperable external GET
   v
verify candidate -> encrypted upload -> update same LearnCloud index record
                                      -> retain prior encrypted URI in history
```

The aggregate supplies one authorization and concurrency boundary. Credential nodes
remain immutable, and changing the head is the only mutable publication operation.

## Domain model

### `CredentialRefresh`

A dedicated node or equivalent model contains only service and audit metadata:

| Field                           | Purpose                                                       |
| ------------------------------- | ------------------------------------------------------------- |
| `refreshId`                     | Cryptographically random, unguessable public route identifier |
| `issuerProfileId` / `issuerDid` | Refresh owner and publication authority                       |
| `holderProfileId` / `holderDid` | Intended holder and read authority                            |
| `credentialId`                  | Stable nonempty VC identifier shared by every version         |
| `rootCredentialNodeId`          | Original immutable credential node                            |
| `headCredentialNodeId`          | Current immutable credential node                             |
| `currentVersion`                | Monotonic managed version number                              |
| `etag`                          | Opaque validator for the current encrypted response           |
| `state`                         | `awaiting_claim`, `active`, or `revoked`                      |
| `materialDigest`                | Keyed digest of canonical user-visible content                |
| `lastPublishedAt`               | Audit and ordering timestamp                                  |
| notification metadata           | Current delivery window and latest notification reference     |

`refreshId` receives a unique database constraint. The aggregate is related to its
issuer, intended holder, root, and head. Every successful publication creates a new
immutable `Credential` node and a `REFRESHED_TO` edge from the previous head.

The signed credential payload is persisted only as a holder-encrypted JWE. Plaintext
subject data is not stored on the aggregate or version relationships.

### Version metadata

Issuer history and holder history metadata may expose:

-   Managed version number
-   Publication and effective dates
-   ETag
-   Signing mode
-   Optional issuer-authored update summary
-   Safe publication outcome codes

History metadata never includes the credential subject or credential body. The
issuer history API returns metadata only. An authenticated holder may retrieve the
holder-encrypted payload for a historical version.

### LearnCloud record metadata

LearnCloud index records are encrypted. A refreshable record adds metadata shaped
conceptually as:

```ts
interface CredentialRefreshMetadata {
    serviceId: string;
    serviceType: string;
    credentialId: string;
    etag?: string;
    managedVersion?: number;
    lastCheckedAt?: string;
    lastUpdatedAt?: string;
    updateSummary?: string;
    unreadUpdate?: boolean;
    history: Array<{
        uri: string;
        managedVersion?: number;
        effectiveAt?: string;
        capturedAt: string;
        updateSummary?: string;
    }>;
}
```

The metadata is used to discover refresh candidates, correlate notifications by
`refreshId`, retain locally seen versions, and enforce staleness. Existing external
credentials are discovered lazily from credentials already resolved by wallet
queries; no server-side migration is required.

## Managed issuer lifecycle

### 1. Allocate before signing

Managed issuance must allocate the service before proof creation because
`refreshService` is part of the signed credential.

An advanced issuer calls:

```ts
allocateCredentialRefresh({
    holder: { profileId?: string; did: string },
    credentialId: string,
}): Promise<{
    refreshId: string;
    refreshService: {
        id: string;
        type: '1EdTechCredentialRefresh';
        authorization: { type: 'LearnCardDIDAuth' };
    };
}>;
```

Convenience issuance methods accept `enableRefresh: true` and perform allocation and
injection automatically. Raw/custom issuance can call the allocation primitive and
insert the returned object before signing.

### 2. Bind the original

After signing and sending, brain-service binds the allocation to the original
immutable credential node and intended holder. The aggregate starts as
`awaiting_claim`. Acceptance moves it to `active`.

An issuer may publish while the original remains unclaimed. The update is stored but
is not served and does not notify the intended holder. Acceptance activates the
latest head and schedules at most one notification for the latest applicable material
change.

### 3. Publish an update

Use an unambiguous issuer API name:

```ts
publishCredentialRefresh(input): Promise<{
    refreshId: string;
    version: number;
    publishedAt: string;
    notification: 'queued' | 'suppressed' | 'not-applicable';
}>;
```

The input is a discriminated union:

-   **Issuer-signed mode:** the caller supplies a fully signed VC.
-   **Signing-authority mode:** the caller supplies updated unsigned claims and an
    authorized signing authority; brain-service obtains the new proof.

In both modes, brain-service:

1. Authorizes the original issuer profile or an equivalent authorized administrator.
2. Resolves and validates the refresh aggregate.
3. Validates the credential shape for its VCDM/OBv3/CLR profile.
4. Verifies the completed proof.
5. Requires the same normalized issuer and same nonempty credential ID.
6. Rejects a strictly older effective or issuance timestamp.
7. Computes full-content and material-content comparisons transiently.
8. Encrypts the signed VC for the holder.
9. Creates the immutable version and `REFRESHED_TO` relationship.
10. Advances the head and version in one database transaction.
11. Queues notification work after commit.

The publication transaction serializes on the refresh aggregate. A caller-supplied
idempotency key, combined with refresh ID, prevents retry-created versions. A changed
payload without a newer timestamp can be accepted because some interoperable issuers
omit or reuse timestamp values; managed version ordering remains authoritative.

### 4. Inspect history

```ts
getCredentialRefreshHistory({ refreshId, cursor, limit });
```

Only the issuer or equivalent authorized administrator receives issuer audit history.
It is cursor-paginated and metadata-only.

## Holder refresh protocol

### Managed endpoint

The route is:

```text
GET /refresh/:refreshId
```

The first request without authorization returns `401` with:

-   A short-lived, single-use challenge in a machine-readable JSON body
-   A `WWW-Authenticate` header naming `LearnCardDIDAuth`
-   No holder, issuer, credential, or lifecycle information

The wallet signs a DID-auth presentation and retries with it as a bearer credential.
The server verifies the presentation, challenge, audience/domain, expiry, and that
the signing DID is the accepted intended holder.

After successful authentication:

-   Active and changed: return the holder-encrypted current JWE and ETag.
-   Matching `If-None-Match`: return `304` with no body.
-   Revoked: return `410` with a machine-readable `CREDENTIAL_REVOKED` code and no
    credential body.
-   Awaiting claim or unauthorized: return a non-disclosing authorization response.

Responses use `Cache-Control: private, no-store`. Authentication is performed before
honoring conditional requests.

Holder history uses the same authentication contract. Metadata can be listed and an
individual historical JWE can be fetched lazily. This lets a holder inspect managed
versions that were published between two wallet checks. Locally retained versions
remain available after managed serving stops.

### Generic holder SDK method

The holder-facing method is storage-independent:

```ts
refreshCredential(vc, options?): Promise<
    | { status: 'updated'; credential: VC; etag?: string; managedVersion?: number }
    | { status: 'not-modified'; checkedAt: string; etag?: string }
    | { status: 'failed'; code: RefreshFailureCode; retryable: boolean }
>;
```

It performs no LearnCloud mutation. It accepts a single `refreshService` object or an
array, selects the first supported service, and performs only one refresh interaction
per operation.

For `1EdTechCredentialRefresh`:

1. Verify the currently held credential before contacting the endpoint.
2. Send the standards-compatible `GET`, optionally with `If-None-Match`.
3. If the endpoint provides a recognized DID-auth challenge, sign and retry once.
4. Decode a plain VC or holder JWE response.
5. Verify the refreshed proof.
6. Require the same nonempty credential ID and normalized issuer identity.
7. Reject a strictly older effective/issuance timestamp.
8. Compare canonical signed content; return `not-modified` when identical.
9. Return the verified candidate without mutating storage.

Failures are represented by safe codes including unavailable, timed out,
unsupported service, unauthorized, malformed response, invalid proof, issuer
mismatch, ID mismatch, rollback, revoked, and unsafe endpoint.

## External request safety

`refreshService.id` is credential-controlled input, so the wallet's fetcher must be
SSRF-hardened:

-   Require HTTPS outside explicit local-development configuration.
-   Reject loopback, private, link-local, multicast, and cloud metadata destinations
    after DNS resolution.
-   Revalidate every redirect and restrict the redirect count.
-   Set strict connect and total request timeouts.
-   Set a bounded response size.
-   Accept only supported credential/JWE JSON content types.
-   Never forward LearnCard authorization to a redirect or unrelated origin.
-   Retry DID authentication only for the recognized challenge scheme.

Managed refresh IDs are generated with cryptographically secure randomness. Routes
are rate-limited before authentication by network source and refresh ID, then after
authentication by holder DID and refresh ID.

## Plaintext and encryption boundary

Phase 1 permits plaintext only transiently inside the brain-service process so it can
validate proofs, compare material content, and use a signing authority. This is a
conscious relaxation of the strongest interpretation of client-only encryption.

Plaintext must never be written to:

-   Neo4j or other databases
-   Credential/object storage
-   Redis or caches
-   Queues
-   Notifications
-   Metrics, tracing attributes, or logs
-   Error responses

Persisted credential versions are encrypted to the holder. Semantic comparison uses
a server-keyed digest of the canonical material projection rather than an unkeyed
digest that could enable offline guessing. ETags are opaque validators derived from
the stored encrypted response.

A later detached signed-manifest design can remove transient plaintext from
issuer-signed publication without changing the public refresh endpoint.

## In-place holder synchronization

A refresh query/mutation layer coordinates `refreshCredential` with LearnCloud.

For an `updated` result:

1. Read the current encrypted index record and credential.
2. Acquire an in-process mutex keyed by index-record ID.
3. Refresh and validate the candidate.
4. Re-read the index record before committing.
5. Stop if another result is already equivalent or newer.
6. Upload the candidate through `store.LearnCloud.uploadEncrypted`.
7. Update the same index record in one call:
    - replace its current URI;
    - append the former URI to encrypted local history;
    - update ETag, managed version, check/update dates, summary, and unread state.
8. Invalidate affected credential queries.
9. Remove the old URI and add the new URI in `newCredsStore` so existing wallet
   indicators follow the replacement.

The old encrypted payload is intentionally retained for history. If upload succeeds
but the index update fails, the original index record remains authoritative and the
unused upload is removed on a best-effort basis. A failed cleanup may leave an
unindexed encrypted blob, but never a duplicate wallet entry.

The final pre-write comparison narrows multi-device races. Exact cross-device
compare-and-swap is outside Phase 1; devices converge to the managed head on their
next foreground check.

### Foreground triggers

-   **App launch or foreground focus:** scan refreshable records that are stale.
-   **Credential detail:** run a targeted check when that record is stale.
-   **Refresh notification tap:** force a targeted check regardless of staleness.
-   **Ordinary throttle:** check no more than once per foreground session and once per
    configurable 24-hour interval per credential.

The check interval is a named configuration value so product can shorten it without
rewriting the flow. There is no native background scheduler in Phase 1.

Expected failures retain the current credential, update safe check metadata where
appropriate, and report structured outcome codes to the central logger. They do not
interrupt normal wallet use.

## Notification design

### Materiality

After a publication commit, brain-service determines notification materiality from a
canonical projection of user-visible credential content.

Included examples:

-   Credential subject claims
-   Title, name, and description
-   Evidence and attachments
-   Achievement/result content
-   User-visible `validUntil` or expiration changes

Excluded examples:

-   Proofs
-   Credential and refresh identifiers
-   Issuance-only or `validFrom` timestamp changes
-   `refreshService`
-   `credentialStatus` mechanism descriptors
-   Internal managed-version metadata

`notifyHolder: true` forces notification and `notifyHolder: false` suppresses it. If
unset, canonical material comparison decides.

Revocation is not ignored: it continues through the existing
`CREDENTIAL_REVOKED` lifecycle and notification path. A status-only refresh does not
also generate a misleading “updated” notification. Future suspension states should
likewise use their own lifecycle notification types.

### Payload

Add `CREDENTIAL_REFRESHED` to the shared notification types. Its payload contains:

-   Type
-   Refresh ID or safe credential reference
-   Issuer display name
-   Credential title
-   Optional issuer-authored update summary
-   Publication timestamp

It never contains the credential subject or credential body.

### Delivery and collapse

Notification dispatch is fire-and-forget after the version transaction commits. A
delivery failure never rolls back the refresh.

-   The first material update sends push and creates an in-app notification.
-   Further updates inside the configurable 24-hour window atomically update that same
    in-app record with the latest date and summary, mark it unread again, and suppress
    additional push.
-   An update outside the window creates a new in-app record and push.
-   The logical upsert key includes holder, refresh ID, type, and active delivery
    window so concurrent publications cannot create duplicates.
-   Pre-claim publications produce at most one latest notification after acceptance.

Push copy:

-   **Title:** `Your {credentialTitle} was updated`
-   **Body:** `{issuerName}` or `{issuerName} · {updateSummary}`

Push and in-app copy avoid implementation terms such as refresh, sync, service, and
managed version.

## App behavior

### Notification center and deep link

The notification center renders a dedicated refreshed-credential card. Tapping it:

1. Locates the wallet index record by encrypted refresh metadata.
2. Forces a targeted current-version request.
3. Keeps the current credential if the request fails and shows friendly retry copy
   only when user action is useful.
4. Opens the credential detail after the latest available result is resolved.

Push routing carries the refresh ID, never the credential body. If the record is not
yet locally available, the app performs the acceptance/lookup-safe fallback rather
than opening a broken detail route.

### Updated state

The existing wallet new-item mechanism follows the new encrypted URI after in-place
replacement. Credential detail shows an emerald `Updated` pill until the successfully
rendered detail is first viewed. It then shows `Updated {date}` without the unread
emphasis.

### Previous versions

An overflow action labeled `View Previous Versions` opens an app-modal sheet. Entries
show the update date and optional summary, and open read-only credential detail.

The sheet merges:

-   Locally retained encrypted versions, including versions from external services.
-   Authenticated managed history metadata and lazily fetched holder-encrypted versions
    that the wallet did not observe when they were current.

If the managed service is revoked or unavailable, locally retained versions remain
viewable. No edit, restore-as-current, or re-share behavior is added in Phase 1.

## Revocation interaction

Managed revocation invalidates the refresh aggregate and prevents all current or
historical holder serving. The existing credential revocation path remains the source
of truth for holder lifecycle notifications and wallet removal behavior.

Issuer audit metadata and immutable server history remain available to authorized
issuers according to existing retention policy. Locally retained holder history is
not remotely deleted by revocation.

## Compatibility and rollout

-   Existing issuance behavior is unchanged unless `enableRefresh` or explicit
    allocation is used.
-   Older wallets ignore the additional signed property.
-   New wallets support public external 1EdTech services and the optional LearnCard
    DID-auth extension.
-   Unsupported service types do not make a credential unusable.
-   Existing refreshable external credentials are discovered lazily; no bulk data
    migration is required.
-   Managed refresh cannot be attached after signing.
-   Managed routes and automatic foreground scanning receive independent feature flags.
-   Route rollout precedes issuer SDK exposure; holder generic support can ship without
    managed issuance being enabled.

Suggested delivery order:

1. Shared VCDM/LCN validators and generic holder method
2. Managed aggregate, allocation, publication, history, and authenticated endpoint
3. LearnCloud in-place synchronization and foreground triggers
4. Notification delivery, routing, indicators, and history UI
5. Credential-viewer scenario, end-to-end tests, documentation, and staged enablement

## Demo scenario

Extend `examples/credential-viewer` with a managed provisional-transcript flow:

1. Connect issuer and holder test wallets.
2. Issue and claim a provisional CLR 2.0 transcript with managed refresh enabled.
3. Publish a finalized transcript with the same credential ID and a later effective
   date.
4. Trigger or simulate foreground refresh.
5. Confirm the existing wallet index entry changes URI without creating a second
   record.
6. Open the provisional transcript from previous versions.
7. Publish repeated updates to demonstrate in-app collapse and push throttling.
8. Revoke the credential and confirm the refresh endpoint stops serving it.

The demo must use the production SDK surfaces rather than a mock-only refresh path.

## Verification strategy

### Shared types and SDK

-   VCDM 1.1 and 2.0 `refreshService` parsing
-   OBv3 and CLR 2.0 credentials
-   Single-object and array forms
-   Public endpoint happy path and unchanged response
-   DID-auth challenge/retry happy path
-   Endpoint unavailable and timed out
-   Invalid original or refreshed proof
-   Issuer mismatch, ID mismatch, and timestamp rollback
-   Unsupported service type
-   Unsafe URL, DNS, redirect, size, and content-type rejection
-   Exactly one refresh interaction per operation

### Brain service

-   Allocation produces a unique unguessable ID and standard service type
-   Issuer/admin authorization and cross-issuer denial
-   Original binding and claim activation
-   Issuer-signed and signing-authority modes
-   Proof, issuer, ID, and chronology validation
-   Publication idempotency and concurrent serialization
-   Immutable version creation and correct head movement
-   Metadata-only issuer history pagination
-   Holder challenge, DID authorization, expiry, replay rejection, and denial
-   Authenticated ETag/`304`
-   Awaiting-claim and revoked responses
-   Holder-encrypted persistence and absence of plaintext in logs/queues/storage
-   Rate limiting

### LearnCloud synchronization

-   Same index-record ID with a replaced current URI
-   Previous encrypted URI appended to history
-   Upload or update failure preserves current record
-   Best-effort orphan cleanup
-   Mutex deduplication and pre-write stale-result rejection
-   Query invalidation and `newCredsStore` URI transition
-   Lazy metadata discovery for an existing external credential

### Notifications

-   Default material comparison
-   Forced and suppressed overrides
-   Status/lifecycle separation
-   Privacy-safe payload validation
-   Post-commit fire-and-forget dispatch
-   Atomic in-app upsert and unread reset
-   First push and subsequent 24-hour suppression
-   New window creates a new delivery
-   Pre-claim updates collapse to one activation notification

### App

-   Launch/focus staleness behavior
-   Detail targeted check
-   Notification tap bypasses staleness and opens the correct record
-   Network failure preserves and opens the current credential
-   Updated indicator clears after successful detail view
-   Local and managed previous-version viewing
-   Friendly revoked and unavailable states

### End to end

At minimum, cover:

```text
allocate -> issue provisional -> claim -> publish final
         -> notify -> authenticated fetch -> replace in place
         -> inspect history -> revoke -> refuse subsequent serving
```

## Observability

Record only aggregate counts, timings, signing mode, managed/external service type,
and safe outcome codes. Do not record holder identifiers, credential IDs, service
URLs, notification text, credential subjects, bodies, or decrypted values.

Key signals include allocation success, publish result, challenge result, fetch
latency, refresh outcome, in-place update failure, notification suppression, and
history-fetch failure.

## Ticket mapping

### LC-2117

-   Generic `refreshCredential(vc)` SDK method
-   Validation, issuer/ID continuity, freshness, and safe failure handling
-   LearnCloud in-place replacement
-   Foreground synchronization and staleness
-   Holder history and end-to-end replacement coverage

### LC-2135

-   Managed allocation/injection
-   Dedicated aggregate and immutable versions
-   Both publication signing modes
-   Holder-authenticated endpoint, ETag, encryption, history, revocation, and audit
-   Network client/plugin surfaces and issuer demo

### LC-2136

-   `CREDENTIAL_REFRESHED` notification
-   Materiality, override, privacy, throttling, and collapse
-   Push and notification-center handling
-   Forced deep-link refresh, updated indicator, and previous-version UI

## Phase 1 tradeoffs requiring follow-up

1. **Transient plaintext:** accepted for validation/signing in Phase 1; detached signed
   manifests remain a stronger future privacy model.
2. **Twenty-four-hour defaults:** both ordinary refresh checks and repeated push
   suppression are named, configurable values and should be reviewed with product.
3. **Foreground-only operation:** native background execution and manual pull-to-
   refresh are deferred, while the mutation remains reusable.
4. **Cross-device convergence:** a pre-write comparison prevents obvious stale writes,
   but a true LearnCloud compare-and-swap operation may be warranted later.
