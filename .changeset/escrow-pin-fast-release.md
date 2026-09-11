---
"@learncard/sss-key-manager": minor
"@learncard/types": minor
"learn-card-base": patch
"learn-card-app": patch
"@learncard/lca-api-service": minor
---

Escrow PIN fast release: an optional PIN release policy on the existing escrow-recovery substrate.

- The escrow recovery share now supports a second release policy alongside the 7-day hold: `pin`. A user who sets an optional 6-12 digit PIN can recover immediately by presenting it, instead of waiting for the hold. Custodianship is unchanged — this adds a release policy on the already-sealed blob, not a second custodial share.
- PIN verifier lives inside the enclave-sealed envelope (`EscrowBlobPlaintext.pinVerifier`); a leaked DB alone yields nothing to brute force. Client derives the proof with Argon2id and the enclave constant-time compares.
- 10 lifetime failed attempts locks the PIN (`EscrowPinLockedError`); the 7-day hold path is always available as a fallback. Setting/changing a PIN rotates the escrow share; a forced rotation for another reason clears the PIN and the app nudges the user to set it again.
- New app UI: recovery PIN setup overlay after first setup (skippable), a Recovery PIN row in recovery settings (set/change/remove), and a PIN-first step in the recovery flow with fallback to the existing hold.
