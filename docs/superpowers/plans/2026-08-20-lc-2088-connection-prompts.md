# LC-2088 Connection Prompts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prompt both credential claim participants to connect, and create an immediate mutual connection only when one of them explicitly chooses Connect.

**Architecture:** A directed `CONNECTION_PROMPT` relationship in Neo4j is the durable source of truth for each viewer/counterpart pair. Every successful direct, claim-link, or inbox claim calls one best-effort post-claim helper, while authenticated profile routes expose pending/status/skip/connect operations through the existing types → brain client → network plugin flow. Shared React Query hooks and prompt components drive the claimer modal and actionable sender notification in LearnCard App and ScoutPass.

**Tech Stack:** TypeScript, Zod, Neo4j/Neogma, tRPC, LearnCard plugin methods, React, TanStack Query, Vitest, Jest, Ionic app modal surfaces, Paraglide localization.

**Spec:** `docs/superpowers/specs/2026-08-20-lc-2088-connection-prompts-design.md`

## Global Constraints

-   LC-2088 prompt creation never creates a connection by itself; existing separately configured boost auto-connect behavior remains unchanged.
-   Connect from this prompt immediately creates the established mutual `CONNECTED_WITH` relationship by calling `connectProfiles(viewer, counterpart, false)`.
-   Prompt state is directed. One participant skipping does not dismiss the other participant's prompt.
-   **Skip for Now** dismisses one prompt instance across navigation, reload, and sign-in. A later distinct successful claim may create a new instance; there is no TTL and no permanent pair-level opt-out.
-   Every prompt action is authorized by the authenticated viewer plus `promptId`; clients never authorize with a counterpart identifier.
-   Self-issued, service/application, blocked, and already-connected pairs do not receive prompts.
-   Prompt persistence and notification delivery are best-effort follow-up work and must never turn a successful credential claim into a failure.
-   Reuse `BOOST_ACCEPTED` with typed `data.metadata.connectionPrompt`; legacy events without that metadata retain their current UI.
-   Implement both LearnCard App and ScoutPass, including all four locale catalogs (`en`, `es`, `fr`, `ar`).
-   Use `AppModal` through `useModal`; do not add raw `IonModal`, `useIonModal`, or modal-local safe-area code.
-   New UI uses `font-poppins`, grayscale/emerald/red design tokens, `rounded-[20px]` buttons, contextual loading text, and friendly errors.
-   Work test-first and commit after every task. Run brain-service tests with the repository's documented example `SEED`.

---

## File Structure

### New files

-   `services/learn-card-network/brain-service/src/helpers/connectionPrompt.helpers.ts` — all graph-backed prompt creation, lookup, compare-and-set actions, and best-effort post-claim orchestration.
-   `services/learn-card-network/brain-service/test/connection-prompts.spec.ts` — prompt state-machine and authenticated route coverage.
-   `packages/learn-card-base/src/react-query/connectionPrompts.ts` — shared pending/status queries and skip/connect mutations.
-   `packages/learn-card-base/src/components/connection-prompts/ConnectionPromptModal.tsx` — focused post-claim modal content and action states.
-   `packages/learn-card-base/src/components/connection-prompts/ConnectionPromptCoordinator.tsx` — app-shell queue/presentation lifecycle.
-   `packages/learn-card-base/src/components/connection-prompts/ConnectionPromptNotificationCard.tsx` — shared actionable sender card.
-   `packages/learn-card-base/src/components/connection-prompts/*.test.tsx` — modal, coordinator, and notification behavior.
-   `apps/learn-card-app/src/components/notifications/notificationsV2/NotificationCardContainer.connectionPrompt.test.tsx` — LearnCard notification routing regression.
-   `apps/scouts/src/components/notifications/notificationsV2/NotificationCardContainer.connectionPrompt.spec.tsx` — ScoutPass notification routing regression.
-   `.changeset/lc-2088-connection-prompts.md` — package release note.

### Existing files

-   `packages/learn-card-types/src/lcn.ts` — public prompt validators and notification metadata validator.
-   `services/learn-card-network/brain-service/src/models/Profile.ts` — directed relationship declaration.
-   `services/learn-card-network/brain-service/src/helpers/connection.helpers.ts` — resolve current prompts when a pair connects or blocks through any pathway.
-   `services/learn-card-network/brain-service/src/routes/profiles.ts` — authenticated prompt procedures.
-   `services/learn-card-network/brain-service/src/helpers/credential.helpers.ts` — direct and boost-link claim integration.
-   `services/learn-card-network/brain-service/src/helpers/finalize-inbox.helpers.ts` — verified-contact finalization integration.
-   `services/learn-card-network/brain-service/src/routes/workflows.ts` — universal inbox exchange integration.
-   `services/learn-card-network/brain-service/src/helpers/notificationMessages.ts` and test — localized actionable claim message.
-   `services/learn-card-network/brain-service/test/credentials.spec.ts`, `boosts.spec.ts`, and `inbox.spec.ts` — claim-path regressions.
-   `packages/plugins/learn-card-network/src/types.ts`, `plugin.ts`, and `src/test/index.test.ts` — wallet invocation plumbing.
-   `packages/learn-card-base/src/react-query/mutations/mutations.ts` — direct-accept prompt invalidation.
-   `packages/learn-card-base/src/react-query/mutations/notifications.ts` — typed/optimistic `actionStatus` updates.
-   `packages/learn-card-base/src/index.ts` — shared exports.
-   `apps/learn-card-app/src/components/boost/mutations.ts`, `apps/scouts/src/components/boost/mutations.ts`, and `apps/learn-card-app/src/hooks/useFinalizeInboxCredentials.ts` — post-storage prompt invalidation.
-   Both apps' `FullApp.tsx` — coordinator mount.
-   Both apps' `NotificationCardContainer.tsx` — actionable metadata branch.
-   Both apps' four `public/locales/*/translation.json` files — prompt copy.

---

### Task 1: Prompt Contracts and Graph State Machine

**Files:**

