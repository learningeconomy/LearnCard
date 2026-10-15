# Enrollment authority for Nitro escrow

**Status:** Decided (2026-10-13, by product owner). This does not close BLOCKER-ENROLLMENT.
**Baseline:** `origin/main` at `11d788511a39ff1f9416e37c3626da2a7e02cdfe`.
**Decisions:**

1. Forgot-PIN recovery via the 7-day path stays, protected by vault-sent email confirmation.
2. PIN budget is 10 attempts per PIN set. Setting/changing a PIN starts a fresh 10 and MUST be user-signed. Carry/rewrap preserve the count.
3. Authority table lives in the escrow account with tight admin controls.

All interfaces and record types below marked proposed are new work, not existing APIs.
Paths are repository-relative; `app/` below means `services/escrow-enclave-app/`,
`api/` means `services/learn-card-network/lca-api/`.

### Implementation status

Foundations include the losing-signer fix: speculative ledger
proposals are separate from committed high-water marks. A conflict can reconcile
to a verified winning successor without resetting the committed prefix; ambiguous
writes still fail closed. Readback remains the legacy host-presented view, not
proof of durable persistence (D3). Existing KMS boot/unsealing now uses fresh
Roughtime evidence for TLS validity and SigV4, with compiled roots and no automatic
retries or cross-operation TLS reuse (see SECURITY.md for delayed-delivery limits).
Direct DynamoDB/SES data-plane clients are compiled under `kms`, with optional
measured settings, dedicated credential types, generated execution IDs, and no
automatic retries. Configured boot now constructs the authority client. Local TLS tests
cover response conversion, body limits, stalled bodies and cross-operation
connection isolation. Attested writer-credential unsealing and optional opaque
host ciphertext delivery are implemented. Email credential unsealing and sending
remain inactive. Gated authority/credential/email infrastructure, optional delegated DNS,
host proxy allowlists, governance alarms and operator provisioning are implemented
but off by default. The management-account SCP is a prerequisite to enabling them;
see `infra/escrow-enclave/README.md`. Public authority/email settings are recorded in local measurements and the
CI-signed manifest; no plaintext access keys belong in either artifact.
Without authority configuration, `UnavailableEnrollment` remains wired. Partial
configuration, missing ciphertext or unsealing failure fails boot closed. No email
client is active. **PR 2 implementation is complete offline, not deployed or a
production launch approval.** Authority, wire/API, clients and independent audit
integration are implemented. The ordered staging gates and PR 3 attack-C/email
confirmation blocker remain; see `STAGING.md` and `SECURITY.md`.

Operation budget: with one time server down, a round now ends at the second
consistent authenticated response, not the missing server's shared 2s cap.
Create-hold uses four rounds (three AWS TLS/signing samples and one shared
back-to-back policy/event sample); PIN release uses nine (six AWS, three policy/event).
At 200ms per quorum and 100ms per AWS call the paused-time policy regressions take
1.1s / 2.4s, leaving over half of the enclave's 10s read/queue/execute/write deadline.
These are latency assumptions, not availability guarantees: at the full 2s cap,
time acquisition alone can cost 8s / 18s, and each AWS call has a 15s cap; the
enclave's shared 10s deadline cancels unfinished work fail-closed rather than
allowing those inner caps to add up. PR #1714 must budget an additional quorum
and AWS call for SES and a fresh post-acceptance evidence round for warning sends
(at these latencies, +0.3s and +0.2s respectively); no pre-SES evidence may timestamp
acceptance. AWS samples stay fresh because they also validate TLS certificate
intervals: a monotonic-age SigV4 cache cannot replace that evidence. Outer
deadlines must exceed inner operation deadlines plus transport/response overhead:
host forwarding and lca-api currently both use 10s, racing the enclave; change
them to, for example, 12s and 15s respectively, below the SDK's 30s fetch budget.
The AWS 15s per-call cap is subordinate to the enclave operation deadline, not
a promise that each call gets 15s. Slow quorum/AWS service or actor queueing can
still exhaust the operation budget; ambiguous writes must not be retried as releases.

PR 2 item-a checkpoint adds the persistence schema in
`src/authority/state.rs`. It is available without AWS features for offline tests
and future independent verification. Account rows bind tenant, generation and DID
hash; operation revision is separate from enrollment version and epoch. Active
state includes the encrypted envelope and its canonical blob identity. Disabled
tombstones retain versions and PIN accounting. Holds and operation metadata occupy
separate bounded rows, with no TTL or default state for missing records.

Storage payloads use strict, versioned JSON, capped at 64 KiB, with 24 KiB encrypted
envelopes and 8 KiB proposed events. Partition keys are domain-separated hashes of
length-framed tenant/generation and DID hash; sort keys distinguish `ENROLLMENT`,
`HOLD#<holdId>` and `OPERATION#<requestId>`. This encoding is **not** the future
signed-intent canonicalization. Stored proposal bytes are **not** signed proof of
commit. Schema validation does not authenticate a snapshot or enforce transitions.
PR 2 item b adds `AuthorityStore` with the direct DynamoDB adapter and an
explicit `fake-authority` feature. Each transition atomically puts the account,
request-operation, optional hold, and immutable `EXECUTION#<randomId>` receipt.
Rows contain `pk`, `sk`, and a binary `payload`; existing rows require exact prior
payload equality, new rows require absence. Reads use `TransactGetItems`. The fake
uses the same conditions under one lock, including delayed/ambiguous-write tests.

The durable execution ID is generated inside the enclave and stored with the
operation and receipt. It is independent of the AWS client's short-lived transport
idempotency token. The immutable receipt binds the transaction digest and resulting
revision; it survives updates to a PIN operation's reservation/result row. Receipts
retain the exact signed proposal in their immutable execution row, so a reservation
event is not lost when its mutable operation row advances to a result. Receipts
are storage evidence; item c separately signs portable post-commit artifacts. An acknowledged
write requires receipt readback for `Applied`; reconciliation returns only
`Reconciled`, never a fresh PIN comparison permit. Missing receipts with unchanged
or missing account state remain `Unknown`. Only an atomic read showing an advanced
account revision without that receipt establishes a losing transaction. There is
no automatic retry, deletion, expiry, or refund path. A missing account is never
initialized from an existing blob; only an explicitly prepared initial enrollment
can create it, and item c verifies the owner's signature and plaintext bindings first.

