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
available. Successful PIN recovery resets the counter; authenticated enrollment
with a PIN starts a fresh counter. Setting or changing a PIN requires client share
rotation. Inbox compromise plus a correct PIN guess can recover the account
(at most 10/1,000,000 for a uniformly random six-digit PIN).

## Nitro requirement

TODO(escrow-nitro): Move the counter into enclave-internal, replicated state with
decrement-before-decrypt semantics and rollback protection. Do not reuse the
host-owned counter as the security boundary for a Nitro implementation.
