# Enrollment authority immutable archive and outbox

**Status:** Deferred — not a launch blocker; required before the 50% rollout stage (or sooner if security rejects R-AUTHORITY-ROLLBACK).

The design below is retained as the implementation proposal. Its production
sequencing describes the future archiver cutover, not a prerequisite to initial
launch. [ROLLOUT.md](ROLLOUT.md) governs the current pre-50% gate; earlier stages
require working CloudTrail alarms and explicit security acceptance of
R-AUTHORITY-ROLLBACK, not a claim that independent archived history exists.

**Status:** Proposed; requires security/product approval. No infrastructure is deployed by this document.
**Baseline:** `origin/main` at `750bdc2050fa7f4e59fe80dc83a69a5072c55d09` (2026-10-19).
**Scope:** The unbuilt authority retention gate in [PRODUCTION.md](PRODUCTION.md), not launch approval or a new enrollment authority.

Paths below are repository-relative. `app/` means `services/escrow-enclave-app/`;
`monitor/` means `services/escrow-ledger-monitor/`. All new schemas, metrics,
roles and deployment switches below are proposals, not existing interfaces.

## 1. Decision and guarantee

Use the authority's immutable execution rows as a **persistent transactional
outbox**, extended with an enclave-signed canonical-CBOR archive envelope. Enable
DynamoDB Streams on the authority table and consume it with a dedicated archiver
Lambda, separate from the host and verifier. Write content-addressed objects to a
new COMPLIANCE Object Lock bucket in a separately administered **audit member
account**. An independent verifier reconciles both directions and publishes locked
coverage checkpoints. Retain the legacy ledger archive unchanged.

The authority transaction remains the linearization point. **A commit can be
effective and acknowledged before S3 archival.** Every committed execution must
be archived within a proposed operational objective **T = 5 minutes**. A missed
deadline, integrity failure or loss of coverage pages security; operators suspend
recovery and reconcile before resuming. This is an alarm/response policy, **not a
hard five-minute bound on adversarial damage or on stopping releases**.

Preserve the existing manual-only API kill switch. Automatic containment is an
explicitly rejected launch choice (§7), not an implicit new monitor permission.
Security must accept the asynchronous exposure and human response latency before
this design can close the gate. If the required guarantee is “no release while
audit is unavailable,” this design is insufficient: require a separately reviewed
online archive/freshness gate instead.

Object Lock prevents erasure of retained object **versions**. Independent archived
history makes a later coherent table rollback, PIN-budget reset, or whole-account
purge detectable. It does not make S3 a live enrollment authority, stop a release
before detection, authenticate an unobserved commit, or survive compromise of all
audit/organization administrators. D3 and D10 remain explicit boundaries.

## 2. What exists today

| Data/path            | Writer and credentials                                                                                                                                                                                   | Durable result / limitation                                                                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configured authority | Enclave `policy/authority.rs::authority_commit_at` → `authority/store.rs::Transition::prepare` → `authority/store/dynamo.rs`; dedicated writer IAM user credentials unsealed inside the attested enclave | One conditional transaction writes `ENROLLMENT`, `OPERATION#<requestId>`, optional `HOLD#<holdId>`, and create-only `EXECUTION#<randomId>`. Exact prior payload equality fences updates. No TTL, refund or automatic release retry.       |
| Authority readback   | Enclave-terminated AWS TLS/SigV4 through opaque host relay; no host-role credential fallback                                                                                                             | `Applied` requires authenticated execution receipt readback. `Reconciled` is historical evidence, never another PIN comparison permit. This trusts AWS/protected administration, not a parent acknowledgment.                             |
| Authority artifacts  | Enclave ledger-derived P-256 signer                                                                                                                                                                      | Signed Proposal JSON bytes are stored inside execution rows. Receipts contain execution ID, revisions and transaction digest. Post-readback Commit and nonce-bound Snapshot signatures are RPC artifacts, **not stored in DynamoDB**.     |
| Legacy records/heads | Host `storage.rs::commit_then_audit`, EC2 instance-role temporary credentials                                                                                                                            | Conditional DynamoDB record/head transaction, then S3 PUT of signed CBOR to `audit/<tenant>/<chainId>/<seq>-<hash>.cbor`. Failed S3 writes return unavailable but leave the transaction committed. This is not the authority path.        |
| Legacy audit         | Same host role; existing storage CMK                                                                                                                                                                     | Bucket default COMPLIANCE retention, versioning and SSE-KMS. No durable upload outbox. Monitor compares expected keys with current S3 bytes, not a reverse version inventory.                                                             |
| Authority monitor    | Separate Lambda role; authenticated GetItem/Query/Scan and public SSM trust; no writer credentials or escrow/credential CMK access                                                                       | Every 15 minutes, reconstructs revisions, PIN accounting, hold/email ordering and row coverage using pinned Proposal signatures and table receipts. An unchanged account row brackets pagination. No external historical high-water mark. |

Authority persistence uses strict versioned JSON in binary `payload`, not CBOR
(`app/src/authority/{state,record,audit}.rs`). `SignedAuthorityRecord::signing_hash`
domain-separates Proposal/Commit/Snapshot; `ExecutionRecord.receipt` is **not itself
signed**. The transaction digest is not a portable AWS-signed commit certificate.
Do not call these existing rows “signed canonical-CBOR commits.”

`infra/escrow-enclave/authority.tf` enables deletion protection and PITR, but **no
authority stream**. `authority-audit.tf` supplies periodic read access; despite its
name it is not an S3 archiver. `ledger.tf` enables `NEW_AND_OLD_IMAGES` only for
the legacy records table. `monitor.tf` connects that stream, not the authority.