Item c adds `policy/authority.rs`. Configured boot unseals the dedicated writer
credentials, supervises the DynamoDB relay and installs `AuthorityEnrollment` as
both the enrollment source and transactional policy backend. The signed-intent
verifier is compiled with this mode and called unconditionally for enrollment
changes; there is no unsigned activation switch. The old unsigned carry method is
refused in configured mode. Enroll/replace/disable/carry validate decrypted DID,
share version and PIN action before committing. All resulting active envelopes
are persisted atomically, including enclave-randomized carry output. Background
rewrap requires the current blob and signed delegation and preserves plaintext,
epoch, PIN generation and attempts. It increments enrollment version, invalidating
old holds while leaving the epoch unchanged.

Set/change/clear start a fresh signed PIN generation; keep/carry/rewrap cannot
refund attempts. Only `Applied` reservations permit a comparison. Reconciled or
unknown reservations are never resumed. PIN success and hold release commit in
one transaction; cancellation, rotation and other result writers race against
the same account/hold conditions. Conflict fails closed without retrying comparison.
Reconciled release commits do not disclose another seal. Cancellation uses a stable
hold-bound operation ID; committed cancellations can be confirmed across restarts
without a new transition. A missing receipt never establishes non-commit.

Authority holds have policy version 2 and use `ledgerSeq` as the creation operation
revision. Their `signature` contains base64 JSON of a signed **Commit** artifact,
not a legacy ledger signature. Proposal and Commit records use distinct tags under
`learncard-authority-signed-record-v1`, bind key ID and measurement, and use raw
low-S P-256 signatures. Policy stores signed proposals with the transaction and
signs commit artifacts only after authenticated receipt readback. Commit payloads
bind the immutable execution receipt, proposed-event hash and request commitment.
The configured policy does not derive freshness or PIN budgets from the legacy
parent ledger. Item g now consumes these authority artifacts independently; the
legacy ledger observer remains separate.

Item e exposes `enrollmentState`, `applyEnrollment` and `authorityRewrap` through
the enclave and independent host DTOs, at `/v1/enrollment-state`,
`/v1/apply-enrollment` and `/v1/authority-rewrap`. Release/cancel responses preserve
post-commit receipts. The API requires owner-signed intent in remote mode and
never falls back to unsigned/PIN-less enrollment. It caches and returns the actual
persisted output envelope, authoritative epoch/version/generation and commit
evidence. Mongo persistence compares the old blob and PIN cache; a lost cache CAS
does not undo or retry the authority transition. Signed disablement uses the POST
body route `/keys/escrow/disable`; the legacy DELETE route remains software-only,
so signed capabilities and encrypted sources never become URL query parameters.
The rewrap job can reconcile a
lost response from fresh authoritative state instead of trying to reseal an old copy.
Pending obsolete holds can still be cancelled after rotation/disable, and confirmed
cancellation receipts are stored before clearing the durable pending marker.

`POST /keys/escrow/authority-state` requires account/provider authentication and
forwards a client-generated 32-byte nonce (64 lowercase hex characters). The enclave
signs `[nonce, state]` as a distinct Snapshot artifact (kind tag 2, versus Proposal=0
and Commit=1). Snapshot payloads are bounded at 49,152 base64 characters to accommodate
the encrypted active envelope; Proposal/Commit payloads retain the 8192-character
bound. Commit payloads now explicitly bind resulting blob identity and epoch, so
clients can check the returned ciphertext without reconstructing a DynamoDB transaction.
API shape validation is not signature verification: clients must verify these artifacts
against the nonce-bound attested ledger key before trusting them (item f).

Item f integrates the signed protocol into `sss-key-manager` and AuthCoordinator.
The NSM verifier extracts the raw P-256 ledger key only from the signed `public_key`
field and derives the record measurement from the verified PCR0/1/2 tuple. Legacy
evidence without an attested ledger key remains readable for compatibility but
cannot authorize Nitro enrollment. The client requires a fresh random Snapshot
nonce, verifies the record signature/kind/scope, and compares the signed state
against its unsigned duplicate. It verifies each mutation's commit against the
exact intent digest, expected enrollment version, DID/tenant/generation, epoch
and actual returned blob identity before treating enrollment as successful.

Automatic repair checks the authority even when Mongo claims enrollment. Empty
staging generations re-enroll cleanly without importing Mongo epochs or PIN state.
Active PINs carry only via signed keep intent; set/change/clear are selected from
verified state. A disabled authority is never resurrected by background repair,
even if Mongo loses its opt-out marker. Explicit enable without a new PIN signs
a clear of the retired verifier. Disable uses the POST body endpoint, verifies
its commit, and can recognize an already-disabled state through fresh evidence.

Only receipt/Snapshot-verified ciphertext enters the client's account-scoped
session cache (`getVerifiedEscrowEnvelope`); durable ciphertext remains in the
authority and lca-api caches the returned envelope. The session cache is not a
freshness oracle and is cleared on account switch, logout and device forgetting.
Guarded asynchronous writes cannot emit a mutation after a forgotten session
resumes. AuthCoordinator does not replace a failed verification with Mongo's
optimistic enrolled flag. Recovery itself never requests the lost key to sign
an intent; owner signatures begin only after key possession/reconstruction.

`escrow-authority-v1.json` adds Rust-produced Snapshot/Commit signatures and a
fake-CA NSM document with the bound ledger key, verified by both Rust and TypeScript.
Its documented fixture keys/root are public test material, never production trust.

