---
'learn-card-base': patch
'learn-card-app': patch
'scoutpass-app': patch
---

Prevent login from stalling after logout while other app tabs remain open. Preserve Firebase-managed database connections and clear authenticated sessions through Firebase sign-out. Add safe ScoutPass login diagnostics.

Coordinate Web3Auth account setup across browser tabs so Firebase sign-in propagation does not reuse a token concurrently. Validate restored account identity and replace raw provider errors with safe sign-in messages.

Clear stale account state when sign-out propagates to an already-open tab, without reopening its cached account or changing cold offline startup behavior.
