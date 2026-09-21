---
'@learncard/types': minor
'@learncard/network-plugin': minor
'@learncard/init': minor
'@learncard/cli': minor
---

Act as a managed profile. A request may carry `X-LearnCard-Act-As: <profileId>`; the network swaps the acting profile when the authenticated profile manages the target, keeps the token's scope unchanged, and records `onBehalfOf` on the resulting activity. API tokens must opt in via a new `actAs` field on the auth grant (`'*'` or a list of profile IDs; absent = no delegation).

- `@learncard/types`: `ACT_AS_HEADER`, `AuthGrant.actAs`.
- `@learncard/network-plugin` / `@learncard/init`: `actAs` option on `initLearnCard` and the network plugin; `learnCard.invoke.actAs(profileId)` returns a scoped instance.
- `@learncard/cli`: `serviceAccounts[].actAs` in the org spec is set on the grant at creation; like scope and expiry, it is compared on re-apply and any drift errors with a revoke hint (dry-run reports `drifted`). Shown by `doctor` and `whoami`; new `examples/delegated-service-account.network.yaml`.