Item g adds a gated read-only authority sweep, independent of host/Mongo/legacy
ledger data. It verifies measurement/key-pinned proposals and authenticated
execution receipts, reconstructs revisions/PIN generations/hold states, and checks
every committed row against history. Signed proposals include public share version
and rewrap delegation. An unchanged account fence brackets pagination; moving or
unavailable reads never become a clean partial sweep. Integrity, coverage and
missing-heartbeat alarms are separate from legacy telemetry. No authority writes,
writer secrets or escrow/credential-CMK grants are added to the observer.

The read exception is bounded by table IAM and two separately attached SCPs. The
observer's role/PassRole, Lambda and public SSM trust path are protected from
non-admin takeover. These are still structural offline tests, not live enforcement
proof. A coherent privileged purge/rollback and detector suppression remain explicit
risks; the sweep is not an external durable high-water mark.

Item h's [coverage inventory](AUDIT-COVERAGE.md) maps every requested offline
must-have to tests, including new comparison/cancellation pause points and mutation
crash matrices. Item i updates security status and the ordered staging runbook.
Software mode remains staging/dev only. Email confirmation remains PR 3; current
lca-api notifications do not close attack C.

Item d was implemented before c to avoid an unsigned activation window. The Rust
verifier is `src/authority/intent.rs`; the TypeScript encoder/signer is
`packages/sss-key-manager/src/escrow-enrollment-intent.ts`. Both consume the shared
golden vector `packages/sss-key-manager/src/__fixtures__/escrow-enrollment-intent-v1.json`.
The fixture uses a **public RFC 8032 test seed**, never a real account key. Its
envelopes test ciphertext identity binding, not decrypted-plaintext authorization.
The verifier requires an authenticated authority snapshot and exact request
envelopes. A valid signature over a fabricated source still fails when that source
is not the active authority blob (attack B). Signature replay fails after enrollment
version changes; unrelated operation revisions do not invalidate intent. Policy
calls the verifier, routes carry intent, and AuthCoordinator supplies the account
key to the strategy that verifies state and signs the exact change.

The client layer is not authorization: enclave policy must build its typed requests
from validated intent and bind generation/tenant/expected revision in item keys and
conditions. It is not exposed as a host RPC. `GetItem` sets `ConsistentRead: true`;
`TransactGetItems` uses AWS's atomic transactional API (which has no `ConsistentRead`
parameter). Transaction tokens are 128-bit enclave-generated IDs with immutable
request bytes; AWS's ten-minute token window does not replace durable receipts.

### Signed enrollment intent V1 encoding (item d)

The account's own **Ed25519** key signs, matching LearnCard's `did:key` plugin.
The verifier decodes the DID locally: `did:key:z` followed by canonical base58btc
of the two-byte Ed25519 multicodec `ed 01` and 32-byte compressed public key.
Other DID methods, codecs, fragments, invalid/noncanonical points and weak keys
fail closed. It never fetches a DID document. The client checks that its 32-byte
seed derives exactly that public key and wipes its temporary seed byte array.

Sign **the complete message bytes** using ordinary RFC 8032 Ed25519 (not a digest,
Ed25519ph, JWS or JSON). The signature is raw 64-byte `R || S`, transported as
canonical padded standard base64. Rust uses `verify_strict`; malformed/noncanonical
signatures are rejected. JSON object order and whitespace do not affect the signed
message; unknown/duplicate fields, omitted required nulls and out-of-range integers
are rejected by the Rust decoder. Raw signed-intent JSON is capped at 4096 bytes.

The message starts with the ASCII bytes `learncard-escrow-enrollment-intent-v1`
followed by a single zero byte. Append the following fields **in this order**.
Every field, including integers and booleans, has a four-byte unsigned big-endian
byte-length prefix. Integers are unsigned big-endian at the fixed width below.

| Field                       | Encoding                                                                         |
| --------------------------- | -------------------------------------------------------------------------------- |
| `version`                   | Four bytes; exactly `1`                                                          |
| `tenant`                    | ASCII `[A-Za-z0-9_-]`, 1–128 bytes                                               |
| `did`                       | Canonical Ed25519 `did:key` UTF-8, 56 bytes                                      |
| `authorityGeneration`       | ASCII `[A-Za-z0-9_-]`, 1–128 bytes                                               |
| `expectedEnrollmentVersion` | Eight bytes; 0 through `2^53 - 1`                                                |
| `action`                    | One byte: enroll=0, replace=1, disable=2, carry=3                                |
| `sourceBlobIdentity`        | Zero bytes for explicit JSON null, otherwise 32 bytes decoded from lowercase hex |
| `targetBlobIdentity`        | Same encoding as source identity                                                 |
| `pinAction`                 | One byte: set=0, change=1, clear=2, keep=3                                       |
| `shareVersion`              | Four bytes; 1 through `2^32 - 1`                                                 |
| `enrollmentEpoch`           | Eight bytes; 1 through `2^53 - 1`                                                |
| `requestId`                 | ASCII `[A-Za-z0-9._-]`, 1–112 bytes                                              |
| `allowRewrap`               | One byte: false=0, true=1                                                        |

Blob identities use the existing `learncard-escrow-blob-id-v1` algorithm, including
Q/-Q equivalence. The TypeScript helper validates the P-256 point and reproduces
the Rust identity. For carry, `targetBlobIdentity` is the **submitted target before
enclave resealing**; the resulting ciphertext must be persisted atomically and
bound by the separate post-commit receipt. The owner cannot sign a future randomized
envelope that the enclave has not produced yet.

Initial enrollment requires expected version zero, no source, target present and
epoch one. Re-enrollment from disabled state requires its retained version and next
epoch; it cannot silently keep a disabled PIN whose verifier is no longer available.
Replace/carry require the active source and next epoch; share versions cannot
decrease (carry requires a strict increase and keeps the existing PIN). Disable
requires the active source, no target, current share version/epoch, `pinAction=keep`
and `allowRewrap=false`; the tombstone preserves accounting. Set requires no prior
PIN; change/clear require one. These checks do not replace decrypting the inputs
and enforcing DID/share/PIN semantics in policy.

