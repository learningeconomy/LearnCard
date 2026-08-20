# LC-2088 — Connection Prompts After Credential Claims — Design

-   **Jira:** [LC-2088](https://welibrary.atlassian.net/browse/LC-2088)
-   **Branch:** `codex/lc-2088-connection-prompts`
-   **Apps:** LearnCard App and ScoutPass
-   **Services:** LearnCard Network brain service and LCA notification API
-   **Date:** 2026-08-20

## Overview

After a person successfully claims a credential, LearnCard should invite both participants to
connect. The claimer sees a post-claim prompt for the sender. The sender sees an actionable version
of the existing credential-claimed notification. Choosing **Connect** creates the mutual connection
immediately through the established network connection model; accepting the credential itself never
creates a connection.

The Jira copy says **Skip for Now** but also describes a permanent dismissal for the pair. Product
clarification resolves that contradiction in favor of the label: skipping dismisses only the current
claim-triggered prompt. It stays dismissed across reloads and sign-ins, but a later successful
credential claim involving the same two people may create a fresh prompt. There is no time-based
cooldown and no lifetime "never ask about this person again" state.

## Goals

-   Prompt a claimer to connect with the credential sender after a successful direct, claim-link,
    or inbox/email claim.
-   Give the sender an actionable credential-claimed notification inviting them to connect with the
    claimer.
-   Create an immediate mutual connection only when either participant explicitly chooses
    **Connect**.
-   Persist prompt state per viewer and counterpart so reloads, retries, and duplicate deliveries do
    not reopen the same prompt.
-   Let a later successful claim create a new opportunity after **Skip for Now**.
-   Reuse the current connection graph and `BOOST_ACCEPTED` notification infrastructure where
    practical.
-   Keep prompt and notification failures non-fatal to credential claiming.

## Non-goals

-   Automatically connecting people when a credential is accepted.
-   Replacing the ordinary connection-request and approval workflow outside this prompt.
-   Adding a permanent pair-level opt-out or configurable cooldown.
-   Backfilling prompts for credentials claimed before deployment.
-   Prompting for self-issued credentials, blocked profiles, service/application issuers, or pairs
    that are already connected.
-   Redesigning the notification center beyond the new actionable claimed-credential state.

## Product semantics

### Participant independence

Prompt state is directed and belongs to the viewer. A claimer skipping their prompt does not dismiss
the sender's notification, and the sender skipping does not affect the claimer. Either participant
may connect while their own prompt is pending. A successful connection resolves prompt state for
both directions because no further action is useful once the pair is connected.

### Skip for Now

**Skip for Now** means:

1. Mark this prompt instance skipped in durable storage.
2. Do not reopen it after navigation, reload, or a later sign-in.
3. Do not reopen it merely because time passed.
4. If a different credential is successfully claimed later between the same pair, create a new
   prompt instance for any participant who is not already connected and has no pending prompt.

Closing the claimer modal through its close control or backdrop has the same effect as **Skip for
Now**. The close callback must guard against writing `SKIPPED` after a successful Connect action.

### Connect

**Connect** is an explicit authorization to connect immediately. The backend validates that the
prompt belongs to the authenticated profile and is still actionable, then uses the existing mutual
connection pathway (`connectProfiles(..., false)`). This is intentionally different from the normal
connection-request handshake.

## Current architecture

### Claim paths

There are three backend completion paths that must converge on the same post-claim behavior:

1. `acceptCredential` in `credential.helpers.ts` handles direct credential acceptance. Boost claim
   links eventually reach this helper through `issueClaimLinkBoost` and auto-acceptance.
2. The inbox exchange flow in `routes/workflows.ts` claims credentials presented through the
   universal inbox workflow.
3. `finalizeInboxCredentials` in `finalize-inbox.helpers.ts` signs and claims credentials after a
   verified contact is associated with a newly created or returning profile.

These paths currently create their received/claimed graph relationships and activity records
independently. The direct path also sends `BOOST_ACCEPTED` unless `skipNotification` is set; inbox
paths do not consistently produce the same sender notification.

### Connections

Profiles use mutual `CONNECTED_WITH` relationships. `connectProfiles(source, target, false)` creates
that relationship immediately, records the `manual` source, removes stale request relationships,
and sends the existing connection-accepted notification. Ordinary `requestConnection` remains the
handshake path for all unrelated UI.

### Notifications

`BOOST_ACCEPTED` already represents "this person claimed your credential" and is rendered by both
LearnCard App and ScoutPass. Adding actionable metadata to that event avoids a second claim event,
new push-notification copy plumbing, and a migration of existing cards. LCA notification
`actionStatus` remains presentation state; it is not authoritative prompt storage.

## Target architecture

### 1. Directed prompt relationship

Store one directed Neo4j relationship for each viewer/counterpart pair:

```text
(viewer:Profile)-[prompt:CONNECTION_PROMPT]->(counterpart:Profile)
```

The relationship contains:

| Property      | Meaning                                                                    |
| ------------- | -------------------------------------------------------------------------- |
| `promptId`    | UUID identifying the current prompt instance                               |
| `status`      | `PENDING`, `SKIPPED`, or `CONNECTED`                                       |
| `triggerId`   | Stable identifier for the claim event/credential that opened this instance |
| `surface`     | `POST_CLAIM` for the claimer or `NOTIFICATION` for the sender              |
| `triggeredAt` | Timestamp when the current instance became pending                         |
| `updatedAt`   | Timestamp of the latest state transition                                   |

Neo4j is the source of truth because eligibility and connection state already live in the profile
graph. Redis would make dismissal vulnerable to eviction and would not provide the durable,
per-viewer semantics required across sign-ins.

`promptId` is required on every action and in notification metadata. This prevents an old card or
late request from skipping or connecting a newer prompt instance for the same pair. `triggerId`
prevents a retried delivery of the same claim event from reopening an instance that was already
skipped.

### 2. Prompt state transitions

For a new successful claim from sender to claimer, a shared helper evaluates both directions:

```text
claimer --POST_CLAIM--> sender
sender  --NOTIFICATION--> claimer
```

For each direction independently:

-   If the pair is self-referential, blocked, ineligible, or currently connected, do not create a
    pending prompt.
-   If the relationship is already `PENDING`, keep its current `promptId`; multiple credentials in
    one batch must not stack duplicate prompts.
-   If it is `SKIPPED` with the same `triggerId`, keep it skipped because this is a retry.
-   If it is `SKIPPED` with a new `triggerId`, replace it with a new `promptId` and `PENDING` state.
-   If it is `CONNECTED` and the pair remains connected, do nothing. If they later disconnect, only
    a new successful claim may open a new instance.
-   If no relationship exists, create a new `PENDING` instance.

The helper returns which directions actually transitioned to a new pending instance. That result
drives notification creation and query invalidation without treating duplicate claims as new UI
work.

When one participant connects, the server calls the existing immediate mutual connection helper and
marks both directed prompt relationships `CONNECTED`. When one participant skips, only their
directed relationship becomes `SKIPPED`.

### 3. Shared post-claim helper

Add a best-effort helper invoked only after the credential claim relationship has been committed.
It receives the claimer, resolved sender profile, and stable claim trigger identifier. It:

1. Rejects self, service/application, blocked, and already-connected pairs.
2. Creates or refreshes the two directed prompt records according to the state machine.
3. Enqueues one actionable `BOOST_ACCEPTED` notification only when the sender-facing direction
   transitions to a new `PENDING` instance.
4. Returns prompt transition information for callers that can use it.

Direct acceptance should not emit both the current ordinary `BOOST_ACCEPTED` and the actionable
version. If an actionable sender prompt is created, it replaces the ordinary event. If the sender is
not eligible for a prompt, the current direct-accept notification behavior is preserved. Claim-link
and inbox claims may emit the actionable event even where their legacy path suppressed or omitted
the ordinary event, because LC-2088 explicitly requires the sender prompt for those claim methods.

Prompt setup and notification delivery must be wrapped as non-fatal follow-up work. A failure is
logged with the claim and participant identifiers, but the successful credential claim response is
not rolled back or changed to an error.

### 4. Brain-service API and SDK plumbing

Expose authenticated profile operations through the normal type flow (`@learncard/types` → brain
router → brain client → network plugin):

-   `getPendingConnectionPrompts` returns actionable prompts for the current profile, ordered oldest
    first, including the counterpart's safe public profile fields.
-   `skipConnectionPrompt({ promptId })` conditionally changes the authenticated viewer's matching
    `PENDING` instance to `SKIPPED`.
-   `connectWithConnectionPrompt({ promptId })` conditionally consumes the viewer's `PENDING`
    instance, rechecks block and connection state, creates the immediate mutual connection, and
    resolves both directions.

Prompt actions must be compare-and-set operations on both authenticated viewer and `promptId`.
Repeated skip/connect requests are idempotent. A stale prompt returns its current resolved state
rather than acting on a newer instance. Counterpart identifiers supplied by clients are never used
as authorization.

### 5. Actionable notification metadata

Reuse `BOOST_ACCEPTED` and add a typed metadata branch resembling:

```ts
connectionPrompt: {
    promptId: string;
    counterpartProfileId: string;
}
```

The notification card uses `promptId` to call the prompt APIs. It must query or rely on mutation
responses from the graph before showing actions, because notification `actionStatus` can be stale.
After Connect, mark the local notification `COMPLETED`; after Skip, mark it `REJECTED`. A card whose
pair was connected elsewhere renders completed/non-actionable. Legacy `BOOST_ACCEPTED` events
without this metadata keep their current appearance.

Duplicate webhook or push delivery can create duplicate notification documents, so the UI also
deduplicates the actionable presentation by `promptId`. The graph relationship remains the final
authority: duplicate cards become non-actionable after the first state transition.

## Frontend design

### Claimer prompt

Add a shared connection-prompt modal and query/mutation hooks in `learn-card-base`. LearnCard App and
ScoutPass each mount a small coordinator in their authenticated app shell. Claim completion
invalidates/refetches pending prompts, and the coordinator presents them after the credential claim
surface closes.

The modal copy is:

-   Heading: `Connect with [sender]?`
-   Primary action: `Connect`
-   Secondary action: `Skip for Now`

The primary action shows a contextual loading state, closes on success, refreshes connection and
prompt queries, and shows friendly non-technical errors without losing the pending prompt. The
secondary action persists `SKIPPED` before closing. Multiple eligible counterparts are presented
one at a time; multiple credentials from one sender result in one modal.

For claim surfaces that currently open the post-claim feedback toast, the connection prompt takes
precedence so users do not receive competing overlays. If no connection prompt is eligible, the
existing feedback behavior remains unchanged.

### Sender notification

Both apps adapt their existing `BOOST_ACCEPTED` notification card handling. When
`data.metadata.connectionPrompt` is present and pending, render the invitation copy and Connect / Skip
for Now actions. The Connect button calls the immediate prompt endpoint, not `requestConnection`.
Both actions show loading feedback and update notification and connection caches on success.

### Signup and inbox finalization

The global coordinator is also the post-signup surface. Once verified-contact inbox finalization
claims a credential and the user enters the authenticated app, its pending claimer prompt appears as
`Connect with [sender]?`. No special transient signup-only state is required, so an interrupted
signup can safely resume after login.

## Failure handling and concurrency

-   A claim succeeds even if prompt persistence or notification delivery fails.
-   Prompt APIs recheck blocked and connected state at action time, not only at creation time.
-   Concurrent Connect actions converge on the existing mutual connection relationship and resolve
    both prompt directions.
-   A concurrent Skip and Connect for one prompt uses conditional state updates; the first terminal
    transition wins, and the client refreshes the authoritative result.
-   A new claim cannot be modified by an old notification because every action includes `promptId`.
-   A batch claim may invoke post-claim processing more than once, but an existing `PENDING`
    relationship prevents duplicate prompts for the pair.
-   Notification delivery is at-least-once. Duplicate cards are harmless because prompt actions are
    idempotent and graph-backed.

## Testing strategy

Implementation follows test-driven development in these groups:

1. **Prompt model/helper tests:** directed independence, first creation, same-trigger retry,
   new-trigger reopening after skip, pending deduplication, self/blocked/connected exclusions, and
   resolution of both directions after connect.
2. **Claim-path tests:** direct accept, boost claim link, inbox workflow, and verified-contact
   finalization each create both eligible directions; acceptance alone never connects; prompt
   failures do not fail claims.
3. **API tests:** authentication, prompt ownership, stale `promptId`, idempotent Skip and Connect,
   immediate mutual connection, block race, and connection race.
4. **Notification tests:** one actionable `BOOST_ACCEPTED` per new sender prompt, no duplicate
   ordinary event, legacy non-actionable fallback, and prompt metadata validation.
5. **SDK tests:** new validators and network-plugin methods preserve the repository's type flow.
6. **UI tests:** claimer modal ordering, Skip persistence, Connect loading/error/success, close as
   skip, no competing feedback toast, sender notification actions, duplicate prompt deduplication,
   and stale notification rendering in both apps.

Focused backend verification starts with:

```bash
SEED=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
    bun run test -- run test/credentials.spec.ts test/inbox.spec.ts test/profiles.spec.ts
```

Then run the affected package tests, frontend tests, type checks, and production builds in proportion
to the final file set.

## Rollout and compatibility

-   No data migration is required; prompt relationships are created lazily for claims after
    deployment.
-   Older app versions continue to display `BOOST_ACCEPTED`; they ignore the extra metadata and do
    not expose prompt actions.
-   New app versions preserve the current card for notifications without prompt metadata.
-   Backend/API support should deploy before or with the first clients that render the actions.
-   Prompt creation and action outcomes should emit structured logs so eligibility exclusions,
    skips, connects, and failures can be measured during rollout.

## Key files and likely change areas

| Path                                                                                             | Responsibility                                       |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `packages/learn-card-types/src/lcn.ts`                                                           | Prompt validators, inputs, outputs, metadata         |
| `services/learn-card-network/brain-service/src/models/Profile.ts`                                | `CONNECTION_PROMPT` relationship model               |
| `services/learn-card-network/brain-service/src/helpers/connection.helpers.ts`                    | Prompt state and immediate connection integration    |
| `services/learn-card-network/brain-service/src/helpers/credential.helpers.ts`                    | Direct/claim-link post-claim integration             |
| `services/learn-card-network/brain-service/src/helpers/finalize-inbox.helpers.ts`                | Verified-contact finalization integration            |
| `services/learn-card-network/brain-service/src/routes/workflows.ts`                              | Inbox workflow integration                           |
| `services/learn-card-network/brain-service/src/routes/profiles.ts`                               | Authenticated prompt queries and mutations           |
| `packages/plugins/learn-card-network/src/types.ts`                                               | Network-plugin method types                          |
| `packages/plugins/learn-card-network/src/plugin.ts`                                              | Network-plugin prompt methods                        |
| `packages/learn-card-base/src/react-query/`                                                      | Shared prompt queries and mutations                  |
| `packages/learn-card-base/src/components/`                                                       | Shared claimer prompt UI                             |
| `apps/learn-card-app/src/components/notifications/notificationsV2/NotificationCardContainer.tsx` | LearnCard sender card handling                       |
| `apps/scouts/src/components/notifications/notificationsV2/NotificationCardContainer.tsx`         | ScoutPass sender card handling                       |
| `apps/learn-card-app/src/hooks/useFinalizeInboxCredentials.ts`                                   | Finalization query invalidation/presentation trigger |
| `apps/learn-card-app/src/pages/claimBoost/ClaimBoost.tsx`                                        | Claim-link presentation trigger                      |
| `apps/scouts/src/pages/claimBoost/ClaimBoost.tsx`                                                | ScoutPass claim-link presentation trigger            |
| `services/learn-card-network/brain-service/test/{credentials,inbox,profiles}.spec.ts`            | Backend integration coverage                         |

The implementation plan may refine exact component and test filenames after the failing tests are
placed, but it must preserve the state machine and product semantics in this design.