-   Modify: `packages/learn-card-types/src/lcn.ts:90-150, 900-990`
-   Modify: `services/learn-card-network/brain-service/src/models/Profile.ts:25-70, 115-145`
-   Modify: `services/learn-card-network/brain-service/src/helpers/connection.helpers.ts:285-370, 600-660`
-   Create: `services/learn-card-network/brain-service/src/helpers/connectionPrompt.helpers.ts`
-   Create: `services/learn-card-network/brain-service/test/connection-prompts.spec.ts`

**Interfaces:**

-   Produces public types `LCNConnectionPrompt`, `LCNConnectionPromptStatus`, `LCNConnectionPromptSurface`, `LCNConnectionPromptActionResult`, and `LCNConnectionPromptMetadata`.
-   Produces `createConnectionPromptsForClaim`, `getPendingConnectionPrompts`, `getConnectionPromptStatus`, `skipConnectionPrompt`, and `connectWithConnectionPrompt` for later routes and claim integrations.

-   [ ] **Step 1: Add failing state-machine tests**

Create test cases with the existing `getUser`/Neo4j test setup proving:

```ts
it('creates independent claimer and sender prompts for one claim', async () => {
    const created = await createConnectionPromptsForClaim({
        claimer: userb.profile,
        sender: usera.profile,
        triggerId: 'credential:claim-1',
    });

    expect(created.claimerPrompt?.surface).toBe('POST_CLAIM');
    expect(created.senderPrompt?.surface).toBe('NOTIFICATION');
    expect(await getPendingConnectionPrompts(userb.profile)).toHaveLength(1);
    expect(await getPendingConnectionPrompts(usera.profile)).toHaveLength(1);
});

it('does not reopen a skipped prompt for the same trigger but reopens for a later claim', async () => {
    const first = await createConnectionPromptsForClaim({
        claimer: userb.profile,
        sender: usera.profile,
        triggerId: 'credential:claim-1',
    });
    await skipConnectionPrompt(userb.profile, first.claimerPrompt!.promptId);

    await createConnectionPromptsForClaim({
        claimer: userb.profile,
        sender: usera.profile,
        triggerId: 'credential:claim-1',
    });
    expect(await getPendingConnectionPrompts(userb.profile)).toHaveLength(0);

    const later = await createConnectionPromptsForClaim({
        claimer: userb.profile,
        sender: usera.profile,
        triggerId: 'credential:claim-2',
    });
    expect(later.claimerPrompt?.promptId).not.toBe(first.claimerPrompt?.promptId);
});
```

Also cover: one participant skipping leaves the other pending; repeated creation while pending keeps
the original `promptId`; self, service-profile, blocked, and connected pairs create nothing; old
`promptId` reports `STALE` after a later claim; Connect and Skip compare-and-set so only one terminal
action wins. Prove an ordinary connection resolves both directed prompts, blocking a pair skips both
current prompts, and neither an ordinary disconnect nor unblock resurfaces the old instance without
a new claim.

-   [ ] **Step 2: Run the new test and confirm the missing-module failure**

Run:

```bash
SEED=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
    bun run test -- run test/connection-prompts.spec.ts
```

Expected: FAIL because the prompt helper and public validators do not exist.

-   [ ] **Step 3: Define public validators and the relationship contract**

Add these exact public shapes to `lcn.ts`:

```ts
export const LCNConnectionPromptStatusValidator = z.enum(['PENDING', 'SKIPPED', 'CONNECTED']);
export const LCNConnectionPromptSurfaceValidator = z.enum(['POST_CLAIM', 'NOTIFICATION']);
export const LCNConnectionPromptActionStatusValidator = z.enum([
    'PENDING',
    'SKIPPED',
    'CONNECTED',
    'STALE',
]);

export const LCNConnectionPromptValidator = z.object({
    promptId: z.string().uuid(),
    status: LCNConnectionPromptStatusValidator,
    surface: LCNConnectionPromptSurfaceValidator,
    triggerId: z.string(),
    triggeredAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    counterpart: LCNPublicProfileValidator,
});

export const LCNConnectionPromptActionResultValidator = z.object({
    promptId: z.string().uuid(),
    status: LCNConnectionPromptActionStatusValidator,
});

export const LCNConnectionPromptMetadataValidator = z.object({
    promptId: z.string().uuid(),
    counterpartProfileId: z.string(),
});

export const LCNNotificationMetadataValidator = z
    .object({
        connectionPrompt: LCNConnectionPromptMetadataValidator.optional(),
    })
    .catchall(z.unknown());
```

Export the matching `z.infer` types and use `LCNNotificationMetadataValidator` for
`LCNNotificationDataValidator.metadata` instead of the untyped record. Add `connectionPrompt` to
`ProfileRelationships` with relationship properties `promptId`, `status`, `triggerId`, `surface`,
`triggeredAt`, and `updatedAt`, then declare the outbound `CONNECTION_PROMPT` relationship in the
model.

-   [ ] **Step 4: Implement graph helpers with stable trigger and prompt identities**

Use parameterized `neogma.queryRunner.run` Cypher. Keep these exact signatures:

```ts
type CreateConnectionPromptsForClaimInput = {
    claimer: ProfileType;
    sender: ProfileType;
    triggerId: string;
    vcUris?: string[];
};

type PromptTransition = {
    promptId: string;
    surface: LCNConnectionPromptSurface;
    isNew: boolean;
};

export type ConnectionPromptCreationResult = {
    claimerPrompt?: PromptTransition;
    senderPrompt?: PromptTransition;
};

export declare const createConnectionPromptsForClaim: (
    input: CreateConnectionPromptsForClaimInput
) => Promise<ConnectionPromptCreationResult>;

export declare const getPendingConnectionPrompts: (
    viewer: ProfileType
) => Promise<LCNConnectionPrompt[]>;

export declare const getConnectionPromptStatus: (
    viewer: ProfileType,
    promptId: string
) => Promise<LCNConnectionPromptActionResult>;

export declare const skipConnectionPrompt: (
    viewer: ProfileType,
    promptId: string
) => Promise<LCNConnectionPromptActionResult>;

export declare const connectWithConnectionPrompt: (
    viewer: ProfileType,
    promptId: string
) => Promise<LCNConnectionPromptActionResult>;
```

