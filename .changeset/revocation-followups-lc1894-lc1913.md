---
"@learncard/types": minor
"learn-card-base": minor
"@learncard/react": minor
"learn-card-app": minor
---

Revocation/suspension follow-ups (LC-1894, LC-1913)

- Issuance now allocates a `suspension` bitstring status entry by default, so suspended credentials are externally verifiable (LC-1894).
- `getActivityStats` returns `revoked`/`suspended` counts, surfaced in the issuer Issuances summary (LC-1894).
- Credential-lifecycle mutations (revoke/suspend/unsuspend) now emit a holder notification, and the activity views migrated to react-query so they auto-refresh without manual callbacks (LC-1894 / LC-1913).
- Holder wallet cards show a revoked/suspended treatment: a red/orange X seal badge (replacing the verified seal), a colored corner pill, and a desaturated card, driven by a lazy per-card status check; revoked/suspended credentials remain in the Earned tab (LC-1913).
