# Escrow enclave application

Rust scaffold for LearnCard's attested escrow recovery service (P1.1). **Not a
working enclave or recovery server:** both launch modes log "not yet implemented"
and exit successfully without binding a socket. Crypto primitives (P1.2) and NSM
drivers (P1.3) and the release decision core (P1.7) exist, but server and
authenticated current-enrollment integration remain unimplemented.
Do not deploy this scaffold for recovery.

## Target architecture

```text
client --HTTPS--> lca-api (Lambda) --private net--> enclave-host service (EC2, Nitro-enabled)
                                                      |-- parent: HTTP/gRPC <-> vsock proxy, KMS proxy
                                                      `-- Nitro Enclave (.eif): release policy + decrypt capability
                                                                 | kms:Decrypt w/ RecipientAttestation
                                                                 v
                                                        AWS KMS key (policy pinned to PCR0/1/2)
```

The dedicated parent service is separate from the escrow email relay. lca-api
selects this backend with `ESCROW_ENCLAVE_MODE=remote`; client-facing attestation
uses `mode: nitro`. Planned production topology is an ASG across at least two AZs
with an internal NLB and at least `m6i.xlarge` parents (two enclave vCPUs plus two
remaining for the parent).

Implemented primitives: `crypto` (P1.2), `nsm`/`NsmDriver` (P1.3),
`kms`/`KmsClient` (P1.4), `time`/`TimeSource` (P1.5),
`ledger`/`HeadStore` (P1.6), `policy` (P1.7). Future module:
`server` (P1.8). Native trait-based fakes exercise the same policy logic;
the NSM, KMS and time traits and fakes are available now.

## Ledger (P1.6)

`Ledger` signs and verifies bounded **enrollment-wide** chains. Every event carries
a hold ID; `Released` and `Cancelled` are terminal for that hold, not for other
holds in the enrollment. This deliberately replaces separate per-hold chains:
otherwise a parent could reset the PIN budget simply by creating another hold.
`ChainState` derives all hold states and the shared ten-reservation lifetime budget.
Sequence starts at zero **per enrollment chain**, with an all-zero genesis link.
At most 64 records are accepted; exhaustion fails closed, never compacts/resets.

### Identity and schema

Policy constructs `Enrollment::new(tenant, decrypted_did, epoch, blob_hash)` from
authenticated inputs. `enrollment_id = SHA-256(UTF-8 decrypted DID)`; the chain ID
is lowercase SHA-256 hex of `"learncard-ledger-chain-v1\0" || tenant_byte_length
(u64 big-endian) || tenant || enrollment_id || epoch (u64 big-endian)`. Blob hash
is NOT in the chain ID: a changed blob in the same epoch fails binding validation
rather than creating a fresh budget. Authenticating the tenant/current epoch and
hashing the actual envelope are P1.7 responsibilities, not claims about host DTOs.

The wire record is a CBOR map with these **integer keys**, not JSON field names:

| Key | Field           | CBOR value                                                                |
| --- | --------------- | ------------------------------------------------------------------------- |
| 0   | version         | unsigned integer, 1                                                       |
| 1   | tenant          | identifier text                                                           |
| 2   | holdId          | identifier text                                                           |
| 3   | enrollmentEpoch | unsigned integer                                                          |
| 4   | blobHash        | 32-byte byte string                                                       |
| 5   | seq             | unsigned integer, 0–63                                                    |
| 6   | prevHash        | 32-byte byte string                                                       |
| 7   | event           | array `[code]`, or `[1, attempt_no]`                                      |
| 8   | requestId       | identifier text                                                           |
| 9   | measurement     | SHA-256 of the attested PCR tuple, 32-byte byte string                    |
| 10  | keyId           | identifier text                                                           |
| 11  | timeEvidence    | `[lo_ms, hi_ms, [[server_id, midpoint_ms, radius_ms, response_hash], …]]` |
| 12  | payloadHash     | 32-byte byte string                                                       |
| 13  | policyVersion   | unsigned integer, 1                                                       |
| 14  | enrollmentId    | 32-byte byte string                                                       |
| 15  | sig             | 64-byte byte string, ECDSA P-256 `r                                       |     | s`, low-S |

Event codes: 0 HoldCreated, 1 PinAttemptReserved, 2 PinAttemptFailed,
3 PinAttemptSucceeded, 4 Released, 5 Cancelled, 6 PinLocked. Attempt numbers
are 1–10 globally across the chain. Reservation 10 immediately sets `locked`,
even without a subsequent PinLocked/result record; its one comparison may still
succeed. PinLocked is an optional explicit audit event, not the security boundary.

Canonical rules: definite lengths, shortest unsigned-integer/length encodings,
ascending integer map keys (also deterministic encoded-key order), no unknown or
duplicate keys, tags, negative integers, floats, null, indefinite containers or
trailing bytes. Identifier text is 1–128 ASCII `[A-Za-z0-9._-]` bytes. Time sources
are 2–16 entries sorted uniquely by server ID, with 32-byte response hashes.
The fixed-schema decoder checks lengths **before** allocation and has no recursive
descent over arbitrary input. Records are capped at 8192 bytes. `decode` validates
canonical structure only; `verify_chain` must also authenticate signatures/state.

`record_hash = SHA-256(canonical CBOR with key 15 omitted)` (15-entry map).
Sign/verify uses this digest directly, not SHA-256 of the digest. The hash excludes
the signature; low-S encoding eliminates the alternative ECDSA signature form.
`verify_chain` verifies every signature, tenant/identity/epoch/blob binding,
sequence/link, request transition and non-decreasing time lower bound. It verifies
enclave attestations of time verification, **not** original Roughtime datagrams.
Only pass fresh `TimeSource` evidence to signing APIs; interval structure alone
does not establish trusted time. A lower bound before the head is refused even
if the interval's upper bound overlaps the head.

### Signing keys and operation commitments

`Ledger::new` decodes the unsealed escrow PKCS#8 and uses the 32-byte P-256 scalar
as HKDF-SHA256 input. Salt: `learncard-escrow-ledger-v1`; signing info:
`ecdsa-p256-signing-key\0 || counter_u32_be` (counter starts at zero; rejection
sample a valid P-256 scalar). The key survives reboots/measurement upgrades while
the escrow key remains the same; it is distinct from ECDH and release keys.
The monitor must obtain `public_key()` (SEC1 P-256 encoding) through a validated
attestation binding, and pin its key ID and permitted measurements. **Key derivation
alone is not attestation**: P1.8 must publish that binding; the existing wire DTO is
unchanged. Measurement is SHA-256 of `PCR0 || PCR1 || PCR2` in raw 48-byte form;
startup must compute it from NSM, never accept it from the parent. The verifier
accepts measurement changes under the same signing key; monitor allowlisting is
separate. `policyVersion=1` is the only currently supported interpretation.

`Operation.payload_hash` must commit to the full canonical request, including
tenant, identity, epoch, blob, hold, request ID, client recipient and PIN proof
where applicable. For PIN requests use `pin_payload_hash(canonical_request)`:
it derives a secret commitment key with HKDF info `pin-payload-commitment`, then
HKDFs the request using that secret as salt and info `learncard-pin-request-v1`.
Do NOT publish an unkeyed PIN/proof hash (an offline dictionary oracle).
The policy layer must canonicalize and bound these request bytes (8192 maximum).

### Reserve → verify → commit API

1. Keep **one Ledger per escrow key for the entire enclave lifetime**, serialized
   behind the server's lock. Its `&mut self` APIs serialize local operations.
   Never recreate it on failure, use multiple instances for one key, or evict
   high-water marks. At 4096 tracked enrollment chains it fails closed.
2. `transition(store, enrollment, operation, event)` permits HoldCreated,
   Released, Cancelled and PinLocked only. P1.7 authorizes these actions, including
   delayed release and recipient binding; this ledger does not authorize release.
3. `verify_pin(store, enrollment, operation, compare)` loads/verifies the chain,
   appends a reservation and reads it back before invoking the synchronous
   constant-time comparison closure. The closure must have **no release or IO
   side effects**. Result append/readback completes before `Compared` is returned.
4. Every reservation consumes its attempt even after a crash, cancellation or
   missing result. A repeated request returns `Duplicate { result }`, never calls
   the closure, and never grants a new comparison. An abandoned reservation has
   `result: None` forever; use a **new** request ID (and spend another attempt).
   Same ID with a different hold/payload/event is rejected. Reservation and its
   single result intentionally share the request ID. Non-PIN exact duplicates
   return the existing record without an append, even if the hold is now terminal.
5. A head is remembered **before** signed bytes leave the enclave. Failed,
   conflicting, cancelled or lying appends cannot make it sign a local fork.
   Conflict/Unavailable propagate; there is no automatic retry on an older head.
   If that signed record was not persisted, the chain stays fail-closed in this
   process until the exact signed history is restored. Do not restart to clear it.
   No comparison resumes from a persisted-but-ambiguous reservation.

`observe` checks that the chain contains the previously observed/signed record
at its original sequence, not merely that its new sequence is larger. Therefore
both truncation and a longer fork are rejected. Pure `verify_chain` has no memory;
production callers use the stateful APIs, not that pure monitor helper alone.

### HeadStore / P3.3 parent obligations

`HeadStore: Send + Sync` uses boxed Send futures, matching KMS/time drivers:
`get_chain(chain_id) -> Vec<LedgerRecord>` and
`append(chain_id, record) -> Result<(), AppendError::{Conflict, Unavailable}>`.
The transport adapter is deferred to P1.8/P3.3. It must cap responses at 64
records / 524288 total record bytes **before allocation**, and use the strict
record decoder. Do not deserialize unbounded JSON arrays directly into this trait.

- Partition records and heads by the enrollment chain ID (e.g. `ENROLL#<chainId>`),
  not by hold ID. Record SK is `SEQ#<zero-padded seq>`; fetch the full ordered chain.
