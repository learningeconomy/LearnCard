# Universal Inbox: escrow, retention, and maintenance operations

Engineering notes for the hardened inbox (LC-2154, #1555). The developer-facing summary lives in
`docs/core-concepts/network-and-interactions/universal-inbox.md` under "Security and retention".

## Escrow model

Until a recipient creates an account, no recipient encryption key exists, so the brain service
encrypts the pending payload to itself (`lc-inbox-jwe:v1:` prefix). On finalize it decrypts only
long enough to deliver: in one Neo4j transaction it saves a recovery copy encrypted exclusively to
the claiming DID, marks the claim issued, and removes the service-readable escrow. Concurrent
finalizers cannot overwrite that recovery copy.

Escrow encryption depends on the brain service's configured `SEED`. Preserve access to that key
while pending records exist; rotating it without re-encrypting pending payloads makes those records
unreadable. This protects storage at rest, not against a compromised service holding the key.
Removing node properties does not erase older backups or transaction logs — apply storage retention
policies to those separately.

## Claim windows

- `/inbox/issue`: `configuration.expiresInDays`, default 30, range 1–720.
- `/inbox/claim` (embed): `configuration.expiresInDays`, default 720 (`EMBED_INBOX_EXPIRY_DAYS`),
  range 1–720. Usually inappropriate for sensitive records unless the integration overrides it.

## Recovery

`POST /inbox/deliveries` (authenticated, `inbox:read`) returns a paginated list of
`{ id, credential, expiresAt }` for the claiming DID for seven days after finalize. It recognizes the
profile's controller and profile DID aliases and works for claimants without a network profile. A
single undecryptable record does not block the page; the SDK reports the count in `failed` and
preserves the cursor.

The LearnCard app saves the finalize response immediately, then sweeps recovery deliveries at
sign-in, deduplicating on `inboxDeliveryId` in the personal index. Empty sweeps show no sync
notification.

Claim responses carry stable delivery metadata: `/inbox/finalize` returns
`deliveries: [{ id, credential }]` alongside `verifiableCredentials`; VC-API inbox exchanges return
`inboxDeliveries: [{ id, credential }]` alongside the signed presentation.

## Metadata-only issuer routes

`/inbox/issued`, `/inbox/credentials/{credentialId}`, and the tracking record from `/inbox/claim`
omit `credential` for every status, including legacy records. Ciphertext is never exposed through
issuer routes.

## `inboxMaintenance` Lambda

Runs daily. Expiry, recovery cleanup, audit deletion, and legacy migration each process batches of
100, at most ten batches per operation per invocation. The recovery endpoint rejects expired copies
immediately; maintenance later removes their ciphertext. Issued audit records remain without the
payload or display metadata.

**Audit deletion is off by default.** Set `INBOX_DELETE_EXPIRED_RECORDS=true` to delete records 90
days after `expiredAt` (or `expiresAt` for legacy expired records). Newly expired historical pending
records receive today's `expiredAt`, giving them a full retention interval. Payload expiry and
recovery cleanup run even when audit deletion is disabled or encryption is unavailable.

Returned totals: `migrated`, `wiped`, `failed`, `expired`, `deleted`, `deliveriesWiped`. A failed
record increments `failed` and moves behind untouched candidates; it cannot block its batch.

### Pre-rollout counts

Run read-only against the target deployment's Neo4j before enabling maintenance:

```cypher
MATCH (ic:InboxCredential)
WHERE ic.currentStatus = "PENDING" AND datetime(ic.expiresAt) <= datetime()
RETURN count(ic) AS pendingToExpire;
```

```cypher
MATCH (ic:InboxCredential)
WHERE ic.currentStatus = "EXPIRED"
  AND datetime(coalesce(ic.expiredAt, ic.expiresAt)) < datetime() - duration({days: 90})
RETURN count(ic) AS auditRecordsEligibleForDeletion;
```

```cypher
MATCH (ic:InboxCredential)
WHERE ic.credential IS NOT NULL
  AND (ic.currentStatus <> "PENDING" OR NOT ic.credential STARTS WITH "lc-inbox-jwe:v1:")
RETURN count(ic) AS legacyPayloads;
```

### Rollout

Maintenance encrypts pending legacy plaintext and wipes terminal legacy payloads. Invoke it during
rollout and confirm no plaintext remains before enabling sensitive issuances:

```bash
cd services/learn-card-network/brain-service
bunx serverless invoke --function inboxMaintenance --stage <stage>
```

Repeat for backlogs exceeding the per-run budget and investigate `failed` records. Migration runs
safely alongside live claims.

## Security regression tests

From `services/learn-card-network/brain-service`, `bun run test:inbox:e2e` (Docker required), or
`bunx nx run network-brain-service:test:inbox:e2e` from the root. The PR workflow runs this as the
`inbox-security` job. The suite starts fresh Neo4j and Redis on random ports, inspects stored
properties and cache values directly, and exercises signing, claim wiping, migration, retention, and
concurrent finalization without touching development databases. The signing-authority adapter signs
locally; external signing-authority transport is covered by `tests/e2e`.