`allowRewrap` explicitly delegates only the background operation described in the
product rules: DID, share version, epoch, verifier and attempts must all remain
unchanged. Recovery requests never require a new owner signature. Intent verification
does not authorize release and does not establish commit freshness: item c must
condition the mutation against the verified enrollment version and source identity,
consume durable request tombstones, and distinguish proposals from signed commit
receipts. The policy, clients and monitor now enforce/check this boundary; rollout
must still pass the documented operational gates and separately address attack C.

## 1. Problem and current boundary

The enclave can decrypt a blob and authenticate its contents. It cannot establish
that the user authorized that blob, or that it is the user's current enrollment.
Anyone can encrypt chosen contents to the public escrow key. An encrypted
decentralized identifier (DID) is not proof of control of its signing key.
`app/src/policy.rs::verify_blob` checks decrypted DID/share version, not ownership.

`EnrollmentSource::current(tenant, did)` must return authenticated current
`{epoch, share_version, blob_hash}` and serialize rotation with policy operations.
`app/src/server/parent/nitro.rs` constructs `UnavailableEnrollment`, which always
returns `Unavailable`. Valid create-hold requests reach it through `enrollment`;
release and cancel reach it through `verify_hold`. Invalid requests can fail earlier.
Boot and health do not prove enrollment readiness (`app/src/server.rs`).

The missing decision is **which valid copy is authoritative now**. After re-enroll,
recovery-method rotation, or rewrap, the host may present an older, decryptable blob
and its valid signed history. An older PIN-bearing copy can have fewer spent
attempts. After cancellation, the host may present a prefix ending before Cancelled.
Valid signatures prove past statements, not absence of a later replacement or cancel.

Existing defenses remain necessary (`app/src/policy.rs`, `app/src/ledger.rs`):

- Blob identity is invariant under the elliptic-curve encryption envelope's Q/-Q
  twin and serialization aliases (`app/src/crypto.rs::escrow_blob_identity`,
  `api/src/services/escrow-enclave/blobIdentity.ts`). Do not hash JSON instead.
- The chain selector binds tenant + decrypted DID hash + blob identity, not epoch.
  Epoch remains a signed binding. Same-process high-water marks reject truncation.
- PIN reservations precede comparison. Carry/rewrap append a signed Carried genesis
  record with source chain, observed source head and inherited attempts.
- Carry/rewrap currently do **not** consult EnrollmentSource. They require trusted
  time and ledger observation, but cannot decide that their source is the latest copy.
- A release observed as Released is refused on retry. Lost responses can burn holds.

Mongo currently allocates enrollment epochs, increments on enroll, preserves epoch
on rewrap, and removes the blob on opt-out (`api/src/models/UserKey.ts`). These are
application semantics, not trusted monotonic state. Re-enabling after removal must
not recreate authority epoch 1. Likewise, API DID-auth is not an enclave-verified
signature over enrollment contents (`api/src/routes/escrow.ts`, `src/routes/index.ts`).

Cancellation is already durable **in the API queue**, not instantly in the enclave:
Mongo marks cancelled plus `enclaveCancelPendingAt`; retained `enclaveEnvelope`
allows retries after replacement. Unconfirmed cancellations block new API holds.
The hourly job retries and alerts near release; only success confirms cancellation
(`api/src/models/EscrowHold.ts`, `src/services/escrow-enclave/cancellation.ts`,
`src/jobs/escrowHoldReminders.ts`). A compromised API can suppress all of this.

## 2. Threat model and required guarantee

Retain [SECURITY.md](SECURITY.md)'s D1–D18 boundaries rather than redefining them.
Trust measured enclave code, Nitro isolation, Amazon Web Services (AWS), Key
Management Service (KMS), and pinned Roughtime sources. Platform Configuration
Registers (PCR0/1/2) pin approved image tuples in `infra/escrow-enclave/kms.tf`.

Treat lca-api, its Mongo database, the enclave host, and all relays as compromised.
They can forge API claims, select copies, replay packets, suppress writes, start
parallel enclaves, pause execution, and deny service. Client signing keys and the
client code producing enrollment intent are assumed uncompromised.

Today the host writes DynamoDB records/heads and Object Lock audit copies through
`services/escrow-enclave-host/src/services.rs` and `src/storage.rs`. Records are
enclave-signed; honest appends conditionally transact record and ledger head before
uploading audit bytes. Host IAM does not enforce transaction shape: direct PutItem
can overwrite despite UpdateItem/DeleteItem denies (`infra/escrow-enclave/iam.tf`).
The independent monitor checks signatures, links, Carried accounting, heads and
audit divergence (`services/escrow-ledger-monitor/src/{lib,aws,main}.rs`). It does
not authenticate current enrollment. COMPLIANCE Object Lock preserves retained
versions, not a live latest head (`infra/escrow-enclave/{ledger,storage,monitor}.tf`).

The authority must prevent unauthorized replacement and acceptance of superseded
enrollment/hold state after a committed revocation. It need not keep escrow available
under host denial of service, validate the mathematical correctness of a user-supplied
recovery share, deliver notifications, or undo a release already authorized.
The existing API kill switch cannot stop a host bypassing the API.

## 3. Testable requirements

1. **Ownership:** Initial enrollment and user replacement require a signature by the
   enrolled DID over exact, domain-separated intent. API authentication alone fails.
2. **Binding:** Every authorization binds tenant, DID hash, blob identity, enrollment
   epoch, share version, action and request ID; holds additionally bind their signed
   record and recipient. Cross-tenant, sibling-copy and Q/-Q tests cover this.
3. **Freshness:** No cached snapshot authorizes a mutation. Enclave-generated random
   challenges bind online replies to one session/operation. Commit conditions reject
   state changed since the read, even if a valid reply was delayed.
