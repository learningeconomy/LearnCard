# Independent escrow monitor (legacy ledger and Design 2 authority)

Rust 1.93, one Lambda bootstrap with two entry points selected by event shape:
DynamoDB `Records` invokes stream verification; `source=aws.events` and
`detail-type=Scheduled Event` invokes the audit sweep. Terraform schedules it
every 15 minutes and connects only the **records** stream. No network calls in tests.

## Authority audit path (PR 2)

When `enable_enrollment_authority=true`, the existing 15-minute schedule also runs
an independent, strongly consistent authority-table sweep. It receives only
GetItem/Query/Scan on the exact table and GetParameter on the security-owned
`/escrow-enclave-<environment>/authority-monitor-trust` String. It has **no authority
writes, writer credentials, escrow-CMK or credential-CMK grant**. No new stream is
needed; the original stream still covers legacy records. Legacy and authority
sweeps run independently within the scheduled invocation.

All three Lambda settings must be present together: `AUTHORITY_TABLE`,
`AUTHORITY_GENERATION`, `AUTHORITY_TRUST_PARAMETER`. Partial configuration fails
startup. The trust value is a bounded JSON object:

```json
{
    "<keyId>": {
        "publicKey": "<130 lowercase hex SEC1 characters>",
        "measurements": ["<64 lowercase hex SHA-256 of PCR0||PCR1||PCR2 bytes>"]
    }
}
```

Security operators independently verify fresh NSM evidence before populating it;
never use parent-supplied unverified keys or the public fake fixtures. Up to 32 key
IDs/eight measurements per key/8192 bytes are accepted. Retain historical anchors
for the lifetime of records, even after an old image/key loses decrypt approval.
Use an Advanced SSM String when needed. Redeploy/recycle Lambda after trust changes
because anchors load at cold start. The two SCPs protect the read exception, IAM
role/PassRole, Lambda code/configuration and this fixed trust path. Both must be
attached and independently checked before enabling the grant.

The monitor shares **schemas and signature encoding**, not the enclave policy or
writer implementation. It reconstructs revision, enrollment, PIN-generation and
hold state independently. It verifies measurement/key-pinned Proposal signatures,
immutable execution receipt bindings, gap-free operation revisions, allowed budget
increments/resets, carry/rewrap preservation, terminal hold ordering and the latest
operation/current-account rows. Every committed row must have matching execution
evidence. Execution rows retain reservations even after operation rows change.
Request IDs, public share version and rewrap delegation are included in signed
proposals, so renaming an operation tombstone cannot evade correlation.

RPC Commit/Snapshot records are not stored in the table. The common verifier can
verify them against an explicitly expected kind, but they cannot substitute for
a Proposal or an execution receipt. The monitor relies on **authenticated reads of
the protected table** for receipt existence, not on treating a proposal signature
as post-commit proof. Clients separately verify RPC signatures and nonces.

Each account is read before and after paginated history collection. A changed fence
retries as coverage failure, not a false tampering alarm. Orphan rows are discovered
because the scan projects partition keys from **all** row types, not just accounts.
Bounds: 100 items/page, 10,000 scan pages, 50,000 partitions, 4096 rows/32 MiB per
account, and the Lambda's 900-second limit. Exceeding a bound never reports partial
success: it raises coverage failure/missing heartbeat and requires capacity review
or a separately reviewed sharded/checkpoint design before further rollout.

Fixed metrics/notifications are `AuthorityIntegrityFailure`,
`AuthorityCoverageFailure`, and `AuthoritySweepCompleted`, with only operator-owned
Tenant dimensions. A separate authority heartbeat alarm treats missing data as
breaching. Integrity findings may accompany a completed sweep; completion is a
coverage signal, not an assertion that every row is valid. No historical release
rate counters are emitted on every sweep (that would double-count history).

