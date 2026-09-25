# Independent escrow ledger monitor (P7.1 A/B)

Rust 1.93, one Lambda bootstrap with two entry points selected by event shape:
DynamoDB `Records` invokes stream verification; `source=aws.events` and
`detail-type=Scheduled Event` invokes the audit sweep. Terraform schedules it
every 15 minutes and connects only the **records** stream. No network calls in tests.

## Detection boundary

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
  can raise a transient missing-object alarm. **It is not silently suppressed**:
  investigate and compare on the next sweep. Persistent absence is an incident.
  AccessDenied/timeouts are operational failures, not fabricated missing objects.
- Full scan work grows with the ledger. All pages are traversed, but Lambda's
  15-minute timeout bounds execution. `SweepCompleted` is emitted only on completion;
  missing-heartbeat and Lambda errors expose incomplete scans. Before scale exceeds
  this bound, implement durable, partitioned sweeps (not in-memory pagination).
  Table deletion or total removal of heads needs stream/CloudTrail evidence;
  this is not a reverse S3 inventory comparison or an external freshness oracle.

Metrics in `LearnCard/EscrowLedger` have **only `Tenant`**, taken from operator
configuration, never a record-supplied DID, chain ID, hold ID, request ID, or hash.
All seven signed event types are counted. Delivery is **at least once**: Lambda
retries can duplicate both metrics and SNS alarms; hourly thresholds are signals,
not billing or exact forensic counts. No payloads, raw SDK errors, or record
identifiers are logged; returned errors and alarm messages are fixed strings.
CloudTrail SNS messages are also constant, not full management-event payloads.
DLQs may contain source payloads/metadata: restrict operator access accordingly.

## Trusted key provisioning and configuration

Before enabling the monitor, security operators must verify a fresh nonce-bound
Nitro attestation (AWS trust root, approved PCRs, non-debug, freshness) and extract
its **ledger** public key from `public_key`, not the escrow ECDH key in `user_data`.
Store the 65-byte uncompressed SEC1 P-256 key as **130 hex characters** in an SSM
**String** parameter under a security-owned absolute path. This is a public trust
anchor; neither host nor monitor should have PutParameter permission. Never obtain
it from an unauthenticated parent response. The monitor reads it at cold start;
recycle execution environments after an approved update. A single tenant/key is
configured per deployment. Key rotation needs retention/verification planning for
historical chains: do not simply replace the parameter while old chains remain.
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
