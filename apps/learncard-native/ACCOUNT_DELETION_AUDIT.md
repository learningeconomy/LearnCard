# Staging account reset and deletion audit

October 16, 2026. During live first-time signup planning, the user authorized resetting the current dedicated staging account and reusing its email. **No deletion has run.** The scope choice between staging-only data reset and removing the shared Firebase login is pending. The native registration feature and its synthetic verification are complete independently.

## Existing source behavior

Web `DeleteUserConfirmationPrompt.tsx` requires the user to type their email/phone. For Firebase accounts it calls `adapter.deleteAccount()` first, then `removeAllVCsFromWallet()`, then network `deleteProfile()`. Firebase's adapter uses `deleteUser`; a recent-login requirement can force reauthentication. The native experiment currently has sign-out/forget and web recovery management, not a completed native deletion flow.

The account's sign-in project is shared `learncard`, even though the network, LearnCloud and account-key endpoints are staging-specific. Removing that Firebase login can affect sign-in in other environments. A staging-only reset must keep the shared login unless removing it is explicitly chosen.

The inspected web removal helper clears SQLite/LearnCloud indexes; it is not evidence that every encrypted storage object or credential held by other recipients is erased. The network profile route deletes the current profile and DID document. The inspected UI path does not invoke the separate SSS key deletion route. Avoid presenting these operations as atomic full data erasure.

## Additional backend contract

LCA `keys.deleteUserKey` (`POST /keys/delete`) requires a Firebase auth token/provider plus DID/challenge authorization and verifies ownership of the stored primary DID. It deletes the matching UserKey record, including its versions/recovery metadata in that record. The old standalone SSS key-manager deletion API is deprecated and deliberately throws; use the authenticated current contract rather than weakening it.

A robust native reset must bind every step to the same verified Firebase UID and signing identity, preserve a protected operation receipt, reconcile lost responses before retrying, and retain a recoverable path after partial cleanup. Confirm cloud/index and profile cleanup before deleting the recovery record that enables resumed access. Clear only that account's local shares/progress after verified completion. Do not auto-claim or grant app permissions when signup restarts.

Keeping the same Firebase login also retains its original creation timestamp. The coordinator's five-minute legacy heuristic will not by itself treat it as a new signup. A staging reset needs an explicit, protected, verified-reset handoff to required setup; it must not generalize into a bypass for older unknown accounts. Removing the shared Firebase login instead requires separate explicit scope and current login verification before destructive work.

## Live validation still needed

After the chosen cleanup completes, enter the emailed sign-in code directly in the native app, perform birth date/country/profile/privacy setup, save/confirm a real encrypted backup, and verify relaunch, staging-web identity/profile parity and backup recovery on a separate disposable device. Real guardian delivery/approval is a separate test identity/path. Keep passwords, codes and recovery files out of chat/logs.

## Sources

- `apps/learn-card-app/src/components/userOptions/DeleteUserConfirmationPrompt.tsx`
- `packages/learn-card-base/src/auth-adapters/createFirebaseSignInAdapter.ts`
- `packages/learn-card-base/src/hooks/useWallet.ts` (`removeAllVCsFromWallet`)
- `services/learn-card-network/brain-service/src/routes/profiles.ts` (`deleteProfile`)
- `services/learn-card-network/lca-api/src/routes/keys.ts` (`deleteUserKey`)
- `services/learn-card-network/lca-api/src/models/UserKey.ts` (`deleteUserKeyByAuthProvider`)
- `packages/sss-key-manager/src/api-client.ts` (deprecated deletion refusal)