This is not an external durable high-water mark. A coherent privileged purge to an
old prefix or an empty table can evade a read-only snapshot sweep. Enforce the SCPs,
resource IAM, no same-generation restore, and independent governance monitoring.
An unused fresh generation is legitimately empty. Administrators able to change
guardrails or disable alarm delivery remain a stated trust/operational risk.

## Legacy detection boundary

### Configured authority audit (PR 2)

With `enable_enrollment_authority`, the scheduled invocation also independently
scans the authority table. It projects **all partition keys**, not only account
rows, so retained executions cannot hide behind a missing account. It then queries
each partition with strongly consistent reads bracketed by identical account-row
reads. Every legitimate transition changes that row; a changed fence fails with
`AuthorityCoverageFailure` and no authority heartbeat, rather than a false tamper
alarm. Scheduled retries repeat the whole sweep; no write permission or volatile
checkpoint is needed. Periodic scans were chosen because immutable execution rows
retain every phase (including abandoned reservations), without a stream-expiry or
checkpoint dependency. This is bounded periodic detection, not real-time alerting.

The verifier authenticates Proposal signatures using security-owned ledger-key and
measurement pins, reconstructs revisions and per-generation PIN accounting, and
matches current account, operation and hold rows to immutable execution receipts.
Missing receipts/rows, invalid signatures, revision regressions and decreasing
attempts alarm `AuthorityIntegrityFailure`. Proposal is never treated as Commit:
the table contains signed proposals plus transaction receipts, **not** the portable
post-readback Commit RPC artifact. The same kind-specific signature verifier checks
Commit artifacts (covered by the shared Rust/client fixture); client verification
of RPC commits remains separate from this independent table enumeration.

### P9.1 (attack C): enclave-sent recovery email confirmation

A Hold-policy `CreateHold` now starts `AwaitingConfirmation` instead of
`Pending` (Pin-policy is unaffected — it never leaves `Pending`). `ConfirmHold`
and `ResendCode` are only valid while still `AwaitingConfirmation`;
`SendReleaseWarning` and `Release`/matched `PinAttempt` require `Pending`;
`Cancel` accepts either. The verifier independently re-derives — purely from
signed events, never from the unauthenticated stored `HoldItem` row's own
`confirmedHiMs`/`releaseWarningSentHiMs` fields — whether a hold that started
`AwaitingConfirmation` shows a matched `ConfirmHold` (the one whose resulting
status is `Pending`, not one of the up-to-five rejected guesses) and a
`SendReleaseWarning` at least 24 hours before the release event's own
trusted-time lower bound. Either gap alarms `AuthorityIntegrityFailure` exactly
like any other reconstructed-state violation; this mirrors (and independently
re-checks, rather than trusts) the enclave's own `authority_release_with_receipt`
gate.

Limits: 10,000 scan pages of at most 100 items, 50,000 distinct partitions,
4,096 rows / 32 MiB per account, and the shared 900-second Lambda deadline.
Capacity/read failures alarm `AuthorityCoverageFailure`; incomplete sweeps never
emit `AuthoritySweepCompleted`. Its missing-heartbeat alarm uses two 30-minute
periods. A completed sweep can still have integrity findings: heartbeat means
coverage, not clean data. Before these bounds are approached, implement durable
partitioned coverage; do not increase limits blindly. The legacy sweep runs
alongside this one and keeps its own heartbeat and stream handling.

The observer receives only `GetItem`, `Query`, `Scan` on the exact authority table
and `GetParameter` on `/${name_prefix}/authority-monitor-trust`. Both Organizations
SCPs must be attached and independently verified; the second protects the observer
role, Lambda code and trust parameter and forbids non-read authority APIs even if
another identity policy grants them. It gets no writer credential or escrow CMK.