`storage.tf` uses a shared data CMK (`aws_kms_key.s3`) for audit/artifacts and the
authority table. It delegates key access through IAM, unlike the attestation-gated
escrow and credential CMKs; its policy reserves `PutKeyPolicy`/`ScheduleKeyDeletion`/
`DisableKey`/`DisableKeyRotation` for `escrow-kms-admin` and MFA root, and
`EscrowKmsGovernanceChange` watches it. That protects availability against other
IAM principals only, not the MFA admin. `variables.tf` defaults to **2555 days (~7 years)**,
matching the production-review retention concern; its validation permits as little
as one day. COMPLIANCE does not protect availability of the KMS key.

Both SCPs under `infra/escrow-enclave-bootstrap/authority-guardrail/` and the table
policy deny ordinary host, root and organization-account-admin data access. Only
the writer may transact; enumeration is reserved to the monitor. Thus “any account
admin can currently write authority data” is inaccurate under intact guardrails.
The relevant attacker has bypassed/changed that boundary, acquired writer
credentials, or is a sufficiently privileged approved administrator. Such an
attacker can coherently restore an old valid prefix or delete all rows. A fresh
enclave and today's stateless sweep have no independent retained reference with
which to distinguish it from the legitimate shorter history. PITR is mutable
administration/recovery tooling, not that reference.

## 3. Alternatives and commit semantics

| Choice               | Alternatives                                                                      | Recommendation and reason                                                                                                                                                                                                                                                                                                            |
| -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Commit gating        | Synchronous archive-before-ack; asynchronous archive with reconciliation          | Async. Avoid adding S3 availability and latency to every reservation/result, including the enclave's existing 10-second operation deadline. Explicitly accept an unarchived tail and manual containment latency.                                                                                                                     |
| Synchronous ordering | Archive proposal before DynamoDB; archive after DynamoDB before response          | Neither is atomic across services. Before DB creates orphan proposals; after DB can fail after the state already became effective. A host's S3 success/readback is not durability proof. A trusted direct AWS path or independent authenticated archiver acknowledgment would be required, plus explicit ambiguous-result semantics. |
| Outbox               | Separate mutable “pending” rows; existing immutable execution rows                | Extend execution rows. They already participate in the same transaction and retain every PIN phase. Do not add a second post-commit enqueue gap or mutate receipts to mark delivery.                                                                                                                                                 |
| Delivery             | Exactly-once processing; at-least-once with content addressing                    | At-least-once. Conditional PUT plus exact verification provides an idempotent object effect, not exactly-once Lambda execution or metrics.                                                                                                                                                                                           |
| Record set           | Snapshots/latest state only; every committed execution; all speculative proposals | Every committed execution, including abandoned reservations, failed comparisons, enrollment changes, holds, confirmation failures/resends and warnings. Latest-state snapshots lose spent-budget history; speculative losing proposals are not commits.                                                                              |
| Writer               | Host/enclave direct S3; stream Lambda; dual-write plus reconciliation             | Stream Lambda plus persistent-row reconciler. Host cannot be trusted and must not gain authority reads; direct enclave S3 expands measured networking/credentials and latency. Dual-write adds failure states without eliminating reconciliation.                                                                                    |
| Archive boundary     | Existing escrow-account bucket; separate audit-account bucket/key                 | Separate account for production. Same-account COMPLIANCE preserves versions but shares storage-key, monitor and administration failure domains. This deliberately strengthens ENROLLMENT-AUTHORITY §5's existing-bucket proposal and requires security approval.                                                                     |
| Lock mode            | GOVERNANCE; COMPLIANCE                                                            | COMPLIANCE: no bypass permission can shorten retained versions, including root. Governance permits authorized bypass and does not meet this administrator threat model.                                                                                                                                                              |

Order executions by `(tenant, generation, authority partition, operation revision)`;
the first revision is 1. This is **not** the legacy per-blob chain with sequence
0–63. There is no global order across accounts. Stream records for distinct items
in one transaction can arrive separately/interleaved; never infer an atomic
transaction from adjacency or assume revision ordering across execution keys.
Upload out of order, but advance coverage only over a contiguous verified prefix.
Two distinct valid executions at one revision are an integrity incident, not a
last-writer-wins selection.

Do not archive every read-only Snapshot RPC: nonces make them high-volume request
evidence, not durable transitions. Do not require every RPC Commit to be delivered
to the archiver: a crash can occur after DB commit but before signing. Preserve any
available client Commit in incident evidence separately. Continue legacy CBOR
archiving; it neither substitutes for nor duplicates configured authority history.

## 4. Archive bytes and persistent outbox

### New execution format

Introduce a versioned execution schema and `ArchiveIntentV1`, **not a new kind
silently added to the existing V1 RPC signature format**. Before the authority
transaction, allocate execution ID and compute the existing transaction digest
over state/operation/hold writes. Sign a fixed-schema CBOR map using the enclave
ledger key, then include it in the execution row atomically. Exclude the execution
row itself from the transaction digest, as today, to avoid a circular commitment.

The unsigned CBOR map binds:

| Integer key | Value                                                         |
| ----------- | ------------------------------------------------------------- |
| 0           | Format version, exactly 1                                     |
| 1           | Tenant text                                                   |
| 2           | Authority generation text                                     |
| 3           | DID hash, 32-byte string                                      |
| 4           | Authority partition-key text (must recompute from binding)    |
| 5           | Execution ID, 16-byte string                                  |
| 6           | Resulting operation revision                                  |
| 7           | Resulting enrollment revision                                 |
| 8           | Existing transaction digest, 32-byte string                   |
| 9           | Exact existing signed Proposal JSON bytes, as a byte string   |
| 10          | Ledger key ID                                                 |
| 11          | Attested measurement hash, 32-byte string                     |
| 12          | Raw 64-byte low-S P-256 signature; omitted from signing input |

Sign SHA-256 of `learncard-authority-archive-intent-v1\0` followed by canonical
unsigned CBOR. Definite lengths, ascending integer keys, minimal integer/length
encodings, no unknown/duplicate keys, floats, tags, indefinite values or trailing
bytes. Enforce existing identifier/counter bounds and an initial 16-KiB envelope
cap; test worst-case current 8-KiB proposal rows before fixing the cap. Reuse
`ledger/codec.rs` conventions, with a distinct decoder and golden vectors.

