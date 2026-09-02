# Managed Credential Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:executing-plans` to implement this plan task-by-task. Use
> `superpowers:test-driven-development` for every behavior change and
> `superpowers:verification-before-completion` before claiming a ticket or phase is
> complete. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add interoperable holder-side `refreshService` support, a managed issuer
refresh service in brain-service, and privacy-safe refresh notifications for VCDM
1.1/2.0, Open Badges 3.0, and CLR 2.0 credentials.

**Architecture:** A dedicated `CredentialRefresh` aggregate binds an issuer, intended
holder, stable credential ID, immutable version chain, and mutable head. Managed
payloads are persisted only as holder-encrypted JWE objects. A generic VC-plugin method
authenticates to managed services or reads compatible public 1EdTech services, verifies
the returned credential, and returns a typed result without mutating storage. The app
uses that primitive to atomically replace the URI on the same encrypted LearnCloud
index record, retain prior encrypted URIs as local history, and surface one collapsed
notification per configurable delivery window.

**Tech Stack:** TypeScript, Zod, LearnCard plugin control planes, tRPC, Fastify, Neo4j,
MongoDB, AWS SQS/Lambda, React, React Query, Capacitor App lifecycle, Jest, Vitest,
Playwright, Bun, and Nx.

**Approved design:**
[2026-09-02-lc-2117-lc-2135-lc-2136-credential-refresh-design.md](./2026-09-02-lc-2117-lc-2135-lc-2136-credential-refresh-design.md)

## Ticket map

| Slice       | Primary ticket   | Outcome                                                         |
| ----------- | ---------------- | --------------------------------------------------------------- |
| Tasks 1-3   | LC-2117 + shared | Standards-compatible SDK refresh primitive                      |
| Tasks 4-9   | LC-2135          | Managed allocation, send, publish, history, and holder endpoint |
| Tasks 10-11 | LC-2117          | Safe in-place replacement and foreground synchronization        |
| Tasks 12-15 | LC-2136          | Materiality, notification collapse, deep links, and history UI  |
| Tasks 16-17 | All              | Demo, end-to-end proof, documentation, and release verification |

## Global constraints

-   Preserve the stable VC `id`, issuer, intended holder, and credential type across all
    versions. Never silently convert a replacement into a second wallet entry.
-   Select only the first supported refresh service from a single object or array. Ignore
    unsupported entries without making a request.
-   Support `type: "1EdTechCredentialRefresh"` and HTTP `GET`. LearnCard-managed
    authorization is an additive extension, not a replacement for the interoperable
    public flow.
-   Verify the current credential and replacement proof. Reject ID changes, issuer
    changes, holder changes, invalid proofs, and strictly older effective timestamps.
    Accept changed content with equal or absent timestamps for interoperability.
-   Enforce HTTPS in production. Reject localhost, link-local, loopback, private IP
    literals, unsafe DNS results, unsafe redirects, non-credential content types,
    oversized responses, and timed-out requests before parsing credential content.
-   Do not log, cache, queue, or persist plaintext subject data in brain-service. The
    service may hold plaintext transiently only for validation/signing/encryption.
-   Encrypt managed versions to the holder only. Do not use the existing convenience
    JWE path that automatically includes the brain DID as a recipient.
-   Authenticate the holder before returning a body, ETag result, history, revocation
    state, or existence signal. Managed responses use `Cache-Control: private, no-store`.
-   A failed refresh leaves the current LearnCloud record and credential URI untouched.
    Upload first, re-read the record, then update the same index record. Preserve old
    encrypted blobs as history.
-   Refresh notifications contain no credential subject, title, evidence, attachment,
    or other claim content in transport payloads. A notification carries opaque routing
    metadata only; the client retrieves the credential after authentication.
-   Refresh lifecycle events are separate from credential-status notifications.
    Revocation, suspension, and unsuspension keep their existing explicit event types.
-   Feature-flag issuer APIs, foreground scanning, notifications, and history UI so each
    ticket can roll out independently.
-   Keep the unrelated untracked `services/learn-card-network/vc-api-service/` directory
    out of every commit.

## Configuration contract

Use explicit server/app configuration names and provide safe defaults:

| Variable / flag                                | Default   | Meaning                                            |
| ---------------------------------------------- | --------- | -------------------------------------------------- |
| `CREDENTIAL_REFRESH_ENABLED`                   | `false`   | Enables managed issuer APIs and holder HTTP routes |
| `CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS` | `24`      | Collapse window for repeated material updates      |
| `CREDENTIAL_REFRESH_MAX_RESPONSE_BYTES`        | `1048576` | Maximum remote refresh response                    |
| `CREDENTIAL_REFRESH_REQUEST_TIMEOUT_MS`        | `10000`   | Remote refresh timeout                             |
| `CREDENTIAL_REFRESH_DIGEST_SECRET`             | none      | Required server-keyed HMAC secret when enabled     |
| LaunchDarkly `credentialRefresh`               | `false`   | Enables foreground holder synchronization          |
| LaunchDarkly `credentialRefreshNotifications`  | `false`   | Enables notification production and handling       |
| LaunchDarkly `credentialRefreshHistory`        | `false`   | Enables Updated indicator and history UI           |

Do not derive `CREDENTIAL_REFRESH_DIGEST_SECRET` from another application secret. Fail
startup when managed refresh is enabled without it.

---

### Task 0: Create an isolated, current implementation branch

**Files:**

-   Inspect only: `/Users/donny/Work/LearnCard/.git`
-   Preserve: `services/learn-card-network/vc-api-service/`

**Interfaces:**

-   Starts from local design commit `48bf8922b`
-   Produces branch `codex/credential-refresh-service` in an isolated worktree

-   [ ] **Step 1: Load project memory and inspect current state**

Run:

```bash
/Users/donny/.config/dualmem/bin/dualmem-run context "implement managed credential refresh LC-2117 LC-2135 LC-2136" --budget 3000
/Users/donny/.config/dualmem/bin/dualmem-run context "implementation environment" --budget 1500 --ns claude:infra
git status --short --branch
git log -3 --oneline
```

Expected: local `main` contains `48bf8922b`; the unrelated untracked directory is the
only uncommitted item.

-   [ ] **Step 2: Fetch current upstream state**

Run: `git fetch origin main`

Expected: `origin/main` is available locally. Do not reset or rewrite local `main`.

-   [ ] **Step 3: Create the isolated worktree and merge upstream**

Run:

```bash
git worktree add ../LearnCard-credential-refresh -b codex/credential-refresh-service 48bf8922b
cd ../LearnCard-credential-refresh
git merge --no-edit origin/main
```

Expected: the implementation branch contains both the approved design and current
upstream code. If the merge conflicts, resolve only after comparing both sides and run
the baseline checks below before any feature work.

-   [ ] **Step 4: Establish a baseline**

Run:

```bash
bun install --frozen-lockfile
bunx nx build types
bunx nx build helpers
bunx nx build vc-plugin
bunx nx build network-brain-service
bunx nx build network-plugin
```