Terraform sets `AUTHORITY_TABLE`, `AUTHORITY_GENERATION`, and
`AUTHORITY_TRUST_PARAMETER` together; partial configuration fails cold start.
Provision the separate SSM **String** from verified nonce-bound NSM evidence:
`{"<keyId>":{"publicKey":"<130 lowercase SEC1 hex>","measurements":["<64 lowercase hex>"]}}`.
The measurement is SHA-256 of raw PCR0 || PCR1 || PCR2. Bounds are 8,192 bytes,
1–32 key IDs and 1–8 distinct measurements per key (use SSM Advanced tier above
4 KiB). Retain historical key/measurement pairs while audit rows reference them;
these are historical verification pins, not permission for retired images to run.
Recycle Lambda environments after approved trust updates. This does not replace
the existing legacy ledger parameter.

A coherent privileged purge/rollback of **all** rows cannot be detected by this
stateless read-only scan. There is no independent authority S3 outbox/checkpoint
implemented here. Preserve PITR and independent governance evidence; never restore
an old same-generation table. Authority protection trusts AWS and protected
administration. On either integrity or prolonged coverage alarms, follow the manual
incident procedure below; the API kill switch cannot stop a compromised host.

This is D3/D13 **rollback detection, not prevention**. It cannot discover a
parent's entirely suppressed writes or prove globally fresh enrollment, and it
does not make an independent live enrollment authority unnecessary. It shares
no credentials with the host: the existing monitor IAM role has read-only table
and audit access, SNS/CloudWatch publication, and GetParameter for one public key.
It has **no escrow-CMK access, table writes, or lca-api configuration writes**.

- Any records-table MODIFY or REMOVE alarms immediately, without image parsing
  or storage reads. There is no legitimate mutation of a committed record.
- INSERT strongly-consistently queries the entire ordered chain, paginating one
  item at a time and bounding it at 64 records of 8192 bytes. It uses the enclave's
  exact canonical decoder and `Ledger::verify_chain`, binds the chain ID to the
  signed enrollment, and requires the inserted image and sort key to match stored
  bytes. Only the inserted event is counted, not its whole history.
  It captures the strongly consistent head before reading the chain, requires that
  head to be a verified prefix at least as recent as the inserted record, and checks
  the inserted record's exact S3 audit bytes before counting it. Head-first ordering
  avoids false tampering alarms when a concurrent append advances the head.
- Neither records nor heads stores a commit/update timestamp. **The sweep scans
  every head on every invocation**, not just a purported two-hour subset. This
  is a superset of the requested lookback and needs no volatile/durable handoff,
  timestamp schema changes, or write permissions. Each head must occur in its
  verified chain; every record is compared byte-for-byte with
  `audit/<tenant>/<chainId>/<seq>-<unsigned-record-hash>.cbor`. A subsequent
  strongly-consistent head read detects a head left behind later stored records.
  Scan pagination is not a transaction-wide snapshot; concurrent appends may
  extend the initially scanned head, so prefix matches are allowed.
- DynamoDB commits precede S3 uploads. A sweep overlapping that short interval
  or INSERT check retries an absent object at most three times, 100 ms apart, then
  alarms; different bytes alarm immediately. **It is not silently suppressed**:
  investigate and compare on the next sweep. Persistent absence is an incident.
  AccessDenied/timeouts are operational failures, not fabricated missing objects.
- Reconciliation also scans the **records** table for partitions whose heads are
  missing, so deleting a head cannot hide its retained records from a sweep. Both
  scans paginate 25 items at a time, capped at 10,000 pages each; reaching the cap
  fails the invocation without a SweepCompleted heartbeat. Records scans project
  partition keys only and deduplicate within each page (bounded memory).
- Full scan work grows with the ledger. Within those caps all pages are traversed, but Lambda's
  15-minute timeout bounds execution. `SweepCompleted` is emitted only on completion;
  missing-heartbeat and Lambda errors expose incomplete scans. Before scale exceeds
  this bound, implement durable, partitioned sweeps (not in-memory pagination).
  Table deletion or total removal of both heads and records needs stream/CloudTrail evidence;
  this is not a reverse S3 inventory comparison or an external freshness oracle.