The archived object is **exactly these signed CBOR bytes**, not a Lambda JSON
reserialization. Its content hash is SHA-256 of the **whole signed object**,
distinct from the legacy unsigned-record hash and canonical encrypted-blob identity.
The archiver validates the signature, measurement/key allowlist, partition,
execution receipt and Proposal bindings before upload. It never signs as the
enclave or recreates a lost signature.

**Self-verifying does not mean self-proving commit.** The pre-transaction signature
authenticates the intended execution/receipt fields, not successful persistence.
Commit provenance is the authenticated AWS execution-row INSERT/read observed by
the archiver/verifier, recorded in a separately signed observation manifest. An
offline auditor verifies both the enclave bytes and that independent observation;
it does not relabel ArchiveIntent or Proposal as a post-commit artifact. A
compromised observer can lie about observation; independent comparison and client
receipts are additional evidence, not a solution to joint observer compromise.

Keep execution rows without TTL and without archiver updates/deletes. “Pending”
is the set difference between execution rows and verified archive versions; Lambda
checkpoints/cache tables are accelerators, never deletion permission or the sole
coverage truth. No persistent data-plane retry may resume a PIN comparison or
release: only byte archival is retried.

### Keys and metadata

```text
authority/v1/<tenant>/<generation>/<partitionHash>/executions/<revision20>-<executionId>-<sha256>.cbor
authority/v1/<tenant>/<generation>/observations/<shard>/<sequence20>-<sha256>.cbor
authority/v1/<tenant>/<generation>/checkpoints/<shard>/<sequence20>-<sha256>.cbor
authority/v1/<tenant>/<generation>/manifests/<sha256>.cbor
authority/legacy-v1/<tenant>/<generation>/<partitionHash>/<executionId>-<sha256>.json
```

`partitionHash` is SHA-256 of UTF-8 authority partition key; revision is zero-padded
decimal, execution ID/hash lowercase hex. Validate all path segments; no raw DID,
email, PIN, code or recipient key in keys/logs/metrics. Hashes remain linkable
sensitive metadata. Legacy objects preserve **exact** execution JSON; their signed
Proposal remains verifiable, but no retrospectively invented enclave signature
covers the unsigned receipt. Keep that lower-assurance provenance explicit.

Use single-part `PutObject`, `Content-Type: application/cbor` (JSON for legacy),
`If-None-Match: *`, and `x-amz-checksum-sha256` containing base64 SHA-256 of the
entire body. Require the configured encryption key and bucket owner. Do not use
ETag as an integrity hash. Inherit the COMPLIANCE default; worker roles cannot
set shorter explicit retention. After PUT, verify exact bytes/checksum and the
returned **VersionId**, mode and retain-until date. Record that version in the
observation manifest. On 412, verify the existing version identically; on timeout
or 409, bounded retry/readback of the same bytes/key. Mismatch, unexpected versions
or delete markers are incidents, not overwrite opportunities. Failed verification
must not mark coverage complete.

Choose 2555-day minimum retention for new objects, matching current defaults,
subject to legal approval before the first irreversible write. Backfill starts
retention at upload, not historical event time. No automatic legal hold on all
objects: it creates indefinite retention with an easily forgotten release process.
Security/legal may add incident-specific holds; only a separate reviewed role can
remove them, never the archiver. Removal does not override unexpired COMPLIANCE.

Seven years is not a safe automatic deletion deadline for a still-active account.
Before expiry, extend retention on its dependency history/checkpoints, or freeze
the generation and approve a successor continuity baseline. A retention-horizon
alarm at 180 days requires review. No lifecycle expiration until this policy is
implemented; an expired object may still be essential to PIN-budget evidence.

Keep objects in S3 Standard for launch: small-object retrieval and version scans
must remain immediate. Glacier/Deep Archive lower byte storage but add restore
delay, request/metadata overhead and operational complexity; evaluate after
measuring volume, never transition active verification dependencies blindly.

## 5. Credentials and administrative boundaries

Deploy the stream Lambda in the **escrow account/region** with an AWS-issued
execution-role session, avoiding a cross-account event-source-mapping dependency.
It writes cross-account to an audit-owned bucket using explicit bucket/key grants.
The reconciler and archive verifier run in the audit account with different roles;
each assumes a narrowly scoped protected escrow reader role for table reads.
Do not reuse the host, writer user, existing monitor role, or canary-secret role.

| Principal                       | Allowed                                                                                                                                                                                                                                  | Explicitly excluded                                                                                                           |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Stream archiver                 | Exact authority stream DescribeStream/GetShardIterator/GetRecords; ListStreams only if required by the integration; create/read/version-retention checks in execution/observation prefixes; dedicated observation-signing key; telemetry | Authority writes, writer secrets, escrow/credential CMKs, archive delete/retention/legal-hold changes, checkpoint publication |
| Audit reconciler                | Protected table GetItem/Query/Scan; same content-addressed execution uploads; separately identified observation signing; bounded recovery queue                                                                                          | Authority mutations, policy changes, checkpoint approval                                                                      |
| Audit verifier                  | Protected table reads; list all archive versions, GetObjectVersion/retention/legal-hold/config; append verified checkpoint/manifest prefix; audit signing key                                                                            | Execution-object writes, escrow/credential secrets, lca-api configuration, table mutation                                     |
| Security deployment/legal roles | Reviewed IAM/trust, retention extensions, legal holds and incident response                                                                                                                                                              | Routine runtime use; no automatic shortening/deletion of retained versions                                                    |

The verifier remains **read-only with respect to authority state**; checkpoint S3
writes/signing are new, isolated audit-account permissions. Preserve the existing
monitor's legacy role and checks; share schema/verifier code, not its host-account
administration or execution credentials. External heartbeat evaluation and paging
must not depend on the escrow Lambda, SNS topic or storage CMK being healthy.