Expected: all builds pass. Record any pre-existing failure before continuing; do not
mix unrelated baseline repairs into refresh commits.

---

### Task 1: Add shared refresh contracts and canonical comparison helpers

**Files:**

-   Create: `packages/learn-card-types/src/credential-refresh.ts`
-   Modify: `packages/learn-card-types/src/index.ts`
-   Create: `packages/learn-card-helpers/src/credential-refresh.ts`
-   Create: `packages/learn-card-helpers/test/credential-refresh.test.ts`
-   Modify: `packages/learn-card-helpers/src/index.ts`

**Interfaces:**

-   Produces: `ManagedCredentialRefreshServiceValidator`
-   Produces: allocation, publication, version-history, challenge, envelope, and result
    Zod schemas plus inferred public types
-   Produces: `getSupportedRefreshService(vc)`
-   Produces: `getCredentialIssuerId(vc)` and `getCredentialEffectiveTime(vc)`
-   Produces: deterministic canonicalization and a proof-insensitive content comparator

-   [ ] **Step 1: Write failing helper tests**

Cover VCDM 1.1 `issuanceDate`, VCDM 2.0 `validFrom`, string/object issuers, single/array
refresh services, unsupported-first/supported-second selection, recursive object-key
ordering, preserved array ordering, and proof-insensitive equality.

-   [ ] **Step 2: Run the focused helper test and verify RED**

Run:

```bash
bun --cwd packages/learn-card-helpers test -- --runInBand test/credential-refresh.test.ts
```

Expected: FAIL because the module and exports do not exist.

-   [ ] **Step 3: Define permissive and managed schemas**

Keep the existing generic `RefreshServiceValidator` permissive. Add a managed subtype
that requires `id`, `type: z.literal('1EdTechCredentialRefresh')`, and an optional
LearnCard authorization descriptor. Model public and JWE response envelopes as a
discriminated union. Model refresh outcomes as `updated`, `unchanged`, `unsupported`,
or `failed`, with safe machine-readable reason codes and no raw response body.

-   [ ] **Step 4: Implement canonical helpers**

Recursively sort object keys, preserve array order, and exclude only `proof` for the
generic changed-content comparison. Normalize issuer objects to their `id`. Treat an
array as ordered and select the first entry whose type is supported.

-   [ ] **Step 5: Verify GREEN and package builds**

Run:

```bash
bun --cwd packages/learn-card-helpers test -- --runInBand test/credential-refresh.test.ts
bunx nx build types
bunx nx build helpers
```

Expected: focused tests and both builds pass.

-   [ ] **Step 6: Commit the contracts**

Run:

```bash
git add packages/learn-card-types/src/credential-refresh.ts packages/learn-card-types/src/index.ts packages/learn-card-helpers/src/credential-refresh.ts packages/learn-card-helpers/test/credential-refresh.test.ts packages/learn-card-helpers/src/index.ts
git commit -m "feat: add credential refresh contracts"
```

---

### Task 2: Add provisional CLR refresh fixtures

**Files:**

-   Create: `packages/credential-library/src/fixtures/clr/provisional-transcript.ts`
-   Modify: `packages/credential-library/src/fixtures/index.ts`
-   Modify: `packages/credential-library/src/__tests__/registry.test.ts`
-   Modify: `packages/credential-library/src/__tests__/issuance.test.ts` only if the
    existing auto-discovery test requires an explicit assertion

**Interfaces:**

-   Produces fixture `clr/provisional-transcript`
-   Produces deterministic provisional and final variants sharing one credential ID

-   [ ] **Step 1: Add a failing registry assertion**

Assert the fixture is discoverable as valid CLR 2.0, includes a
`1EdTechCredentialRefresh` service, and can be prepared with a patched issuer, holder,
refresh URL, stable ID, and provisional/final status.

-   [ ] **Step 2: Run the fixture tests and verify RED**

Run: `bun --cwd packages/credential-library test -- src/__tests__/registry.test.ts`

Expected: FAIL because `clr/provisional-transcript` is absent.

-   [ ] **Step 3: Add and register the fixture**

Use the cached CLR context already supported by DIDKit. Keep the initial credential
provisional and expose a factory or patch set for the final version without changing
the credential ID, issuer, or subject.

-   [ ] **Step 4: Verify registry and real issuance**

Run:

```bash
bun --cwd packages/credential-library test -- src/__tests__/registry.test.ts src/__tests__/issuance.test.ts
```

Expected: schema validation and DIDKit issuance pass for every valid fixture.

-   [ ] **Step 5: Commit the fixture**

Run:

```bash
git add packages/credential-library/src/fixtures/clr/provisional-transcript.ts packages/credential-library/src/fixtures/index.ts packages/credential-library/src/__tests__
git commit -m "test: add provisional CLR refresh fixture"
```

---

### Task 3: Implement the generic holder refresh primitive

**Files:**

-   Create: `packages/plugins/vc/src/refreshCredential.ts`
-   Create: `packages/plugins/vc/src/refreshCredential.test.ts`
-   Modify: `packages/plugins/vc/src/types.ts`
-   Modify: `packages/plugins/vc/src/vc.ts`
-   Modify: `packages/plugins/vc/src/index.ts`
-   Modify: `packages/plugins/vc/package.json`

**Interfaces:**

-   Produces: `learnCard.invoke.refreshCredential(vc, options?)`
-   Consumes optional `decryptDagJwe` and existing `getDidAuthVp`
-   Returns a typed result; performs no storage or index mutation

-   [ ] **Step 1: Write failing public-service tests**

Mock `fetch` and proof verification. Cover public GET success, unchanged ETag (`304`),
unsupported service, endpoint failure, timeout, invalid JSON, wrong content type,
oversized streaming response, invalid proof, changed ID, changed issuer, changed holder,
strictly older timestamp, equal timestamp with changed content, and no timestamp with
changed content.

-   [ ] **Step 2: Run the public tests and verify RED**

Run:

```bash
bun --cwd packages/plugins/vc test -- --runInBand src/refreshCredential.test.ts
```

Expected: FAIL because `refreshCredential` is not registered.

-   [ ] **Step 3: Implement safe public fetching**

Validate URLs before fetch. In Node-capable environments resolve DNS and reject every
private/loopback/link-local answer; in browsers reject unsafe host literals and rely on
the platform plus CORS for host resolution. Disable automatic redirect following,
validate every redirect target, cap redirects, apply an abort timeout, count streaming
bytes, and accept only the documented VC/JWT/JWE JSON media types.

-   [ ] **Step 4: Implement verification and freshness rules**

Verify the current VC first. Parse the response, decrypt a managed JWE only when the
optional capability exists, verify the replacement proof, then enforce stable ID,
issuer, holder, and non-regressing effective time. Compare proof-insensitive canonical
content to distinguish `updated` from `unchanged`.

-   [ ] **Step 5: Add failing managed challenge tests**

