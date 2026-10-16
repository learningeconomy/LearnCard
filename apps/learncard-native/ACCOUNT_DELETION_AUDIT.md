# Staging account reset and deletion audit

October 16, 2026. The user explicitly authorized resetting the current dedicated staging test account and reusing its email, **keeping the shared Firebase login**. The native reset clears the staging personal index, network profile and account recovery record. This is an experimental staging flow, not a production account-deletion feature or a claim of erasing every stored object. Live results are recorded below.

## Existing source behavior

Web `DeleteUserConfirmationPrompt.tsx` requires the user to type their email/phone. For Firebase accounts it calls `adapter.deleteAccount()` first, then `removeAllVCsFromWallet()`, then network `deleteProfile()`. Firebase's adapter uses `deleteUser`; a recent-login requirement can force reauthentication. At the start of this audit, native account management had sign-out/forget and web recovery management. The staging-only reset described below is now implemented; general production account deletion remains separate.

The account's sign-in project is shared `learncard`, even though the network, LearnCloud and account-key endpoints are staging-specific. Removing that Firebase login can affect sign-in in other environments. The selected native reset never calls Firebase identity deletion or sign-out; its transport refuses the Firebase identity-management host.

The inspected web removal helper clears SQLite/LearnCloud indexes; it is not evidence that every encrypted storage object or credential held by other recipients is erased. The network profile route deletes the current profile and DID document. The inspected UI path does not invoke the separate SSS key deletion route. Avoid presenting these operations as atomic full data erasure.

## Additional backend contract

LCA `keys.deleteUserKey` (`POST /api/keys/delete` on the staging account API) requires a Firebase auth token/provider plus DID/challenge authorization and verifies ownership of the stored primary DID. The adapter first obtains `/api/keys/challenge`, signs its fresh challenge, then deletes. It deletes the matching UserKey record, including its versions/recovery metadata in that record. The old standalone SSS key-manager deletion API is deprecated and deliberately throws; use the authenticated current contract rather than weakening it. Both current deployed paths were verified against staging's public OpenAPI schema.

A robust native reset must bind every step to the same verified Firebase UID and signing identity, preserve a protected operation receipt, reconcile lost responses before retrying, and retain a recoverable path after partial cleanup. Confirm cloud/index and profile cleanup before deleting the recovery record that enables resumed access. Clear only that account's local shares/progress after verified completion. Do not auto-claim or grant app permissions when signup restarts.

Keeping the same Firebase login also retains its original creation timestamp. The coordinator's five-minute legacy heuristic will not by itself treat it as a new signup. A UID-scoped Keychain receipt records collection → profile → recovery → local cleanup. Each destructive reply is reconciled against fresh server state before advancing. Local completion clears this UID's primary/pending access and old signup journal, writes a fresh-setup marker, then removes the receipt last. The native controller disposes the old SDK host before reconnecting the same Firebase user. An interrupted reset blocks Collection, requires explicit Continue reset, and can offer existing recovery when local access is missing. Nothing resumes destructive cleanup merely on launch.

Reset authorization uses a separate seed-only `did:key` signer. The connected network wallet defaults to its profile `did:web`, whose document disappears during cleanup; using it for the final recovery deletion would fail. Real SDK JWT generation and independent signature verification cover the seed signer and fresh nonce.

Network `getProfile()` caches its result, so reset reconciliation uses an authenticated brain client query rather than that cached SDK method. Server status with an existing record but no primary identity is refused, not interpreted as absence. Bulk `index.removeAll` clears only the authenticated DID, while reads include associated DIDs. The native adapter therefore removes owned record IDs in bounded batches, rereading the first page after each batch without stale cursors, and requires a verified empty read before proceeding. Lost/failed calls retain the receipt for explicit continuation.

Index deletion does not erase all payload objects, sent copies, legacy preferences associated with the old identity, or other environments. This is a staged operation; simultaneous writes from other devices are not an atomic transaction.

## Implementation and live status

Account → Reset staging account requires the currently verified email. Scope and retention are explained before the destructive action. Confirmation, progress, retry and errors are translated into English, Spanish, French and Arabic. The domain rejects foreign receipts, identity changes, concurrent operations and stale completions; lifecycle guards close the old account before cleanup begins.

The first live attempt saved protected progress but stopped at collection verification. After installing the associated-identity cleanup correction, the user pressed Continue reset while unlocking the Mac (and subsequently reported its unreadable button label). The app reached native first-time setup. The user then completed setup and encrypted-backup export/confirmation directly in the app and reached Collection. The agent verified the new staging profile, the retained selected sign-in email and saved access on this device. This is a newly created LearnCard profile using the retained Firebase login; it does not validate creating a brand-new Firebase identity.

The user also reported that Continue reset was unreadable (navy text on navy fill). Its label/fill now use the explicit adaptive primary color pair, with light/dark visual and interaction coverage. Home replaces Collection as the initial destination after successful setup; Home is first in the navigation tray.

Independent public DID-document reads return HTTP 200 with the expected identity and verification methods for the new profile, and HTTP 404 for the former profile. This confirms network-profile replacement outside the native app. It does not establish full staging-web UI parity or successful backup restoration on another device.

Independent saved-backup recovery on a second device, staging-web profile parity and real guardian delivery/approval remain unverified. Keep passwords, codes and backup contents out of chat/logs. See [TESTING](TESTING.md) for completed evidence and validation boundaries.

## Live validation still needed

Reset and required setup completed using the retained verified login. Verify final-build relaunch, staging-web identity/profile parity and backup recovery on a separate disposable device. Real guardian delivery/approval is a separate test identity/path. Keep passwords, codes and recovery files out of chat/logs.

## Sources

- `apps/learn-card-app/src/components/userOptions/DeleteUserConfirmationPrompt.tsx`
- `packages/learn-card-base/src/auth-adapters/createFirebaseSignInAdapter.ts`
- `packages/learn-card-base/src/hooks/useWallet.ts` (`removeAllVCsFromWallet`)
- `services/learn-card-network/brain-service/src/routes/profiles.ts` (`deleteProfile`)
- `services/learn-card-network/lca-api/src/routes/keys.ts` (`deleteUserKey`)
- `services/learn-card-network/lca-api/src/models/UserKey.ts` (`deleteUserKeyByAuthProvider`)
- `packages/sss-key-manager/src/api-client.ts` (deprecated deletion refusal)