Required Terraform/SCP changes (not performed here):

1. Enable `NEW_AND_OLD_IMAGES` on authority, add a separately routed event mapping
   and explicit stream resource policy. Do not feed authority events into the
   existing handler, which interprets MODIFY/REMOVE as legacy tampering.
2. Update table deny exceptions and **both** authority SCPs for exact new reader
   roles and stream consumer, with action/resource-specific denies. Keep the writer
   as the only data mutator; do not grant archivers transaction permissions. Protect
   new roles/PassRole, code/config, event mappings, trust parameters and schedules.
   Check SCP byte/attachment limits; split policies rather than dropping denies.
3. Create audit-member-account bucket with BucketOwnerEnforced ownership, versioning,
   public-access block, TLS-only policy, conditional-create enforcement, no runtime
   delete/version-delete/replication-delete, and COMPLIANCE default >=2555 days.
   Separate prefix writers; prevent archiver modification of checkpoints.
4. Use an **audit-account-owned dedicated storage CMK**, not `aws_kms_key.s3`, the
   escrow CMK or credential CMK. Scope GenerateDataKey to uploads and Decrypt to
   verified readback/readers through regional S3 and encryption context. Cross-account
   grants require both key and identity policies. Bucket Keys reduce KMS request
   costs but broaden encryption context to bucket scope; prefix IAM still applies.
5. Protect audit key DisableKey/ScheduleKeyDeletion/PutKeyPolicy/CreateGrant, bucket
   reconfiguration, trust/signing keys and alarm delivery through independently
   owned SCPs and two-person administration. Preserve old key material for the full
   retention/readability horizon. Immutable ciphertext with a deleted key is useless.
6. Deliver management/data-event CloudTrail evidence to independent storage, including
   stream disable/recreate, mapping changes, bucket defaults/policy/versioning,
   retention/legal-hold changes and storage-key administration. SCPs do not constrain
   the Organizations management account; its owners remain trusted.

SSE-S3 is a valid simpler alternative without customer key-deletion risk, but gives
less independently controlled decryption policy. Choose dedicated audit SSE-KMS for
the linkable metadata, conditional on enforceable key-lifecycle governance. If
security cannot operate that governance, revisit SSE-S3 rather than pretending
Object Lock protects the encryption key.

## 6. Stream processing, reconciliation and completeness

### Fast path

Start at `TRIM_HORIZON` after stream enablement; register the exact stream ARN and
creation epoch in an immutable generation manifest. At-least-once Lambda delivery
and shard splits require no global ordering assumption.

- Execution INSERT: validate and upload. Execution MODIFY/REMOVE: archive available
  old/new evidence in a restricted incident prefix and immediately raise integrity
  failure. Do not replace the accepted execution.
- ENROLLMENT/OPERATION/HOLD updates are normal. Validate shape, use them to schedule
  a partition reconciliation, and alarm on REMOVE. Do not lock raw row images by
  default: envelopes and email-throttle/code metadata exceed audit needs. Redact
  incident payloads under an explicit evidence policy, not in ordinary logs.
- Use partial-batch failure responses, bounded retries and batch bisection. Set a
  failure destination retaining the **full original event**, not only invocation
  metadata; verify actual AWS destination behavior live. Poison records remain
  unresolved gaps even after quarantine. A successful batch is not a clean-history
  signal. Restrict queue/evidence access and bound size, retries and concurrency.

### Independent reconciler and verifier

The reconciler scans **all row types** to discover partitions, not only current
ENROLLMENT rows. It compares execution IDs/bytes against archive versions and
reuploads missing bytes idempotently. Retain before/after account fencing from
`monitor/src/authority.rs::sweep_authority_inner`; changing fences or pagination
limits are coverage failures, never clean partial results.

The verifier independently does both directions:

1. **DynamoDB → S3:** every execution has matching signed bytes/receipt bindings,
   exact expected version/checksum, sufficient retention and approved key. Every
   current account/operation/hold row matches independently reconstructed history.
2. **S3 → DynamoDB:** enumerate all accepted execution versions and checkpoint
   account manifests, including accounts absent from current table scans. Each
   archived execution must still exist identically; current account revision cannot
   fall below the archived contiguous head. Detect orphan/missing partitions,
   duplicates, forks and delete-marker masking. Never consult only latest objects.
3. Verify gap-free revisions from genesis/baseline, PIN-generation resets, hold
   terminal transitions and email gates using the independent authority verifier.
   A higher revision with a gap is not a valid new head. Invalid archive injections
   alarm but cannot advance the accepted head.

### Locked checkpoints, not mutable latest pointers

After a complete shard reconciliation, append a signed, COMPLIANCE-locked checkpoint
binding generation/table/stream identity, prior checkpoint hash, scope of scan,
start/end observation times, trust-manifest digest and immutable manifest digests.
Each manifest contains sorted `(partition, highest contiguous revision, execution
content hash, S3 version ID)` entries, plus predecessor checkpoint links. Partition
by a fixed hash-prefix scheme recorded in the generation manifest. Store manifests
before their referencing checkpoint. A crash leaves harmless unreferenced manifests;
it never advances completeness. Use one writer per shard with conditional
checkpoint-cache updates to serialize normal publication. Content-addressed keys
alone cannot prevent two objects at the same sequence; enumerate and reject such
forks even if both signatures verify.

Checkpoints are signed by an audit-owned asymmetric signing key, **not the enclave
ledger key**. Retain its verified public-key history in locked trust manifests.
Observation manifests use separate audit-owned signing keys identifying the
archiver/reconciler. Their signatures attest only that component's observation;
neither key can sign accepted verifier checkpoints.
An external audit-account watchdog enumerates checkpoint versions and requires
all registered shards to advance. A mutable “latest” cache may accelerate lookup
but cannot delete a partition or hide an older higher head. Shard-layout changes
must name all predecessor shards and preserve the union of known accounts.