- DynamoDB `TransactWriteItems`: Put the record with `attribute_not_exists(pk)`
  for that composite record key, and update the head only if its hash equals
  `prevHash` **and** its sequence is `seq - 1`. Genesis requires no existing head.
  Transaction failure is Conflict; transport/unknown outcome is Unavailable.
  A duplicate persisted record can be reconciled by exact bytes, never overwritten.
- Audit the canonical signed bytes in Object Lock storage at
  `audit/<tenant>/<chainId>/<seq>-<record_hash_lowercase_hex>.cbor`. The independent
  monitor verifies pinned signatures/measurements, all links/transitions, unique
  requests, budget, current enrollment and DynamoDB/S3 divergence. Alarm on any
  records-table MODIFY/REMOVE (`NEW_AND_OLD_IMAGES`) and conflicting successor or
  missing audit record; activate the API release kill switch. Monitor heads too.
- Ledger re-reads and verifies after append; a success response alone is untrusted.
  This detects a parent omitting the write from its presented view, **not durable
  persistence**. An adversarial parent can return signed bytes held only in RAM.
  IAM does not enforce the transaction shape, and independent replicas do not
  coordinate their high-water marks. The monitor and D3 limitation still apply.

### Guarantees vs non-guarantees

| Threat                                                                          | Prevention / detection boundary                                                                                   |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Forged/modified record, reordered chain, dropped middle                         | Prevented from being accepted by signature, sequence and link verification                                        |
| Cross-tenant/identity/epoch/blob or nonexistent-hold transplant                 | Prevented by expected binding and hold state machine                                                              |
| New hold resets PIN counter                                                     | Prevented within a presented enrollment history; all holds share one budget                                       |
| Crash/abort avoids consuming a reserved attempt                                 | Prevented for retained history; reservation alone spends it, duplicate never compares                             |
| Truncation or fork after this instance saw/signed a fresher head                | Prevented in that instance by non-evicting high-water marks                                                       |
| Records after Released/Cancelled                                                | Prevented for that hold; other holds remain independent                                                           |
| Backwards time                                                                  | Prevented relative to signed head lower bound; authenticity requires enclave TimeSource integration               |
| Old valid head after restart / parallel enclave fork                            | **Detection only**, if fresher history is observable to independent monitor; no strict global replay-proof budget |
| Parent acknowledges but never durably stores/audits a record                    | Not provably prevented by readback; detection requires an independent observation/audit path                      |
| Parent suppresses all evidence, pauses enclave, denies storage/time             | No availability or bounded detection-latency guarantee                                                            |
| Unauthorized delayed release, stale current epoch, attestation key distribution | P1.7/P1.8 integration obligations, not implemented here                                                           |

Strict rollback prevention needs quorum replicas / an independent live freshness
authority (D3 option B, deferred). Audit storage is not a live freshness oracle.
`fake-ledger` exposes `FakeHeadStore` only for tests/explicit emulation; it provides
conditional append semantics and intentional history replacement for attacks.

## Release policy

`Policy` owns the unsealed keys and one non-evicting `Ledger`. Keep one instance
per key for the entire process lifetime, under the server's serialized lock;
never rebuild it after an ambiguous write. Its `HeadStore`, `TimeSource` and
`EnrollmentSource` drivers are injected; the tests use fakes, not a separate
software policy. No server implementation or transport adapter is included.

### Current enrollment is a required trust boundary