4. **Monotonicity:** A per-tenant/DID revision increases on every authority change;
   enrollment epoch increases on enroll (including re-enable after disable), user
   replacement and carry. Disable keeps the epoch and advances the enrollment
   revision instead, which fences stale intents and operations just as well.
   Rewrap keeps epoch/share version but increments revision and replaces blob
   identity.
5. **Serialization:** Committed disable, replacement or cancellation wins against
   a later release commit. Concurrent release first may win; client receipt order
   is not the order of authorization. No expiring lease alone grants release.
6. **Rollback resistance:** Reboot, parallel enclave, stale head and omitted append
   cannot grant a second reservation/release on witness-managed histories. Carried
   genesis must inherit the current source head, not merely a valid source prefix.
7. **Availability:** Authority outage, ambiguous commit, missing state or trust-pin
   mismatch fails closed for mutations. Attestation and blob verification may work.
   API cancellation may queue, but must not claim independently confirmed revocation.
8. **Performance:** Proposed target: added witness p95 latency under 500 ms per
   mutation at forecast peak; total request remains within the current ten-second
   server deadline. Load-test transactions, signing and audit IO; report cost per
   enrollment, failed PIN and release. No per-user polling or unbounded retries.
9. **Operability:** Exercise witness/enclave key rotation and loss recovery. Restoring
   an old backup or absent row must never silently reset epoch, tombstones or budget.
10. **Audit/privacy:** Independently reconcile all committed authority events and
    signed ledger bytes. Store no PIN proof, verifier, recovery share or contact
    identity in witness records; DID hashes remain linkable sensitive metadata.

## 4. Options considered

### A. Enclave-signed per-DID enrollment chain in the existing ledger

Add a distinct per-DID enrollment chain and conditional DynamoDB head updates.
Monitor its links and archive exact signed bytes beside existing hold chains.
Require user authorization as well; an enclave signature over host input alone
does not prove consent. This reuses storage, signatures and operational tooling.

It trusts the host to expose the true head, or accepts D3's detection-only model.
A compromised host can serve an older valid head to a fresh/parallel enclave, omit
the conditional write, or keep signed bytes only in memory. A same-process observed
newer head prevents local rollback. Monitor/audit may detect a visible fork or
overwrite afterward, but cannot stop release first or detect wholly suppressed
evidence. A clean sweep is not proof of freshness. **Reject as the sole authority.**

### B. Client/user-signed enrollment statements only

The client signs tenant, DID, epoch, share version, blob identity and action;
the enclave verifies the DID key independently of lca-api. This prevents the API
from inventing user replacements and gives portable consent evidence.

It trusts the user's key and its resolution. The host can replay an older valid
statement, omit a signed revocation, or race two statements on different enclaves.
Counters in signatures are useless without trusted latest-state storage. Short
expiry limits some replays but does not serialize rotation; requiring the DID key
online for recovery defeats recovery when that key is lost. **Use for intent, not
freshness.** Compromised client/key remains outside the guarantee.

### C. External monotonic witness without user signatures

A service in a separately administered AWS account owns a single-region DynamoDB
authority table. Enclave-terminated Transport Layer Security (TLS), pinned service
identity and challenge-bound replies prevent the relay from substituting results.
Only the witness role writes state; conditional transactions serialize revisions.

This prevents host-selected old heads if every sensitive commit goes through it.
But accepting enroll requests merely because lca-api authenticated them lets a
compromised API replace current state. It adds a trusted service/admin boundary,
latency and an outage dependency. Separate-account placement without authenticated
enclave-to-service transport does not fix stale replies.

KMS signing/sealing alone is not a monotonic counter: valid old signed/encrypted
snapshots remain valid. A KMS-protected witness signing key is useful, but the
witness must enforce state transitions. An attested replica quorum could replace
this trust assumption with consensus; that is substantially larger than this
launch change. **Use the AWS witness with independent intent verification.**

### D. Design 1: Custom witness service in separate account

A custom program + single-region DynamoDB with conditional transactions + KMS signing key.
Enclave authenticates via fresh attestation-bound session over enclave-terminated TLS;
witness signs replies. Every mutating op commits through witness.
This provides independent second verifier and portable signed receipts.
However, it adds a trusted custom service and is not simpler for launch.
A malicious approved image can exfiltrate regardless of any witness.
**Keep as an alternative when independent second verifier or portable signed receipts are justified.**

### E. Design 2: Direct DynamoDB authority (Recommended & Decided)

One regional DynamoDB "authority" table in the ESCROW account.
A dedicated IAM writer user whose access key is sealed under a NEW, separate KMS key.
The escrow CMK policy is NOT touched (it denies Encrypt).
The new KMS key policy allows Decrypt only with an attested Recipient matching pinned PCRs.
The enclave talks to DynamoDB directly through the vsock byte proxy with TLS terminated inside the enclave.
Every sensitive transition is a conditional transaction (enroll/replace/disable, carry/rewrap, PIN-attempt reservation + result, create-hold, release, cancel).
User-signed intent is verified inside the enclave.

No custom witness service/account is needed because DynamoDB conditional transactions provide the serialization, and KMS attestation gating makes the vault the only writer.

## 5. Proposed protocol and commit boundary

### State and authentication

Use one authoritative write region; no asynchronous multi-region failover. Store
all transactional items in the escrow account/region. AWS documents serializable
transaction isolation, strong reads and single-account/region limits in
[transaction APIs](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis.html)
and [constraints](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Constraints.html).
Transactions cannot span the existing host table and authority table.

Per-DID state contains authority generation, monotonic revision, enrollment epoch,
active/disabled status, share version, active blob identity, intent digest and
active chain head. Retain disabled tombstones and operation receipts without a
time-to-live reset. Store bounded per-hold terminal state and signed ledger bytes
separately; do not grow one DynamoDB item indefinitely.

