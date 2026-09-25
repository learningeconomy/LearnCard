# Escrow enclave parent (P3.3)

Standalone Rust 1.93 host, no production dependency on the enclave crate. **Not
deployment-ready until Linux/AWS staging integration and the gates below pass.**
The independent live enrollment authority remains a separate production blocker.
The host is untrusted: cryptography, trusted time, signatures, current enrollment,
and release authorization belong exclusively to the enclave. D3 is rollback
**detection**, not prevention across restarts/parallel enclaves; readback cannot
prove durable storage. D10's key-admin policy-rewrite risk remains. D11's RSA
exception is enclave-only: this crate's audit has no advisory ignores.

## Architecture

```text
lca-api -- HTTPS / bearer --> TCP NLB :8443 --> host rustls :8443
                                                    | framed vsock --> enclave CID :5000
                                                    | nitro-cli supervisor
enclave --> parent CID 3 :5001 --> fixed Roughtime UDP endpoints
enclave --> parent CID 3 :5002 --> DynamoDB + S3 + temporary credentials
enclave --> parent CID 3 :8000 --> systemd vsock-proxy --> AWS KMS :443
NLB health probe --> plain HTTP :8444 /health
```

Only Linux can run the service. Native macOS tests use in-memory streams/fakes,
never Nitro, AWS or public time servers. Release builds use `panic=abort`.
No debug-mode flag is constructed or accepted. Supervisor fixes CID (default 16),
examines `describe-enclaves`, runs `run-enclave` only on confirmed absence, probes
framed `Health`, and uses exponential 1–60 second backoff. A live but unhealthy
enclave is **never killed/restarted** to clear a ledger high-water mark. Unknown
CLI outcomes fail closed; no release/append/boot retry after an ambiguous result.

## HTTP and framing

Every POST requires `Authorization: Bearer <token>`; SHA-256 token digests are
compared with `subtle` constant-time equality. The NLB is TCP passthrough: host
TLS certificates must cover the DNS name used by lca-api and be trusted there.
No plaintext API listener or certificate-verification bypass exists.

| HTTP path         | vsock method |
| ----------------- | ------------ |
| `/v1/attest`      | `attest`     |
| `/v1/verify-blob` | `verifyBlob` |
| `/v1/create-hold` | `createHold` |
| `/v1/release`     | `release`    |
| `/v1/cancel-hold` | `cancel`     |

Bodies use the corresponding independent `src/wire.rs` fields **without** the
`method` discriminator. Responses remove it too. Attestation mode is preserved,
never upgraded to Nitro. Errors are non-2xx `{code,message}` with the P4.1 codes
`policy`, `pinMismatch`, `blob`, `unavailable`, `ledger`, `time`. Diagnostic messages
are replaced by constants. Unsigned legacy holds, unknown fields and host `now`
are rejected. HTTP bodies and each framed message are capped at 256 KiB; one
connection/one request/one response, u32 big-endian length then JSON. Responses
must match the requested method. No retries. At most 32 active authorized API
calls; each complete body/bridge operation has a 10-second timeout.
Connection admission occurs before TLS: 128 HTTPS / 16 health connections, each
with a hard 60-second lifetime (including handshake and slow headers).

Cross-component tests link the enclave crate as a **dev-dependency only** with its
four fake features. `tests/parent_interop.rs` drives the production enclave parent
codecs and relay client against this host's real services over bounded duplex
streams and local UDP. `tests/http_interop.rs` drives this host's HTTP router into
the real enclave actor over TCP loopback, including PIN and advanced-clock holds.
These do not exercise real AWS pagination, TLS handshakes, or Linux vsock admission.

Golden tests deserialize/reserialize shared JSON fixtures through the independent
host types and test-only inclusion of enclave `wire::v1` (no Cargo path dependency).
The policy wrapper's DTO is reproduced in the test harness to avoid linking enclave
crypto/policy code. All five endpoints, including cancellation, are compared.

### P1.8 wire / P4.2 HTTP adaptation