The creation query must preserve an existing pending instance, preserve a same-trigger skipped
instance, and assign a new UUID only when no relationship exists or a different trigger reopens a
resolved instance. `getPendingConnectionPrompts` returns only `LCNPublicProfileValidator` fields for
the counterpart. Connect first conditionally consumes the authenticated viewer's matching pending
instance, rechecks `isRelationshipBlocked` and `areProfilesConnected`, calls
`connectProfiles(viewer, counterpart, false)`, and then marks both directed prompt records connected.
If connection creation throws before an edge exists, restore the consumed viewer prompt to pending;
if the edge exists, return `CONNECTED` despite a follow-up notification error.

Update `connectProfiles` so every successful connection pathway marks both current prompt directions
`CONNECTED`, including ordinary request acceptance. Update `blockProfile` so both current prompt
directions become `SKIPPED`. These updates prevent an old pending prompt from resurfacing after a
later disconnect or unblock.

-   [ ] **Step 5: Run the state-machine tests**

Run the command from Step 2. Expected: all connection-prompt tests PASS.

-   [ ] **Step 6: Commit the graph state machine**

```bash
git add packages/learn-card-types/src/lcn.ts \
    services/learn-card-network/brain-service/src/models/Profile.ts \
    services/learn-card-network/brain-service/src/helpers/connection.helpers.ts \
    services/learn-card-network/brain-service/src/helpers/connectionPrompt.helpers.ts \
    services/learn-card-network/brain-service/test/connection-prompts.spec.ts
git commit -m "feat(network): add credential claim connection prompt state"
```

---

### Task 2: Authenticated Routes and Network Plugin Methods

**Files:**

-   Modify: `services/learn-card-network/brain-service/src/routes/profiles.ts:1-80, 660-950`
-   Modify: `services/learn-card-network/brain-service/test/connection-prompts.spec.ts`
-   Modify: `packages/plugins/learn-card-network/src/types.ts:130-205`
-   Modify: `packages/plugins/learn-card-network/src/plugin.ts:740-810`
-   Modify: `packages/plugins/learn-card-network/src/test/index.test.ts`

**Interfaces:**

-   Consumes Task 1's validators and graph helpers.
-   Produces wallet methods:

    -   `getPendingConnectionPrompts(): Promise<LCNConnectionPrompt[]>`
    -   `getConnectionPromptStatus(promptId: string): Promise<LCNConnectionPromptActionResult>`
    -   `skipConnectionPrompt(promptId: string): Promise<LCNConnectionPromptActionResult>`
    -   `connectWithConnectionPrompt(promptId: string): Promise<LCNConnectionPromptActionResult>`

-   [ ] **Step 1: Add failing authenticated-route tests**

Exercise the tRPC clients rather than calling helpers directly:

```ts
const pending = await userb.clients.fullAuth.profile.pendingConnectionPrompts.query();
expect(pending[0]?.counterpart.profileId).toBe(usera.profile.profileId);

const skipped = await userb.clients.fullAuth.profile.skipConnectionPrompt.mutate({ promptId });
expect(skipped.status).toBe('SKIPPED');

const connected = await usera.clients.fullAuth.profile.connectWithConnectionPrompt.mutate({
    promptId: senderPromptId,
});
expect(connected.status).toBe('CONNECTED');
expect(await areProfilesConnected(usera.profile, userb.profile)).toBe(true);
```

Include tests that user A cannot act on user B's `promptId`, an overwritten old ID returns `STALE`,
and already-connected status returns `CONNECTED` without a second connection.

-   [ ] **Step 2: Run and confirm the missing-procedure failure**

Run the focused command from Task 1. Expected: FAIL because the profile procedures are absent.

-   [ ] **Step 3: Add four profile procedures**

Add `profileRoute` procedures with `connections:read` for pending/status and `connections:write` for
skip/connect. Use these input/output contracts:

```ts
pendingConnectionPrompts: profileRoute.input(z.void()).output(LCNConnectionPromptValidator.array());

connectionPromptStatus: profileRoute
    .input(z.object({ promptId: z.string().uuid() }))
    .output(LCNConnectionPromptActionResultValidator);

skipConnectionPrompt: profileRoute
    .input(z.object({ promptId: z.string().uuid() }))
    .output(LCNConnectionPromptActionResultValidator);

connectWithConnectionPrompt: profileRoute
    .input(z.object({ promptId: z.string().uuid() }))
    .output(LCNConnectionPromptActionResultValidator);
```

Each resolver passes only `ctx.user.profile` and `input.promptId` to the helper. Do not accept
`profileId` from the client.

-   [ ] **Step 4: Add network-plugin types and implementations**

Import the Task 1 public types into `types.ts`, add the four methods with the exact signatures above,
and implement each in `plugin.ts` after `await ensureUser()`:

```ts
getPendingConnectionPrompts: async _learnCard => {
    await ensureUser();
    return client.profile.pendingConnectionPrompts.query();
},
getConnectionPromptStatus: async (_learnCard, promptId) => {
    await ensureUser();
    return client.profile.connectionPromptStatus.query({ promptId });
},
skipConnectionPrompt: async (_learnCard, promptId) => {
    await ensureUser();
    return client.profile.skipConnectionPrompt.mutate({ promptId });
},
connectWithConnectionPrompt: async (_learnCard, promptId) => {
    await ensureUser();
    return client.profile.connectWithConnectionPrompt.mutate({ promptId });
},
```

Extend the existing mocked-client test to assert all four plugin methods call the matching tRPC
operation and run `ensureUser`.

-   [ ] **Step 5: Run route, plugin, and build verification**

```bash
SEED=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
    bun run test -- run test/connection-prompts.spec.ts test/profiles.spec.ts
bun --cwd packages/plugins/learn-card-network test -- --runInBand
bunx nx build network-plugin
```

Expected: all tests PASS and the network plugin build succeeds.

