# Native Inbox contracts

Inbox combines pending credential offers with connections and account updates. The native interface uses compact artwork/profile-led rows, category accents and explicit actions. The page retains the neutral canvas and shared account/action header.

## Sources and actions

| Item                                                    | Source                                                                    | Native action                                                     |
| ------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Credential offer                                        | Existing brain incoming credential query                                  | Review and add through the existing credential detail             |
| Incoming connection request / expired invitation notice | Active LCA notification plus fresh brain request/connection membership    | Accept, or Dismiss the notification                               |
| Accepted connection                                     | Active LCA notification                                                   | Read and dismiss                                                  |
| Connection suggestion                                   | Valid server prompt UUID in notification metadata or pending prompt query | Connect or Not now                                                |
| Other account update                                    | Active LCA notification                                                   | Read and dismiss; specialized follow-on workflows remain separate |

The staging LCA API is independent of the brain network client. `runtime.ts` creates a client for `https://staging.api.learncard.app/trpc` using the current account's challenge-bound authentication presentation. `StagingTransport` adds only `notifications.notifications` and `notifications.updateNotificationMeta` to its existing account-host allowlist. Production domains and arbitrary notification routes remain refused.

Notifications load 30 at a time, in reverse chronological order with `archived: false`. More updates uses the server-issued opaque cursor. Arrival notifications whose credential URIs match a pending offer are suppressed from the update list and badge. The badge counts loaded unread updates plus credential offers; it is not a total count across unloaded notification pages. Relationship pagination validates requests against the current account's full bounded membership query, and fails rather than accepting an incomplete view when a cursor is missing/repeated.

Dismiss matches the web notification action: archive/read metadata only. It does not reject, cancel or disconnect a relationship. Relationship queries do not synthesize new Inbox notices from pending requests, which would recreate previously archived notifications on refresh.

## Server-driven suggestions

The server owns whether and when to suggest a connection. The native app never derives suggestions from credential issuer names or identifiers. It deduplicates notification prompt UUIDs, and displays pending `POST_CLAIM` prompts in trigger-time/ID order after the credential sheet and success alert have closed. Connect and Not now call `connectWithConnectionPrompt` and `skipConnectionPrompt` explicitly. The sheet prevents gesture dismissal so a close cannot accidentally mutate a server prompt during backgrounding.

Each action rechecks `getConnectionPromptStatus`; resolved or stale prompts cannot send another connection. Successful terminal receipts suppress stale cached pending values. Notification metadata updates are best-effort after a relationship/prompt commits: failure does not undo a connection or cause repeat writes. The Inbox can report delayed notification synchronization.

Legacy/malformed prompt metadata keeps its ordinary notification type. It never becomes an actionable connection suggestion; ordinary requests still require fresh pending membership. Staging did:web sender strings resolve to the current request profile. Other-network identities cannot authorize a local action. Loaded notification IDs scope actions; unowned/unloaded identifiers are refused. The LCA endpoint additionally checks notification ownership.

## Account lifecycle and validation

`InboxStore` is account-owned. Background/sign-out locks clear its items, prompt queue, receipts and cursors; generation checks discard delayed reads and actions. Resuming creates a new store and fetches fresh server state. Mutation controls disable while an action is in progress.

Protocol tests inject SDK/API boundaries without contacting staging. Swift tests cover late replies after lock, duplicate taps, terminal receipt reconciliation, cursor rejection, sample-only post-claim prompts, localization and the exact transport allowlist. Simulator tests exercise actual request actions and explicit post-claim decisions in sample mode. No agent test sends a real connection request or accepts a real credential.

Live account notification/prompt actions, long histories, partner-specific notification variants and real server delivery still need dedicated staging validation. This slice does not implement push registration, a full connections directory, guardian approval, device-request decisions or every web notification destination. Those notices remain readable/dismissible without pretending their specialized actions are implemented.

## Landmarks

- `account-runtime/inbox.ts`: DTO validation, pagination, relationship reconciliation, prompt actions and metadata receipts.
- `ios/NativeCore/Sources/LearnCardNativeSDK/InboxService.swift`: native DTOs and live/sample service boundary.
- `ios/NativeCore/Sources/LearnCardNativeSDK/InboxStore.swift`: lifecycle and UI state.
- `ios/Sources/InboxActivityView.swift`, `ConnectionInboxRow.swift`: Inbox and prompt presentation.
- `ios/Sources/RootView.swift`: shared chrome, badge and modal coordination.
