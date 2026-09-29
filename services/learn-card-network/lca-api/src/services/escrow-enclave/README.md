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

The real Nitro enclave application **must also implement `carryPinVerifier`** with
the same contract before PIN carry is available in `remote` mode:

```ts
carryPinVerifier({ sourceEnvelope, targetEnvelope, expectedDid,
    sourceShareVersion, targetShareVersion }): Promise<{ envelope }>
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

`services/escrow-enclave-app/src/wire.rs` has no `carryPinVerifier` method yet, so
`RemoteEnclave.carryPinVerifier` (`remoteEnclave.ts`) fails closed with
`EscrowUnavailableError` rather than calling a nonexistent endpoint. Until the
enclave-app implements the contract above, PIN-carry-on-rotation degrades to normal
PIN-less enrollment in `remote` mode — see the PIN-budget note in
`services/escrow-enclave-app/SECURITY.md` for the resulting interaction with the
per-epoch ledger budget (D13).