-   [ ] **Step 6: Commit the public API plumbing**

```bash
git add services/learn-card-network/brain-service/src/routes/profiles.ts \
    services/learn-card-network/brain-service/test/connection-prompts.spec.ts \
    packages/plugins/learn-card-network/src/types.ts \
    packages/plugins/learn-card-network/src/plugin.ts \
    packages/plugins/learn-card-network/src/test/index.test.ts
git commit -m "feat(network): expose connection prompt actions"
```

---

### Task 3: Direct and Claim-Link Post-Claim Integration

**Files:**

-   Modify: `services/learn-card-network/brain-service/src/helpers/connectionPrompt.helpers.ts`
-   Modify: `services/learn-card-network/brain-service/src/helpers/credential.helpers.ts:77-180`
-   Modify: `services/learn-card-network/brain-service/src/helpers/notificationMessages.ts`
-   Modify: `services/learn-card-network/brain-service/test/notificationMessages.spec.ts`
-   Modify: `services/learn-card-network/brain-service/test/credentials.spec.ts`
-   Modify: `services/learn-card-network/brain-service/test/boosts.spec.ts`

**Interfaces:**

-   Consumes Task 1 prompt creation.
-   Produces `handleConnectionPromptsForCredentialClaim(input): Promise<ConnectionPromptCreationResult>` as the single non-fatal claim integration seam.
-   Produces localized notification key `boostAcceptedConnect`.

-   [ ] **Step 1: Add failing direct-accept and claim-link tests**

Add credential tests proving that after `acceptCredential`:

```ts
expect(await userb.clients.fullAuth.profile.pendingConnectionPrompts.query()).toHaveLength(1);
expect(await usera.clients.fullAuth.profile.pendingConnectionPrompts.query()).toHaveLength(1);
expect(await areProfilesConnected(usera.profile, userb.profile)).toBe(false);
```

Read the test notification queue and assert exactly one `BOOST_ACCEPTED` contains:

```ts
expect(notification.data?.metadata?.connectionPrompt).toEqual({
    promptId: expect.any(String),
    counterpartProfileId: userb.profile.profileId,
});
```

Add cases for: `skipNotification: true` still sends the actionable event when a sender prompt is
eligible; ordinary non-actionable `BOOST_ACCEPTED` remains when no prompt is eligible; self-issued
acceptance creates no prompt; an injected prompt-helper failure still returns successful acceptance;
`claimBoostWithLink` creates both directions with `triggerId` derived from the accepted credential
URI; retrying an already-received credential can recover a failed prompt write but does not reopen a
same-trigger skipped prompt or duplicate a notification.

-   [ ] **Step 2: Run the focused tests and confirm no prompts are created**

```bash
SEED=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
    bun run test -- run test/credentials.spec.ts test/boosts.spec.ts \
    test/notificationMessages.spec.ts
```

Expected: new assertions FAIL while existing claim assertions remain green.

-   [ ] **Step 3: Add actionable localized server copy**

Add `boostAcceptedConnect` to all server notification catalogs with these exact values:

| Locale | Value                                                    |
| ------ | -------------------------------------------------------- |
| `en`   | `{name} claimed your credential — connect?`              |
| `es`   | `{name} reclamó tu credencial. ¿Conectar?`               |
| `fr`   | `{name} a réclamé votre justificatif — vous connecter ?` |
| `ar`   | `استلم {name} اعتمادك — هل تريد التواصل؟`                |

Extend `notificationMessages.spec.ts` to render the key for every supported locale and verify
interpolation. Do not alter `boostAccepted`, which remains the legacy fallback.

-   [ ] **Step 4: Add the best-effort orchestration helper**

Implement this exact boundary in `connectionPrompt.helpers.ts`:

```ts
export const handleConnectionPromptsForCredentialClaim = async (
    input: CreateConnectionPromptsForClaimInput & {
        vcUris?: string[];
    }
): Promise<ConnectionPromptCreationResult> => {
    try {
        const result = await createConnectionPromptsForClaim(input);

        if (result.senderPrompt?.isNew) {
            await addNotificationToQueue({
                type: LCNNotificationTypeEnumValidator.enum.BOOST_ACCEPTED,
                to: input.sender,
                from: input.claimer,
                message: getNotificationMessage(
                    'boostAcceptedConnect',
                    resolveRecipientLocale(input.sender),
                    { name: input.claimer.displayName }
                ),
                data: {
                    vcUris: input.vcUris,
                    metadata: {
                        connectionPrompt: {
                            promptId: result.senderPrompt.promptId,
                            counterpartProfileId: input.claimer.profileId,
                        },
                    },
                },
            });
        }

        return result;
    } catch (error) {
        console.error('Failed to create post-claim connection prompts', {
            claimerProfileId: input.claimer.profileId,
            senderProfileId: input.sender.profileId,
            triggerId: input.triggerId,
            error,
        });
        return {};
    }
};
```

Merge existing claim metadata into the notification metadata without allowing it to replace the
typed `connectionPrompt` object.

-   [ ] **Step 5: Invoke the helper from `acceptCredential`**

Refactor the idempotency branch so relationship creation, claim hooks, role assignment, automatic
boost-config connections, activity logging, and the ordinary notification still run only for a new
acceptance, while source resolution and the best-effort prompt helper also run on an
already-received retry. Call the helper with trigger ID `credential:${id}` and `vcUris: [uri]`. If
`senderPrompt?.isNew` is true, do not send the old ordinary event. If no actionable sender prompt was
created, the acceptance is new, and `options.skipNotification` is false, preserve the current
ordinary `BOOST_ACCEPTED`. This lets a client retry recover a failed prompt write without duplicating
claim side effects. Leave `ensureConnectionsForCredentialAcceptance` unchanged: its existing
boost-config auto-connect behavior is separate from LC-2088, and the new tests must prove ordinary
credential acceptance did not connect the pair.

-   [ ] **Step 6: Run the focused claim tests**

Run the Step 2 command. Expected: all focused tests PASS.

-   [ ] **Step 7: Commit direct and claim-link integration**