Metrics in `LearnCard/EscrowLedger` have **only `Tenant`**, taken from operator
configuration, never a record-supplied DID, chain ID, hold ID, request ID, or hash.
All eight signed event types (including `Carried`) are counted. Delivery is **at least once**: Lambda
retries can duplicate both metrics and SNS alarms; hourly thresholds are signals,
not billing or exact forensic counts. No payloads, raw SDK errors, or record
identifiers are logged; returned errors and alarm messages are fixed strings.
CloudTrail SNS messages are also constant, not full management-event payloads.
DLQs may contain source payloads/metadata: restrict operator access accordingly.

## Trusted key provisioning and configuration

Chain IDs use the shared v2 tenant/identity/blob-hash derivation; epoch is a signed
record binding, not a selector. On INSERT and sweep, a Carried genesis must name
an authenticated source head and carry exactly `min(10, sourceCarried + source
reservations through that head)`. Missing sources/heads and mismatched floors use
LedgerIntegrityFailure. An all-zero head denotes an empty prefix with floor zero;
that source may subsequently acquire ordinary hold records. Its own Carried
genesis cannot be omitted this way. Validation is one hop, not recursive: the
source's genesis supplies its inherited floor and is checked on its own sweep.
Nitro never ran in production; no v1-chain migration is supported. An older
PIN-bearing source copy may still have fewer attempts: preventing its selection
requires the independently authenticated current-enrollment authority.

Before enabling the monitor, security operators must verify a fresh nonce-bound
Nitro attestation (AWS trust root, approved PCRs, non-debug, freshness) and extract
its **ledger** public key from `public_key`, not the escrow ECDH key in `user_data`.
Store a JSON object `{"<keyId>":"<130-character lowercase hex SEC1 P-256 key>",...}`
in an SSM **String** parameter under a security-owned absolute path. The value is
bounded to 2048 bytes and 1–4 entries; IDs are 1–128 ASCII `[A-Za-z0-9._-]` and
keys are 65-byte uncompressed points (hex starts `04`). Each record selects its
verifier using signed CBOR key 10, allowing K1/K2 records in the same chain and
rejecting unknown IDs. The legacy bare 130-hex value is still accepted with its
previous single-key, single-keyId-per-chain semantics. This is a public trust
anchor; neither host nor monitor should have PutParameter permission. Never obtain
it from an unauthenticated parent response. The monitor reads it at cold start;
recycle execution environments after an approved update. A single tenant is
configured per deployment (up to four ledger key IDs). During rotation retain
old key entries while any historical chain references them, even after blob rewrap.
Do not simply replace the parameter while old chains remain.
This implementation validates signatures against that pinned key; it does not
perform attestation fetching, PCR allowlisting per record, or enrollment freshness
verification. Those are separate trust-provisioning/authority obligations.

Required environment variables (Terraform populates them):
`TENANT`, `RECORDS_TABLE`, `HEADS_TABLE`, `AUDIT_BUCKET`, `ALARM_TOPIC`,
`LEDGER_PUBLIC_KEY_PARAMETER`; AWS provides region and monitor role credentials.
Use tenant identifiers only, not personal data, in TENANT and infrastructure names.

## Build and deploy

`infra/escrow-enclave/monitor.tf` uses **x86_64**, `provided.al2023`, 1024 MiB,
900-second timeout. Build in Linux AL2023-compatible tooling (e.g. a controlled
Linux build runner) for `x86_64-unknown-linux-gnu`; native macOS binaries cannot run
in Lambda. ZIP the release executable at the archive root as `bootstrap` with
executable permissions. Set `monitor_zip_path` to that ZIP, `monitor_tenant`,
and `monitor_public_key_parameter_name`. Optional `monitor_alarm_email` requires
subscription confirmation. Tune the two hourly threshold variables to baseline.
Do not package test binaries or enable fake enclave features in a production build.

Default builds of the enclave retain their existing runtime/KMS behavior through
the new default `enclave-runtime` feature. This monitor uses `default-features=false`
to omit KMS/CMS/RSA and server code; fake KMS enables runtime only in dev builds.
No cryptographic implementation or verifier behavior is changed. AWS clients disable
default features to exclude the legacy TLS stack. Cargo.lock is checked in.