User intent binds protocol/domain, authority generation, tenant, DID, expected
revision, action, proposed epoch/version, exact input blob identities, and random
request ID. Bind PIN replace/clear/carry intent and permitted background rewrap.
Verify a supported self-certifying DID key locally in enclave; do not
trust a DID document supplied by the host. Other DID methods need separate review.
Initial creation is conditional on never-enrolled state, not a Mongo assertion.

For carry, the user signs source identity and target **input** identity. The
measured enclave attests the transformation and resulting output identity; the
authority commits that output. For background rewrap, prior user intent delegates
only same-DID/share-version/epoch resealing to an approved current enclave key,
preserving verifier and cumulative attempts. It never authorizes arbitrary replacement.

The enclave establishes a direct DynamoDB session using SigV4 with the decrypted IAM credentials.
Verify certificate chain, hostname, validity-period and handshake-signature using roots inside the measured image.
Use a fixed regional DynamoDB hostname; matching SNI, HTTP authority and signing region/service; no HTTP fallback, arbitrary endpoint overrides or cross-host redirects.
No mutation through TLS early data.
The enclave must construct a fixed set of DynamoDB operations itself; it must not sign arbitrary host-supplied AWS requests.
The host provides only a fixed-destination byte relay, never authority credentials.
Never fall back to host boot credentials. Pin account/region/table/principal/authority generation in the measured image.

### Conditional operations, not reusable permission tokens

1. Read current state over the authenticated session. This is input to a conditional
   operation, not authorization to release. Validate blob/hold and presented chain
   against authority head plus existing signatures/high-water marks.
2. Produce a signed proposed event. The authority atomically checks expected revision,
   active enrollment tuple, predecessor head, request uniqueness and hold transition;
   stores the exact event/receipt and advances state. It verifies enclave/session
   signatures and the bounded ledger transition. No parent success flag substitutes.
3. For PIN, commit reservation **before** comparing. Only a newly committed reservation
   in that live operation permits one comparison; querying an old receipt never does.
   Persist outcome, then conditionally commit Released before producing ciphertext.
   Cancellation/rotation between reservation and release can burn an attempt safely.
4. Replacement/rewrap atomically checks the source head, commits destination Carried
   genesis when applicable, switches active blob and advances revision. Subsequent
   old-source commits fail. A source reservation already committed is inherited.
   Carry/rewrap must persist the resulting encrypted blob with the transition.
5. Hold cancellation commits a terminal tombstone against the exact signed hold,
   including a superseded enrollment. Disable commits a DID-wide tombstone. Neither
   resets PIN accounting. Repeated cancellation may return a fresh signed confirmation
   of already-cancelled/superseded state; unknown state is not confirmation.

The authority commit is the linearization point. A delayed Released receipt may
arrive after cancellation, but that release was already authorized. The host can
also delay previously produced ciphertext. We accept this; we do **not** promise
revocation of an in-flight committed release. Nonces prevent old-session replay,
not suspension of a still-live enclave. No host-clock timeout proves freshness.
Roughtime still enforces the existing seven-day comparison; its signed processing
time is not a receipt-time upper bound (`app/src/time.rs`, SECURITY D2/D13).

Authority stores committed bytes independently (signed execution rows in the
authority table). The existing host ledger becomes a checked projection, not the
authority. Failure after a database commit returns unavailable and may burn the
operation.

**Retention status (as implemented in this stack):** the authority table has
deletion protection, point-in-time recovery, SCP-guarded lifecycle/restore/import
actions and a read-only monitor that verifies execution rows. There is **no**
authority-to-Object-Lock archiver or persistent audit outbox yet. Long-term
immutable retention of authority rows therefore remains **in scope as a
production-enablement gate**, not a delivered control: before production,
copy exact signed execution bytes to the existing COMPLIANCE Object Lock bucket
idempotently (synchronous gating optional; durable outbox + reconciliation
acceptable), and have the monitor check coverage. Staging may run without it. No cross-service atomicity
with S3 or Mongo is claimed. Stored receipts permit metadata reconciliation, never
replay of a PIN comparison or release. Enclave high-water marks still never reset
on failure; losing concurrent signers may require exact-history reconciliation.
Must separate speculative proposals from committed high-water marks.

Cancellation intent may remain caller-authenticated for denial-only operations,
as in `app/src/policy.rs::cancel_hold`: a compromised host can already deny service.
Require a valid witnessed hold binding, but not the unavailable DID key, for this
path. A direct authority cancellation ingress can reduce API suppression; exposing
it and its capability format require review. API-only queuing gives no bounded
revocation latency. A client must verify an authority receipt before treating a
change as independently committed; an API `{success:true}` is insufficient.

## 6. Concrete implementation changes

- **Enclave:** Replace `UnavailableEnrollment` in `app/src/server/parent/nitro.rs`
  only after adding authenticated authority transport. Evolve `EnrollmentSource` in
  `app/src/policy.rs` from a snapshot slot to read + conditional commit operations.
  Thread generation/revision/session through create, PIN, release, cancel and
  carry/rewrap. Extend `HeadStore` integration so authority acknowledgement gates
  comparisons and outputs. Keep fake authority explicitly test-only.
- **Wire:** Add a versioned authority protocol to `app/src/wire.rs` and dispatch in
  `app/src/server.rs`; do not overload unsigned legacy DTOs. Proposed fields include
  signed enrollment intent, expected revision, source/output bindings and receipt.
  Extend `api/src/services/escrow-enclave/{types,remoteEnclave}.ts` and host HTTP
  translation together. Preserve strict bounds, generic errors and no release retry.
  Cancel returns a verifiable terminal receipt rather than only `{ok:true}`.
- **Records:** Add a separate canonical, domain-separated EnrollmentRecord schema:
  Enrolled, Replaced, Rewrapped, Disabled, with previous/new tuple, revision, intent
  digest and source/destination heads. Add authority commit receipts for HoldCreated,
  reservations/results, Released and Cancelled. Version signed hold/policy bindings
  to include authority generation/revision; retain Carried's source-head accounting.
  Do not insert per-DID events into the current 64-record per-blob chain namespace
  or silently reinterpret `app/src/ledger/codec.rs` event numbers.