This proves completeness **relative to the registered baseline and independently
observed contiguous histories**, not the absence of all unobserved writes. Neither
scans nor Streams are a cross-partition snapshot. A whole account created and
purged before independent observation, followed by stream expiry/suppression, can
remain unknowable. Detect coverage loss and stop claiming completeness; do not
paper over it with an empty-table checkpoint. A scan alone cannot recover this gap.

### Deadlines and 24-hour stream expiry

Use stream AWS approximate creation time and independent first-observed time for
lag accounting; enclave Roughtime event intervals are processing evidence, not a
reliable delivery deadline. Backfill entries have separate observation timestamps,
never fabricated on-time status. Poll fast-path pending gaps/heartbeat each minute;
warn at two minutes and page when unarchived age exceeds five minutes. Also page
when scanner coverage exceeds its deadline, even if no known gap exists.

Target complete bidirectional shard coverage every 15 minutes with a 30-minute
maximum age; implement durable sharded cursors before existing 50,000-partition,
4096-row/32-MiB-account or 900-second limits are approached. T is upload latency,
not the full reverse-scan detection bound. Under healthy services, an already
archived rollback is detected by the next complete sweep (target <=30 minutes),
plus alarm delivery and human response. No guaranteed bound under detector outage.

Streams retain records for **24 hours**, not forever. Escalate any discontinuity,
stream replacement, discarded batch or prolonged lag immediately, well before
expiry. After expiry, durable execution rows support backfill only if retained;
PITR and captured failure events are forensic aids, not proof that erased history
never existed. Freeze affected generation activity, compare the last independently
locked inventory and all available evidence, and publish a signed gap report.
An unresolved gap blocks resumption/production approval. Never replay transitions
or reset counters to repair the archive.

## 7. Alarms and containment decision

| Proposed signal                                                         | Condition / action                                                                                           |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `AuthorityArchiveIntegrityFailure`                                      | Any byte/signature/binding/fork/retention mismatch or immutable execution mutation: immediate security page. |
| `AuthorityArchiveOverdue`                                               | Oldest known unarchived execution >300 seconds: page; mark coverage unhealthy.                               |
| `AuthorityArchiveHeartbeat`                                             | Independent one-minute evaluation absent for five minutes: page, even with zero traffic.                     |
| `AuthorityArchiveCoverageAge`                                           | Any shard lacks complete bidirectional coverage for 30 minutes: page.                                        |
| `AuthorityArchiveStreamGap`                                             | Lost/replaced stream interval, discarded event or expired cursor: page and require explicit gap closure.     |
| `AuthorityArchiveRetentionHorizon`                                      | Required history within 180 days of expiry: security/legal ticket with deadline.                             |
| Lambda errors/throttles/IteratorAge/failure destination/paging delivery | Independent operational alarms, missing evaluator data breaching; no success inferred from silent failure.   |

Use fixed labels and operator-owned tenant/generation/shard dimensions, not DID,
hold/request IDs or content hashes. Archive success counts are at-least-once
telemetry, not exact billing or proof of coverage. Existing `AuthoritySweepCompleted`
means traversal completed and can coexist with integrity findings; introduce a
separate clean checkpoint result rather than treating that heartbeat as approval.

**Automatic kill switch alternatives:**

- Giving the monitor lca-api configuration writes is simplest but violates the
  existing read-only/manual-only boundary and lets detector compromise deny global
  recovery. The API switch also cannot stop a host bypassing lca-api. **Reject.**
- A separate one-way containment actuator could only disable, never enable,
  recovery; authority-side credential revocation would also stop bypassing hosts
  after AWS enforcement propagates. This has a materially larger IAM/availability
  blast radius and can interrupt cancellation/enrollment too. **Defer pending a
  separate security decision**, not a hidden prerequisite claimed implemented here.
- **Choose manual containment** as in SECURITY/ROLLOUT: page a named on-call owner;
  target acknowledgment within five minutes of page and verified API suspension
  within fifteen. These are operational targets, not cryptographic guarantees.

On integrity or sustained coverage failure, set `ESCROW_RELEASE_KILL_SWITCH=true`
through the real API deployment mechanism and verify every serving instance
refuses start/complete. Reading `process.env` per request does not remotely update
running processes. Keep cancellation/notifications working where safe. Stop new
enrollment separately (client mode off plus traffic controls; rollout percent zero
does not stop manual enrollment). For suspected host/admin compromise, security
must revoke the dedicated writer capability and isolate compute through the MFA
incident procedure; removing PCR approval alone does not revoke credentials in a
running enclave. No action can undo already committed/delivered releases.

## 8. Failure modes and runbooks

All incidents: preserve version IDs, checkpoints and independent CloudTrail evidence
in restricted storage; never paste payloads/secrets in tickets. Page, contain as
above, reconcile, then require two-person security approval to resume. Do not
restart to erase high-water marks or automatically clear alarms into availability.

