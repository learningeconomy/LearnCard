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
available. Successful PIN recovery consumes the lifetime budget; authenticated
enrollment with a PIN starts a fresh counter. Setting or changing a PIN requires
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
