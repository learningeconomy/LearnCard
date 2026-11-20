---
'@learncard/types': minor
'@learncard/sss-key-manager': minor
'learn-card-base': minor
---

Re-seal the escrow recovery contact after the sign-in email changes (LC-2409). Key-derivation strategies can implement `confirmEscrowPin` (prove the current PIN; `replace` + `pinAction: 'keep'`, no new salt) and `resealEscrowContact` (with a PIN the same, without one the forced rotation of an account with no PIN). The SSS strategy implements both: a wrong PIN is `EscrowPinMismatchError`, and lca-api's confirm limits, a locked or stale PIN or a PIN that fails today's rules are the new `PinChangeRequiredError` (`@learncard/types`); a wrong-PIN retry in the same session reuses the pending share rotation. The AuthCoordinator adds `refreshAccountContact` (re-authenticate with lca-api's custom token, check the new email, then refresh escrow), `confirmEscrowPin` and `resealEscrowContact`, which only run from the login that holds the sign-in email and only for an address confirmed on this device (`rememberConfirmedContact`, or re-typed).