- **API enroll/remove:** `api/src/routes/escrow.ts` relays signed intent and stores
  authority receipts. `api/src/models/UserKey.ts` stores authority epoch/revision,
  not a Mongo-allocated authority epoch. Authority commit precedes Mongo projection;
  failed Mongo writes reconcile by request ID. Removal commits Disabled before
  treating opt-out as confirmed. Linked providers share one tenant/DID authority.
- **API carry/rewrap:** Preserve current rewrap epoch semantics. Update
  `api/src/jobs/escrowBlobRewrap.ts` to commit an authority current-source transition.
  Pending-hold checks and Mongo compare-and-swap remain useful, not security locks.
  Do not silently fall back from rejected signed carry intent to a different PIN
  policy. A new client blob budget requires explicit authorized replacement intent.
- **API cancellation:** Keep retained envelopes, retry queue and new-hold guard in
  `api/src/models/EscrowHold.ts`, `src/services/escrow-enclave/cancellation.ts` and
  `src/jobs/escrowHoldReminders.ts`. Confirm only verified authority revocation receipts;
  permit reconciliation after replacement/lost replies without needing the old blob
  to remain current. Leave ambiguous errors pending. Document queued vs confirmed.
- **Client:** Add enrollment-intent signing and receipt verification under
  `packages/sss-key-manager/src/`; reuse `escrow-crypto.ts` envelope parsing and
  `escrow-attestation.ts`/`escrow-nitro-attestation.ts` verification, with shared blob
  identity vectors. Bind exact intent, not a generic DID-auth challenge. Recovery
  itself must not require possession of the lost DID signing key. Preserve existing
  `escrow-pin.ts` derivation; no PIN-derived public commitment in authority records.
- **Monitor:** Extend `services/escrow-ledger-monitor/src/{lib,aws,main,tests}.rs`
  to verify enrollment chains, authority receipts and projection completeness. Check
  historical events against authority revision **at commit**, not today's blob.
  Independently enumerate authority commits so host-suppressed writes become visible.
  Keep it read-only, without escrow KMS access or automatic kill-switch control.
- **Infra:** Add a dedicated IAM writer user whose access key is sealed under a NEW, separate KMS key.
  The escrow CMK policy is NOT touched (it denies Encrypt).
  The new KMS key policy allows Decrypt only with an attested Recipient matching pinned PCRs.
  Add single-region tables, fixed TLS endpoint, alarms and backup policy. The audit
  outbox/Object Lock archiver is a production gate (see section 5), not in this stack.
  Host/API get no table writes, signing grants or cross-account administrator role.
  Update `infra/escrow-enclave/{iam,ledger,kms,storage,monitor}.tf` integration and
  measured endpoint/pin configuration. Preserve existing PCR tuple/KMS denies.
  Add authority-side operator release-disable control; the API switch alone is weaker.

## 7. Operations, rollout and accepted residual risks

Staging data is disposable. Archive audit evidence; discard legacy staging blobs
and holds through an approved reset, then require fresh signed enrollment into a
new authority generation. Do not import Mongo epochs as trusted genesis. Retain
locked audit objects until retention expires. This design task performs no reset.

Deploy authority, monitor, enclave, API and client as a coordinated protocol upgrade.
Keep rollout internal under [ROLLOUT.md](ROLLOUT.md). Require a real seven-day soak,
rotation rehearsal and adversarial checks from [STAGING.md](STAGING.md). Do not
enable non-internal rollout merely because health or attestation succeeds.

Rotate authority keys with measured old/new pin overlap and security-owned key IDs;
rotate allowed enclave session measurements separately from escrow keys. Retire
old write protocols/sessions explicitly. Retiring an old image requires revoking its writer credential, not only removing PCRs.
Preserve historical verifier keys. After
state loss, stop mutations and reconcile independent committed history and durable
checkpoints. If completeness cannot be established, do not restore an older head:
disable that generation, revoke its write sessions, require fresh user enrollment
through other recovery methods, and explicitly abandon old holds/budgets.

Accepted subject to reviewer approval: authority/AWS/admin compromise can violate
freshness; separate administration reduces correlated compromise, not malicious
trusted-admin risk. Host suppression and authority outages deny service. Lost
responses burn holds/attempts. Committed releases can arrive after revocation.
Metadata correlation, bounded chain capacity, lost sealed-key risk (D18), KMS
policy-admin risk (D10), and Roughtime delayed-delivery limitations remain.
Legacy D3 histories remain detection-only; stronger prevention applies only when
every mutation uses authority fencing. No automatic fail-open or backup rollback.

## 8. Verification plan

Existing tests are baselines, not evidence that this proposal is implemented:
`app/src/policy/tests.rs` covers authority-unavailable, rotation/blob substitution,
same-process truncation, carried floors, terminal replay and lost release responses.
`services/escrow-ledger-monitor/src/tests.rs` covers carry edges, head/audit mismatch
and tampering. API baselines include `test/keys-escrow.spec.ts`,
`test/jobs/{escrowHoldReminders,escrowBlobRewrap}.spec.ts` and the remote contract test
in `api/src/services/escrow-enclave/remoteEnclave.contract.test.ts`.

Add tests for every numbered requirement, including these adversarial cases:

