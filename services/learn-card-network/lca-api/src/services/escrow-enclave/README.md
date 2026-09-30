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
available. Successful PIN recovery does not replenish the lifetime budget; authenticated enrollment
with a new PIN starts a fresh counter. Setting or changing a PIN requires client share
rotation. Inbox compromise plus a correct PIN guess can recover the account
(at most 10/1,000,000 for a uniformly random six-digit PIN).

## Nitro requirement

The real Nitro enclave application lives on a separate branch and **must implement
`carryPinVerifier`** with the same contract before PIN carry is available there:

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

TODO(escrow-nitro): Move the counter into enclave-internal, replicated state with
decrement-before-decrypt semantics and rollback protection. Do not reuse the
host-owned counter as the security boundary for a Nitro implementation.