| Failure                                               | User-visible effect                                                                                                                   | Recovery / proof required                                                                                                                                                                                                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Archiver down, permissions denied or throttled        | Initially no extra RPC latency; commits continue during the accepted exposure window. After manual containment, recovery unavailable. | Restore role/code/service capacity; replay archival bytes from execution outbox; close all gaps and complete reverse sweep. No PIN refund.                                                                                                                   |
| Lag >24h, disabled/recreated stream                   | Same until contained; potential unprovable history loss.                                                                              | Record discontinuity; backfill retained executions and compare locked inventory/PITR/failure evidence. If completeness cannot be established, retire generation under reviewed recovery procedure; do not restore an old same-generation table.              |
| Poison/malformed record                               | No silent skip; affected shard cannot be certified clean.                                                                             | Quarantine exact bounded evidence, page integrity, fix decoder only through review; replay bytes, not business operations. Separate unrelated shard throughput from global launch approval.                                                                  |
| S3 timeout/partial workflow                           | Single PUT is atomic; execution may exist without observation/checkpoint.                                                             | GET exact version and checksum, conditional retry; rebuild observation from verified object. Unreferenced objects/manifests are not committed coverage.                                                                                                      |
| Object Lock missing/short, wrong key or delete marker | Recovery must be suspended when discovered; object existence alone is insufficient.                                                   | Reject coverage. Extend retention where legal/possible or write correct locked copy, preserve original and record incident. Never claim the earlier unlocked interval was protected.                                                                         |
| Key disabled, policy changed or scheduled deletion    | Archive unreadable/unchecked; authority may remain online.                                                                            | Independent key-governance alarm; cancel deletion/restore approved access under dual control. Irrecoverably destroyed storage key means lost audit evidence despite Object Lock.                                                                             |
| Region outage                                         | Authority may itself fail closed; otherwise audit blindness triggers containment.                                                     | No automatic multi-region authority failover. Restore same-region verification; reconcile from retained versions. Optional cross-region locked replication improves evidence availability but doubles failure/cost analysis and is not launch-required here. |
| Verifier/mapping/scheduler/alarm suppressed           | Cannot assume clean history; external heartbeat pages.                                                                                | Recover independent control plane and inspect trust/mapping changes, then full bidirectional reconciliation. Management-account compromise remains residual risk.                                                                                            |
| Backfill cannot authenticate history                  | No production enablement; staging generation may be retired.                                                                          | Preserve lower-assurance legacy evidence and gap report. Require fresh signed enrollment in a new generation, never import Mongo counters/epochs or silently abandon active budgets.                                                                         |

Archive is evidence, not a complete account restore backup: do not retain raw
encrypted envelopes, email code hashes, PIN salts or auth shares merely to make
restoration convenient. State loss still needs the reviewed generation-continuity
procedure in ENROLLMENT-AUTHORITY §7 and independent backups where applicable.

## 9. Threat model

| Attacker                                                           | Prevention                                                                                                                      | Detection and residual risk                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ordinary escrow-account admin / host role under intact SCPs        | Existing table/SCP boundary denies authority mutations; new audit bucket/key are outside that account.                          | Attempted governance changes alarm. “Admin” alone is not equivalent to writer access.                                                                                                                                                                                                    |
| Escrow attacker with effective DynamoDB write / restore capability | Cannot erase already retained audit versions or administer the audit CMK under this separation.                                 | Archived prefix rollback, deleted accounts, changed execution and budget divergence detected. Can cause unauthorized activity before detection; unobserved tail loss remains possible. D3 detection, not universal prevention.                                                           |
| Compromised host                                                   | No authority writer plaintext or audit permissions; enclave authenticates AWS directly and verifies user intent.                | Can suppress network/availability and relay responses. Cannot manufacture valid archive signatures. Legacy D3 limitations remain unchanged.                                                                                                                                              |
| Compromised archiver                                               | No authority mutations, enclave signing key, checkpoint permission, retention shortening or deletion.                           | Can omit uploads, inject junk, replay signed proposals, or lie in its observation metadata. Independent verifier/table reconciliation detects observable discrepancies. Pre-commit signatures alone cannot disprove a fabricated commit observation after all original evidence is gone. |
| Compromised lca-api/Mongo                                          | Cannot authorize user enrollment changes or directly write authority/archive; existing enclave intent/PIN/email policy remains. | Can suppress recovery/cache/cancellation requests and bypass its own API kill switch. Archive does not repair lost application shares or undo disclosure.                                                                                                                                |
| Compromised audit verifier                                         | Cannot change authority or execution objects.                                                                                   | Can lie in new checkpoints or suppress alarms; external heartbeat and prior locked evidence help investigation, not complete prevention. Separation from archiver and protected deployment/trust remain essential.                                                                       |
| Approved key/org administrator or joint audit+escrow compromise    | COMPLIANCE still protects retained versions against early deletion, not key readability or future policy changes.               | Can weaken trust, approve malicious images, disable keys/detection, or falsify future evidence. D10 and organizational governance remain accepted residuals, never “solved by Object Lock.”                                                                                              |

## 10. Volume and cost envelope

No approved traffic forecast was found in the baseline. Existing 100/hour release
and PIN-failure alarm defaults are **not** a capacity forecast. Budget in authority
executions (a PIN flow has reservation and result; email actions add executions),
not sign-ins or releases. Measure serialized sizes and retries in staging.

Illustrative planning assumptions: 10,000 executions/day, mean 4 KiB archived
execution, observation/manifest overhead 2x total bytes, ~2 PUTs/execution amortized,
and 2555-day retention. At illustrative S3 Standard $0.023/GB-month and $0.005/1000
PUTs (not a current regional quote):

| Component                                                 | 10,000/day            | 100,000/day sensitivity |
| --------------------------------------------------------- | --------------------- | ----------------------- |
| Retained bytes at year 7, including 2x overhead           | ~209 GB               | ~2.09 TB                |
| Year-7 storage/month                                      | ~$4.81                | ~$48.1                  |
| ~2 PUTs/execution, 30-day month                           | ~$3                   | ~$30                    |
| One daily GET of every retained execution at $0.0004/1000 | ~$307/month at year 7 | ~$3066/month            |

Full payload rereads every 15 minutes would multiply that last line by 96 and
are unacceptable. Cache validated immutable version hashes in locked manifests;
incremental sweeps verify new executions and current row correspondence, enumerate
versions/deletions, and check retained dependency coverage. Schedule deep byte
scrubs separately. Current authority full-history scans also grow without bound
and need sharded/indexed coverage before production volume exceeds their limits.