- **Credential isolation:** Host role attempts unattested decrypt, wrong/debug/mixed PCRs, grants, credential ciphertext substitution and arbitrary AWS signing. No authority credential or unauthorized write succeeds.
- **Provisioning leakage:** Demonstrate where plaintext access keys exist; verify none enter Terraform state, logs, build artifacts or host boot DTOs.
- **Endpoint identity/TLS:** Redirect the relay to an attacker server, wrong AWS service/region, wrong-name certificate, expired/not-yet-valid certificate and host-supplied CA. Fail closed.
- **Replay/delay:** Replay captured traffic across connections; pause valid reads and commit replies. No forged response is accepted; delayed reads cannot bypass commit conditions.
- **Concurrent PIN budget:** Run at least two enclaves with more than ten concurrent guesses, duplicate IDs and different proofs; instrument comparisons. Total comparisons never exceed the authorized budget.
- **Durable idempotency:** Replay after restart and after DynamoDB's 10-minute token window. No old reservation receipt enables another comparison or release.
- **Race ordering:** Pause at every await around cancel/release, disable/release and replacement/release. Revocation-first prevents release; release-first is explicitly classified as already authorized.
- **Carry concurrency:** Race source reservations against carry/rewrap, including chains of carries. Committed attempts are never lost, and only the authoritative output remains usable.
- **Losing signer:** Force two different successors from the same head. The loser reconciles to the committed winner without authorizing from its speculative fork or requiring unsafe resets.
- **Crash ambiguity:** Kill before/after reservation, comparison, result, release and envelope-switch commits; drop every reply. No refunds, duplicate comparisons or missing-active-envelope success.
- **Intent attacks:** Reject victim-DID fabricated blobs, replayed replacement signatures, wrong tenant/generation, substituted carry input and altered PIN semantics. Exercise attack B explicitly: with unsigned enrollment, attacker keeps a genuine no-PIN victim blob at version V, fabricates a lower-version same-DID blob with junk share + attacker-known PIN verifier, uses carry_pin_verifier to attach the attacker PIN to the genuine share.
- **Account administration:** Attempt new access-key creation for the writer, role-trust changes, table-policy deletion, alternate writes, TTL/lifecycle changes and restore substitution. Unauthorized actors are denied; authorized break-glass actions alarm independently. AWS lets the account root call DynamoDB DeleteResourcePolicy even when denied, so explicit denies are not absolute.
- **Image retirement:** Keep an old enclave running after its PCR is removed. Prove writer-capability retirement actually stops subsequent authority mutations.
- **State loss and audit:** Restore an old backup or present an empty/recreated authority. No silent epoch/budget reset; independently enumerate committed events even when the host suppresses all projections.
- **Recovery boundary (Attack C):** Suppress API notifications and run an attacker-recipient delayed hold. Must now fail because the code never reaches the user (the hold never starts without the emailed code).

## 9. Attack C mitigation: the enclave sends recovery email itself

**Problem.** `create_hold` accepts `ReleasePolicy::Hold` even when the blob has a
PIN (`src/policy.rs`, `create_hold`), and every user-facing notification is sent by
lca-api (`services/learn-card-network/lca-api/src/services/escrow-enclave/notifications.ts`).
A compromised lca-api can start a hold for its own recipient key, suppress the
emails, and receive the share after the waiting period. A verifiable "lca-api sent
it" check is not possible: lca-api also supplies the address, and its email provider
(Postmark) retains message content, so any confirmation code would be visible to it.

**Decision (2026-10-13, product owner):** keep the forgot-PIN 7-day path, and move
recovery email into the enclave. A separate notifier service in the escrow account
was considered (cheaper wording changes) and rejected in favour of keeping the code
visible only to the enclave and the user's inbox.

**Design.**

1. **Binding.** At enrollment the user's device puts the recovery email address and
   language into the sealed blob. lca-api cannot read or change them. Changing the
   address means re-enrolling from the user's device.
2. **Transport.** The enclave calls Amazon Simple Email Service (SES) in the escrow
   account directly, with the same pattern as the authority table: a dedicated
   sender credential sealed under the credential CMK, enclave-terminated TLS to a
   fixed regional endpoint, no host credentials. The SES endpoint is added to the
   host's fixed relay destinations.
3. **Confirmation.** A new hold starts in `awaiting_confirmation`. The enclave emails
   a one-time code bound to the hold ID and recipient key. The waiting period starts
   only when the code is presented. Codes expire, guesses are bounded, and resends
   are rate-limited per DID so the enclave cannot be used to flood an inbox. All of
   this state is committed through the authority table.
4. **Warnings.** The enclave sends "recovery started" at confirmation and "release in
   24 hours" before release. The hourly lca-api job asks the enclave to send the
   second warning; release is refused unless the enclave recorded sending it at
   least 24 hours earlier. Skipping the job delays release; it cannot bypass it.
5. **Fail closed.** If SES rejects or the send outcome is unknown, the hold does not
   advance.

**Content constraints.** Email text is part of the measured image, so changing it
needs a new EIF, new PCRs and a measurement rotation. Keep it to three plain-text
messages (code, started, release warning) with no links or images, in the four app
languages, using the tenant name only. Every message says "Only enter this code if
you started a recovery." A separately signed template file was considered and
deferred: its signing key could produce misleading or leaking templates.

**Operations.** SES sending domain with SPF/DKIM/DMARC, production access (out of
the SES sandbox), bounce and complaint handling, quota monitoring. Cost is
negligible at expected volume.

**Effort.** Roughly one to two weeks on top of the enrollment authority: enclave SES
client and code flow, client binding of email/language and a code-entry screen,
lca-api routes, SES infrastructure.

**Residual risks.** Phishing for the code; users who lose both their device and
their email account use another recovery method; the host can block email (denial
of service, fails closed).

## 10. Open questions for security/product

1. Which DID methods/signature algorithms and client signing interface are approved? Must account/DID changes require both old and new key authorization?
2. Approve background rewrap delegation and preservation of epoch with new revision?
3. Who owns witness/credential recovery, key rotation and generation abandonment? What independent checkpoint evidence suffices to restore state without rollback?
4. What traffic forecast, monthly cost ceiling, latency target and regional outage objective must staging demonstrate before approval?
5. Accept the listed D2/D10/D18 and witness-admin residual risks, and assign owners to reconcile SECURITY/STAGING/ROLLOUT wording before the launch review?
6. Email binding format inside the blob (address normalisation, language tag), code length/expiry/guess and resend limits, and SES quota targets?
