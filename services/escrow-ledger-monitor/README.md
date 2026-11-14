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
is retried (at most three reads of that account, 250 ms apart), never a false
tampering alarm. Orphan rows are discovered
because the scan projects partition keys from **all** row types, not just accounts.
Bounds: 100 items/page, 10,000 scan pages, 50,000 partitions, 16,384 rows/128 MiB per
account (see "Capacity note" below), and the Lambda's 900-second limit. Exceeding a
bound never reports partial success: it raises coverage failure/missing heartbeat.
Per-account problems are **isolated** (see "Per-account isolation" below): every
other account is still verified before the sweep reports coverage failure.

Fixed metrics/notifications are `AuthorityIntegrityFailure`,
`AuthorityCoverageFailure`, `AuthorityAccountOverCapacity`, `AuthoritySweepCompleted`, and (metric only)
`AuthorityRepeatedPinClearAccounts` plus the deprecated `AuthorityRepeatedPinClear`,
with only operator-owned
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
reads. Every legitimate transition changes that row; a changed fence is retried for
that account (bounded), and if it never settles that account is reported as
incomplete (`AuthorityCoverageFailure`, no authority heartbeat) after every other
account was verified, rather than a false tamper alarm. The next scheduled sweep
re-reads everything; no write permission or volatile checkpoint is needed. Periodic scans were chosen because immutable execution rows
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

Repeated PIN clears: from a fully verified history, every committed event whose
signed `previous_pin` was configured and whose `pin` is not is counted as a PIN clear
(only an owner `Enroll`/`Replace` can change the PIN generation). An account with at
least 2 clears whose signed `time.interval.hi_ms` falls in the 30 days before the
sweep is a repeated-PIN-clear account. After a complete sweep, immediately before
`AuthoritySweepCompleted`, the monitor emits one gauge datum
`AuthorityRepeatedPinClearAccounts` = the number of such accounts, including 0 (no SNS
message; the `AuthorityRepeatedPinClear` CloudWatch alarm notifies). An incomplete
sweep (coverage failure, changed fence, exceeded bound) emits no gauge, so a partial
count or a misleading 0 is never reported. Accounts that fail verification raise
`AuthorityIntegrityFailure` instead and are not counted.

The alarm takes the hourly `Maximum` of the gauge and fires when it exceeds
`authority_repeated_pin_clear_threshold`, an account count (default 0: any account
alarms). During a known episode set it to the number of known accounts (e.g. 1) so a
new account still notifies, then back to 0 once the known account's clears age out
of the 30-day window. The alarm needs this monitor build: deploy it in the same apply
that switches the alarm (an older build emits no gauge and the alarm would sit in
`OK` on missing data).

Deprecated: the monitor still emits the old per-account `AuthorityRepeatedPinClear`
datum (1 per affected account per sweep, Tenant dimension only) for one release so
existing dashboards keep working. Nothing alarms on it; it will be removed in the next
release. It could not distinguish one known account from a new one, because the Sum
is the same shape for both.

This is a rate signal, not an integrity finding: the clients may sign one clear
automatically after an identity-recovery rebind
(`packages/sss-key-manager/POST_RECOVERY_ESCROW_REPAIR_DESIGN.md`, Q1), so a second one
within the window is unusual. Signed records cannot tell a user-initiated clear from
an automatic one, and the metrics have only the Tenant dimension; find the accounts
from the authority table.

Limits: 10,000 scan pages of at most 100 items, 50,000 distinct partitions,
16,384 rows / 128 MiB per account, and the shared 900-second Lambda deadline.
Capacity/read failures alarm `AuthorityCoverageFailure`; incomplete sweeps never
emit `AuthoritySweepCompleted`. Its missing-heartbeat alarm uses two 30-minute
periods. A completed sweep can still have integrity findings: heartbeat means
coverage, not clean data. Before these bounds are approached, implement durable
partitioned coverage; do not increase limits blindly (re-run the capacity probe
and redo the arithmetic below). The legacy sweep runs alongside this one and keeps
its own heartbeat and stream handling.

### Per-account isolation

One account must not blind the monitor to every other account. Within a sweep:

| Per-account condition                                      | What happens to that account                                                      | Rest of the sweep     | Sweep result                                       |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------- | -------------------------------------------------- |
| Integrity finding (`verify_account`, current-row mismatch) | `AuthorityIntegrityFailure` (metric + SNS)                                        | continues (unchanged) | completes if nothing else failed                   |
| Over the row/byte bound                                    | skipped; `AuthorityAccountOverCapacity` (metric + SNS), one per oversized account | continues             | `AuthorityCoverageFailure`, no heartbeat, no gauge |
| Fence still changing after 3 attempts                      | skipped; diagnostic line only                                                     | continues             | `AuthorityCoverageFailure`, no heartbeat, no gauge |
| Malformed row returned by a read (bad key/shape)           | sweep aborts                                                                      | stops (unchanged)     | `AuthorityIntegrityFailure`, no heartbeat          |
| Read/SDK failure (throttle after SDK retries)              | sweep aborts                                                                      | stops (unchanged)     | `AuthorityCoverageFailure`, no heartbeat           |

`AuthoritySweepCompleted` and the `AuthorityRepeatedPinClearAccounts` gauge are
emitted only when **every** partition was fully verified. A skipped account means
coverage is incomplete, so the sweep still fails (and Lambda's async retries
repeat it); the difference is that the failure is reported _after_ everyone else
was checked, so integrity findings in other accounts are not hidden.

An oversized account is **either legitimate growth or deliberate padding**, and
the operator must decide which. Rows are append-only and legitimate traffic grows
an account permanently (~8 rows per PIN recovery; ~16 rows/day for a canary
account at one recovery every 12 hours). But the read path only checks that a row
is well formed and in the right partition before counting it against the bound; it
checks no signatures. Anything that can write the table (for example a compromised
writer) can therefore pad one account with well-formed junk until it is skipped,
and tampering inside a skipped account is never verified. Treat it as **suspected
tampering** (page security, preserve DynamoDB PITR, stream and CloudTrail evidence)
if the account is not a known canary or high-traffic account, if its row count
jumped instead of growing at the expected rate, or if its rows do not look like
enclave records. Either way the account remains unverified until the bound is
raised (with the arithmetic below) or a sharded/checkpointed design lands.

Alert volume while an account stays over capacity: it cannot shrink, so every
scheduled run (every 15 minutes, plus up to 2 Lambda async retries of the failed
invocation) sends one direct `AuthorityAccountOverCapacity` and one direct
`AuthorityCoverageFailure` SNS message, i.e. up to ~6 messages per 15 minutes
(~576/day), and the CloudWatch alarms (60 s period, missing data not breaching)
return to OK between sweeps and re-fire each sweep. This is expected and repeats
until the account is resolved. Do not mute the shared monitor topic to quiet it:
integrity alarms use the same topic. A follow-up should give a known
over-capacity account one persistent alarm state instead of repeated messages.

An account whose fence never settles is skipped with only a diagnostic line and
the end-of-sweep `AuthorityCoverageFailure` (no dedicated metric). Someone able to
drive legitimate writes to one account often enough could keep it unverified, so
investigate `fence_unstable` > 0 on consecutive sweeps as possibly induced.

### Capacity note

Measured on staging: ~7.3 KB per authority row (an account of ~4,100 rows was
~30 MB); successful sweeps of ~8,700 rows / ~85 partitions took ~12 s and peaked
at ~84 MB Lambda memory (1024 MiB configured, 900 s timeout). Memory is per
account: rows are read, verified and dropped before the next partition, so peak
memory is set by the largest single account, not the table.

`tests/capacity.rs` (ignored by default) builds one synthetic account at the
bound with ~8 KB validly signed rows and measures heap with a counting allocator.
The synthetic history is not a valid sequence: it fails the transition check,
which runs only after every row is parsed, so the probe measures the parse phase
(where rows and parsed structures are both held) but not the later state tracking
a valid history would go through. The headroom below is meant to cover that gap:

```sh
cargo test --release --test capacity -- --ignored --nocapture
```