**Production integration is blocked until an authenticated, fresh
`EnrollmentSource` exists.** `current(tenant, decrypted_did)` must independently
authenticate the current `{epoch, share_version, blob_hash}` and serialize
rotation with policy operations. Missing/unavailable authority must refuse the
operation. There is deliberately no default or host-Mongo implementation.
Do not implement this trait by returning the request's epoch, trusting a host
database response, or verifying only the signature of a replayable snapshot.
Possession of an encrypted blob proves neither DID ownership nor that it is the
latest enrollment: anyone knows the public encryption key. An independent live
authority/quorum or a separately reviewed authenticated enrollment protocol is
needed; that protocol is not supplied by the committed crypto/time/ledger APIs.
The tenant passed to `Policy::new` is enclave startup configuration, not a host
request parameter. Measurement must likewise come from verified NSM startup.

### Operations and decisions

| Operation      | Required checks                                                                                                                          | Persisted result before returning                                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `verify_blob`  | Authenticated envelope/key ID, positive u32 version; compare decrypted DID/version to expectations                                       | None; `{ok, has_pin}`, or `Blob` for invalid ciphertext/key/plaintext                                                                                               |
| `create_hold`  | Identity/version, current authenticated enrollment, valid recipient SPKI, unique hold, PIN verifier present for PIN policy, trusted time | `HoldCreated`, then authenticated full-chain readback                                                                                                               |
| `release_hold` | All signed hold fields and current blob/epoch match; live, uncancelled/unreleased hold; trusted `lo >= createdHi + 604800000`            | `Released` + readback, **then** seal to the signed recipient                                                                                                        |
| `release_pin`  | Same bindings/live hold; PIN policy, verifier and proof present; enrollment budget available                                             | Reserve + readback → fixed-size `subtle` comparison → success/failure + readback; success adds `Released` + readback before sealing; tenth failure adds `PinLocked` |
| `cancel_hold`  | Same authenticated hold/current enrollment; live hold                                                                                    | `Cancelled` + readback; subsequent release refused                                                                                                                  |

`release` dispatches on the signed policy. A PIN hold never becomes a delayed
hold, even after seven days; a delayed hold ignores any PIN proof. The duration
is a compile-time constant, with **no environment/host/test override**. Tests
advance fake authenticated intervals instead. Every time addition uses checked
arithmetic; times/epochs remain within JavaScript's safe integer range. Time
must not move the ledger lower bound backwards even for overlapping intervals.
Roughtime's signed processing-time/delayed-delivery limitation described below
still applies: this comparison is not proof of seven real days since receipt.

All holds in an enrollment share ten lifetime reservations. Success does not
reset the budget; only authenticated rotation to a new epoch starts a new one.
Malformed bounded proofs consume an attempt and produce `PinMismatch`; absent
proofs produce `Policy`, oversized proofs are rejected before allocation, and
locked requests do not compare. PIN request commitments are secret-keyed via
the ledger API, never public dictionary hashes. Releases explicitly strip and
zeroize the verifier before invoking crypto; it never appears in the sealed
client plaintext or error detail. Errors are only `wire::ErrorCode`: `Policy`,
`PinMismatch`, `Blob`, `Unavailable`, `Ledger`, `Time`. Storage Conflict and
Unavailable both map to `Unavailable`; all time-source errors map to `Time`.

### Signed hold format and P1.8 wire integration

Without changing the existing `wire.rs` scaffold, policy introduces
`SignedHoldRecord { hold: wire::HoldRecord, holdDurationMs, ledgerSeq }` (camelCase
JSON). P1.8/P4.2 must adapt their DTOs to carry this whole object, plus bounded
request IDs and cancellation. The old `wire::Request` is **not yet a complete
policy transport contract**. Do not discard the two new signed fields or accept
legacy unsigned `status`, `now`, `releaseAfter`, duration or counter inputs.

The hold's `signature` is standard base64 of the existing ledger's 64-byte low-S
P-256 signature on the `HoldCreated` record at `ledgerSeq`. That record's signed
`payloadHash` is SHA-256 of compact UTF-8 JSON of this fixed-order array:

```text
["learncard-hold-v1", tenant, holdId, sha256Hex(UTF8(did)), shareVersion,
 blobHash, enrollmentEpoch, releasePolicy, clientEphemeralPublicKey,
 createdLo, createdHi, holdDurationMs, policyVersion, ledgerSeq]
```

This is a commitment inside the canonical-CBOR signed ledger record, **not** an
ECDSA signature directly over the array. Verification authenticates the entire
current chain, requires that exact record/signature/commitment/time/hold match,
and checks terminal state. A standalone signature or signed old chain is not
sufficient. P1.8 must attest the ledger public key; a parent-supplied public key
is not trusted. `blobHash` is lowercase SHA-256 hex of compact serde JSON of the
authenticated `EscrowEnvelope`, in its declared field order: version, algorithm,
keyId, ephemeralPublicKey, salt, iv, ciphertext. JSON host key order is irrelevant.
Identifiers are bounded ASCII; policy reserves prefix space (112 bytes maximum)
within the ledger's 128-byte identifiers. Create/PIN/release/cancel/lock operation IDs
are domain-prefixed and commitments bind the signed hold hash and caller ID.

### Idempotency decision: refuse release replay

Once `Released` is observed, **every retry is refused**, including an identical
request, after reboot, or after the host lost the response. No second append or
seal occurs. This deliberately favors a simple terminal authorization boundary
over availability: a crash after append/readback but before returning ciphertext
burns the hold. The client must start a new hold (and a new wait or PIN attempt);
the enrollment PIN budget is not restored. Operators must not delete history or
restart to clear high-water marks. Host adapters must not silently retry releases.
Creating an existing hold and cancelling a terminal hold are also refused.

A PIN request whose reservation was persisted before a crash permanently spends
that attempt; the same request ID never compares again. Duplicate failures or
successes are refused **before computing any proof-dependent commitment**: the
ledger's distinct duplicate/mismatched-payload errors must not become an unmetered
proof-equality oracle. A success without its subsequent `Released` record is
not resumable. Use a new hold if that success stranded the old hold. Ledger D3
limitations are unchanged: fresh boot/parallel-instance stale-history replay is
not globally prevented, readback cannot prove durable storage, and suppressed
cancellation never reaches this decision core. Cancellation intent authentication
belongs to the caller; a malicious parent can already deny service. Real
durability/audit and independent monitor/kill-switch integration remain required.

## Authenticated time (P1.5)

`RoughtimeTimeSource::new` requires 2–16 distinct pins, a minimum of two
successful responses, and an explicit radius cap (`production`: 10 seconds).
All queries run concurrently with two-second per-source timeouts. Every valid
source participates in the intersection; no majority/outlier exclusion occurs.
Missing/invalid replies count as unavailable; insufficient sources, disjoint
intervals, or an intersection wholly before the supplied ledger floor fail closed.
The caller supplies the authenticated ledger head floor; this module does not
store or authenticate it. Cancellation drops the JoinSet and aborts its queries.