```bash
git add services/learn-card-network/brain-service/src/helpers/connectionPrompt.helpers.ts \
    services/learn-card-network/brain-service/src/helpers/credential.helpers.ts \
    services/learn-card-network/brain-service/src/helpers/notificationMessages.ts \
    services/learn-card-network/brain-service/test/notificationMessages.spec.ts \
    services/learn-card-network/brain-service/test/credentials.spec.ts \
    services/learn-card-network/brain-service/test/boosts.spec.ts
git commit -m "feat(network): create connection prompts after credential claims"
```

---

### Task 4: Universal Inbox and Signup Finalization Integration

**Files:**

-   Modify: `services/learn-card-network/brain-service/src/helpers/finalize-inbox.helpers.ts:40-210`
-   Modify: `services/learn-card-network/brain-service/src/routes/workflows.ts:570-755`
-   Modify: `services/learn-card-network/brain-service/test/inbox.spec.ts`

**Interfaces:**

-   Consumes Task 3's `handleConnectionPromptsForCredentialClaim`.
-   Makes inbox claim tokens and verified-contact finalization produce the same prompt state and sender notification as direct acceptance.

-   [ ] **Step 1: Add failing tests for both inbox completion paths**

Extend the existing workflow claim and `finalizeInboxCredentials` suites. For each path, issue from
user A to user B, successfully claim, then assert one pending prompt in each direction and no
connection. Add a multi-credential batch from the same sender and assert only one prompt per
direction. Add a credential from a second sender and assert the claimer has two prompts ordered by
`triggeredAt`. Add a DID-only holder case and verify no prompt is created until a LearnCard profile
exists.

-   [ ] **Step 2: Run the inbox suite and confirm the new assertions fail**

```bash
SEED=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
    bun run test -- run test/inbox.spec.ts
```

Expected: existing inbox tests PASS; new prompt assertions FAIL.

-   [ ] **Step 3: Integrate verified-contact finalization**

Immediately after `createClaimedRelationship` succeeds, and only when `senderProfile` exists, call:

```ts
await handleConnectionPromptsForCredentialClaim({
    claimer: profile,
    sender: senderProfile,
    triggerId: `inbox:${inboxCredential.id}`,
});
```

The helper already catches its own errors, so finalization counts and returned credentials remain
unchanged if prompt work fails.

-   [ ] **Step 4: Integrate the workflow exchange path**

Reuse the already-resolved `issuerProfileForActivity`. After the holder's claimed relationship is
created, call the helper only when both `holderProfile` and issuer profile exist:

```ts
await handleConnectionPromptsForCredentialClaim({
    claimer: holderProfile,
    sender: issuerProfileForActivity,
    triggerId: `inbox:${inboxCredential.id}`,
});
```

Resolve the issuer profile once per credential and reuse it for prompt, activity, and webhook work
rather than adding a third lookup.

-   [ ] **Step 5: Run inbox and focused claim regression tests**

```bash
SEED=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
    bun run test -- run test/inbox.spec.ts test/credentials.spec.ts \
    test/boosts.spec.ts test/connection-prompts.spec.ts
```

Expected: all suites PASS.

-   [ ] **Step 6: Commit inbox integrations**

```bash
git add services/learn-card-network/brain-service/src/helpers/finalize-inbox.helpers.ts \
    services/learn-card-network/brain-service/src/routes/workflows.ts \
    services/learn-card-network/brain-service/test/inbox.spec.ts
git commit -m "feat(network): prompt connections after inbox claims"
```

---

### Task 5: Shared React Query Prompt Data Layer

**Files:**

-   Create: `packages/learn-card-base/src/react-query/connectionPrompts.ts`
-   Create: `packages/learn-card-base/src/react-query/connectionPrompts.test.tsx`
-   Modify: `packages/learn-card-base/src/react-query/mutations/mutations.ts:130-160`
-   Modify: `packages/learn-card-base/src/react-query/mutations/notifications.ts:10-330`
-   Modify: `packages/learn-card-base/src/index.ts:260-290`
-   Modify: `apps/learn-card-app/src/components/boost/mutations.ts`
-   Modify: `apps/scouts/src/components/boost/mutations.ts`
-   Modify: `apps/learn-card-app/src/hooks/useFinalizeInboxCredentials.ts:50-165`

**Interfaces:**

-   Consumes Task 2 wallet invocation methods.
-   Produces query keys from `connectionPromptKeys`, `usePendingConnectionPrompts`, `useConnectionPromptStatus`, `useSkipConnectionPromptMutation`, and `useConnectWithConnectionPromptMutation`.

-   [ ] **Step 1: Add failing hook tests with a mocked wallet**

Use `QueryClientProvider` and mock `useWallet().initWallet()` to return Task 2's methods. Verify:

```ts
expect(wallet.invoke.getPendingConnectionPrompts).toHaveBeenCalledOnce();
expect(wallet.invoke.skipConnectionPrompt).toHaveBeenCalledWith(promptId);
expect(wallet.invoke.connectWithConnectionPrompt).toHaveBeenCalledWith(promptId);
expect(queryClient.getQueryState(connectionPromptKeys.pending(switchedDid))?.isInvalidated).toBe(
    true
);
```

Also prove the status query is disabled without a `promptId`, mutations invalidate connection and
prompt keys, and `useAcceptCredentialMutation` invalidates pending prompts after success.

-   [ ] **Step 2: Run the hook test and confirm missing exports**

```bash
bun --cwd packages/learn-card-base test -- src/react-query/connectionPrompts.test.tsx
```

Expected: FAIL because `connectionPrompts.ts` does not exist.

-   [ ] **Step 3: Implement shared query keys and hooks**

Use switched-DID-aware keys:

```ts
export const connectionPromptKeys = {
    all: ['connectionPrompts'] as const,
    pending: (did = '') => [...connectionPromptKeys.all, 'pending', did] as const,
    status: (did = '', promptId = '') =>
        [...connectionPromptKeys.all, 'status', did, promptId] as const,
};
```