P1.8 landed during implementation. Host DTOs now mirror active `wire::v1`, not
the retained top-level scaffold: mutations carry `requestId`; holds carry the full
`SignedHoldRecord {hold,holdDurationMs,ledgerSeq}`. P4.2's implementation spec omits
HTTP request IDs, so the host generates a fresh random UUID when absent; callers
may provide one explicitly. It never derives an ID from a PIN proof. A retry with
a new ID can spend another attempt; no layer here retries automatically. Enclave
policy still refuses terminal release replay. Create-hold HTTP returns the full
signed wrapper directly (unwrapping vsock's outer `hold`); cancel HTTP returns
`{ok:true}` from vsock's `{cancelled:true}`. Cancellation false fails closed.

Parent CID3:5002 accepts one u32-BE length-prefixed JSON request, <=32 KiB,
32 active connections, 10-second lifetime, only the configured enclave peer CID:

- `{method:"boot",keyId}` -> framed JSON
  `{sealed:base64|null,accessKeyId,secretAccessKey,sessionToken}` (no method tag).
- `{method:"persistKey",keyId,sealed:base64}` -> one byte `0` success / `2` unavailable.
- `{method:"getChain",chainId}` -> raw u32-BE count, then each raw CBOR record
  individually prefixed by u32-BE length; <=64 records / 8192 each / 524288 total.
- `{method:"append",chainId,record:base64CBOR}` -> one byte `0` success,
  `1` conflict, `2` unavailable.
- Other failures close the connection; they are never encoded as zero record count.

Boot is enclave-initiated, before its port 5000 binds. The configured key ID must
match. Missing ciphertext fails closed by default; an operator must explicitly
enable `ESCROW_ALLOW_FIRST_BOOT=true` on host AND enclave for provisioning. Even
then only S3's specific NoSuchKey result permits a null blob; access/transport
errors never permit regeneration. `persistKey` is allowed only with that flag and
always uses a conditional insert. Turn the flag off after provisioning. Concurrent
first boots cannot overwrite one another; the losing enclave must refuse to serve.

P1.8 decodes record/count limits before allocation and authenticates every record.
`aws-config`'s default provider chain fetches the instance role via IMDSv2 on EC2;
static credentials without expiration/session token are refused for enclave
delivery, as are credentials with less than five minutes remaining. The enclave
has no IMDS. The current P1.8 KMS adapter is boot-scoped; any future post-boot KMS
operation needs an agreed refresh protocol, not a restart to clear ledger state.
The KMS path remains opaque enclave-to-AWS TLS through the separate port-8000
proxy; parent code never receives KMS plaintext keys or CMS recipient plaintext.

## Persistence / audit ordering

Records use `pk=ENROLL#<64-lowercase-hex-chainId>`,
`sk=SEQ#<20-digit-zero-padded-seq>`. Heads use the same pk. A strict, nonrecursive
fixed-schema CBOR reader rejects nonminimal encodings, unordered/duplicate keys,
unknown fields, trailing bytes, invalid identifiers, oversize records, seq>=64,
and malformed time evidence. Hash is SHA-256 of the canonical unsigned 15-key map
(not the signature-bearing bytes). Signature verification stays in the enclave.

`TransactWriteItems` is exactly two Put operations:

1. Records: `attribute_not_exists(pk)` on the composite key.
2. Heads: genesis `attribute_not_exists(pk)`; successors
   `head_seq = :prev AND head_hash = :prev_hash` (never OR for successors).

TransactionCanceledException => Conflict; transport/unknown failures => Unavailable.
AWS retries are disabled. Reads are strongly consistent, ordered and paginated one
item at a time, max 64 records / 8192 bytes each / 524288 total record bytes. A
bounded final query after record 64 distinguishes a cursor from a real 65th item;
an actual 65th item fails closed before copying it. The AWS SDK necessarily allocates
one DynamoDB item before this code checks it (DynamoDB bounds items at 400 KiB).

**DynamoDB first, then S3.** Audit stores exact signed bytes at
`audit/<tenant>/<chainId>/<seq>-<unsigned-record-hash>.cbor`, inheriting bucket
COMPLIANCE Object Lock retention. S3 failure after transaction success logs only
`audit_unavailable` and returns Unavailable; no rollback, replay or compensating
delete. Reservation remains spent. The independent monitor must alarm on missing
audit/divergence, records MODIFY/REMOVE, heads anomalies and disable API release.
Recovery requires operator reconciliation of exact bytes; restarting is not a fix.

Sealed-key objects are <=16 KiB, read in bounded chunks and created with
`If-None-Match: *`; existing keys are never overwritten. **Current Terraform IAM
only grants artifacts GetObject, not PutObject**. Initial sealed-key provisioning
therefore needs a separately reviewed narrow PutObject permission for this exact
object or a privileged provisioning workflow. No IAM changes were made here.

## Configuration / systemd

Install the release executable at
`/opt/escrow-enclave-host/bin/escrow-enclave-host`, matching the user-data unit.
Use a systemd drop-in `EnvironmentFile=/etc/escrow-enclave-host/env`, mode 0600;
use a root-owned token file or systemd credentials rather than embedding tokens
in the unit. No secrets or whole SDK errors are logged. Do not enable SDK tracing,
HTTP access-body logging, core dumps or request capture in production.

| Variable                                                 | Meaning/default                                                     |
| -------------------------------------------------------- | ------------------------------------------------------------------- |
| `AWS_REGION`                                             | Required region                                                     |
| `ESCROW_ENCLAVE_EIF_PATH`                                | Required; user-data sets `/opt/escrow-enclave-host/eif/current.eif` |
| `ESCROW_ENCLAVE_CPU_COUNT` / `ESCROW_ENCLAVE_MEMORY_MIB` | 2 / 2048                                                            |
| `ESCROW_ENCLAVE_CID`                                     | 16, >=4, not u32::MAX                                               |
| `ESCROW_ENCLAVE_HEALTH_PORT`                             | 8444                                                                |
| `ESCROW_ENCLAVE_TLS_CERT` / `ESCROW_ENCLAVE_TLS_KEY`     | Required PEM paths; restart host to reload                          |
| `ESCROW_ENCLAVE_TOKEN_FILE`                              | Preferred bearer token source; whitespace trimmed                   |
| `ESCROW_ENCLAVE_REMOTE_TOKEN`                            | Fallback bearer; 32–4096 bytes                                      |
| `ESCROW_LEDGER_RECORDS_TABLE`                            | `escrow-ledger-records-<env>` required                              |
| `ESCROW_LEDGER_HEADS_TABLE`                              | `escrow-ledger-heads-<env>` required                                |
| `ESCROW_AUDIT_BUCKET` / `ESCROW_ARTIFACTS_BUCKET`        | Required bucket names                                               |
| `ESCROW_SEALED_KEY_OBJECT`                               | Required fixed artifacts object key                                 |
| `ESCROW_KEY_ID`                                          | Required logical key ID, must match measured enclave configuration  |
| `ESCROW_ALLOW_FIRST_BOOT`                                | `false`; explicit `true` enables create-only provisioning           |
| `ESCROW_ROUGHTIME_ALLOWLIST_JSON`                        | Optional operator-owned server ID -> host:port map                  |

Roughtime defaults: `cloudflare` -> `roughtime.cloudflare.com:2003`, `google` ->
`roughtime.sandbox.google.com:2002`. User-data's endpoint-only
`ESCROW_ROUGHTIME_SERVERS` is intentionally not interpreted (it has no IDs); use
the explicit JSON map for overrides and reconcile enclave pins/security-group
egress separately. Request JSON <=8192, ID <=128, payload 1–1024; reply is raw
1–1024 bytes framed with u32 BE, not JSON. A 1025-byte receive buffer detects
oversize/truncation, a connected UDP socket filters source, total lifetime is 2s.

User-data already orders the unit after allocator and KMS vsock-proxy. Supply
the additional configuration before starting it; add `LimitCORE=0` and a bounded
`MemoryMax`, `TasksMax`, file-descriptor limit. The existing NLB health check is
**TCP**, not HTTP: a listening 8444 socket alone is accepted even when `/health`
returns 503. Change the NLB check to HTTP `/health` in an infra follow-up before
rollout. This crate does not modify infra. Real Linux/vsock/AWS/TLS deployment and
readiness must be verified in staging; native compilation is not that verification.

## Verification

```sh
cargo fmt --check && cargo clippy -- -D warnings && cargo test
cargo audit
cargo build --release
```

Default-features are disabled on AWS config/DynamoDB/S3: `default-https-client`
selects hyper 1.x/rustls 0.23, not the legacy rustls 0.21/h2 0.3 stack. Commit
Cargo.lock with this crate. No advisory-ignore configuration is provided.

RustSec currently reports the S3 SDK's transitive `lru 0.16.4` as informational
`unsound` (RUSTSEC-2026-0253), not an audit-failing vulnerability. Patched lru
0.18.2 is outside this Rust-1.93-compatible SDK's dependency range. No ignore is
used. The reported exploit requires catch-unwind after a panicking key Drop;
production uses panic=abort. Track the SDK update rather than hiding the warning.

With the cross-component dev-dependency, plain `cargo audit` also scans the enclave's
`rsa 0.9.10` and **fails** on RUSTSEC-2023-0071 (no fixed upgrade available).
RSA is not a production host dependency. No advisory ignore was added or inherited
from the enclave; the required host audit gate remains blocked pending an explicit
decision on auditing this dev-only graph. A passing production-only dependency
claim must not be substituted for the requested whole-lockfile audit result.