Verification is a bounded pure-Rust implementation using `ed25519-dalek 2.2.0`
strict verification and existing SHA-512/SHA-256 primitives. It verifies both
context-prefixed signatures, delegation bounds, nonce Merkle inclusion (including
unused index bits), exact field sizes, framing, and checked timestamp arithmetic.
Parsers accept at most 1024-byte datagrams and 32 tags per nested message; recursion
is fixed to CERT/DELE/SREP. Legacy microseconds round outward to milliseconds.
The evidence hash is SHA-256 of the received datagram, not a replayable standalone
proof; later ledger signing authenticates the enclave's verification result.

### Protocol and pin provenance

- Cloudflare's [published service](https://developers.cloudflare.com/time-services/roughtime/usage/)
  supplies key `0GD7c3yP8xEc4Zl2zeuN2SlLvDVVocjsPSL8/Rl/7zg=`.
  Its [ecosystem description](https://github.com/cloudflare/roughtime/blob/master/ecosystem.md)
  identifies draft-08 support; its [Go protocol source](https://github.com/cloudflare/roughtime/blob/master/protocol/protocol.go)
  defines the implemented `0x80000008` format: 32-byte nonce, truncated SHA-512
  nonce leaves, seconds, outer VER/NONC, ROUGHTIM framing, and the delegation
  context ending `signature--\0`. This is a documented deployment selection,
  **not a live UDP interoperability claim**.
- Google's [original published server list](https://roughtime.googlesource.com/roughtime/+/dd529367052d2d4e723407525887310fe866ddd8/roughtime-servers.json)
  supplies historical sandbox key `etPaaIxcBMY1oUeGpwvPMCJMwlRVNxv51KK/tktoJTQ=`.
  Legacy Google format uses 64-byte nonces/SHA-512 hashes, microseconds, PAD-FF,
  no ROUGHTIM framing and the same signature contexts. Current sandbox key and
  availability are unconfirmed (Cloudflare's ecosystem lists it unreachable).
- Latest [IETF draft-19](https://datatracker.ietf.org/doc/html/draft-ietf-ntp-roughtime-19)
  uses `0x8000000c`, full-request-packet leaves, TYPE/VERS and a different
  delegation context. **Not supported and never silently negotiated/downgraded.**
  Current roughenough's request-packet verifier cannot substitute for draft-08
  or Google legacy; using it without compatibility handling would reject them.

`production()` returns `Configuration` unless the build explicitly enables
`verified-roughtime-keys`. This is a release-review gate, not automatic verification:
verify Google's current pin/service and both endpoints' actual interoperability
before enabling it. Pins are never fetched dynamically. Neither beta service is
an uptime guarantee; unavailable Google means recovery fails closed. Custom pins
must represent independently operated authorities (distinct keys alone do not
establish organizational independence).

`TimeSource` and `RoughtimeTransport` use boxed Send futures, like `KmsClient`, for
dyn compatibility on Rust 1.93; callers still use `.now(...).await` and
`.exchange(...).await`. `fake-time` enables configurable in-memory time and relay
drivers; default builds exclude them. Tests construct signed real-format messages
with test keys and never contact external time services.

### Time semantics and integration limits

Intervals describe signed **server processing events**, not a provable upper
bound on time at receipt. An untrusted parent can delay packets or pause execution;
the local two-second timer is only a resource bound, not an authenticated delay
bound. Delayed evidence's lower bound stays conservative for release, but a future
hold-creation policy must not claim an exact real seven-day minimum solely from
these upper bounds without resolving this delay threat. No local clock value is
used to advance trusted time. Concurrent intersection is application policy, not
the IETF sequential nonce-chaining/malfeasance-report algorithm. Retry/backoff and
rate limiting belong to the caller/parent integration, not an automatic loop here.

## Wire: time relay

Linux `VsockRoughtimeTransport` connects to fixed parent CID **3**, port **5001**.
One connection carries one request and one response:

1. Enclave → parent: **u32 big-endian byte length**, then UTF-8 JSON
   `{"server_id":"cloudflare","payload":[82,79,...]}`. `payload` is the complete
   opaque UDP datagram as a JSON byte array. JSON is capped at 8192 bytes,
   server ID at 128 bytes, datagram at 1024 bytes.
2. Parent → enclave: **u32 big-endian byte length**, then the **raw UDP response
   bytes**, NOT JSON. Length must be 1–1024; reject before allocation. Failure is
   signaled by closing the connection (zero length is also rejected).
3. Both sides close; no pooling, multiplexing, request IDs, or retries. The enclave
   bounds the complete connect/write/read exchange to two seconds.

P3.3 parent must hardcode `cloudflare` → `roughtime.cloudflare.com:2003` and
`google` → `roughtime.sandbox.google.com:2002`, reject unknown IDs (never accept an
arbitrary destination), bound UDP receives and reject oversized/truncated datagrams,
and relay bytes unchanged. Roughtime's internal draft-08 length is **little-endian**
after `ROUGHTIM`, unlike the outer relay's big-endian lengths. Parent authentication
is not a time trust boundary: every response is independently enclave-verified.

## KMS sealing primitives (P1.4)

`RecipientKey::generate()` creates a boot-local RSA-2048 key (zeroized on drop).
On subsequent boots, `unseal_or_generate_escrow_key` attests its SPKI in NSM
`public_key`, a fresh 32-byte nonce in `nonce`, and the logical key ID in `user_data`.
This boot attestation is separate from client-facing attestation, whose `user_data`
must contain the escrow P-256 SPKI. KMS `Decrypt` returns only
`CiphertextForRecipient`; any plaintext field, even empty, fails closed.
The always-compiled CMS parser uses `cms 0.2.3` / `der 0.7`, requires a single
RSA-OAEP recipient (SHA-256, MGF1-SHA-256, empty label), and opens AES-256-CBC
with PKCS#7 padding. Unsupported OIDs/parameters and malformed DER are rejected.
CMS CBC has no independent integrity: only feed it responses from authenticated
KMS TLS, not an unauthenticated parent-provided CMS value.

First boot generates the existing P-256 escrow pair and seals its binary PKCS#8
with `Encrypt`, using `{purpose: "escrow-enclave-key", keyId: <logical-id>}` on both
paths. A failed unseal never regenerates a replacement. The caller must persist
the returned new ciphertext via the parent **before serving the key**. Persistence,
missing-blob/rollback policy, credential wire DTOs, refresh, and startup supervision
belong to P1.8/P3.3; this library does not silently wire them into the stub server.
The KMS CMK ARN in `AwsKmsClient::new` is distinct from the logical escrow key ID.

`KmsClient` returns explicit boxed `Send` futures: native `async fn` in traits
is not dyn-compatible in Rust 1.93, so no `async-trait` dependency is needed.
`FakeKmsClient` is test-only or explicit `fake-kms` (default off); it authenticates
its sealed blobs with AES-GCM and emits actual DER CMS to exercise the real parser.
It checks parsed attestation public-key equality and optional PCR0 pins, **not**
signatures, chain, nonce or freshness. It is not a production KMS substitute.

### KMS transport and credentials

The SDK enables only `rt-tokio` and `default-https-client`, not its legacy
`rustls` feature: hyper 1.x, rustls 0.23 and AWS-LC handle HTTPS. Certificate
validation uses rustls-webpki with **native CA roots**, not bundled
`webpki-roots`. Smithy loads these through `rustls-native-certs`, honoring
`SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt` in the Dockerfile. Thus the
Alpine CA bundle baked into the measured image remains the trust store (D11);
local development uses the platform trust store unless explicitly overridden.

`AwsKmsClient` (`kms` feature) requires explicit temporary parent STS credentials
and a region; it never uses IMDS or an environment credential chain. Reconstruct
the client with refreshed credentials per boot/request; never log these values.
Its default endpoint is `https://kms.<region>.amazonaws.com:8000`.
The enclave image **must** map that exact hostname to `127.0.0.1` in `/etc/hosts`
and supervise `kms::vsock_forward::run()` (Linux + `kms`) before KMS calls:

```text
SDK -- TLS (AWS hostname/SNI verified) --> 127.0.0.1:8000
    -- opaque TCP-to-vsock --> CID 3:8000
    -- parent vsock-proxy --> kms.<region>.amazonaws.com:443
```

Do **not** use `https://127.0.0.1:8000`: KMS certificates do not cover loopback;
never disable TLS certificate verification to work around that. The forwarder
has a fixed destination, at most 16 active connections, and a 60-second connection
lifetime. Dropping its future aborts its child tasks. `ESCROW_KMS_ENDPOINT` can
select only that regional hostname with port 8000, port 443, or no explicit port;
other hosts and HTTP fail closed so first-boot plaintext cannot be redirected.
The direct 443 options are for non-enclave environments; this setup currently
assumes the standard `amazonaws.com` partition, not China/FIPS endpoints.

Private key, CEK and application plaintext buffers zeroize on drop, including CBC
error paths, and RSA decrypt uses blinding. AWS SDK request/HTTP/parser allocations
are SDK-owned and **do not promise zeroization**; complete memory erasure is not
claimed. The SDK necessarily copies first-boot PKCS#8 into its Encrypt request.
RSA dependency timing advisories and real AWS-generated CMS interoperability still
require the planned security review/staging enclave test before deployment.

## NSM attestation primitives

`RealNsm` (feature `nitro`) opens one device descriptor and closes it on drop.
Both drivers enforce request caps before IO/signing: user data 1024 bytes, nonce
512 bytes, optional public key 1024 bytes. Put the P-256 escrow SPKI in `user_data`
and the distinct RSA KMS recipient key in `public_key`.

`FakeNsm` exists only in tests or with explicit `fake-nsm` (default off). Its public,
deterministic P-384 test CA chain and signatures are **never production evidence**.
`parse_attestation_document` only decodes the COSE envelope and claims: it does not
verify signatures, certificates, root pins, nonce, PCRs, or freshness.

Client verifier fixtures live in
`packages/sss-key-manager/src/__fixtures__/nitro-attestation/`. Regenerate from this
directory with `ESCROW_WRITE_NITRO_FIXTURES=1 cargo test nsm::tests::client_fixtures`.
The first generation uses `crypto::generate_escrow_key_pair`; subsequent generations
reuse only its public SPKI from the manifest for byte-stable output. Private escrow
keys are never written. Normal tests are read-only. Use the manifest's frozen
`nowMs`, `maxAgeMs`, and per-case overrides when testing freshness and nonce checks.

## Local development

From this directory (explicit host-trusted test drivers, never production):

```sh
export ESCROW_ENCLAVE_EMULATE_TOKEN=contract-test-token
cargo run --features fake-nsm,fake-kms,fake-time,fake-ledger -- --emulate 127.0.0.1:5000 --emulate-http 127.0.0.1:8443
```

Then from `services/learn-card-network/lca-api`:

For the full lifecycle contract, first create a **disposable local JSON file**
containing `{}`. Set `ESCROW_ENCLAVE_EMULATE_FIXTURE` to its absolute path in
both the emulator and test environments before starting either process. The test
atomically installs a fake enrollment and restores the file afterward; never
point it at a shared developer fixture. Without this setting the lifecycle test
fails rather than silently skipping mutations. Use the same bearer token in
`ESCROW_ENCLAVE_EMULATE_TOKEN` and `ESCROW_ENCLAVE_CONTRACT_TOKEN`.

```sh
ESCROW_ENCLAVE_CONTRACT_URL=http://127.0.0.1:8443 bunx vitest run src/services/escrow-enclave/remoteEnclave.contract.test.ts
```

The contract test defaults to `contract-test-token`; set
`ESCROW_ENCLAVE_CONTRACT_TOKEN` if you choose a different token. Runtime lca-api
uses `ESCROW_ENCLAVE_REMOTE_URL` and `ESCROW_ENCLAVE_REMOTE_TOKEN` instead.
Both emulator listeners require loopback addresses. HTTP is optional and requires
a nonempty `ESCROW_ENCLAVE_EMULATE_TOKEN`; there is no default bearer credential.
Emulation requires **all four** fake features, generates an ephemeral escrow key
via fake KMS seal/unseal, and reports **`mode: software`**, never Nitro evidence.
The production `--features nitro,kms` binary refuses `--emulate` before binding.

The CLI emulator supports attestation and blob verification without enrollment.
It deliberately does **not** invent enrollment ownership/currentness from a blob
or a create-hold request. For local recovery flows, set
`ESCROW_ENCLAVE_EMULATE_FIXTURE=/absolute/path/to/fixture.json` before launch.
This **fake-only**, at-most-64-KiB local file is re-read for enrollment/time:

```json
{
    "nowMs": 1700000000000,
    "enrollments": {
        "did:key:test": {
            "epoch": 1,
            "shareVersion": 1,
            "blobHash": "<64 lowercase hex characters>"
        }
    }
}
```

After encrypting a blob to the running emulator's attested key, put its
canonical envelope hash (field order documented above) and DID/version/epoch
in the fixture. Use atomic file replacement between operations. Omit `nowMs`
to use advancing host wall time; move it forward by **604800000** to test the
unchanged seven-day policy. Fake attestation timestamps always use current host
time. Absent enrollment entries fail closed. Fixture authority is host-trusted
test data, **never a production enrollment protocol**. Wire tests separately
provision an in-memory fake authority/clock and exercise the same signed policy.

```sh
cargo fmt --check
cargo clippy -- -D warnings
cargo test
cargo clippy --features fake-ledger,fake-time,fake-kms,fake-nsm -- -D warnings
cargo check --features nitro,kms
```

Production startup defaults to vsock port 5000 on Linux. It supervises the KMS
TLS byte forwarder, reads NSM measurements, constructs production Roughtime,
fetches boot material from CID 3:5002, seals/unseals, derives the policy ledger
key, and only then binds. Startup configuration is `ESCROW_TENANT`,
`ESCROW_KEY_ID`, `ESCROW_KMS_REGION`, `ESCROW_KMS_KEY_ARN`. Missing sealed material
fails closed unless the measured launch configuration explicitly permits first
boot with `ESCROW_ALLOW_FIRST_BOOT=true`; disable it after provisioning.
Production remains **blocked** on independently authenticated fresh enrollment
(D14) and the existing `verified-roughtime-keys` review gate. The default Docker
feature set cannot pass that time gate. No parent enrollment claims are trusted.

Rust is pinned to 1.93.0, including rustfmt, clippy, and the Linux musl target.
Default features include `enclave-runtime`, preserving KMS/CMS and server support.
Verifier-only consumers can disable defaults to exclude recipient RSA and transports;
`kms`, `nitro`, and `fake-kms` explicitly enable the runtime. `tokio-vsock` is Linux-only; emulation is intended for
macOS/native testing. `nitro` adds NSM and COSE dependencies (COSE's default backend
requires OpenSSL development libraries); `kms` adds AWS configuration/KMS and CMS
unwrapping primitives. Compilation does not imply access to `/dev/nsm` or AWS.
Real Nitro execution, EIF generation, and musl cross-linking need Linux tooling;
installing the Rust target alone is not sufficient.

Dependencies use patch-only `~major.minor.patch` ranges, with `Cargo.lock` recording
exact resolutions. RustCrypto versions share the stable RSA 0.9 digest/rand traits
rather than mixing incompatible generations. AWS config 1.8.18 and KMS 1.111.0
are the newest Rust-1.93-compatible releases found during scaffolding; newer AWS
releases require Rust 1.94.1. Resolver 3 respects transitive Rust-version limits.
No root Cargo workspace is needed.

NX targets (from the repository root): `bunx nx build escrow-enclave-app`,
`bunx nx test escrow-enclave-app`, `bunx nx lint escrow-enclave-app`, and
`bunx nx run escrow-enclave-app:fmt-check`. Build output is
`target/release/escrow-enclave`, not the repository's usual `dist` folder.

## Wire contract

The server exclusively accepts `wire::v1::{Request,Response}`. The original
top-level scaffold DTOs are retained unchanged for additive source compatibility;
they are **not accepted as legacy policy messages**. The v1 namespace is a Rust
name, not an additional JSON wrapper/version field.

On enclave vsock port **5000** (TCP `--emulate` uses identical bytes), each
connection carries exactly one request and response, each framed as **u32
big-endian JSON byte length followed by UTF-8 JSON**, length 1–262144 bytes.
Length is checked before allocation. No newline delimiter, pooling, pipelining,
retry, or JSON-RPC 2.0 IDs. Objects have a camelCase `method` discriminator;
unknown and duplicate typed fields are rejected. Example JSON payload:
`{"method":"attest","nonce":[0,1,255]}`. Malformed/oversized framed input closes
only that connection; operation failures return `method: error` and sanitized
`code`/`message`. One policy actor serializes all operations and retains its
ledger after every error/timeout. At most **32** socket tasks across both
listeners; an absolute ten-second deadline covers read, actor queueing, policy,
and write. Expired queued requests are dropped without policy execution. This
cannot undo a release already committed before the caller loses its response;
callers must not retry releases. Async deadlines cannot preempt synchronous NSM
or cryptographic calls. Framed emulator TCP is host-trusted and unauthenticated;
the HTTP bearer is not protection from other local processes.

| Method                  | Request fields (besides `method`)                                                                                                        | Response fields                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `attest`                | `nonce` (JSON byte array)                                                                                                                | `mode`, `keyId`, `publicKey`, `measurements`, `document`, `issuedAt` |
| `createHold`            | `envelope`, `holdId`, `requestId`, `expectedDid`, `expectedShareVersion`, `enrollmentEpoch`, `releasePolicy`, `clientEphemeralPublicKey` | `hold` (`SignedHoldRecord` wrapper)                                  |
| `verifyBlob`            | `envelope`, `expectedDid`, `expectedShareVersion`                                                                                        | `ok`, `hasPin`, optional `reason` (on failure)                       |
| `release`               | `envelope`, `hold` (`SignedHoldRecord`), `requestId`, `clientEphemeralPublicKey`, `expectedDid`, optional `pinProof`                     | `sealed` (envelope)                                                  |
| `cancel`                | `envelope`, `hold` (`SignedHoldRecord`), `requestId`, `clientEphemeralPublicKey`, `expectedDid`                                          | `cancelled` (boolean)                                                |
| `health`                | none                                                                                                                                     | `ok`                                                                 |
| `error` (response only) | —                                                                                                                                        | `code`, safe `message`                                               |

Error codes: `policy`, `pinMismatch`, `blob`, `unavailable`, `ledger`, `time`.
DTO deserialization is **not** signature, algorithm, range, or policy validation.
All integers crossing JavaScript must remain within its safe-integer range;
positive versions and policy input bounds are enforced by handlers/policy.

`EscrowEnvelope` mirrors the SDK: `version`, `algorithm`, `keyId`,
`ephemeralPublicKey`, `salt`, `iv`, `ciphertext`. Binary fields are standard base64;
the ephemeral key is raw uncompressed P-256, ciphertext includes the GCM tag.
Client release keys and attested escrow public keys are base64 SPKI. Attestation
`document` is base64 and `issuedAt` is an ISO-8601 UTC string. `pinProof` is hex.

`HoldRecord` binds `holdId`, `did`, `shareVersion`, `blobHash` (SHA-256 hex),
`enrollmentEpoch` (integer generation), `releasePolicy` (`hold` or `pin`),
`clientEphemeralPublicKey`, `createdLo`, `createdHi` (Unix milliseconds),
`policyVersion`, and `signature` (base64). The enclave must derive blob hashes,
time intervals and policy versions rather than accept them from the parent.
The complete `SignedHoldRecord` is `{hold: HoldRecord, holdDurationMs, ledgerSeq}`;
all three are mandatory, and `createHold` returns `{method:"createHold",hold:
{hold: {...},holdDurationMs:604800000,ledgerSeq:0}}`. See Release policy above for
the exact signed commitment. `requestId` is mandatory for mutations, bounded to
112 ASCII identifier bytes by policy; it never enables release replay.

Attestation binds escrow SPKI bytes in NSM `user_data`, caller nonce in `nonce`,
and the distinct **65-byte uncompressed SEC1 P-256 ledger public key** in NSM
`public_key`. Monitors must extract that key only after validating attestation,
measurement allowlists, freshness and nonce. `issuedAt` is formatted from the
NSM timestamp, not used to authorize release. Hardware replies use `mode:nitro`;
fake replies use `mode:software` and a publicly known test CA.

### HTTP translation (parent / optional emulator listener)

`POST /v1/attest`, `/v1/verify-blob`, `/v1/create-hold`, `/v1/release`, `/v1/cancel-hold`,
and `/v1/health` carry the table's fields **without `method`**. The parent adds
the discriminator when forwarding and removes it on replies. Both HTTP adapters
implement P4.2: create returns the bare complete `SignedHoldRecord`, cancel returns
`{ok:true}`, and mutations receive a fresh random request ID when omitted. Explicit
request IDs are preserved; the framed enclave protocol still requires them. The
emulator retains `/v1/cancel` as a path alias. Neither adapter retries releases or
accepts unsigned host records. All emulator calls require bearer auth,
HTTP/1.1 and exactly one Content-Length. Headers are bounded to 8192 bytes and
bodies to 256 KiB. Chunking, duplicate lengths/auth headers and Expect are refused;
connections close after one response. Unknown paths return 404; oversized bodies
413; missing/incorrect bearer 401. Operation error JSON is `{code,message}`:
503 for unavailable/ledger/time, 403 for other policy errors. Successful replies
are 200, including `{ok:false,hasPin,reason}` for identity/version mismatch.

### Boot and HeadStore parent protocol (proposed P3.3 integration)

CID **3**, port **5002**, one connection per operation; requests use the same
length-prefixed bounded JSON framing. This is separate from client port 5000 and
the established time relay 5001 / KMS byte relay 8000. P3.3 must implement:

- `{"method":"boot","keyId":"..."}` → framed JSON
  `{sealed:base64|null,accessKeyId,secretAccessKey,sessionToken}` with temporary
  STS credentials. Ciphertext encoded length ≤24000. No secrets are logged.
- `{"method":"persistKey","keyId":"...","sealed":"base64"}` → one byte
  **0** only after durable create-if-absent persistence; anything else fails boot.
  Never overwrite an existing key. Concurrent first boots must lose closed,
  restart, and load the winner. A malicious parent acknowledgment is not proof
  of durability; operational supervision/monitoring is still required.
- `{"method":"getChain","chainId":"..."}` → raw **u32 BE record count**
  (0–64), followed by count records, each **u32 BE length + raw canonical CBOR**
  (1–8192 bytes). No JSON/base64 array; limits checked before allocation, total
  record bytes at most 524288. The strict ledger decoder checks every record.
- `{"method":"append","chainId":"...","record":"base64 canonical CBOR"}`
  → one byte **0 success / 1 conflict / 2 unavailable**. Every other byte/EOF is
  unavailable. Apply the existing HeadStore conditional transaction and audit
  obligations above; the enclave independently reads back and authenticates.

Each storage exchange is timed out at ten seconds; boot KMS and persistence at
60 seconds. No retries or fabricated empty chains on storage failures. The
transport must be coordinated with P3.3 before staging; hardware/parent
interoperability now has native coverage in the host crate's `parent_interop.rs`:
the production client codecs run against `Services` with in-memory persistence.
The socket address-family binding, real AWS storage/pagination, and Nitro boot
remain staging obligations. `http_interop.rs` additionally drives the host router
through loopback framing into the real enclave actor and policy, including an
advanced fake-clock delayed release. The live TypeScript contract opens PIN
releases with the SDK and checks cancellation, wrong PIN, and terminal replay.

The envelope/verify/release field names match lca-api's escrow-enclave types,
but `hold` intentionally replaces the **unsigned** `EscrowHoldForEnclave` with
the D3 signed record. P4 must adapt the host. Legacy `now`, `releaseAfter`, and
`status` are not trusted wire inputs. Cancellation/current-enrollment checks
require ledger integration; a valid signature alone does not authorize release.

## Threat model & guarantees

The following are **design requirements, not guarantees delivered by this scaffold**.
Treat the parent, its transport, host-supplied database state, and clock as untrusted.
The parent can replay, reorder, suppress, or modify messages and deny service.
Trust boundaries include measured enclave code, AWS Nitro/KMS, pinned independent
time authorities, and the separately administered audit monitor/KMS policy roles.

### D2: authenticated time, not the enclave clock

The enclave clock is host-influenced; reading it locally does not authenticate
elapsed time. Require fresh nonce-bound signed Roughtime responses from **at least
two independent pinned sources**, verified inside the enclave. Intersect their
intervals: `[max(lows), min(highs)]`; disagreement, missing evidence, or time before
the observable ledger head fails closed. Delayed release requires
`trusted_now.lower >= hold.created.upper + 7 days`. A parent UDP relay is untrusted
(the KMS vsock proxy is TCP-only). Public time services have production-readiness
and uptime caveats; authority selection and outage behavior need security review.

### D3: rollback detection, not prevention

Option A uses enclave-signed canonical-CBOR hash chains, DynamoDB conditional
appends/head updates, and S3 Object Lock audit records. It provides rollback
**detection with fail-closed behavior when a mismatch is observed**, not rollback
prevention. Detection requires a fresher head to be observable. A fresh enclave
cannot distinguish the true latest head from an old valid head supplied by the
parent (trust on first use). Parent-held DynamoDB credentials can bypass the
intended transaction shape; IAM cannot enforce that shape. Immutable audit
records are not a live freshness oracle.

An independent monitor in a separate IAM boundary must check chain integrity
and DynamoDB/S3 divergence, alarm, and trigger the API release kill switch.
Strict rollback prevention requires quorum enclave replicas (option B,
Signal SVR2/ROTE model), **deferred**. Do not claim a strict replay-proof PIN
budget against a malicious parent using option A alone.

Planned PIN handling is reserve -> verify -> commit: consume attempts before
checking the proof and use request-ID idempotency, even if a response is lost.
The host-owned Mongo counter is not a Nitro security boundary. Signed holds must
match the current enrollment epoch, blob hash, share version, identity and client
key; old holds must not survive rotation. Key material must stay inside the
enclave except as KMS ciphertext; KMS recipient attestation binds allowed PCR
tuples. TCP emulation is host-trusted, never a production security substitute.

## Security review checklist

- [ ] Cross-language envelope/AAD/KDF vectors and malformed-input tests pass.
- [ ] Secrets are zeroized where possible and never included in logs/errors.
- [ ] Client attestation verifies chain/root, nonce, freshness and PCR tuple pins;
      debug enclaves and emulation are rejected in production.
- [ ] KMS recipient key and escrow key have distinct roles; KMS policy changes
      require two-person approval and lca-api has no escrow KMS grant.
- [ ] Two pinned independent time authorities, relay replay resistance, interval
      checks, monotonicity, outage handling and seven-day boundary are reviewed.
- [ ] Signed holds bind the current enrollment and recipient; cancellation,
      rotation and single-use release are checked against observable ledger state.
- [ ] PIN reservation precedes verification, retry idempotency is tested, and
      rollback detection's fresh-boot/replayed-head limitation is accepted explicitly.
- [ ] Independent immutable audit/monitor/kill switch works across IAM boundaries;
      failures refuse release, and quorum prevention remains a documented gap.
- [ ] Transport framing/limits, parser fuzzing, denial-of-service behavior and
      dependency advisories (including RSA side channels) are reviewed before use.
- [ ] Reproducible EIF/PCR builds, measurement rotation, notifications and external
      security review pass before any production rollout.

## Reproducible build

`Dockerfile` + `scripts/build-eif.sh` (P2.1) turn this crate into a Nitro
Enclave Image File (`.eif`) plus its PCR0/1/2 measurements, reproducibly.

### How to build

```sh
services/escrow-enclave-app/scripts/build-eif.sh --out /tmp/escrow-eif-out
```

This requires **Amazon Linux with `aws-nitro-enclaves-cli` and a running
Docker daemon** — `nitro-cli` is Linux-only and needs the Nitro Enclaves
kernel driver, so this only runs in CI (or a Nitro-capable EC2 instance),
never on a developer laptop. `--source-date-epoch` defaults to
`git log -1 --format=%ct`; pass it explicitly to reproduce a specific
commit's build later. Output: `escrow-enclave.eif`, `measurements.json`
(`{pcr0, pcr1, pcr2, imageTag, sourceDateEpoch, gitCommit, eifSha256}`), the
built `image.tar`, and raw `nitro-cli` logs.

`scripts/verify-measurements.sh <a.json> <b.json>` compares two
`measurements.json` files' `pcr0`/`pcr1`/`pcr2` and exits non-zero on any
mismatch — this is what P2.2's CI double-build gate runs to prove
reproducibility before trusting a published measurement.

Builder choice: kaniko (`--reproducible`, `--no-push`, `--tar-path`) over
`docker buildx build --output type=docker,rewrite-timestamp=true`. Both are
viable (notepad decisions.md D8 mentions kaniko as the primary option); this
task picked kaniko because (a) it matches the plan's own phrasing and D8,
and (b) `nitro-cli build-enclave` needs a Docker daemon on the build host
regardless (to load the image `--docker-uri` references), so buildx's
"needs a daemon anyway" isn't actually a point in its favor here — kaniko
still buys an unprivileged, single-purpose container for the
Rust/C-toolchain compile step itself. kaniko's `--reproducible` has a
[known open gap](https://github.com/GoogleContainerTools/kaniko/issues/2304)
around fully normalizing copied-file mtimes, so the Dockerfile does **not**
rely on it alone: it explicitly `touch -d "@$SOURCE_DATE_EPOCH"`s the two
files that end up in the final image before they're copied out.

### What makes PCR0/1/2 change

- **PCR0** (enclave image file): any change to the Docker image's
  filesystem contents — source code, `Cargo.lock` (dependency versions),
  the pinned Rust base image digest, installed `apk` packages, or file
  mtimes if they aren't normalized. This is why the Dockerfile pins the
  base image by digest and normalizes mtimes explicitly rather than trusting
  `--reproducible` alone.
- **PCR1** (Linux kernel + bootstrap/init ramfs): comes from `nitro-cli`
  itself, not from this Dockerfile — **pin the exact
  `aws-nitro-enclaves-cli` package version in the CI runner/AMI**. Two
  otherwise-identical Docker images built with two different `nitro-cli`
  versions will produce different PCR1 (and thus a different overall
  attestation) even though PCR0 (the image content) matches.
- **PCR2** (application layer, in-order measurement of the user
  application without the boot ramfs): follows PCR0's inputs closely for a
  single-binary image like this one.

A residual, currently-open reproducibility gap: pinning the base image's
digest pins Alpine's filesystem, but `apk add` still resolves against the
_live_ `v3.22` package repository at build time. A security backport to
`build-base`/`openssl-dev`/etc. within the `v3.22` branch could change
PCR0 on a rebuild months later even with an unchanged Dockerfile and
Cargo.lock. The P2.2 CI gate (build twice, diff PCR0, same run) proves
same-day reproducibility; it does not by itself prove "rebuild from this
tag a year later still matches." Pin exact `apk add pkg=version` strings if
that stronger guarantee becomes a requirement — this task's local
environment (no Linux, no `nitro-cli`) could not exercise a real build to
determine current exact `apk` version strings; see
`.sisyphus/notepads/nitro-escrow-enclave/issues.md`, "P2.1 report", for
what was and wasn't verified locally.

### Flowing measurements into Terraform / tenant config

1. CI (P2.2) runs `build-eif.sh` twice, diffs with `verify-measurements.sh`,
   and on success commits `measurements.json` (renamed
   `escrow-measurements.json`) to the repo root's `security/` directory and
   uploads the `.eif` to the artifacts S3 bucket
   (`infra/escrow-enclave`'s `storage.tf`).
2. `infra/escrow-enclave`'s `enclave_measurements` Terraform variable takes
   `{label, pcr0, pcr1, pcr2}` tuples (see `variables.tf`) — copy
   `measurements.json`'s `pcr0`/`pcr1`/`pcr2` in directly (they're already
   the required lowercase-hex SHA384 strings) under a new `label` (e.g. the
   `gitCommit` short SHA or a semver tag), following the **N / N+1
   measurement rotation** procedure in `infra/escrow-enclave/README.md`.
3. The same three PCR values become one entry in the tenant config's
   `escrowEnclaveMeasurements: {pcr0, pcr1, pcr2, imageSha384?}[]` array
   (see decisions.md D6, `learn-card-base`'s tenant schema) — clients pin
   against this allowlist when verifying a Nitro attestation document, so
   the Terraform key-policy update and the tenant-config/SDK release must
   roll out together, both following the N/N+1 overlap window (never remove
   the old measurement from either side until every instance and every
   client rollout has moved to the new one).