Result on the change that set these limits (developer macOS hardware, release
build; not yet confirmed on the Lambda's ~0.58 vCPU x86/glibc runtime): 16,383 rows, 124.5
MiB payload, 130.9 MiB heap while holding the rows, 207.3 MiB peak during
`verify_account` (+76 MiB of parsed structures), 1.7 s to verify. Arithmetic:

- Rows bound: 16,384 x 7.3 KB = ~114 MiB, so at the measured mean row size the row
  bound binds first. The byte bound (128 MiB) caps accounts of larger rows (up
  to 64 KiB items: 2,048 rows).
- Peak heap scales at ~1.66x payload: 128 MiB -> ~213 MiB. Add ~35 MB runtime
  baseline (84 MB staging peak minus ~1.66 x 30 MB), the in-flight DynamoDB page
  (100 items, < 1 MB parsed twice) and allocator overhead (budget 1.5x on heap):
  ~355 MB worst case, about 2.9x headroom inside 1024 MiB. No Lambda memory
  change is needed. The legacy sweep runs concurrently but is bounded per chain
  (64 x 8 KiB).
- Time, one account: verification is ~0.1 ms/row on developer hardware (expect
  3-5x slower on the Lambda) plus one strongly consistent Query per 100 rows; a
  full account adds seconds to tens of seconds, well inside 900 s.
- Time, whole sweep (the real deadline): the sweep is serial. Staging measured
  ~12 s for ~85 partitions / ~8,700 rows, ~0.14 s per partition (one Scan page
  per 100 rows, two GetItem calls and at least one Query per partition), sharing
  the 900 s timeout with the concurrent legacy sweep. At that rate 900 s is
  reached around ~6,000-12,000 partitions, far below `MAX_PARTITIONS` = 50,000.
  The partition Scan is also bounded at 10,000 pages x 100 items, i.e. ~1,000,000
  rows across the whole table. A timed-out invocation writes no diagnostic line
  and sends no `AuthorityCoverageFailure`; the only signal is the missing-heartbeat
  alarm. This whole-sweep bound, not the per-account bound, sets the deadline for
  the sharded/checkpointed design: watch the monitor Lambda's `Duration` against
  900 s as authority enrollment grows.
- Read cost: each sweep reads the whole table twice with strongly consistent reads
  (the Scan is charged on full item size even with a key projection, then the
  per-partition Query), about 2 x table bytes / 4 KB RRU. Staging's ~63 MB is
  ~31k RRU per sweep, ~3M RRU/day at 96 sweeps. A failed sweep is retried up to 2
  more times by Lambda (x3). An over-capacity account is still read up to its bound
  on every invocation before it is skipped (~2 x account bytes / 4 KB, ~58k RRU at
  ~114 MiB). Cost grows linearly with total table size regardless of the
  per-account limits.
- Growth: with the PIN canary at one recovery per account every 12 hours
  (~16 rows/day), the staging canary account (~4,300 rows on 2026-11-13) reaches
  16,384 rows in roughly two years. Production's largest accounts are ~2,700 rows
  (inferred). Watch `AuthorityAccountOverCapacity`; the long-term answer for
  unbounded per-account history is still a separately reviewed
  sharded/checkpointed design, not repeated limit increases.

### Diagnostic lines

There is still no tracing subscriber and SDK error text is still discarded. The
authority sweep writes one fixed-vocabulary line to stderr (CloudWatch Logs)
per notable event. Only these constant strings and aggregate counts are ever
written, never partition keys, account hashes, payloads, DIDs or SDK errors:

| Line                                                                        | Meaning                                                             |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `authority sweep: partition scan failed`                                    | listing partitions failed (SDK/throttle after SDK retries)          |
| `authority sweep: partition scan over capacity`                             | more than 50,000 partitions or 10,000 scan pages                    |
| `authority sweep: account read failed`                                      | an account GetItem/Query failed; sweep aborted                      |
| `authority sweep: account read malformed`                                   | a read returned a malformed row; sweep aborted as integrity failure |
| `authority sweep: account over capacity`                                    | one account skipped (row/byte bound)                                |
| `authority sweep: fence changed after retries`                              | one account skipped (fence never settled)                           |
| `authority sweep: alarm delivery failed`                                    | CloudWatch or SNS publication failed                                |
| `authority sweep: completed partitions=N`                                   | every partition verified; heartbeat emitted                         |
| `authority sweep: incomplete partitions=N over_capacity=A fence_unstable=F` | every other partition verified; coverage failure follows            |

Find them with a Logs Insights query on the monitor log group, e.g.
`filter @message like /^authority sweep:/`.

Operator note: the `AuthorityAccountOverCapacity` CloudWatch alarm is defined in
`infra/escrow-enclave/authority-audit.tf` (same `authority_integrity` alarm set,
Sum > 0 over 60 s, same SNS topic). Apply that Terraform with the monitor build
that emits the metric; until then the monitor's direct SNS message and
`AuthorityCoverageFailure` still notify.

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
identifiers are logged; returned errors, alarm messages and the authority
sweep's diagnostic lines are fixed strings (plus aggregate counts).
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

| Signal                                       | Meaning / first response                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LedgerIntegrityFailure                       | Mutation, invalid encoding/signature/link/transition, changed image, wrong tenant/key/chain, or head inconsistency. Page security immediately; preserve DynamoDB PITR, stream and CloudTrail evidence, compare immutable S3 versions. Treat as suspected tampering, not a retryable business failure.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| AuditMismatch                                | Missing or different exact signed S3 bytes. Check host AuditUnavailable, S3/KMS availability and commit/upload timing. Recheck next sweep; persistent absence or differing bytes needs security containment. Never repair by overwriting ledger history.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Released / PinAttemptFailed hourly threshold | Possible mass recovery/guessing or duplicate processing. Compare legitimate traffic and stream retries; investigate identities only in access-controlled evidence systems, not metric dimensions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Lambda errors / DLQ depth                    | Verification may not be running. Check permissions, SSM key format, service health, throttling and packaging. Restore detection promptly. Stream retries are capped at 5 with batch bisection; SQS retains failures 14 days, but stream records expire after 24 hours. DLQ metadata is not a durable full copy of the stream; preserve evidence before expiry.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| AuthorityAccountOverCapacity                 | One authority account exceeded the per-account row/byte bound and was skipped; every other account was still verified, and the sweep also reports AuthorityCoverageFailure with no authority heartbeat. Legitimate growth or deliberate padding: identify the account from the authority table in access-controlled tooling and decide which. Unknown account, sudden jump instead of ~8 rows per PIN recovery, or rows that do not look like enclave records: treat as suspected tampering (page security, preserve PITR/stream/CloudTrail evidence). Known canary/high-traffic growth: follow the README capacity note (re-run the probe before raising bounds). Repeats every 15 minutes (up to 3x per run with retries) until resolved; do not mute the shared topic. That account is unaudited until resolved. |
| Missing SweepCompleted                       | No successful full sweep for two 30-minute periods. Check EventBridge delivery, Lambda duration/errors, and ledger growth; do not interpret absent integrity metrics as health.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| EscrowKmsGovernanceChange                    | PutKeyPolicy, CreateGrant, ScheduleKeyDeletion or DisableKey on the escrow CMK, including denied attempts. Immediately reconcile CloudTrail actor/action with approved two-person change records. Unapproved policy/grant activity is a security incident (D10).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| EscrowPrivateLinkChange                      | Endpoint-service permission, configuration, notification or acceptance change (account-wide, including denied calls). The page carries eventName, eventID and eventTime; look up the eventID in CloudTrail for caller and request. Reconcile with the change record; an unexpected acceptance or principal change is a security incident: reject the connection and restore allowed principals.                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Endpoint connection notification             | Raw `vpce` notice (ServiceId, VpcEndpointId, VpcEndpointOwner, EndpointState) on Connect/Accept/Reject/Delete. Accept only the reviewed lca-api endpoint ID from the expected owner; reject anything else. An unplanned Delete means lca-api lost its path to the enclave.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| <prefix>-nlb-healthy-hosts                   | Fewer healthy NLB targets than the ASG minimum for 5 minutes (or no registered targets). Check ASG activity, instance refresh, target health and host/enclave logs. Expected during staging's single-host roll; in production it means lost redundancy or capacity. OK notifies recovery.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

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