`usePendingConnectionPrompts(enabled = true)` refetches on mount and window focus. Status has
`staleTime: 0`. Both mutations call the wallet plugin and invalidate `connectionPromptKeys.all`,
`connections`, `paginatedConnections`, and counterpart connection queries on settled success.

-   [ ] **Step 4: Centralize post-claim invalidation**

Add `queryClient` to `useAcceptCredentialMutation` and invalidate `connectionPromptKeys.all` in
`onSuccess`. Add the same invalidation after both apps' `useAddCredentialToWallet` succeeds, because
claim-link acceptance is complete before local credential storage. In
`useFinalizeInboxCredentials`, invalidate after `finalizeInboxCredentials()` returns, including the
zero-VC branch, so a previously stored credential can still surface its pending prompt.

-   [ ] **Step 5: Make notification `actionStatus` a typed optimistic update**

Extend the local notification metadata type:

```ts
type NotificationMeta = {
    archived?: boolean;
    read?: boolean;
    actionStatus?: 'PENDING' | 'COMPLETED' | 'REJECTED';
};
```

When `actionStatus` is supplied, update the matching item in every cached notification page in the
same `onMutate` pass that updates `read`, and preserve rollback snapshots. This removes the app-local
manual cache mutation requirement for the new card.

-   [ ] **Step 6: Run shared hook and notification mutation tests**

```bash
bun --cwd packages/learn-card-base test -- \
    src/react-query/connectionPrompts.test.tsx \
    src/react-query/mutations/notifications.test.tsx
```

Expected: all tests PASS.

-   [ ] **Step 7: Commit the shared data layer**

```bash
git add packages/learn-card-base/src/react-query/connectionPrompts.ts \
    packages/learn-card-base/src/react-query/connectionPrompts.test.tsx \
    packages/learn-card-base/src/react-query/mutations/mutations.ts \
    packages/learn-card-base/src/react-query/mutations/notifications.ts \
    packages/learn-card-base/src/index.ts \
    apps/learn-card-app/src/components/boost/mutations.ts \
    apps/scouts/src/components/boost/mutations.ts \
    apps/learn-card-app/src/hooks/useFinalizeInboxCredentials.ts
git commit -m "feat(app): add connection prompt query hooks"
```

---

### Task 6: Claimer Modal, Queue Coordinator, and App-Shell Mounts

**Files:**

-   Create: `packages/learn-card-base/src/components/connection-prompts/ConnectionPromptModal.tsx`
-   Create: `packages/learn-card-base/src/components/connection-prompts/ConnectionPromptModal.test.tsx`
-   Create: `packages/learn-card-base/src/components/connection-prompts/ConnectionPromptCoordinator.tsx`
-   Create: `packages/learn-card-base/src/components/connection-prompts/ConnectionPromptCoordinator.test.tsx`
-   Modify: `packages/learn-card-base/src/index.ts`
-   Modify: `apps/learn-card-app/src/FullApp.tsx:200-235`
-   Modify: `apps/scouts/src/FullApp.tsx:115-135`
-   Modify: both apps' `public/locales/{en,es,fr,ar}/translation.json`

**Interfaces:**

-   Consumes Task 5 hooks.
-   Produces `ConnectionPromptCoordinator` with localized copy props:

```ts
type ConnectionPromptCopy = {
    title: (name: string) => string;
    description: string;
    connect: string;
    skipForNow: string;
    connecting: string;
    skipping: string;
    error: string;
};
```

-   [ ] **Step 1: Add failing pure modal tests**

Render a prompt with counterpart `Alice` and assert `Connect with Alice?`, Connect, and Skip for Now.
Click Connect and verify `onConnect(promptId)` is called once, the button shows `Connecting...`, and
a rejected promise renders `Something went wrong. Please try again.` while keeping the modal open.
Click Skip and verify `onSkip(promptId)` and `Skipping...`. Assert all buttons use
`rounded-[20px]`, primary uses `bg-grayscale-900`, and the container contains no safe-area tokens.

-   [ ] **Step 2: Add failing coordinator lifecycle tests**

With `ModalsProvider` and mocked prompt hooks, prove:

-   No modal appears while another modal is open.
-   The oldest prompt appears after the existing modal closes.
-   Native X/backdrop close calls Skip once.
-   Connect sets the resolved guard before closing, so `onClose` does not also Skip.
-   Two different counterparts appear sequentially, while one pair appears once.
-   Presenting a prompt calls `dismissToast()` so the feedback toast does not compete.
-   Logging out or changing switched profile clears the active prompt ref.

-   [ ] **Step 3: Run and confirm the missing-component failures**

```bash
bun --cwd packages/learn-card-base test -- \
    src/components/connection-prompts/ConnectionPromptModal.test.tsx \
    src/components/connection-prompts/ConnectionPromptCoordinator.test.tsx
```

Expected: FAIL because both components are absent.

-   [ ] **Step 4: Implement the focused modal UI**

The component takes `prompt`, `copy`, `onConnect`, and `onSkip`. It owns only loading/error state.
Use `UserProfilePicture` for the counterpart and native buttons:

```tsx
<button
    type="button"
    disabled={busy}
    className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
>
    {connecting ? copy.connecting : copy.connect}
</button>
<button
    type="button"
    disabled={busy}
    className="py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
>
    {skipping ? copy.skipping : copy.skipForNow}
</button>
```

Use the standard red error banner and never render raw backend messages.

-   [ ] **Step 5: Implement coordinator presentation and dismissal semantics**

Read `useModalsContext().modals` and present only when the stack is empty. Keep `activePromptIdRef` and
`resolvedRef`. Defer `newModal` by 150 ms so a just-closed claim surface finishes its Ionic exit.
Before opening, call `dismissToast()`. Use a centered `useModal` surface with `onClose`:

```ts
onClose: () => {
    if (!resolvedRef.current) {
        skipPrompt({ promptId: prompt.promptId });
    }
    activePromptIdRef.current = null;
};
```

Explicit Connect/Skip await their mutation, set `resolvedRef.current = true`, then call `closeModal()`.
Mutation invalidation supplies the next queue item after the 300 ms close transition.