```sh
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo test
cargo audit --ignore RUSTSEC-2023-0071
cargo tree -e normal -i rsa
cargo build --release --locked
```

The RSA ignore is **D11, dev dependency only**; the reverse normal dependency tree
must be empty. The S3 SDK's lru advisory may be informational; do not add an ignore.
Production panic=abort. Local compiler/tests do not prove Linux packaging or AWS
delivery works. In staging test a denied records mutation, a missing audit object,
rate alarm, DLQ path, timeout/heartbeat, email confirmation and KMS event delivery.

## Operator runbook

| Signal                                       | Meaning / first response                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LedgerIntegrityFailure                       | Mutation, invalid encoding/signature/link/transition, changed image, wrong tenant/key/chain, or head inconsistency. Page security immediately; preserve DynamoDB PITR, stream and CloudTrail evidence, compare immutable S3 versions. Treat as suspected tampering, not a retryable business failure.                                                          |
| AuditMismatch                                | Missing or different exact signed S3 bytes. Check host AuditUnavailable, S3/KMS availability and commit/upload timing. Recheck next sweep; persistent absence or differing bytes needs security containment. Never repair by overwriting ledger history.                                                                                                       |
| Released / PinAttemptFailed hourly threshold | Possible mass recovery/guessing or duplicate processing. Compare legitimate traffic and stream retries; investigate identities only in access-controlled evidence systems, not metric dimensions.                                                                                                                                                              |
| Lambda errors / DLQ depth                    | Verification may not be running. Check permissions, SSM key format, service health, throttling and packaging. Restore detection promptly. Stream retries are capped at 5 with batch bisection; SQS retains failures 14 days, but stream records expire after 24 hours. DLQ metadata is not a durable full copy of the stream; preserve evidence before expiry. |
| Missing SweepCompleted                       | No successful full sweep for two 30-minute periods. Check EventBridge delivery, Lambda duration/errors, and ledger growth; do not interpret absent integrity metrics as health.                                                                                                                                                                                |
| EscrowKmsGovernanceChange                    | PutKeyPolicy, CreateGrant, ScheduleKeyDeletion or DisableKey on the escrow CMK, including denied attempts. Immediately reconcile CloudTrail actor/action with approved two-person change records. Unapproved policy/grant activity is a security incident (D10).                                                                                               |

1. Acknowledge/page the security incident owner. Preserve evidence before replaying
   failed batches; do not delete records, reset PIN budgets, regenerate keys, or
   restart enclaves to clear high-water marks.
2. **Manually set lca-api `ESCROW_RELEASE_KILL_SWITCH=true` and redeploy/restart all
   serving API instances** when tampering, unauthorized KMS governance changes, or
   persistent unexplained audit divergence is suspected. Also consider this during
   prolonged monitor blindness. Confirm start/complete recovery are refused; the
   switch does not retroactively undo completed releases. Follow Part C's existing
   API deployment procedure; this monitor does not modify it.
3. Reconcile exact signed histories, public-key provenance, IAM and CMK policy with
   security. Object Lock is evidence, not authorization to resume automatically.
4. Only the incident owner/security approver clears the switch after reconciliation,
   restored monitoring, and validated recovery tests. Record approval and timestamps.

**Never auto-flip the switch.** Giving a monitor write authority over lca-api would
let a compromised/buggy detector deny recovery globally. Its independent read-only
role trades response latency for avoiding that new denial-of-service capability.

CloudTrail's management-event trail must be enabled independently in this region;
the EventBridge rule does not create a trail. SNS permits the EventBridge service
publisher (EventBridge SNS targets do not support source-condition policies);
control creation of EventBridge rules/targets via security administration. The
CloudWatch publisher is scoped by source account/alarm prefix. Restrict who may
edit this monitor, its role, SSM trust anchor, rules, subscriptions and alarms.