Budget Lambda, DynamoDB strongly consistent scans/queries, KMS calls/signatures,
S3 LIST/HEAD/GET/checkpoints, failure storage, CloudTrail data events and alarms
separately; these can dominate byte storage. Bucket Keys reduce, not guarantee
elimination of, KMS requests. Retention extensions, version injections, retries and
optional replication increase cost. Acceptance requires a measured regional cost
worksheet at expected/10x peak, not the illustrative totals above as a service quote.

## 11. Staging, backfill and production ordering

### Staging sequence

1. Keep production off. Review new audit-account ownership, retention/privacy,
   async/manual-response acceptance, threat model and expected volume. Provision
   guardrails before credentials/access; deploy archive resources and independent
   paging before stream consumption. Offline tests are not live IAM evidence.
2. Freeze staging mutations for a controlled baseline. Enable authority stream,
   start consumer at its earliest retained point, record table/generation/stream
   identity. Independently inventory all partitions with stable account fences.
3. Backfill **exact legacy execution JSON** with explicit legacy provenance,
   validating every signed Proposal and reconstructed history. Record counts,
   partition heads, hashes, version IDs, trust pins and unresolved gaps in a locked
   baseline manifest. Preserve disabled tombstones and abandoned reservations.
   A clean baseline proves what was observed then, not absence of a prior rollback.
4. Prefer a **fresh staging generation** for the new signed-CBOR format; preserve
   the old generation's locked evidence. Existing staging histories can be archived
   but cannot be upgraded retroactively into enclave-signed commit receipts.
   Exercise reviewed continuity if retaining active staging identities; no Mongo
   epoch/PIN-budget bootstrap. Deploy readers before the measured writer upgrade.
5. Verify fresh Nitro key/measurement anchors, update archive and existing monitor
   trust before any new image gets traffic, then resume internal-only operations.
   Run failure drills below and the real seven-day hold/email soak. CANARY's
   synthetic-user checks complement, not replace, integrity/coverage tests.

### Live verification (operator-only, not executed by this document)

Use disposable staging identities and independently retained evidence, never real
user data. Mutations requiring privileged bypass belong only in an isolated test
generation with explicit two-person authorization.

1. Verify effective table/stream policies, all SCP attachments, audit bucket owner,
   versioning, default retention, KMS ownership and role isolation. Try host/API/org
   admin writes and retention/delete/key-policy changes; expect denial under intact
   controls. Test bypass-governance deletion against a COMPLIANCE test object: denied.
2. Enroll, create a PIN hold, fail a PIN, succeed another, disable/re-enroll, carry/
   rewrap, create/confirm/cancel delayed holds, resend and send warnings. Correlate
   each durable execution (including both PIN phases) to exact archive bytes and
   versions; verify signatures offline using attestation-provisioned public keys.
3. Crash/drop responses after DB commit and before response/signing. Verify the
   execution still archives within T and retrying recovery never reuses a comparison
   or emits a second release. Duplicate/shuffle stream deliveries; verify one
   accepted object/version and gap-free, non-forking coverage.
4. Pause archiver >5 minutes: independently delivered overdue/heartbeat alarms and
   measured manual suspension within the response target. Resume byte uploads;
   prove no automatic resumption and no counter reset. Observe the API refusal and
   demonstrate/document that direct host access needs authority-side containment.
5. In the isolated generation, roll all authority rows back to a valid older prefix,
   then purge an entire archived partition. The reverse check must alarm in both
   cases, even when forward scan is empty/valid. Inject an alternate object version
   or marker using an approved test policy: version-aware verification must detect
   masking, preserve the original, and refuse a clean checkpoint.
6. Exercise malformed records, failed checksum, incorrect retention, denied KMS
   read, checkpoint crash, paging failure and stream replacement. Verify fixed-label
   alerts, full-event failure capture, no partial clean checkpoint and no leaked
   secrets. Test >24-hour stream loss with a real staging pause; distinguish retained
   row backfill from an intentionally erased, unclosable gap. Do not waive the latter.
7. Run load/size/cost tests at approved peak and 10x burst, shard restart/rotation,
   trust-key overlap and cold-start failures. Confirm archive p95/p99, oldest age,
   full coverage deadlines and independent heartbeat. Retain a complete seven-day
   clean soak including a real confirmed delayed release and warning interval.

### Placement in PRODUCTION.md bootstrap

- Steps 1–3: prepare independently administered audit account, SCPs, bucket/key,
  roles, stream and disabled consumers alongside authority resources; keep clients
  off and API recovery killed. No production history exists to backfill.
- Before steps 5–7 admit mutations: deploy archiver/reconciler/verifier artifacts
  and compatible execution schema, provision public trust from verified candidate
  attestation, register empty generation and shard manifests. First-boot/steady-state
  image changes still follow resource → credentials → measured image → trust order.
- Step 8: prove all archive alarms, external heartbeat, complete bidirectional
  coverage and manual containment live. Keep the existing monitor read-only and
  preserve historical trust through image/key rotation.
- Step 9: only security-approved evidence closes this blocker. Client mode remains
  off, rollout zero and kill switch true until all other Roughtime, authority/email,
  soak and D10 acceptance gates also pass. Infrastructure readiness is not approval.

**Closure evidence:** reviewed implementation PRs; offline test reports; independently
verified IAM/SCP/key/bucket configuration; exact object VersionId/checksum/retention
and signature samples; baseline plus contiguous checkpoints; both-direction rollback
drill results; real expiry-gap/backfill test; alarm-delivery and timed containment
records; capacity/cost/soak results; named operational/legal owners; explicit
security/product acceptance of unobserved-tail, manual-response and D10 residuals.
Only then change PRODUCTION's blocker in a separate approved PR.

## 12. Small implementation PRs and acceptance criteria