-   [ ] **Step 6: Add localized copy and mount both coordinators**

Add these exact keys and values in both apps; keep `{name}` unchanged as the interpolation token:

| Key                             | English                                        | Spanish                                                 | French                                           | Arabic                                  |
| ------------------------------- | ---------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------ | --------------------------------------- |
| `connectionPrompts.title`       | `Connect with {name}?`                         | `¿Conectar con {name}?`                                 | `Se connecter avec {name} ?`                     | `هل تريد التواصل مع {name}؟`            |
| `connectionPrompts.description` | `Stay in touch and recognize what comes next.` | `Mantente en contacto y reconoce lo que viene después.` | `Restez en contact et valorisez la suite.`       | `ابقَ على تواصل وتابع ما يأتي بعد ذلك.` |
| `connectionPrompts.connect`     | `Connect`                                      | `Conectar`                                              | `Se connecter`                                   | `تواصل`                                 |
| `connectionPrompts.skipForNow`  | `Skip for Now`                                 | `Omitir por ahora`                                      | `Ignorer pour le moment`                         | `تخطي الآن`                             |
| `connectionPrompts.connecting`  | `Connecting...`                                | `Conectando...`                                         | `Connexion...`                                   | `جارٍ التواصل...`                       |
| `connectionPrompts.skipping`    | `Skipping...`                                  | `Omitiendo...`                                          | `Ignorer...`                                     | `جارٍ التخطي...`                        |
| `connectionPrompts.error`       | `Something went wrong. Please try again.`      | `Algo salió mal. Inténtalo de nuevo.`                   | `Une erreur s'est produite. Veuillez réessayer.` | `حدث خطأ ما. يرجى المحاولة مرة أخرى.`   |
| `connectionPrompts.connected`   | `Connected`                                    | `Conectado`                                             | `Connecté`                                       | `تم التواصل`                            |
| `connectionPrompts.skipped`     | `Skipped`                                      | `Omitido`                                               | `Ignoré`                                         | `تم التخطي`                             |
| `connectionPrompts.claimedType` | `Credential claimed`                           | `Credencial reclamada`                                  | `Justificatif réclamé`                           | `تم استلام الاعتماد`                    |

Pass the copy from each app's Paraglide `m` object. Mount the coordinator inside `ModalsProvider`,
beside the existing app-level listeners and before `AppRouter`, in both `FullApp.tsx` files.

-   [ ] **Step 7: Run component and localization checks**

```bash
bun --cwd packages/learn-card-base test -- src/components/connection-prompts
bun --cwd apps/learn-card-app run i18n:check-keys
bun --cwd apps/scouts run i18n:check-keys
bun --cwd apps/scouts run i18n:check-parity
```

Expected: component tests and all catalog checks PASS.

-   [ ] **Step 8: Commit the claimer experience**

```bash
git add packages/learn-card-base/src/components/connection-prompts \
    packages/learn-card-base/src/index.ts \
    apps/learn-card-app/src/FullApp.tsx apps/scouts/src/FullApp.tsx \
    apps/learn-card-app/public/locales apps/scouts/public/locales
git commit -m "feat(app): show post-claim connection prompt"
```

---

### Task 7: Actionable Sender Notification in Both Apps

**Files:**

-   Create: `packages/learn-card-base/src/components/connection-prompts/ConnectionPromptNotificationCard.tsx`
-   Create: `packages/learn-card-base/src/components/connection-prompts/ConnectionPromptNotificationCard.test.tsx`
-   Modify: `packages/learn-card-base/src/index.ts`
-   Modify: `apps/learn-card-app/src/components/notifications/notificationsV2/NotificationCardContainer.tsx:1-250`
-   Create: `apps/learn-card-app/src/components/notifications/notificationsV2/NotificationCardContainer.connectionPrompt.test.tsx`
-   Modify: `apps/scouts/src/components/notifications/notificationsV2/NotificationCardContainer.tsx:1-240`
-   Create: `apps/scouts/src/components/notifications/notificationsV2/NotificationCardContainer.connectionPrompt.spec.tsx`

**Interfaces:**

-   Consumes Task 5 prompt status/actions and notification-meta mutation.
-   Consumes Task 6 localized copy.
-   Produces one shared actionable card selected only when `BOOST_ACCEPTED` contains valid `LCNConnectionPromptMetadata`.

-   [ ] **Step 1: Add failing shared-card behavior tests**

Render with a pending status and assert the sender message, Connect, and Skip for Now. Verify Connect
calls `connectWithConnectionPrompt(promptId)` then updates notification metadata to
`{ actionStatus: 'COMPLETED', read: true }`. Verify Skip calls `skipConnectionPrompt(promptId)` then
uses `REJECTED`. Mock status as `CONNECTED` and assert the card is immediately non-actionable and
shows Connected; mock `SKIPPED` or `STALE` and show Skipped. Reject an action and assert the friendly
error plus enabled retry button.

-   [ ] **Step 2: Add failing container-routing tests in both apps**

Mock `ConnectionPromptNotificationCard` and `NotificationBoostCard`. Assert:

```ts
it('routes actionable BOOST_ACCEPTED metadata to the connection prompt card', () => {
    renderContainer(notificationWithConnectionPrompt);
    expect(screen.getByTestId('connection-prompt-notification')).toBeInTheDocument();
    expect(screen.queryByTestId('boost-notification')).not.toBeInTheDocument();
});

it('keeps legacy BOOST_ACCEPTED on the boost notification card', () => {
    renderContainer(legacyBoostAcceptedNotification);
    expect(screen.getByTestId('boost-notification')).toBeInTheDocument();
});
```

Also pass malformed metadata and verify the legacy fallback rather than throwing.

-   [ ] **Step 3: Run and confirm the new card is missing**

```bash
bun --cwd packages/learn-card-base test -- \
    src/components/connection-prompts/ConnectionPromptNotificationCard.test.tsx
bun --cwd apps/learn-card-app run test:unit -- \
    src/components/notifications/notificationsV2/NotificationCardContainer.connectionPrompt.test.tsx
bunx vitest run --config apps/scouts/vite.config.ts \
    apps/scouts/src/components/notifications/notificationsV2/NotificationCardContainer.connectionPrompt.spec.tsx
```

