# Native child-account phase

This is the next Families slice, not implemented functionality. The current [native Families flows](FAMILIES_INTEGRATION.md) deliberately stop at roster, family setup/editing and guardian invitations.

## Separate membership from account access

A guardian in a family roster is a family-management relationship. A child roster row is a profile-manager descriptor. Neither alone proves that the current account can construct a child signing host.

Use the server's available-profile results and their manager association to determine switchable accounts. Preserve the distinction between custodial family managers and guardian-only approval links. [The relationship reader](../../services/learn-card-network/brain-service/src/accesslayer/profile/relationships/read.ts) excludes explicit `managerType = 'guardian'` links from switchable-profile results while other guardian gates still treat those links as management. The web's [bespoke account construction](../../packages/learn-card-base/src/helpers/walletHelpers.ts) also disables automatic root/child DID association for switched contexts.

Do not pass an arbitrary roster DID to account initialization or use guardian approval as evidence of child key custody.

## Child creation needs a recoverable operation

The existing [web creation hook](../learn-card-app/src/hooks/useCreateChildAccount.tsx) and [Family CMS](../learn-card-app/src/components/familyCMS/FamilyCMS.tsx) span:

1. A manager attached to the family, administrated by the parent.
2. A managed profile, with its own public ID, date of birth and country.
3. Family credential delivery, acceptance and personal-index population.
4. Child permissions/admin cleanup.

A lost reply in the first step can leave an orphaned manager; restarting from scratch can duplicate it. The current manager schema lacks a client operation ID. Before a native flow hides these steps, add an owner-scoped idempotency/recovery contract, or implement a durable account-scoped journal with server reconciliation. Store private child details only in protected storage, never in public family metadata. Preserve the signed membership credential when indexing it.

Prefer an authenticated family-child bootstrap operation returning stable manager/profile/operation IDs and status. Enforce family membership and current create/manage permissions on the server. Brain graph steps can share a transaction; credential issuance and LearnCloud indexing still need recoverable receipts, not a claim of one cross-service transaction.

**Source audit to validate before exposure:** [createChildProfileManager](../../services/learn-card-network/brain-service/src/routes/profile-manager.ts) checks that the parent Boost exists, then creates/relates a manager; this handler does not explicitly check the caller's permissions on that parent. This is a source-level finding, not a reproduced exploit. Add a cross-account denial integration test and verify the intended parent permission gate before exposing native child creation. The first native slice does not call this handler or change backend behavior.

## Keep the parent session and child context distinct

The verified Firebase account and recovered primary signing identity stay bound to the parent. A selected child context needs a separately scoped host and stores for credentials, apps and permissions, built from a server-confirmed manager association. Do not relabel the parent Firebase session or send the parent's app identity proof while a child is active.

Persist the last selected child context as a non-secret, parent-account-scoped identifier. On background/relaunch, dispose both hosts and restore the child context or show a parent-unlock boundary. **Never resume directly into the parent's collection while the device was being used in child mode.** Returning to parent mode requires the parent's existing PIN/recovery policy. Do not keep an unsubmitted PIN, approving proof or private child form in unprotected preferences.

Revoked/unavailable child access must fail closed into the parent-unlock boundary. Language changes, notifications and deep links must not silently switch the acting account. Forget-device cleanup must clear context markers along with the parent's existing protected access.

## Regression gate

Use the actual account controller/store with injected SDK/session boundaries, as the existing account suite does. Add deterministic cases for:

- Guardian-only membership cannot become a switchable child host.
- Root/child identity mismatch and stale profile-manager results.
- Failed, canceled and correct parent PIN return.
- Child → background → resume and child → process termination → relaunch, with no parent-data flash.
- Revocation during initialization, load, app consent or delivery.
- Sign-out/forget while child initialization or creation is pending.
- Partial bootstrap, lost replies, same operation retry, and changed-input refusal.
- App identity/consent and credential sharing use the selected child's scoped records; guardian-required actions stay gated.

Follow with an opt-in disposable staging exchange and physical-device verification. Do not use the recovered review account to create real child identities automatically.