| PR  | Scope                                                                  | Acceptance / tests                                                                                                                                                                                                                                                                                                                    |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Versioned archive codec and transactional execution envelope           | Rust golden vectors and independent verifier vectors; strict malformed/noncanonical/high-S/kind-substitution tests; crash matrices prove execution/outbox atomicity. Existing RPC Commit/Snapshot behavior unchanged. No pre-commit artifact presented as commit proof.                                                               |
| 2   | Audit-account storage/IAM/SCP and authority stream, default off        | Terraform mock tests for disabled neutrality, exact principal/action scopes, no authority writes or escrow grants, separate KMS ownership, >=2555-day COMPLIANCE, conditional writes, role/mapping/trust protection, policy size and production preconditions. No real apply in tests.                                                |
| 3   | Stream archiver Lambda and full-event failure capture                  | Unit tests for duplicate/out-of-order events, partial batches, poison records, 409/412/timeouts, wrong retention/key/checksum and immutable-row mutation. No payload logging; bounded retries; accepted archive version recorded only after verified upload.                                                                          |
| 4   | Persistent-row reconciler and staging legacy backfill tool             | Tests for scan fence changes, pagination, absent account/orphan rows, >24h cursor loss, existing exact/mismatched objects and legacy provenance. Dry-run report first; never table mutations.                                                                                                                                         |
| 5   | Independent monitor reverse inventory, signed checkpoints and watchdog | Monitor tests delete whole partitions/prefixes, fork revisions/checkpoints, mask versions, corrupt trust, interrupt manifest publication and omit shards. No clean result on incomplete reads or unresolved gaps; existing observer permissions remain read-only on authority.                                                        |
| 6   | Integration harness and operational closure docs                       | Local emulated authority/stream/S3 fault harness proves transaction → outbox → archive → checkpoint and rollback alarm; cannot prove Object Lock/IAM. Separately gated Linux/AWS staging test executes §11 live drills and packages evidence. Update SECURITY/ROLLOUT/monitor runbooks with approved policy, not inferred guarantees. |

Estimated effort: **Large**, approximately 3–5 engineering weeks plus independent
security review, account provisioning and a real seven-day soak. Format/schema,
IAM and checkpoint work should be separately reviewable; do not hide trust changes
inside a Lambda upload patch. No implementation or live verification is claimed here.

## 13. Open decisions for security/product

1. Accept async T=5 minutes, full reverse coverage <=30 minutes and manual response
   targets? If not, fund synchronous trusted gating/one-way containment explicitly.
2. Approve the separate audit member account, named independent administrators and
   dedicated storage/signing keys, rather than §5's existing escrow bucket? Can the
   organization protect their lifecycle and external paging independently?
3. Is 2555 days lawful/necessary for linkable DID hashes and operation metadata?
   Approve retention extensions for active histories, incident legal holds, deletion
   after dependency retirement and data-access ownership before irreversible writes.
4. What are expected enrollment/recovery/email execution volumes, peak concurrency,
   growth and cost ceiling? Who owns coverage sharding before current bounds fail?
5. Is staging discarded into a new generation or migrated with reviewed continuity?
   Who accepts the legacy unsigned-receipt baseline and any historical blind period?
6. What is the approved user-facing response to an unclosable gap or region outage?
   Name authority credential-revocation operators and alternative recovery guidance.
7. Is cross-region immutable replication required for audit disaster recovery, and
   what RPO/RTO is acceptable? It is not automatic authority failover.

## 14. Baseline discrepancies and source anchors

These distinctions prevent an implementation from claiming controls that are not
present. Historical prose is retained outside this document's two requested links.

| Source at baseline                                                                                            | Correction / implication                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/src/policy/authority.rs:1443–1491`; `app/src/authority/record.rs:28–63`; `audit.rs:11–24`                | Existing authority uses signed JSON proposals, unsigned execution receipts and post-readback RPC commits, not persisted signed-CBOR commits. New codec is real enclave work.            |
| `services/escrow-enclave-host/src/storage.rs:257–300` vs `app/src/authority/store/dynamo.rs:72–90`            | Host DynamoDB→S3 writes are legacy only; configured authority writes originate inside the enclave.                                                                                      |
| `infra/escrow-enclave/authority.tf:55–77`; `ledger.tf:43–44`                                                  | Authority has no stream; only legacy records have NEW_AND_OLD_IMAGES.                                                                                                                   |
| `monitor/src/authority.rs:150–179`; `app/AUDIT-COVERAGE.md:87–94`                                             | Current table-only enumeration cannot detect coherent full purge; RPC signatures are not a durable archive.                                                                             |
| `monitor/src/aws.rs:233`; `monitor/src/lib.rs:291–315`                                                        | Legacy divergence check fetches expected current objects; it does not enumerate all S3 versions in reverse.                                                                             |
| `infra/escrow-enclave/storage.tf:18–98,131–142`; `variables.tf:238–252`                                       | Shared IAM-delegated storage CMK and configurable 2555-day default; Object Lock alone neither protects key availability nor enforces seven years in production.                         |
| `app/README.md`, “HeadStore / P3.3 parent obligations”; `app/PRODUCTION.md:378–387`; `app/ROLLOUT.md:173–179` | README says activate kill switch; operational runbooks explicitly make that a human action, not monitor automation. This proposal preserves that decision.                              |
| `app/ROLLOUT.md:47–54`; `app/README.md:8–16`; `app/ENROLLMENT-AUTHORITY.md:100–130`                           | Older blanket claims that authority is unwired/carry unsigned are historical; configured mode now installs AuthorityEnrollment and signed intent. Unconfigured mode still fails closed. |
| `app/PRODUCTION.md:9–16`                                                                                      | The archiver is the unbuilt retention gate, not the only outstanding launch condition: live verification, soak and residual-risk approval still matter.                                 |

AWS references: [Object Lock](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html),
[conditional writes](https://docs.aws.amazon.com/AmazonS3/latest/userguide/conditional-writes.html),
[object integrity](https://docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity.html),
[DynamoDB Streams](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html),
[Lambda stream failures](https://docs.aws.amazon.com/lambda/latest/dg/services-dynamodb-errors.html).
Validate API/IAM behavior in staging; local mocks and this design are not AWS evidence.