Expected: FAIL because the card and routing branch do not exist.

-   [ ] **Step 4: Implement the shared card**

Accept `notificationId`, `promptMetadata`, `counterpart`, `title`, `issueDate`, and localized copy.
Parse metadata with `LCNConnectionPromptMetadataValidator.safeParse` before this component is called.
Use `useConnectionPromptStatus(promptId)` to resolve stale cards. Use two textual pill buttons rather
than the legacy archive X so Skip for Now is explicit. Disable both buttons during an action and show
`Connecting...` or `Skipping...`. After a prompt mutation, await `useUpdateNotification`; a metadata
write failure is logged but does not revert a successful graph action.

-   [ ] **Step 5: Route actionable `BOOST_ACCEPTED` in both containers**

Before the current legacy branch:

```ts
const parsedPrompt = LCNConnectionPromptMetadataValidator.safeParse(
    notification.data?.metadata?.connectionPrompt
);

if (type === NOTIFICATION_TYPES.BOOST_ACCEPTED && parsedPrompt.success) {
    return (
        <ConnectionPromptNotificationCard
            notificationId={notification._id!}
            promptMetadata={parsedPrompt.data}
            counterpart={notification.from}
            title={message?.body ?? ''}
            issueDate={displayDate}
            copy={connectionPromptCopy}
        />
    );
}
```

Leave the existing `BOOST_ACCEPTED` → `NotificationBoostCard` branch immediately afterward. Remove no
legacy connection-request handling.

-   [ ] **Step 6: Run shared and app notification tests**

Run the Step 3 commands. Expected: all tests PASS.

-   [ ] **Step 7: Commit sender notification UI**

```bash
git add packages/learn-card-base/src/components/connection-prompts \
    packages/learn-card-base/src/index.ts \
    apps/learn-card-app/src/components/notifications/notificationsV2/NotificationCardContainer.tsx \
    apps/learn-card-app/src/components/notifications/notificationsV2/NotificationCardContainer.connectionPrompt.test.tsx \
    apps/scouts/src/components/notifications/notificationsV2/NotificationCardContainer.tsx \
    apps/scouts/src/components/notifications/notificationsV2/NotificationCardContainer.connectionPrompt.spec.tsx
git commit -m "feat(app): make claimed credential notifications actionable"
```

---

### Task 8: Release Metadata and Full Verification

**Files:**

-   Create: `.changeset/lc-2088-connection-prompts.md`
-   Modify only if verification exposes a defect: files already listed in Tasks 1-7 and their focused tests.

**Interfaces:**

-   Consumes the complete feature.
-   Produces a release-ready, verified branch with no uncommitted changes.

-   [ ] **Step 1: Add the package changeset**

Create exactly:

```markdown
---
'@learncard/types': patch
'@learncard/network-plugin': patch
'@learncard/network-brain-service': patch
---

Prompt credential claimers and senders to create an explicit LearnCard connection.
```

-   [ ] **Step 2: Run the complete affected backend suite**

```bash
SEED=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
    bun --cwd services/learn-card-network/brain-service run test -- run \
    test/connection-prompts.spec.ts test/credentials.spec.ts test/boosts.spec.ts \
    test/inbox.spec.ts test/profiles.spec.ts test/notificationMessages.spec.ts
```

Expected: all affected brain-service tests PASS.

-   [ ] **Step 3: Run shared package and app unit tests**

```bash
bun --cwd packages/learn-card-base test -- \
    src/react-query/connectionPrompts.test.tsx \
    src/react-query/mutations/notifications.test.tsx \
    src/components/connection-prompts
bun --cwd packages/plugins/learn-card-network test -- --runInBand
bun --cwd apps/learn-card-app run test:unit -- \
    src/components/notifications/notificationsV2/NotificationCardContainer.connectionPrompt.test.tsx
bunx vitest run --config apps/scouts/vite.config.ts \
    apps/scouts/src/components/notifications/notificationsV2/NotificationCardContainer.connectionPrompt.spec.tsx
```

Expected: all focused tests PASS.

-   [ ] **Step 4: Run type, localization, safe-area, and build checks**

```bash
bunx nx build types
bunx nx build network-plugin
bunx nx build learn-card-base
bun --cwd apps/learn-card-app run i18n:check-keys
bun --cwd apps/scouts run i18n:check-keys
bun --cwd apps/scouts run i18n:check-parity
node scripts/check-safe-area.mjs
bunx nx build learn-card-app
bunx nx build scouts
```

Expected: every command exits 0. Warnings already present on `main` may be recorded, but no new
warning or failure is accepted.

-   [ ] **Step 5: Perform targeted manual verification**

With two local profiles:

1. Send and claim a credential; confirm acceptance itself does not connect either profile.
2. Confirm the claimer sees `Connect with [sender]?` only after the claim surface closes.
3. Choose Skip for Now, reload, and confirm the same prompt does not return.
4. Claim a different credential from the same sender and confirm a new prompt appears.
5. From a fresh claim, use the sender notification's Connect action and confirm both connection lists update.
6. Confirm the other participant's pending modal/card becomes completed rather than remaining actionable.
7. Repeat through a claim link and verified-contact signup finalization.
8. Switch ScoutPass among English, Spanish, French, and Arabic; confirm copy and RTL layout remain readable.

-   [ ] **Step 6: Review the final diff for scope and generated artifacts**

```bash
git diff origin/main...HEAD --check
git status --short
git diff origin/main...HEAD --stat
```

Expected: no whitespace errors, no generated `src/paraglide` files, no secrets, and only LC-2088
files plus the design/plan documents.

-   [ ] **Step 7: Commit release metadata or verification fixes**

```bash
git add .changeset/lc-2088-connection-prompts.md
git commit -m "chore: add LC-2088 release note"
```

If verification required code fixes, commit each fix with its matching regression test before this
release-note commit.