Mock an initial `401` carrying `WWW-Authenticate` challenge/domain parameters, assert
that a DID-auth VP is created, retry uses `Authorization: Bearer`, and a returned JWE is
decrypted before verification. Cover malformed/replayed challenges and missing decrypt
capability.

-   [ ] **Step 6: Implement the managed challenge retry**

Allow exactly one authenticated retry. Bind the VP audience/domain and challenge to the
server values. Never include the current credential or claims in request headers or
logs.

-   [ ] **Step 7: Verify the full matrix and build**

Run:

```bash
bun --cwd packages/plugins/vc test -- --runInBand src/refreshCredential.test.ts
bunx nx build vc-plugin
```

Expected: all public and managed tests pass and declarations build.

-   [ ] **Step 8: Commit the SDK primitive**

Run:

```bash
git add packages/plugins/vc
git commit -m "feat: refresh credentials from compatible services"
```

---

### Task 4: Model the managed refresh aggregate and immutable versions

**Files:**

-   Create: `services/learn-card-network/brain-service/src/models/CredentialRefresh.ts`
-   Modify: `services/learn-card-network/brain-service/src/models/index.ts`
-   Create: `services/learn-card-network/brain-service/src/types/credential-refresh.ts`
-   Create: `services/learn-card-network/brain-service/src/accesslayer/credential-refresh/create.ts`
-   Create: `services/learn-card-network/brain-service/src/accesslayer/credential-refresh/read.ts`
-   Create: `services/learn-card-network/brain-service/src/accesslayer/credential-refresh/update.ts`
-   Create: `services/learn-card-network/brain-service/src/accesslayer/credential-refresh/index.ts`
-   Create: `services/learn-card-network/brain-service/test/credential-refresh-model.spec.ts`

**Interfaces:**

-   Produces unique `CredentialRefresh.refreshId`
-   Produces `ISSUED_REFRESH`, `HELD_REFRESH`, `ROOT`, `HEAD`, and `REFRESHED_TO`
    relationships
-   Produces optimistic compare-and-advance operation on `currentVersion`

-   [ ] **Step 1: Write failing model/access-layer tests**

Assert random IDs are unique, issuer/holder relationships are required, credential ID
is stable, root/head start at version 1, duplicate refresh IDs fail, version nodes are
immutable, and concurrent compare-and-advance permits exactly one writer.

