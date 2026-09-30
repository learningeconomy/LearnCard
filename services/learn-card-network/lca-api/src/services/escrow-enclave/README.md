# Escrow release policies

The same sealed recovery material supports a delayed `hold` policy and an optional
immediate `pin` policy. PIN verification and release are a single enclave operation;
a PIN hold cannot release without a matching proof, even after its release time.
The verifier is never stored in plaintext in MongoDB, logged, or included in the
release payload. A leaked database alone does not expose an offline PIN oracle.

## Software-mode trust boundary

The software enclave runs in the host process: the host already controls its keys,
clock, and execution. A host-owned MongoDB attempt counter does not weaken that
existing host-trusted model, but does not protect against a malicious host either.
The API atomically reserves one of ten lifetime attempts before claiming the hold
and calling the enclave. Failed releases burn the single-use hold. Exhaustion
disables PIN recovery and cancels pending PIN holds; delayed recovery remains
available. Successful PIN recovery does not replenish the lifetime budget; authenticated
enrollment with a new PIN starts a fresh counter. Setting or changing a PIN requires
client share rotation. Inbox compromise plus a correct PIN guess can recover the
account (at most 10/1,000,000 for a uniformly random six-digit PIN).

Software hold records contain a non-cryptographic signature placeholder and no
ledger. The factory supplies its configured hold duration (seven days by default);
PIN holds have zero duration. Mongo remains responsible for single-use/cancellation.

## Nitro requirement

In `remote` mode, the enclave-owned reserve → verify → commit ledger is the
intended security boundary (`services/escrow-enclave-app/src/policy.rs` `release_pin`
and `ledger.rs` `verify_pin`), pending full P1.8/P3.3 production wiring. The host-owned
Mongo counter (`reserveEscrowPinAttempt` and related helpers) remains defense-in-depth
and UX only, not the boundary against a malicious host.

D3 is **rollback detection, not prevention**: see
`services/escrow-enclave-app/README.md`, "D3: rollback detection, not prevention".
Do not treat the signed ledger as an independent freshness oracle. Per D13, the
ledger is enrollment-wide, bounded to 64 records, and shares a ten-lifetime-reservation
budget across holds for that enrollment.

New holds store the full opaque SignedHoldRecord before returning to callers;
release and cancellation forward that record rather than unsigned host fields.
Legacy Mongo rows without a record can still be cancelled locally, but cannot
release. Enclave cancellation is best-effort after the local cancellation commits.

The real Nitro enclave application **implements `carryPinVerifier`** (P8.1/P8.2)
with the same contract described here:

```ts
carryPinVerifier({ sourceEnvelope, targetEnvelope, expectedDid,
    sourceShareVersion, targetShareVersion,
    sourceEnrollmentEpoch, targetEnrollmentEpoch }): Promise<{ envelope }>
```

Decrypt both envelopes inside the enclave. Require both DIDs to equal `expectedDid`,
both versions to match their expected versions, a strictly increasing target version,
a source PIN verifier, and no target verifier. Reject mismatches with `EscrowBlobError`
(`Invalid escrow payload.`). Seal target plaintext plus the source verifier to the
current enclave key with fresh ephemeral key and IV, using the existing envelope
format. Never return or log plaintext or the verifier.

Enrollment attempts carry only for PIN-less requests with an unlocked PIN matching
the previous blob's version and current enclave key. Persistence compares the complete
old `escrowBlob` and `escrowPin` subdocuments, auth-provider identity, current share
version, and absent opt-out marker atomically. This guards salt, counters, lock state,
and ciphertext against concurrent changes. Carry preserves salt, enabledAt and both
attempt counters, changing only the PIN share version. Unavailable/failed carry or a
lost compare-and-swap falls back to normal PIN-less enrollment with a secret-free warning.
Explicit new PIN enrollment is unchanged; explicit removal sends `clearPin: true`
to bypass carry (it cannot be combined with `pinSalt`).

`services/escrow-enclave-app/src/wire.rs` implements `carryPinVerifier` as
`wire::v1::Request::CarryPinVerifier`, dispatched in `src/server.rs` to
`Policy::carry_pin_verifier` (`src/policy.rs`), and reachable over HTTP at
`POST /v1/carry-pin-verifier` (emulator: `src/server/http.rs`; production parent:
`services/escrow-enclave-host`). `RemoteEnclave.carryPinVerifier` (`remoteEnclave.ts`)
calls that endpoint the same way `verifyEscrowBlob`/`releaseEscrow` do, with zod
response validation and the same fail-closed error mapping.

`carry_pin_verifier` decrypts/validates/reseals: unlike `createHold`/`release`/
`cancelHold`, it needs no `EnrollmentSource`, but now requires trusted time to
sign a destination-genesis Carried record. It can still
works in `remote` mode today even though every other mutating operation fails
closed with `Unavailable` under the enclave's BLOCKER-ENROLLMENT gate (see
`services/escrow-enclave-app/README.md`'s intro paragraph and `SECURITY.md`'s
"Open Items / Launch Blockers").

**P8.3 / v2**: it observes the source blob's ledger chain and writes the output
blob's first Carried record before returning ciphertext, so
the PIN attempt budget itself carries forward across a rotation instead of
resetting. Tenant, decrypted source DID hash and actual blob hash locate that chain;
`sourceEnrollmentEpoch` remains a signed record binding, never a chain selector.
`targetEnrollmentEpoch` binds carry output; rewrap preserves the source epoch.
The chain is verified with
the same signature/sequence/binding checks (`Ledger::verify_chain`), and a
chain that fails that verification is a fail-closed `Ledger`/`Unavailable`
error, not silently treated as empty. The target's `pinAttemptsFloor` becomes
`source.pinAttemptsFloor (default 0) + source_chain.attempts_used`, capped at
the ten-attempt lifetime maximum; a `release_pin` against a blob carrying that
floor only permits `10 - floor` further local attempts before locking, so a
carry — including a carry of a carry — never hands out a fresh budget and
never lowers whatever floor the source blob already had. `pinAttemptsFloor` is
stripped (like `pinVerifier`) before any release plaintext reaches the client:
it is enclave/ledger bookkeeping, not client-facing data. Positive floors must
match the chain's Carried genesis. The independent monitor checks source-head
accounting on inserts and sweeps. Choosing an older PIN-bearing copy with fewer
attempts still requires an authenticated current-enrollment authority to prevent.
Nitro never ran in production; there is no legacy-chain migration.

Software mode (`softwareEnclave.ts`) accepts both epoch fields but
ignores them: software mode has no enclave ledger to reset in the first place,
so there is no epoch-scoped budget to carry — its PIN attempt budget is the
host's `escrowPin.failedAttempts`/`verifiedFailedAttempts` counters in
MongoDB, which the enroll route already copies forward unchanged on every
carry, independent of `enrollmentEpoch`.

## Key rotation

When the enclave key is rotated, previous keys are retained as read-only. The `assertFreshEscrowBlob` check allows carry eligibility for blobs sealed under a recognized previous key (stale-but-usable). The `escrowBlobRewrap` job runs periodically to migrate these blobs to the current key, skipping accounts with pending holds. Use `scripts/escrow-blob-mode-report.ts` with `--current-key-id` and `--previous-key-ids` to monitor migration progress.
