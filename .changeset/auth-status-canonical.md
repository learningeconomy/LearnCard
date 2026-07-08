---
"learn-card-base": minor
---

feat: add canonical race-safe auth-gate selector (`useAuthStatus` / `deriveAuthStatus`)

Introduces a single source of truth for auth/profile gating decisions so the
"mixed login state" bug class becomes unrepresentable. Onboarding, age-gate, and
network-join prompts now derive from a discriminated-union state where "still
resolving" and "couldn't determine" are distinct from "confirmed no profile" — a
prompt can only fire on a positive `ready + absent` assertion, never on absence of
data during the resume race. `useIsCurrentUserLCNUser` is re-rooted on this selector
so all existing consumers inherit the correct semantics. Backed by an exhaustive
pure-selector test plus deterministic resume-race wiring tests.
