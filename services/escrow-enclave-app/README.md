# Escrow enclave application

Rust scaffold for LearnCard's attested escrow recovery service (P1.1). **Not a
working enclave or recovery server:** both launch modes log "not yet implemented"
and exit successfully without binding a socket. No keys, attestation, policy,
ledger, or cryptography are implemented. Do not deploy this scaffold for recovery.

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

Future modules: `crypto` (P1.2), `nsm`/`NsmDriver` (P1.3), `kms`/`KmsClient` (P1.4),
`time`/`TimeSource` (P1.5), `ledger`/`HeadStore` (P1.6), `policy` (P1.7), and
`server` (P1.8). Native trait-based fakes will exercise the same policy logic;
neither the traits nor fake drivers are implemented by this scaffold.

## Local development

From this directory:

```sh
cargo run -- --emulate 127.0.0.1:5000
cargo run                         # selects vsock port 5000; still only a stub
cargo fmt --check
cargo clippy -- -D warnings
cargo test
cargo check
cargo check --features nitro
cargo check --features kms
```

Rust is pinned to 1.93.0, including rustfmt, clippy, and the Linux musl target.
Default features are empty. `tokio-vsock` is Linux-only; emulation is intended for
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

`src/wire.rs` fixes JSON DTOs only; framing, request IDs, transport limits, and
handlers are deferred to P1.8. Objects have a `method` discriminator. Operation
names and fields are camelCase; unknown fields are rejected. This is not JSON-RPC
2.0. For example: `{"method":"attest","nonce":[0,1,255]}`.

| Method                  | Request fields (besides `method`)                                                                                           | Response fields                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `attest`                | `nonce` (JSON byte array)                                                                                                   | `mode`, `keyId`, `publicKey`, `measurements`, `document`, `issuedAt` |
| `createHold`            | `envelope`, `holdId`, `expectedDid`, `expectedShareVersion`, `enrollmentEpoch`, `releasePolicy`, `clientEphemeralPublicKey` | `hold` (signed record)                                               |
| `verifyBlob`            | `envelope`, `expectedDid`, `expectedShareVersion`                                                                           | `ok`, `hasPin`, optional `reason` (on failure)                       |
| `release`               | `envelope`, `hold`, `clientEphemeralPublicKey`, `expectedDid`, optional `pinProof`                                          | `sealed` (envelope)                                                  |
| `health`                | none                                                                                                                        | `ok`                                                                 |
| `error` (response only) | —                                                                                                                           | `code`, safe `message`                                               |

Error codes: `policy`, `pinMismatch`, `blob`, `unavailable`, `ledger`, `time`.
DTO deserialization is **not** signature, algorithm, range, or policy validation.
All integers crossing JavaScript must remain within its safe-integer range;
positive versions and input size limits must be enforced by the future handlers.

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
Canonical signed bytes/signature encoding are deferred to P1.6/P1.7.

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