-   [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
bun --cwd services/learn-card-network/brain-service test -- run test/credential-refresh-model.spec.ts
```

Expected: FAIL because the model is not registered.

-   [ ] **Step 3: Implement the model and indexes**

Persist metadata only: IDs, DIDs/profile IDs, state, monotonic version, ETag, keyed
material digest, timestamps, signing mode, idempotency key, safe update summary, and
notification window keys. Credential version nodes contain holder-encrypted JWE JSON,
not plaintext VC JSON.

-   [ ] **Step 4: Implement transactional compare-and-advance**

Create the immutable new Credential node and `REFRESHED_TO` edge, then update `HEAD`
and version only when the previously read version still matches. Make the idempotency
key unique per aggregate and return the prior successful result on retry.

-   [ ] **Step 5: Verify and commit**

Run:

```bash
bun --cwd services/learn-card-network/brain-service test -- run test/credential-refresh-model.spec.ts
bunx nx build network-brain-service
git add services/learn-card-network/brain-service/src/models services/learn-card-network/brain-service/src/types/credential-refresh.ts services/learn-card-network/brain-service/src/accesslayer/credential-refresh services/learn-card-network/brain-service/test/credential-refresh-model.spec.ts
git commit -m "feat: model managed credential refresh versions"
```

---

### Task 5: Allocate refresh services and send the original holder-only JWE

**Files:**

-   Create: `services/learn-card-network/brain-service/src/helpers/credential-refresh.helpers.ts`
-   Create: `services/learn-card-network/brain-service/src/routes/credential-refreshes.ts`
-   Modify: `services/learn-card-network/brain-service/src/helpers/learnCard.helpers.ts`
-   Modify: `services/learn-card-network/brain-service/src/app.ts`
-   Create: `services/learn-card-network/brain-service/test/credential-refresh-allocation.spec.ts`

**Interfaces:**

-   Produces tRPC `credentialRefresh.allocateCredentialRefresh`
-   Produces tRPC `credentialRefresh.sendRefreshableCredential`
-   Produces holder-only `createDagJweForRecipients(cleartext, [holderDid])`

-   [ ] **Step 1: Write failing allocation tests**

Assert allocation requires an authenticated issuer, an existing recipient profile, and
a stable nonempty credential ID. Assert it returns an unguessable service URL with
`type: '1EdTechCredentialRefresh'` and the LearnCard auth descriptor.

-   [ ] **Step 2: Write failing managed-send tests**

Assert the submitted signed credential has the allocated service, same issuer, same
holder, and same credential ID. Assert its proof verifies, brain handles plaintext only
within the request, stored Credential JSON is a JWE, the holder can decrypt it, and the
brain DID cannot decrypt it. Assert validation errors create no nodes or relationships.

-   [ ] **Step 3: Run the tests and verify RED**

Run:

```bash
bun --cwd services/learn-card-network/brain-service test -- run test/credential-refresh-allocation.spec.ts
```

Expected: FAIL because both procedures are absent.

-   [ ] **Step 4: Expose an exact-recipient DIDKit encryption helper**

Use the lower-level DIDKit plugin method, bypassing the Encryption convenience method
that adds the caller DID. Keep the helper private to brain-service except for its narrow
exact-recipient interface.

-   [ ] **Step 5: Implement allocate and managed send**

Allocation creates an `awaiting_claim` aggregate without a body. Managed send verifies
and encrypts the original, creates the normal sent relationship plus aggregate root/head
bindings, and records version 1. Do not call the legacy storage helper that persists
plaintext credentials.

-   [ ] **Step 6: Verify and commit**

Run:

```bash
bun --cwd services/learn-card-network/brain-service test -- run test/credential-refresh-allocation.spec.ts
bunx nx build network-brain-service
git add services/learn-card-network/brain-service/src/helpers/credential-refresh.helpers.ts services/learn-card-network/brain-service/src/helpers/learnCard.helpers.ts services/learn-card-network/brain-service/src/routes/credential-refreshes.ts services/learn-card-network/brain-service/src/app.ts services/learn-card-network/brain-service/test/credential-refresh-allocation.spec.ts
git commit -m "feat: allocate and send refreshable credentials"
```

---

### Task 6: Publish issuer-signed and signing-authority versions

**Files:**

-   Modify: `services/learn-card-network/brain-service/src/routes/credential-refreshes.ts`
-   Modify: `services/learn-card-network/brain-service/src/helpers/credential-refresh.helpers.ts`
-   Modify: `services/learn-card-network/brain-service/src/helpers/signingAuthority.helpers.ts`
-   Create: `services/learn-card-network/brain-service/src/helpers/credential-refresh-materiality.helpers.ts`
-   Create: `services/learn-card-network/brain-service/test/credential-refresh-publication.spec.ts`

**Interfaces:**

-   Produces tRPC `credentialRefresh.publishCredentialRefresh`
-   Produces issuer-signed and signing-authority discriminated input modes
-   Produces tRPC `credentialRefresh.getCredentialRefreshHistory`

-   [ ] **Step 1: Write failing publication tests**

Cover issuer authorization, proof validation, ID/issuer/holder/service invariants,
idempotent retry, immutable old head, monotonic version, concurrent publication,
strictly older effective time, equal/missing timestamps, safe summaries, and metadata-
only issuer history.

-   [ ] **Step 2: Write signing-authority tests**

Assert an unsigned body can be signed through an owned signing authority, the existing
`credentialStatus` value is preserved, no new status-list entry is allocated, and the
result passes the same invariants as issuer-signed input.

-   [ ] **Step 3: Run and verify RED**

Run:

```bash
bun --cwd services/learn-card-network/brain-service test -- run test/credential-refresh-publication.spec.ts
```

Expected: FAIL because publication and history do not exist.

-   [ ] **Step 4: Add opt-out to signing-authority status allocation**

Add `appendCredentialStatus?: boolean` with default `true` to preserve every current
caller. Managed refresh calls it with `false` and verifies any existing descriptor is
unchanged.

-   [ ] **Step 5: Implement publication**

Verify/sign transient plaintext, compute an HMAC over the canonical user-visible
projection using the dedicated secret, encrypt to holder only, derive an opaque ETag
from stored encrypted bytes, and transactionally advance the aggregate. Never include
credential content in exception messages, tracing attributes, or logs.

-   [ ] **Step 6: Implement issuer history**

Return version, effective date, publication date, ETag, signing mode, safe summary, and
outcome only. Do not expose JWE or subject/body fields to the issuer history procedure.

-   [ ] **Step 7: Verify and commit**

Run:

```bash
bun --cwd services/learn-card-network/brain-service test -- run test/credential-refresh-publication.spec.ts
bunx nx build network-brain-service
git add services/learn-card-network/brain-service/src/routes/credential-refreshes.ts services/learn-card-network/brain-service/src/helpers/credential-refresh.helpers.ts services/learn-card-network/brain-service/src/helpers/credential-refresh-materiality.helpers.ts services/learn-card-network/brain-service/src/helpers/signingAuthority.helpers.ts services/learn-card-network/brain-service/test/credential-refresh-publication.spec.ts
git commit -m "feat: publish managed credential refresh versions"
```

---

### Task 7: Serve authenticated current and historical versions

**Files:**

-   Create: `services/learn-card-network/brain-service/src/credential-refresh.ts`
-   Create: `services/learn-card-network/brain-service/src/helpers/credential-refresh-auth.helpers.ts`
-   Modify: `services/learn-card-network/brain-service/src/index.ts`
-   Modify: `services/learn-card-network/brain-service/src/docker-entry.ts`
-   Modify: `services/learn-card-network/brain-service/lambda.ts`
-   Modify: `services/learn-card-network/brain-service/serverless.yml`
-   Modify: `services/learn-card-network/brain-service/serverless-local.yml`
-   Modify: `services/learn-card-network/brain-service/.env.example`
-   Create: `services/learn-card-network/brain-service/test/credential-refresh-endpoint.spec.ts`

**Interfaces:**

-   Produces `GET /refresh/:refreshId`
-   Produces `GET /refresh/:refreshId/history`
-   Produces `GET /refresh/:refreshId/versions/:version`
-   Uses DID-auth `401` challenge then bearer VP retry

-   [ ] **Step 1: Write failing authentication/privacy tests**

Assert the first request returns a fresh challenge without revealing whether an ID
exists. Assert missing, malformed, expired, wrong-domain, wrong-challenge, replayed,
wrong-holder, and valid-holder VPs. Assert authentication occurs before ETag, history,
revocation, or not-found distinctions.

-   [ ] **Step 2: Write failing response tests**

Assert active holders receive the current holder-encrypted JWE and ETag; matching
`If-None-Match` returns authenticated `304`; authenticated history is metadata only;
version fetch returns a historical holder-encrypted JWE; revoked returns authenticated
`410`; awaiting-claim never serves. Assert CORS, content type, and `private, no-store`.

-   [ ] **Step 3: Run and verify RED**

Run:

```bash
bun --cwd services/learn-card-network/brain-service test -- run test/credential-refresh-endpoint.spec.ts
```

Expected: FAIL because routes are not registered.

-   [ ] **Step 4: Implement challenge verification and rate limits**

Reuse challenge cache primitives. Invalidate a challenge after successful verification.
Apply a coarse source-IP/refresh-ID limit before auth and a holder-DID/refresh-ID limit
after auth. Log only opaque IDs, result codes, latency, and version.

-   [ ] **Step 5: Register Fastify, Lambda, local, and serverless routes**

Register identical handlers for Docker and Lambda deployments, include GET and OPTIONS,
and gate registration with `CREDENTIAL_REFRESH_ENABLED`. Validate required HMAC secret
at startup when enabled.

-   [ ] **Step 6: Verify endpoint and deployment configuration**

Run:

```bash
bun --cwd services/learn-card-network/brain-service test -- run test/credential-refresh-endpoint.spec.ts
bunx nx build network-brain-service
git diff --check
```

Expected: route tests and build pass; all three paths are represented in deployment
configuration.

-   [ ] **Step 7: Commit the endpoint**

Run:

```bash
git add services/learn-card-network/brain-service/src/credential-refresh.ts services/learn-card-network/brain-service/src/helpers/credential-refresh-auth.helpers.ts services/learn-card-network/brain-service/src/index.ts services/learn-card-network/brain-service/src/docker-entry.ts services/learn-card-network/brain-service/lambda.ts services/learn-card-network/brain-service/serverless.yml services/learn-card-network/brain-service/serverless-local.yml services/learn-card-network/brain-service/.env.example services/learn-card-network/brain-service/test/credential-refresh-endpoint.spec.ts
git commit -m "feat: serve authenticated credential refresh versions"
```

---

### Task 8: Couple claim and revocation lifecycle safely

**Files:**

-   Modify: `services/learn-card-network/brain-service/src/routes/credentials.ts`
-   Modify: `services/learn-card-network/brain-service/src/routes/boosts.ts`
-   Modify: `services/learn-card-network/brain-service/src/helpers/credential-refresh.helpers.ts`
-   Modify: `services/learn-card-network/brain-service/src/credential-refresh.ts`
-   Create: `services/learn-card-network/brain-service/test/credential-refresh-lifecycle.spec.ts`

**Interfaces:**

-   Acceptance activates a matching `awaiting_claim` aggregate idempotently
-   Revocation disables current and historical remote serving
-   Endpoint authorization cross-checks actual received relationship state

-   [ ] **Step 1: Write failing lifecycle tests**

Cover publish before claim, accept twice, accept followed by endpoint read, activation
write failure followed by lazy endpoint reconciliation, revoked sent/received status,
and already-revoked retry. Assert old local encrypted blobs are not deleted by server
lifecycle changes.

-   [ ] **Step 2: Run and verify RED**

Run:

```bash
bun --cwd services/learn-card-network/brain-service test -- run test/credential-refresh-lifecycle.spec.ts
```

Expected: FAIL because lifecycle hooks are absent.

-   [ ] **Step 3: Implement idempotent activation and fail-closed serving**

Update aggregate state after normal acceptance succeeds. To avoid a dual-write outage,
the endpoint must verify the canonical CREDENTIAL_RECEIVED relationship and may lazily
repair stale aggregate state. Never serve solely because the aggregate says `active`.

-   [ ] **Step 4: Implement revocation coupling**

Set the aggregate to revoked from existing revocation paths, and independently check
canonical credential relationship/status state on each endpoint request. Keep existing
status notification behavior unchanged.

-   [ ] **Step 5: Verify and commit**

Run:

```bash
bun --cwd services/learn-card-network/brain-service test -- run test/credential-refresh-lifecycle.spec.ts test/credentials.spec.ts test/bitstring-status-list.spec.ts
bunx nx build network-brain-service
git add services/learn-card-network/brain-service/src/routes/credentials.ts services/learn-card-network/brain-service/src/routes/boosts.ts services/learn-card-network/brain-service/src/helpers/credential-refresh.helpers.ts services/learn-card-network/brain-service/src/credential-refresh.ts services/learn-card-network/brain-service/test/credential-refresh-lifecycle.spec.ts
git commit -m "feat: enforce credential refresh lifecycle"
```

---

### Task 9: Expose managed refresh through the network plugin

**Files:**

-   Modify: `packages/plugins/learn-card-network/src/types.ts`
-   Modify: `packages/plugins/learn-card-network/src/plugin.ts`
-   Modify: `packages/plugins/learn-card-network/src/test/index.test.ts`

**Interfaces:**

-   Produces `allocateCredentialRefresh`
-   Produces `sendRefreshableCredential`
-   Produces `publishCredentialRefresh`
-   Produces `getCredentialRefreshHistory`
-   Adds `enableRefresh?: boolean` to supported `sendBoost` object options

-   [ ] **Step 1: Write failing plugin delegation tests**

Assert typed inputs reach each tRPC procedure, typed results are returned, and
`sendBoost({ enableRefresh: true })` generates a stable UUID credential ID when absent,
allocates before signing, injects the service, and uses the dedicated managed-send
procedure instead of legacy credential storage.

-   [ ] **Step 2: Run and verify RED**

Run:

```bash
bun --cwd packages/plugins/learn-card-network test -- --runInBand src/test/index.test.ts
```

Expected: FAIL because methods/options do not exist.

-   [ ] **Step 3: Implement explicit and convenience APIs**

Keep allocate/inject/sign/send available as the advanced flow. Make the convenience
flag use the same primitives and force holder-only managed storage. Preserve every
legacy `sendBoost` path when `enableRefresh` is false or absent.

-   [ ] **Step 4: Verify and commit**

Run:

```bash
bun --cwd packages/plugins/learn-card-network test -- --runInBand src/test/index.test.ts
bunx nx build network-plugin
git add packages/plugins/learn-card-network/src/types.ts packages/plugins/learn-card-network/src/plugin.ts packages/plugins/learn-card-network/src/test/index.test.ts
git commit -m "feat: expose managed credential refresh APIs"
```

---

### Task 10: Replace a LearnCloud credential in place with rollback safety

**Files:**

-   Modify: `packages/learn-card-base/src/types/credential-records.ts`
-   Create: `packages/learn-card-base/src/helpers/credentialRefresh.ts`
-   Create: `packages/learn-card-base/src/helpers/credentialRefresh.test.ts`
-   Create: `packages/learn-card-base/src/react-query/mutations/credentialRefresh.ts`
-   Modify: the mutation barrel export used by `learn-card-base`

**Interfaces:**

-   Produces encrypted `CredentialRefreshMetadata` on the same LearnCloud index record
-   Produces `refreshLearnCloudCredential({ wallet, record, force })`
-   Maintains a per-record in-flight mutex

-   [ ] **Step 1: Write failing replacement tests**

Cover unchanged response, successful replacement, same index record ID, old URI appended
once to history, new URI current, ETag/check timestamps, unread update, concurrent
calls coalesced, upload failure, update failure, stale input record, and a final re-read
that detects another device has already advanced.

-   [ ] **Step 2: Run and verify RED**

Run:

```bash
bun --cwd packages/learn-card-base test -- src/helpers/credentialRefresh.test.ts
```

Expected: FAIL because the helper is absent.

-   [ ] **Step 3: Implement the transactional ordering**

Read current record, resolve its VC, call the generic refresh primitive, upload the new
encrypted VC, re-read the index record, and update that same record only if it still
points at the expected URI/version. On a detected newer head, treat the local result as
superseded. On failure before index update, leave the old record intact and best-effort
delete only the new unindexed upload; never delete a URI referenced by history.

-   [ ] **Step 4: Maintain app-local URI state**

After a successful index update, replace the old URI with the new URI in
`newCredsStore` and invalidate credential/index queries. Clear it only after persistence
succeeds.

-   [ ] **Step 5: Verify and commit**

Run:

```bash
bun --cwd packages/learn-card-base test -- src/helpers/credentialRefresh.test.ts
bunx nx build learn-card-base
git add packages/learn-card-base/src/types/credential-records.ts packages/learn-card-base/src/helpers/credentialRefresh.ts packages/learn-card-base/src/helpers/credentialRefresh.test.ts packages/learn-card-base/src/react-query/mutations/credentialRefresh.ts packages/learn-card-base/src
git commit -m "feat: replace refreshed credentials in place"
```

Before committing, inspect `git diff --cached --name-only`; the broad final path is only
to include the precise barrel file discovered during implementation.

---

### Task 11: Refresh stale credentials on foreground events

**Files:**

-   Create: `packages/learn-card-base/src/react-query/queries/credentialRefresh.ts`
-   Create: `apps/learn-card-app/src/components/credential-refresh-listener/CredentialRefreshListener.tsx`
-   Create: `apps/learn-card-app/src/components/credential-refresh-listener/CredentialRefreshListener.test.tsx`
-   Modify: `apps/learn-card-app/src/FullApp.tsx`

**Interfaces:**

-   Ordinary scan runs once per app session and only for records stale by 24 hours
-   App launch/focus scans stale candidates
-   Detail view and notification paths may call the same mutation with `force: true`

-   [ ] **Step 1: Write failing lifecycle tests**

Mock Capacitor `appStateChange`, document visibility, focus, feature flags, and the
refresh mutation. Assert initial foreground scan, one ordinary scan per session,
24-hour staleness, ignored background events, unmounted listener cleanup, per-record
failure isolation, and no work when the flag is disabled.

-   [ ] **Step 2: Run and verify RED**

Run:

```bash
bun --cwd apps/learn-card-app test:unit -- src/components/credential-refresh-listener/CredentialRefreshListener.test.tsx
```

Expected: FAIL because the listener is absent.

-   [ ] **Step 3: Implement candidate discovery and foreground scheduling**

Read encrypted LearnCloud index records, identify supported services from metadata or a
lazy credential read, and process with bounded concurrency. Store only per-session
process memory plus encrypted record timestamps; do not create a server scheduler.

-   [ ] **Step 4: Mount the listener and add detail-view forced entry point**

Mount beside existing app-level listeners in `FullApp.tsx`. Export a forced mutation
that detail and notification handlers can reuse. Do not add manual or pull-to-refresh
UI in this ticket set.

-   [ ] **Step 5: Verify and commit**

Run:

```bash
bun --cwd apps/learn-card-app test:unit -- src/components/credential-refresh-listener/CredentialRefreshListener.test.tsx
bunx nx build learn-card-app
git add packages/learn-card-base/src/react-query/queries/credentialRefresh.ts apps/learn-card-app/src/components/credential-refresh-listener apps/learn-card-app/src/FullApp.tsx
git commit -m "feat: refresh stale credentials on foreground"
```

---

### Task 12: Compute material changes and enqueue opaque refresh events

**Files:**

-   Modify: `packages/learn-card-types/src/lcn.ts`
-   Modify: `services/learn-card-network/brain-service/src/helpers/credential-refresh-materiality.helpers.ts`
-   Modify: `services/learn-card-network/brain-service/src/helpers/notifications.helpers.ts`
-   Modify: `services/learn-card-network/brain-service/src/routes/credential-refreshes.ts`
-   Create: `services/learn-card-network/brain-service/test/credential-refresh-notifications.spec.ts`

**Interfaces:**

-   Adds `NotificationTypeEnum.CREDENTIAL_REFRESHED`
-   Publication accepts `notifyHolder?: boolean`
-   Event carries opaque `refreshId`, version, route key, and delivery-window key only

-   [ ] **Step 1: Write failing materiality tests**

Assert claim/title/description/evidence/attachment/visible-expiration changes are
material. Assert proof, IDs, issuance-only dates, `refreshService`, and
`credentialStatus` descriptor changes are not. Assert `true` forces and `false`
suppresses regardless of automatic classification.

-   [ ] **Step 2: Write failing event privacy/window tests**

Assert no subject/body/title/summary content leaves brain-service; first material update
in a window enqueues an event; repeats reuse the same delivery key; a new configured
window creates a new key; nonmaterial updates enqueue nothing.

-   [ ] **Step 3: Run and verify RED**

Run:

```bash
bun --cwd services/learn-card-network/brain-service test -- run test/credential-refresh-notifications.spec.ts
```

Expected: FAIL because the enum and event path are absent.

-   [ ] **Step 4: Implement canonical user-visible projection and event emission**

Use a documented allowlist/denylist projection and server-keyed HMAC. Make event enqueue
best-effort after durable publication, record its result for retry/observability, and
never roll back a published credential because notification delivery failed.

-   [ ] **Step 5: Verify and commit**

Run:

```bash
bun --cwd services/learn-card-network/brain-service test -- run test/credential-refresh-notifications.spec.ts
bunx nx build types
bunx nx build network-brain-service
git add packages/learn-card-types/src/lcn.ts services/learn-card-network/brain-service/src/helpers/credential-refresh-materiality.helpers.ts services/learn-card-network/brain-service/src/helpers/notifications.helpers.ts services/learn-card-network/brain-service/src/routes/credential-refreshes.ts services/learn-card-network/brain-service/test/credential-refresh-notifications.spec.ts
git commit -m "feat: emit privacy-safe credential refresh events"
```

---

### Task 13: Collapse repeated refreshes into one unread notification

**Files:**

-   Modify: `services/learn-card-network/lca-api/src/accesslayer/notifications/index.ts`
-   Create or modify: the focused notification create/update access-layer file under
    `services/learn-card-network/lca-api/src/accesslayer/notifications/`
-   Modify: `services/learn-card-network/lca-api/src/routes/notifications.ts`
-   Modify: `services/learn-card-network/lca-api/test/notifications.spec.ts`

**Interfaces:**

-   Produces atomic `upsertCredentialRefreshNotification`
-   Unique key: recipient DID + notification type + opaque delivery key
-   Push occurs only when the upsert inserts a new delivery-window record

-   [ ] **Step 1: Write failing atomic-collapse tests**

Cover first insert, repeat updates the same notification and marks it unread, repeat
does not push, new window inserts and pushes, two concurrent first deliveries result in
one record/one push, and existing non-refresh notification semantics remain unchanged.

-   [ ] **Step 2: Run and verify RED**

Run:

```bash
bun --cwd services/learn-card-network/lca-api test -- run test/notifications.spec.ts
```

Expected: new collapse assertions fail.

-   [ ] **Step 3: Add the partial unique index and atomic upsert**

Use one Mongo `updateOne(..., { upsert: true })` keyed by type, recipient DID, and
`data.metadata.deliveryKey`. Use the insert result to decide push delivery. Store only
generic translated message keys/copy plus opaque metadata.

-   [ ] **Step 4: Sequence database then push for refresh only**

For refresh events, await the upsert and send push only after a successful insert. Keep
the current parallel behavior for other notification types to limit regression scope.

-   [ ] **Step 5: Verify and commit**

Run:

```bash
bun --cwd services/learn-card-network/lca-api test -- run test/notifications.spec.ts
bunx nx build lca-api-service
git add services/learn-card-network/lca-api/src/accesslayer/notifications services/learn-card-network/lca-api/src/routes/notifications.ts services/learn-card-network/lca-api/test/notifications.spec.ts
git commit -m "feat: collapse credential refresh notifications"
```

---

### Task 14: Route refresh notification taps through a forced secure fetch

**Files:**

-   Modify: `packages/learn-card-base/src/helpers/pushNotificationHelpers.ts`
-   Create: `packages/learn-card-base/src/helpers/pushNotificationHelpers.test.ts`
-   Create: `apps/learn-card-app/src/components/notifications/notificationsV2/NotificationCredentialRefreshedCard.tsx`
-   Create: `apps/learn-card-app/src/components/notifications/notificationsV2/NotificationCredentialRefreshedCard.test.tsx`
-   Modify: `apps/learn-card-app/src/components/notifications/notificationsV2/NotificationCardContainer.tsx`

**Interfaces:**

-   Push route: `/notifications?refreshId=<opaque>&refresh=true`
-   Notification tap force-refreshes, then opens the current credential detail

-   [ ] **Step 1: Write failing push-route tests**

Assert the new type maps to a claim-free path and generic message. Assert route values
are URL encoded and unrecognized/malformed data falls back safely.

-   [ ] **Step 2: Write failing card interaction tests**

Assert tap locates a record by encrypted refresh metadata, invokes forced refresh,
opens the newest current URI on success, opens the existing current URI with friendly
feedback on failure, and never renders subject data from notification payload.

-   [ ] **Step 3: Run and verify RED**

Run:

```bash
bun --cwd packages/learn-card-base test -- src/helpers/pushNotificationHelpers.test.ts
bun --cwd apps/learn-card-app test:unit -- src/components/notifications/notificationsV2/NotificationCredentialRefreshedCard.test.tsx
```

Expected: both focused suites fail because mappings/components are absent.

-   [ ] **Step 4: Implement safe routing and the notification card**

Use existing notification-card structure and query invalidation. User copy should say a
credential was updated, not identify it before authenticated retrieval. Show contextual
loading and a friendly connection error using approved design tokens.

-   [ ] **Step 5: Verify and commit**

Run:

```bash
bun --cwd packages/learn-card-base test -- src/helpers/pushNotificationHelpers.test.ts
bun --cwd apps/learn-card-app test:unit -- src/components/notifications/notificationsV2/NotificationCredentialRefreshedCard.test.tsx
git add packages/learn-card-base/src/helpers/pushNotificationHelpers.ts packages/learn-card-base/src/helpers/pushNotificationHelpers.test.ts apps/learn-card-app/src/components/notifications/notificationsV2/NotificationCredentialRefreshedCard.tsx apps/learn-card-app/src/components/notifications/notificationsV2/NotificationCredentialRefreshedCard.test.tsx apps/learn-card-app/src/components/notifications/notificationsV2/NotificationCardContainer.tsx
git commit -m "feat: handle credential refresh notifications"
```

---

### Task 15: Add the Updated indicator and previous-version history UI

**Files:**

-   Create: `apps/learn-card-app/src/components/credentials/credential-history/CredentialHistoryModal.tsx`
-   Create: `apps/learn-card-app/src/components/credentials/credential-history/CredentialHistoryModal.test.tsx`
-   Modify: `apps/learn-card-app/src/components/boost/boost-earned-card/BoostEarnedCard.tsx`
-   Modify: `apps/learn-card-app/src/components/boost/hooks/useBoostMenu.tsx`
-   Modify: `apps/learn-card-app/src/components/boost/boost-options-menu/BoostOptionsMenu.tsx`
-   Modify: `apps/learn-card-app/public/locales/en/translation.json`
-   Modify: `apps/learn-card-app/public/locales/es/translation.json`
-   Modify: `apps/learn-card-app/public/locales/fr/translation.json`
-   Modify: `apps/learn-card-app/public/locales/ar/translation.json`

**Interfaces:**

-   Shows `Updated` until the current version is first viewed
-   Adds `View Previous Versions` only when encrypted local history exists
-   Managed remote history is optional enrichment; local history remains usable offline

-   [ ] **Step 1: Write failing UI tests**

Assert the indicator appears from `unreadUpdate`, clears only after a successful detail
open and persisted metadata update, history action is conditional, modal orders newest
to oldest, unavailable historical blobs show friendly copy, and revoked credentials
retain locally stored history.

-   [ ] **Step 2: Run and verify RED**

Run:

```bash
bun --cwd apps/learn-card-app test:unit -- src/components/credentials/credential-history/CredentialHistoryModal.test.tsx
```

Expected: FAIL because UI is absent.

-   [ ] **Step 3: Implement the modal through the shared surface**

Open through `useModal`/`AppModal`; do not add raw `IonModal` or safe-area logic. Use
grayscale/emerald tokens, pill buttons, contextual loading, and local encrypted URIs.
Do not offer restore or share actions for historical versions in Phase 1.

-   [ ] **Step 4: Implement indicator clearing and menu entry**

Persist `unreadUpdate: false` on the same encrypted index record only after the latest
credential can be rendered. Keep an update date after the pill disappears.

-   [ ] **Step 5: Add all four translations and validate catalogs**

Run:

```bash
bun --cwd apps/learn-card-app i18n:check-keys
bun --cwd apps/learn-card-app check:i18n-imports
```

Expected: all locale keys exist and catalogs remain structurally aligned.

-   [ ] **Step 6: Verify and commit**

Run:

```bash
bun --cwd apps/learn-card-app test:unit -- src/components/credentials/credential-history/CredentialHistoryModal.test.tsx
bunx nx build learn-card-app
git add apps/learn-card-app/src/components/credentials/credential-history apps/learn-card-app/src/components/boost/boost-earned-card/BoostEarnedCard.tsx apps/learn-card-app/src/components/boost/hooks/useBoostMenu.tsx apps/learn-card-app/src/components/boost/boost-options-menu/BoostOptionsMenu.tsx apps/learn-card-app/public/locales
git commit -m "feat: show credential refresh history"
```

---

### Task 16: Add the provisional-to-final demo and cross-service E2E test

**Files:**

-   Create: `examples/credential-viewer/src/components/ManagedRefreshPanel.tsx`
-   Create: the corresponding component test beside the viewer's existing tests
-   Modify: `examples/credential-viewer/src/App.tsx`
-   Modify: `examples/credential-viewer/README.md`
-   Modify: `examples/credential-viewer/package.json`
-   Create: `tests/e2e/tests/credential-refresh.spec.ts`
-   Modify: focused E2E helper files only if setup cannot be expressed in the spec

**Interfaces:**

-   Demonstrates allocate -> issue provisional CLR -> claim -> publish final CLR
-   Proves same wallet record, history, notification collapse, and revocation behavior

-   [ ] **Step 1: Write the failing E2E scenario**

Create issuer and holder, allocate refresh, issue/send/accept the provisional CLR,
capture the LearnCloud record ID and URI, publish the final CLR with the same credential
ID, force holder refresh, then assert the record ID is unchanged, URI changed, old URI
is in history, and the latest claims are final.

-   [ ] **Step 2: Extend the scenario for notifications and revocation**

Publish twice inside one window and assert one in-app notification plus one push attempt;
advance/inject a new window and assert a new notification. Revoke, authenticate, assert
managed current/history endpoints return `410`, and assert local history still renders.

-   [ ] **Step 3: Run and verify RED**

Run:

```bash
bun --cwd tests/e2e test:run -- tests/credential-refresh.spec.ts
```

Expected: FAIL until every cross-service path and test environment variable is wired.

-   [ ] **Step 4: Add the viewer's focused test harness**

Add a `test` script using the workspace Vitest version and a component test that mocks
the wallet methods. Verify button loading, allocation-before-signing order, stable ID,
safe version output, final publication, and friendly failure states.

-   [ ] **Step 5: Build the viewer panel**

Use the shared fixture and explicit buttons for “Issue Provisional Transcript” and
“Publish Final Transcript.” Display only refresh ID, managed version, dates, and safe
outcomes; never log/display hidden credential subject fields as server diagnostics.

-   [ ] **Step 6: Make the smallest integration fixes required by E2E**

Fix only product paths exposed by the test. For each discovered bug, first add or narrow
a failing unit/integration assertion in the owning package, then implement the fix.

-   [ ] **Step 7: Verify demo and E2E, then commit**

Run:

```bash
bun --cwd examples/credential-viewer test
bun --cwd examples/credential-viewer build
bun --cwd tests/e2e test:run -- tests/credential-refresh.spec.ts
git add examples/credential-viewer tests/e2e/tests/credential-refresh.spec.ts tests/e2e
git commit -m "test: prove provisional credential refresh flow"
```

Before committing, inspect `git diff --cached --name-only` and unstage unrelated E2E
files.

---

### Task 17: Document, harden, and verify the complete ticket set

**Files:**

-   Create: `docs/how-to-guides/issue-and-refresh-a-managed-credential.md`
-   Create: `docs/core-concepts/credential-refresh.md`
-   Modify: `docs/SUMMARY.md`
-   Modify: package changelogs according to repository release policy
-   Inspect: every file changed from `origin/main`

**Interfaces:**

-   Documents explicit and convenience issuer APIs, holder behavior, privacy model,
    error semantics, flags, configuration, and Phase 1 limitations

-   [ ] **Step 1: Write the how-to and explanation pages**

Use `@learncard/init`, `learnCard.invoke.*`, runnable snippets, and relative GitBook
links. Spell out Verifiable Credential on first use. Include a Mermaid sequence diagram
for allocation, claim, publication, notification, and holder fetch. Document the 24-hour
default as configurable and foreground-only.

-   [ ] **Step 2: Run focused package suites**

Run:

```bash
bun --cwd packages/learn-card-helpers test -- --runInBand test/credential-refresh.test.ts
bun --cwd packages/credential-library test -- src/__tests__/registry.test.ts src/__tests__/issuance.test.ts
bun --cwd packages/plugins/vc test -- --runInBand src/refreshCredential.test.ts
bun --cwd services/learn-card-network/brain-service test -- run test/credential-refresh-model.spec.ts test/credential-refresh-allocation.spec.ts test/credential-refresh-publication.spec.ts test/credential-refresh-endpoint.spec.ts test/credential-refresh-lifecycle.spec.ts test/credential-refresh-notifications.spec.ts
bun --cwd packages/plugins/learn-card-network test -- --runInBand src/test/index.test.ts
bun --cwd packages/learn-card-base test -- src/helpers/credentialRefresh.test.ts src/helpers/pushNotificationHelpers.test.ts
bun --cwd services/learn-card-network/lca-api test -- run test/notifications.spec.ts
bun --cwd apps/learn-card-app test:unit -- src/components/credential-refresh-listener/CredentialRefreshListener.test.tsx src/components/notifications/notificationsV2/NotificationCredentialRefreshedCard.test.tsx src/components/credentials/credential-history/CredentialHistoryModal.test.tsx
```

Expected: every focused suite passes with zero skipped refresh tests.

-   [ ] **Step 3: Run builds, static guards, and E2E**

Run:

```bash
bunx nx build types
bunx nx build helpers
bunx nx build credential-library
bunx nx build vc-plugin
bunx nx build network-brain-service
bunx nx build network-plugin
bunx nx build learn-card-base
bunx nx build lca-api-service
bunx nx build learn-card-app
bun --cwd apps/learn-card-app i18n:check-keys
node scripts/check-safe-area.mjs
bun --cwd tests/e2e test:run -- tests/credential-refresh.spec.ts
git diff --check origin/main...HEAD
```

Expected: all builds and guards pass; E2E proves the full provisional-to-final flow.

-   [ ] **Step 4: Perform explicit privacy and security review**

Search the diff for credential serialization in logs/cache/events, confirm stored brain
version bodies are JWE, inspect serverless route/CORS coverage, test redirects and DNS
rebinding in a Node environment, test auth before existence/ETag distinctions, and
confirm the brain DID is not a JWE recipient.

Run:

```bash
git diff origin/main...HEAD -- services/learn-card-network/brain-service services/learn-card-network/lca-api | rg -n "console\.|logger\.|cache\.set|MessageBody|credentialSubject|JSON\.stringify"
```

Expected: every match is inspected; no plaintext credential enters logs, cache, queues,
traces, or persisted aggregate fields.

-   [ ] **Step 5: Review the complete branch**

Invoke `superpowers:requesting-code-review`. Resolve correctness findings with tests,
rerun affected suites, then rerun the full verification above.

-   [ ] **Step 6: Save a durable completion checkpoint**

Run a DualMem checkpoint with the exact completed files, tests, feature flags,
deployment variables, known Phase 1 limitations, and any rollout follow-ups.

-   [ ] **Step 7: Commit documentation and final release notes**

Run:

```bash
git add docs packages/*/CHANGELOG.md services/*/CHANGELOG.md apps/*/CHANGELOG.md
git diff --cached --check
git commit -m "docs: document managed credential refresh"
```

Add only changelogs that actually exist and are required by repository release policy.

## Rollout and observability checklist

-   [ ] Deploy schema/index changes with the feature disabled.
-   [ ] Confirm `refreshId` and notification delivery-key unique indexes exist.
-   [ ] Install a dedicated HMAC secret in every brain-service environment.
-   [ ] Enable issuer APIs and endpoint for internal/test issuers first.
-   [ ] Monitor allocation, publication, auth challenge, refresh outcome, latency,
        payload-size, notification-upsert, and rate-limit metrics using opaque identifiers.
-   [ ] Enable holder foreground synchronization for an internal cohort.
-   [ ] Enable collapsed notifications after holder refresh success/error rates stabilize.
-   [ ] Enable history UI last; confirm old encrypted blobs match storage-retention policy.
-   [ ] Exercise the documented kill switches independently.
-   [ ] Review whether the 24-hour staleness/collapse defaults should change after usage
        data; keep manual/pull-to-refresh as a separately scoped follow-up.

## Definition of done

-   [ ] A standards-compatible external 1EdTech endpoint can refresh a credential.
-   [ ] A managed issuer can allocate before signing and publish either issuer-signed or
        signing-authority updates.
-   [ ] Unclaimed, unauthorized, and revoked aggregates never serve a payload or leak
        existence through response distinctions.
-   [ ] Brain-service never persists or emits plaintext managed credential content.
-   [ ] Holder refresh updates one LearnCloud record in place and retains encrypted
        history without risking the current credential on failure.
-   [ ] Foreground scanning, forced detail refresh, and notification refresh converge
        safely across repeated/concurrent calls.
-   [ ] Material changes create at most one push/in-app record per configured window;
        repeat changes update that unread record; status lifecycle events stay separate.
-   [ ] The app shows an Updated state and holder-only previous-version history using
        accessible, translated UI.
-   [ ] The credential-viewer demo and E2E test prove provisional CLR to final CLR,
        notification throttling, history, and revocation.
-   [ ] Focused tests, package builds, i18n checks, safe-area checks, security review, and
        complete branch review all pass.
