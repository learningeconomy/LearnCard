# LC-1950 ScoutPass Real Revocation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace ScoutPass recipient-list revocation inference with LearnCard's authoritative lifecycle system and make administrator removal revoke every credential instance for the selected Boost/profile pair.

**Architecture:** Move the existing LearnCard App lifecycle hook into `learn-card-base`, then give ScoutPass concrete credential-record URIs and a pure presentation adapter. Add a dedicated, idempotent `revokeBoostRecipientGroup` path from brain service through the network plugin and React Query, leaving the existing per-instance API unchanged. The server owns enumeration, Bitstring updates, cleanup hooks, partial-failure reporting, and consolidated notification delivery.

**Tech Stack:** TypeScript, React 18, TanStack React Query 5, tRPC 11, Zod 4, Neo4j/Neogma, Vitest, Bun test, Nx, Bitstring Status List.

## Global Constraints

-   Implement only the runtime cycle defined in `docs/superpowers/specs/2026-08-09-lc-1950-scoutpass-real-revocation-design.md`; pre-Bitstring reissuance, retirement/blocklist, and verifier cutover remain a separate follow-up.
-   Group removal must cover every active, pending, and suspended credential instance for the Boost/profile pair.
-   Keep revoked credentials visible; do not delete them from LearnCloud or the network index.
-   Never derive `revoked` from list absence, loading state, request failure, or verification failure.
-   Keep `revokeBoostRecipient(boostUri, recipientProfileId, credentialUri?)` and its latest-instance fallback behavior backward compatible.
-   A credential with a revocation entry is successful only after its Bitstring update and cleanup hooks succeed; a missing entry is logged as a migration gap and remains authoritatively revoked.
-   Retrying group removal must re-run idempotent Bitstring and cleanup work for already-revoked instances so partial failures can heal.
-   Do not modify the self-service `Leave` branch; it is outside this implementation.
-   Use four-space TypeScript/JSX indentation, named exports for new public APIs, explicit return types, friendly error copy, and existing ScoutPass design tokens.
-   Do not add dependencies.

## File Structure

### Shared lifecycle source

-   Create `packages/learn-card-base/src/hooks/deriveLifecycleStatus.ts` — pure mapping from verification output to `active`, `revoked`, or `suspended`.
-   Create `packages/learn-card-base/src/hooks/useCredentialStatus.ts` — authoritative holder query with Bitstring verification fallback and loading/error metadata.
-   Create `packages/learn-card-base/src/hooks/__tests__/deriveLifecycleStatus.test.ts` — pure lifecycle precedence tests.
-   Create `packages/learn-card-base/src/hooks/__tests__/useCredentialStatus.test.tsx` — hook source/fallback/fail-open tests.
-   Modify `packages/learn-card-base/src/index.ts` — export the shared lifecycle API.
-   Modify `apps/learn-card-app/src/hooks/deriveLifecycleStatus.ts` — compatibility re-export from `learn-card-base`.
-   Modify `apps/learn-card-app/src/hooks/useCredentialStatus.ts` — preserve the existing positional API while delegating to the shared hook.

### Group revocation backend and public API

-   Modify `packages/learn-card-types/src/lcn.ts` — shared Zod validator and result type.
-   Modify `services/learn-card-network/brain-service/src/helpers/status-list.helpers.ts` — distinguish updated, missing-entry, and failed Bitstring outcomes.
-   Modify `services/learn-card-network/brain-service/src/accesslayer/credential/relationships/update.ts` — return idempotent revocation details while preserving the boolean wrapper.
-   Modify `services/learn-card-network/brain-service/src/accesslayer/credential/read.ts` — return all Boost/profile credential instances in deterministic order.
-   Modify `services/learn-card-network/brain-service/src/routes/boosts.ts` — add the authorized best-effort group route and consolidated notification.
-   Create `services/learn-card-network/brain-service/test/revoke-boost-recipient-group.spec.ts` — active/pending/suspended, Bitstring, retry, authorization, partial failure, cleanup, and notification coverage.
-   Modify `packages/plugins/learn-card-network/src/types.ts` — expose the group method.
-   Modify `packages/plugins/learn-card-network/src/plugin.ts` — call the generated brain-client mutation.
-   Create `packages/learn-card-base/src/react-query/mutations/revokeBoostRecipientGroup.ts` — typed group mutation with settled invalidation.
-   Create `packages/learn-card-base/src/react-query/mutations/__tests__/revokeBoostRecipientGroup.test.tsx` — invocation and invalidation coverage.
-   Modify `packages/learn-card-base/src/index.ts` — export the group mutation.

### ScoutPass lifecycle and removal UI

-   Create `apps/scouts/src/pages/troop/troopIdStatus.helpers.ts` — pure ScoutPass lifecycle presentation and action-gating rules.
-   Create `apps/scouts/src/pages/troop/__tests__/troopIdStatus.helpers.test.ts` — state precedence and restriction tests.
-   Modify `apps/scouts/src/pages/troop/TroopIdStatusButton.tsx` — consume the shared lifecycle hook and display suspended/unavailable states.
-   Modify `apps/scouts/src/components/boost/hooks/useBoostMenu.tsx` — use credential-record status and suppress sharing when restricted.
-   Modify `apps/scouts/src/components/boost/boost-options-menu/BoostOptionsMenu.tsx` — accept an explicit share-visibility flag.
-   Modify `apps/scouts/src/components/boost/boost-earned-card/BoostEarnedIDCard.tsx` — pass the earned record URI and guard every share entry point.
-   Modify `apps/scouts/src/pages/ids/IdDisplayContainer.tsx` — pass record URIs through status and detail views; hide the QR action when restricted.
-   Modify `apps/scouts/src/pages/troop/TroopPage.tsx` — distinguish held credential URI from managed Boost URI and gate protected content.
-   Modify `apps/scouts/src/pages/troop/TroopPageIdAndTroopBox.tsx` — use credential-record lifecycle status for the badge and share button.
-   Modify `apps/scouts/src/pages/troop/TroopPageFooter.tsx` — treat pending, suspended, and revoked as restricted.
-   Modify `apps/scouts/src/pages/troop/ViewTroopIdModal.tsx` — gate sharing for the exact issuance being viewed.
-   Modify `apps/scouts/src/pages/troop/ViewTroopIdTemplate.tsx` — pass the exact issuance into the status badge.
-   Modify `apps/scouts/src/hooks/useTroopMembers.tsx` — retain recipient credential URI and explicit acceptance metadata.
-   Modify `apps/scouts/src/pages/troop/TroopPageMembersBox.tsx` — pass the member issuance metadata to the options modal.
-   Create `apps/scouts/src/pages/troop/groupRemoval.helpers.ts` — pure success/partial response interpretation.
-   Create `apps/scouts/src/pages/troop/__tests__/groupRemoval.helpers.test.ts` — full, already-revoked, and partial outcomes.
-   Modify `apps/scouts/src/pages/troop/IdOptionsModal.tsx` — use one group-removal path for Scout, Member, and Administrator roles.
-   Modify `apps/scouts/src/AppRouter.tsx` — remove deletion-based revoked-credential synchronization.

### Documentation

-   Modify `docs/apps/scouts/credential-revocation.md` — document authoritative status, retained records, group semantics, and the legacy limitation.
-   Modify `apps/scouts/AGENTS.md` — replace recipient-list inference guidance with the new lifecycle landmarks.

---

### Task 1: Share the LearnCard credential lifecycle hook

**Files:**

-   Create: `packages/learn-card-base/src/hooks/deriveLifecycleStatus.ts`
-   Create: `packages/learn-card-base/src/hooks/useCredentialStatus.ts`
-   Create: `packages/learn-card-base/src/hooks/__tests__/deriveLifecycleStatus.test.ts`
-   Create: `packages/learn-card-base/src/hooks/__tests__/useCredentialStatus.test.tsx`
-   Modify: `packages/learn-card-base/src/index.ts`
-   Modify: `apps/learn-card-app/src/hooks/deriveLifecycleStatus.ts`
-   Modify: `apps/learn-card-app/src/hooks/useCredentialStatus.ts`
-   Test: `apps/learn-card-app/src/hooks/__tests__/useCredentialStatus.test.ts`

**Interfaces:**

-   Consumes: `wallet.invoke.getMyCredentialLifecycleStatuses({ uris })`, `wallet.read.get(uri)`, and `wallet.invoke.verifyCredential(vc, {}, false)`.
-   Produces: `CredentialLifecycleStatus`, `deriveLifecycleStatus(check)`, `UseCredentialStatusOptions`, `CredentialStatusResult`, and `useCredentialStatus(options)` from `learn-card-base`.

-   [ ] **Step 1: Write the pure derivation tests in the shared package**

Create `packages/learn-card-base/src/hooks/__tests__/deriveLifecycleStatus.test.ts` with the five existing LearnCard App cases plus precedence when both bits are set:

```ts
import { describe, expect, it } from 'vitest';
import { deriveLifecycleStatus } from '../deriveLifecycleStatus';

describe('deriveLifecycleStatus', () => {
    it('gives a set revocation bit precedence over suspension', () => {
        expect(
            deriveLifecycleStatus({
                status: [
                    {
                        entryType: 'BitstringStatusListEntry',
                        statusPurpose: 'suspension',
                        isSet: true,
                    },
                    {
                        entryType: 'BitstringStatusListEntry',
                        statusPurpose: 'revocation',
                        isSet: true,
                    },
                ],
            })
        ).toBe('revoked');
    });

    it.each([
        ['revoked', 'revocation'],
        ['suspended', 'suspension'],
    ] as const)('returns %s for a set %s entry', (expected, purpose) => {
        expect(
            deriveLifecycleStatus({
                status: [
                    { entryType: 'BitstringStatusListEntry', statusPurpose: purpose, isSet: true },
                ],
            })
        ).toBe(expected);
    });

    it('fails open for empty checks and unrelated verification errors', () => {
        expect(deriveLifecycleStatus(undefined)).toBe('active');
        expect(deriveLifecycleStatus({ errors: ['proof could not be loaded'] })).toBe('active');
    });
});
```

-   [ ] **Step 2: Run the shared derivation test and verify it fails**

Run:

```bash
bun run --cwd packages/learn-card-base test -- src/hooks/__tests__/deriveLifecycleStatus.test.ts
```

Expected: FAIL because `deriveLifecycleStatus.ts` does not exist in `learn-card-base`.

-   [ ] **Step 3: Move the pure lifecycle contract into `learn-card-base`**

Create `packages/learn-card-base/src/hooks/deriveLifecycleStatus.ts`:

```ts
import type { VerificationCheck } from '@learncard/types';

export type CredentialLifecycleStatus = 'active' | 'revoked' | 'suspended';

export const deriveLifecycleStatus = (
    check: Partial<VerificationCheck> | undefined | null
): CredentialLifecycleStatus => {
    const entries = check?.status ?? [];
    if (entries.some(entry => entry.statusPurpose === 'revocation' && entry.isSet)) {
        return 'revoked';
    }
    if (entries.some(entry => entry.statusPurpose === 'suspension' && entry.isSet)) {
        return 'suspended';
    }

    const errors = check?.errors ?? [];
    if (errors.some(error => /revok/i.test(error))) return 'revoked';
    if (errors.some(error => /suspend/i.test(error))) return 'suspended';

    return 'active';
};
```

-   [ ] **Step 4: Run the pure derivation tests and verify they pass**

Run the command from Step 2.

Expected: PASS.

-   [ ] **Step 5: Write hook tests for authoritative state, fallback, loading, and failure**

Create `packages/learn-card-base/src/hooks/__tests__/useCredentialStatus.test.tsx` using `@vitest-environment jsdom`, a fresh `QueryClient`, and mocked `useWallet`. Cover these exact expectations:

```ts
expect(result.current.status).toBe('revoked');
expect(mocks.verifyCredential).not.toHaveBeenCalled();

// Backend throws, verification reports suspension.
expect(result.current.status).toBe('suspended');
expect(result.current.isError).toBe(false);

// Both sources fail: active fail-open, but error metadata is retained.
expect(result.current.status).toBe('active');
expect(result.current.isError).toBe(true);

// Disabled/no URI: no wallet initialization and no loading state.
expect(result.current).toEqual({ status: 'active', isLoading: false, isError: false });
expect(mocks.initWallet).not.toHaveBeenCalled();
```

Use this wrapper in the test:

```tsx
const renderStatusHook = (options: UseCredentialStatusOptions) => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return renderHook(() => useCredentialStatus(options), { wrapper });
};
```

-   [ ] **Step 6: Run the hook test and verify it fails**

Run:

```bash
bun run --cwd packages/learn-card-base test -- src/hooks/__tests__/useCredentialStatus.test.tsx
```

Expected: FAIL because the shared hook and types do not exist.

-   [ ] **Step 7: Implement the shared hook with explicit source outcomes**

Create `packages/learn-card-base/src/hooks/useCredentialStatus.ts` with this public contract:

```ts
import { useQuery } from '@tanstack/react-query';
import type { VC, VerificationCheck } from '@learncard/types';
import { useWallet } from './useWallet';
import { deriveLifecycleStatus, type CredentialLifecycleStatus } from './deriveLifecycleStatus';

export interface UseCredentialStatusOptions {
    uri?: string;
    credential?: VC;
    enabled?: boolean;
}

export interface CredentialStatusResult {
    status: CredentialLifecycleStatus;
    isLoading: boolean;
    isError: boolean;
}

interface CredentialStatusQueryResult {
    status: CredentialLifecycleStatus;
    isError: boolean;
}

export const useCredentialStatus = ({
    uri,
    credential,
    enabled = true,
}: UseCredentialStatusOptions): CredentialStatusResult => {
    const { initWallet } = useWallet();
    const shouldQuery = enabled && Boolean(uri);

    const query = useQuery({
        queryKey: ['credentialStatus', uri],
        enabled: shouldQuery,
        staleTime: 5 * 60 * 1000,
        refetchOnMount: 'always',
        queryFn: async (): Promise<CredentialStatusQueryResult> => {
            const wallet = await initWallet();

            try {
                const statuses = await wallet?.invoke?.getMyCredentialLifecycleStatuses?.({
                    uris: [uri as string],
                });
                const status = statuses?.[uri as string];
                if (status === 'active' || status === 'revoked' || status === 'suspended') {
                    return { status, isError: false };
                }
            } catch {
                // The verification fallback below remains authoritative for Bitstring entries.
            }

            try {
                const resolved = credential ?? ((await wallet?.read?.get?.(uri as string)) as VC);
                if (!resolved || !wallet?.invoke?.verifyCredential) {
                    return { status: 'active', isError: true };
                }
                const verify = wallet.invoke.verifyCredential as unknown as (
                    candidate: VC,
                    options: Record<string, unknown>,
                    prettify: boolean
                ) => Promise<VerificationCheck>;
                const check = await verify(resolved, {}, false);
                return { status: deriveLifecycleStatus(check), isError: false };
            } catch {
                return { status: 'active', isError: true };
            }
        },
    });

    if (!shouldQuery) return { status: 'active', isLoading: false, isError: false };

    return {
        status: query.data?.status ?? 'active',
        isLoading: query.isLoading,
        isError: query.data?.isError ?? query.isError,
    };
};
```

If the exact generated `verifyCredential` overload accepts `boolean`, use it directly; otherwise retain the narrow cast used by the current LearnCard App hook.

-   [ ] **Step 8: Export the shared API and preserve LearnCard App imports**

Add to `packages/learn-card-base/src/index.ts`:

```ts
export * from './hooks/deriveLifecycleStatus';
export * from './hooks/useCredentialStatus';
```

Replace `apps/learn-card-app/src/hooks/deriveLifecycleStatus.ts` with:

```ts
export { deriveLifecycleStatus } from 'learn-card-base';
export type { CredentialLifecycleStatus } from 'learn-card-base';
```

Keep LearnCard App's positional hook contract in `apps/learn-card-app/src/hooks/useCredentialStatus.ts`:

```ts
import type { VC } from '@learncard/types';
import {
    useCredentialStatus as useSharedCredentialStatus,
    type CredentialLifecycleStatus,
} from 'learn-card-base';

export type { CredentialLifecycleStatus } from 'learn-card-base';
export { deriveLifecycleStatus } from 'learn-card-base';

export const useCredentialStatus = (
    credential: VC | undefined,
    uri: string | undefined,
    enabled = true
): CredentialLifecycleStatus => useSharedCredentialStatus({ credential, uri, enabled }).status;
```

-   [ ] **Step 9: Run shared and LearnCard App lifecycle tests**

Run:

```bash
bun run --cwd packages/learn-card-base test -- \
  src/hooks/__tests__/deriveLifecycleStatus.test.ts \
  src/hooks/__tests__/useCredentialStatus.test.tsx
bun run --cwd apps/learn-card-app test:unit -- \
  src/hooks/__tests__/useCredentialStatus.test.ts
```

Expected: all shared cases pass and the existing five LearnCard App cases remain green.

-   [ ] **Step 10: Commit the shared lifecycle source**

```bash
git add packages/learn-card-base/src/hooks packages/learn-card-base/src/index.ts \
  apps/learn-card-app/src/hooks/deriveLifecycleStatus.ts \
  apps/learn-card-app/src/hooks/useCredentialStatus.ts
git commit -m "refactor: share credential lifecycle status hook"
```

### Task 2: Add idempotent group revocation to the brain service

**Files:**

-   Modify: `packages/learn-card-types/src/lcn.ts`
-   Modify: `services/learn-card-network/brain-service/src/helpers/status-list.helpers.ts`
-   Modify: `services/learn-card-network/brain-service/src/accesslayer/credential/relationships/update.ts`
-   Modify: `services/learn-card-network/brain-service/src/accesslayer/credential/read.ts`
-   Modify: `services/learn-card-network/brain-service/src/routes/boosts.ts`
-   Create: `services/learn-card-network/brain-service/test/revoke-boost-recipient-group.spec.ts`
-   Test: `services/learn-card-network/brain-service/test/revoke-suspend-per-instance.spec.ts`
-   Test: `services/learn-card-network/brain-service/test/revoke-credential.spec.ts`

**Interfaces:**

-   Consumes: `getBoostPermissions`, `processRevokeHooks`, `setCredentialBitstringStatus`, `addNotificationToQueue`, and the existing Boost/credential graph.
-   Produces: `RevokeBoostRecipientGroupResultValidator`, `RevokeBoostRecipientGroupResult`, `getCredentialStatusesForBoostAndProfile`, `revokeCredentialForProfile`, and tRPC route `boost.revokeBoostRecipientGroup`.

-   [ ] **Step 1: Write the group-route integration fixture and all-instance failure test**

Create `services/learn-card-network/brain-service/test/revoke-boost-recipient-group.spec.ts` using the setup pattern from `revoke-suspend-per-instance.spec.ts`. Issue two accepted instances and one pending instance, suspend one accepted instance, call the not-yet-existing route, and assert all three URIs are returned:

```ts
const userARef = { profileId: 'usera', user: userA };
const userBRef = { profileId: 'userb', user: userB };
const input = { boostUri, recipientProfileId: 'userb' };

const activeUri = await sendBoost(userARef, userBRef, boostUri, true);
const suspendedUri = await sendBoost(userARef, userBRef, boostUri, true);
const pendingUri = await sendBoost(userARef, userBRef, boostUri, false);

await userA.clients.fullAuth.boost.suspendBoostRecipient({
    boostUri,
    recipientProfileId: 'userb',
    credentialUri: suspendedUri,
});

const result = await userA.clients.fullAuth.boost.revokeBoostRecipientGroup({
    boostUri,
    recipientProfileId: 'userb',
});

expect(new Set(result.revokedCredentialUris)).toEqual(
    new Set([activeUri, suspendedUri, pendingUri])
);
expect(result.alreadyRevokedCredentialUris).toEqual([]);
expect(result.failedCredentialUris).toEqual([]);

const statuses = await userB.clients.fullAuth.activity.getMyCredentialLifecycleStatuses({
    uris: [activeUri, suspendedUri, pendingUri],
});
expect(statuses).toEqual({
    [activeUri]: 'revoked',
    [suspendedUri]: 'revoked',
    [pendingUri]: 'revoked',
});

await userA.clients.fullAuth.boost.unsuspendBoostRecipient({
    boostUri,
    recipientProfileId: 'userb',
    credentialUri: suspendedUri,
});
expect(
    await userB.clients.fullAuth.activity.getMyCredentialLifecycleStatuses({
        uris: [suspendedUri],
    })
).toEqual({ [suspendedUri]: 'revoked' });
```

-   [ ] **Step 2: Add failing tests for authorization, idempotency, and consolidated notification**

Add these assertions before implementation:

```ts
const input = { boostUri, recipientProfileId: 'userb' };

await expect(
    userC.clients.fullAuth.boost.revokeBoostRecipientGroup({
        boostUri,
        recipientProfileId: 'userb',
    })
).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

const first = await userA.clients.fullAuth.boost.revokeBoostRecipientGroup(input);
const second = await userA.clients.fullAuth.boost.revokeBoostRecipientGroup(input);
expect(first.revokedCredentialUris).toHaveLength(2);
expect(second.revokedCredentialUris).toEqual([]);
expect(new Set(second.alreadyRevokedCredentialUris)).toEqual(new Set(first.revokedCredentialUris));
expect(second.failedCredentialUris).toEqual([]);

// In a fresh test, install the spy after issuance and before the first group removal.
const notificationSpy = vi.spyOn(notifications, 'addNotificationToQueue');
notificationSpy.mockClear();
const notifiedResult = await userA.clients.fullAuth.boost.revokeBoostRecipientGroup(input);
expect(notificationSpy).toHaveBeenCalledTimes(1);
expect(notificationSpy).toHaveBeenCalledWith(
    expect.objectContaining({
        data: { vcUris: expect.arrayContaining(notifiedResult.revokedCredentialUris) },
    })
);
```

Reset the notification spy before the idempotency assertion so the existing issuance notifications do not affect the count.

-   [ ] **Step 3: Add failing Bitstring and legacy-gap tests**

Use the `statusBoostTemplate`, `getEntryForPurpose`, and `isStatusBitSet` helpers from the per-instance suite to issue two status-enabled credentials, then assert both revocation bits are set after the group call. Separately issue `testUnsignedBoost`, spy on `console.warn`, and assert the group still returns the URI as revoked while emitting a machine-searchable migration-gap event:

```ts
expect(await isStatusBitSet(firstEntry)).toBe(true);
expect(await isStatusBitSet(secondEntry)).toBe(true);

expect(warnSpy).toHaveBeenCalledWith(
    '[revokeBoostRecipientGroup] migration-gap',
    expect.objectContaining({ credentialId: expect.any(String), reason: 'missing-entry' })
);
```

-   [ ] **Step 4: Add a failing partial-cleanup retry test**

Spy on `processRevokeHooks`, fail only one credential on the first request, restore the implementation, and call the route again:

```ts
expect(firstResult.failedCredentialUris).toEqual([failingUri]);
expect(firstResult.revokedCredentialUris).toContain(successfulUri);

expect(secondResult.failedCredentialUris).toEqual([]);
expect(secondResult.alreadyRevokedCredentialUris).toContain(failingUri);
expect(processRevokeHooksSpy).toHaveBeenCalledWith(
    expect.objectContaining({ profileId: 'userb' }),
    expect.objectContaining({ id: failingCredentialId })
);
```

This test is the guard against skipping cleanup simply because the first request already changed `CREDENTIAL_SENT.status`.

Repeat the retry shape with a one-call mock of `setCredentialBitstringStatusWithResult` that returns `failed` for one status-enabled credential. Assert that URI is failed on the first call and is classified as already revoked after the real helper succeeds on retry. This distinguishes a missing legacy entry from a broken update for a credential that does have an entry.

```ts
await issueStatusInstanceToUserB(statusBoostUri);
const { credentialUri: newestCredentialUri } = await issueStatusInstanceToUserB(statusBoostUri);
const input = { boostUri: statusBoostUri, recipientProfileId: 'userb' };
const realStatusUpdate = statusListHelpers.setCredentialBitstringStatusWithResult;
const statusUpdateSpy = vi
    .spyOn(statusListHelpers, 'setCredentialBitstringStatusWithResult')
    .mockResolvedValueOnce('failed')
    .mockImplementation(realStatusUpdate);

const firstResult = await userA.clients.fullAuth.boost.revokeBoostRecipientGroup(input);
expect(firstResult.failedCredentialUris).toContain(newestCredentialUri);

statusUpdateSpy.mockRestore();
const retryResult = await userA.clients.fullAuth.boost.revokeBoostRecipientGroup(input);
expect(retryResult.failedCredentialUris).toEqual([]);
expect(retryResult.alreadyRevokedCredentialUris).toContain(newestCredentialUri);
```

-   [ ] **Step 5: Add failing group-path permission and connection cleanup tests**

For permissions, create a claim Boost and target Boost, attach a `GRANT_PERMISSIONS` claim hook, issue the claim Boost twice, and remove the profile through the group route:

```ts
await userA.clients.fullAuth.claimHook.createClaimHook({
    hook: {
        type: 'GRANT_PERMISSIONS',
        data: {
            claimUri,
            targetUri,
            permissions: { canIssue: true },
        },
    },
});
await sendBoost(userARef, userBRef, claimUri, true);
await sendBoost(userARef, userBRef, claimUri, true);
expect((await userB.clients.fullAuth.boost.getBoostPermissions({ uri: targetUri })).canIssue).toBe(
    true
);

await userA.clients.fullAuth.boost.revokeBoostRecipientGroup({
    boostUri: claimUri,
    recipientProfileId: 'userb',
});
expect(
    (await userB.clients.fullAuth.boost.getBoostPermissions({ uri: targetUri })).canIssue
).toBeFalsy();
```

Add an `ADD_ADMIN` variant using the same `claimUri`/`targetUri` pair:

```ts
await userA.clients.fullAuth.claimHook.createClaimHook({
    hook: { type: 'ADD_ADMIN', data: { claimUri, targetUri } },
});
await sendBoost(userARef, userBRef, claimUri, true);
expect((await userB.clients.fullAuth.boost.getBoostPermissions({ uri: targetUri })).role).toBe(
    'admin'
);

await userA.clients.fullAuth.boost.revokeBoostRecipientGroup({
    boostUri: claimUri,
    recipientProfileId: 'userb',
});
expect((await userB.clients.fullAuth.boost.getBoostPermissions({ uri: targetUri })).role).not.toBe(
    'admin'
);
```

For connection cleanup, create a Boost with `autoConnectRecipients: true`, issue it, assert the `CONNECTED_WITH` query returns a positive count, call the group route, and assert the count is zero. Use the exact Cypher helper:

```ts
const getConnectionCount = async (fromId: string, toId: string): Promise<number> => {
    const { neogma } = await import('@instance');
    const query = await neogma.queryRunner.run(
        `MATCH (:Profile {profileId: $fromId})-[r:CONNECTED_WITH]-(:Profile {profileId: $toId})
         RETURN count(r) AS count`,
        { fromId, toId }
    );
    return query.records[0]?.get('count').toNumber() ?? 0;
};
```

-   [ ] **Step 6: Run the new suite and verify the route is missing**

Run:

```bash
env SEED=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
  bun run --cwd services/learn-card-network/brain-service test -- run \
  test/revoke-boost-recipient-group.spec.ts
```

Expected: FAIL at compile/runtime because `revokeBoostRecipientGroup` is not defined.

-   [ ] **Step 7: Define the shared result validator**

Add near the Boost recipient validators in `packages/learn-card-types/src/lcn.ts`:

```ts
export const RevokeBoostRecipientGroupResultValidator = z.object({
    revokedCredentialUris: z.array(z.string()),
    alreadyRevokedCredentialUris: z.array(z.string()),
    failedCredentialUris: z.array(z.string()),
});

export type RevokeBoostRecipientGroupResult = z.infer<
    typeof RevokeBoostRecipientGroupResultValidator
>;
```

-   [ ] **Step 8: Make status-list mutation outcomes explicit**

In `status-list.helpers.ts`, add a detailed helper and keep the boolean API as a compatibility wrapper:

```ts
export type CredentialBitstringStatusUpdateResult = 'updated' | 'missing-entry' | 'failed';

export const setCredentialBitstringStatusWithResult = async (
    credentialId: string,
    statusPurpose: BitstringStatusPurpose,
    value: boolean
): Promise<CredentialBitstringStatusUpdateResult> => {
    const credential = await Credential.findOne({ where: { id: credentialId } });
    if (!credential) return 'failed';

    const entries = getBitstringStatusListEntries(JSON.parse(credential.credential)).filter(
        entry => entry.statusPurpose === statusPurpose
    );
    if (entries.length === 0) return 'missing-entry';

    const results = await Promise.all(entries.map(entry => setStatusListEntryBit(entry, value)));
    return results.every(Boolean) ? 'updated' : 'failed';
};

export const setCredentialBitstringStatus = async (
    credentialId: string,
    statusPurpose: BitstringStatusPurpose,
    value: boolean
): Promise<boolean> =>
    (await setCredentialBitstringStatusWithResult(credentialId, statusPurpose, value)) ===
    'updated';
```

-   [ ] **Step 9: Add an idempotent relationship/status primitive**

In `credential/relationships/update.ts`, add:

```ts
import { neogma } from '@instance';
import {
    setCredentialBitstringStatusWithResult,
    type CredentialBitstringStatusUpdateResult,
} from '@helpers/status-list.helpers';

export interface RevokeCredentialForProfileResult {
    found: boolean;
    wasAlreadyRevoked: boolean;
    statusList: CredentialBitstringStatusUpdateResult;
}

export const revokeCredentialForProfile = async (
    credentialId: string,
    profileId: string
): Promise<RevokeCredentialForProfileResult> => {
    const revokedAt = new Date().toISOString();
    const result = await neogma.queryRunner.run(
        `MATCH (credential:Credential {id: $credentialId})
         MATCH (sender)-[sent:CREDENTIAL_SENT {to: $profileId}]->(credential)
         WHERE sender:Profile OR sender:AppStoreListing
         WITH sent, sent.status AS previousStatus
         SET sent.status = "revoked", sent.revokedAt = $revokedAt
         RETURN previousStatus`,
        { credentialId, profileId, revokedAt }
    );

    if (result.records.length === 0) {
        return { found: false, wasAlreadyRevoked: false, statusList: 'failed' };
    }

    let statusList: CredentialBitstringStatusUpdateResult = 'failed';
    try {
        statusList = await setCredentialBitstringStatusWithResult(credentialId, 'revocation', true);
    } catch (error) {
        console.error('[revokeCredentialForProfile] status-list update failed', {
            credentialId,
            error,
        });
    }

    return {
        found: true,
        wasAlreadyRevoked: result.records[0]?.get('previousStatus') === 'revoked',
        statusList,
    };
};
```

Rewrite `revokeCredentialReceived` as a wrapper over this result. It returns `result.found`, logs `missing-entry` with its existing warning behavior, and does not change the external route's boolean response.

```ts
export const revokeCredentialReceived = async (
    credentialId: string,
    profileId: string
): Promise<boolean> => {
    const result = await revokeCredentialForProfile(credentialId, profileId);
    if (result.found && result.statusList !== 'updated') {
        console.warn('[revokeCredentialReceived] verifiable revocation unavailable', {
            credentialId,
            reason: result.statusList,
        });
    }
    return result.found;
};
```

-   [ ] **Step 10: Add the plural Boost/profile accessor and preserve latest-only behavior**

In `credential/read.ts`, implement:

```ts
export const getCredentialStatusesForBoostAndProfile = async (
    boostId: string,
    profileId: string
): Promise<CredentialStatusForBoostAndProfile[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (boost:Boost {id: $boostId})<-[:INSTANCE_OF]-(credential:Credential)
         MATCH (sender)-[sent:CREDENTIAL_SENT {to: $profileId}]->(credential)
         WHERE sender:Profile OR sender:AppStoreListing
         OPTIONAL MATCH (credential)-[received:CREDENTIAL_RECEIVED]->(:Profile {profileId: $profileId})
         RETURN credential, sent, received
         ORDER BY coalesce(received.date, sent.date) DESC, credential.id DESC`,
        { boostId, profileId }
    );

    const statuses = await Promise.all(
        result.records.map(async record => {
            const credentialNode = record.get('credential') as {
                properties?: Record<string, unknown>;
            };
            const credentialProps = inflateObject<CredentialType>(
                (credentialNode?.properties ?? {}) as CredentialType
            );
            const credential = await Credential.findOne({ where: { id: credentialProps.id } });
            if (!credential) return null;

            const sentNode = record.get('sent') as {
                properties?: Record<string, unknown>;
            };
            const receivedNode = record.get('received') as {
                properties?: Record<string, unknown>;
            } | null;
            const sentProps = inflateRelationshipProperties(sentNode?.properties ?? {});
            const receivedProps = receivedNode?.properties
                ? inflateRelationshipProperties(receivedNode.properties)
                : undefined;
            const rawStatus = sentProps.status ?? receivedProps?.status;

            return {
                credential,
                sentDate: sentProps.date as string | undefined,
                receivedDate: receivedProps?.date as string | undefined,
                status:
                    rawStatus === 'revoked'
                        ? ('revoked' as const)
                        : rawStatus === 'suspended'
                        ? ('suspended' as const)
                        : receivedProps
                        ? ('claimed' as const)
                        : ('pending' as const),
            };
        })
    );

    return statuses.filter(
        (status): status is CredentialStatusForBoostAndProfile => status !== null
    );
};

export const getCredentialStatusForBoostAndProfile = async (
    boostId: string,
    profileId: string
): Promise<CredentialStatusForBoostAndProfile | null> =>
    (await getCredentialStatusesForBoostAndProfile(boostId, profileId))[0] ?? null;
```

The plural query must return `pending` when there is no received relationship, `claimed` when received, and let `revoked`/`suspended` from `sent.status ?? received.status` take precedence.

-   [ ] **Step 11: Implement the authorized best-effort group route**

Add `revokeBoostRecipientGroup` beside `revokeBoostRecipient` in `boosts.ts`, importing both `RevokeBoostRecipientGroupResultValidator` and `RevokeBoostRecipientGroupResult`. Start the route with the same resource resolution and authorization order as the singular route:

```ts
revokeBoostRecipientGroup: profileRoute
    .meta({
        openapi: {
            protect: true,
            method: 'POST',
            path: '/boost/recipients/revoke-group',
            tags: ['Boosts'],
            summary: 'Revoke every credential for a Boost recipient',
        },
        requiredScope: 'boosts:write',
    })
    .input(z.object({ boostUri: z.string(), recipientProfileId: z.string() }))
    .output(RevokeBoostRecipientGroupResultValidator)
    .mutation(async ({ ctx, input }) => {
        const resolvedRecipientProfileId = await getProfileIdFromString(
            input.recipientProfileId,
            ctx.domain
        );
        if (!resolvedRecipientProfileId) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
        }

        const boost = await getBoostByUri(decodeURIComponent(input.boostUri));
        if (!boost) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });
        }

        const permissions = await getBoostPermissions(boost, ctx.user.profile);
        if (!permissions.canRevoke) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'Profile does not have permission to revoke credentials for this boost',
            });
        }

        const recipientProfile = await getProfileByProfileId(resolvedRecipientProfileId);
        if (!recipientProfile) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Recipient profile not found' });
        }
```

Immediately after that recipient-profile check, use this processing block as the remainder of the mutation body and finish with `return result;`:

```ts
const instances = await getCredentialStatusesForBoostAndProfile(
    boost.id,
    resolvedRecipientProfileId
);
const result: RevokeBoostRecipientGroupResult = {
    revokedCredentialUris: [],
    alreadyRevokedCredentialUris: [],
    failedCredentialUris: [],
};

for (const instance of instances) {
    const uri = constructUri('credential', instance.credential.id, ctx.domain);
    try {
        const revocation = await revokeCredentialForProfile(
            instance.credential.id,
            resolvedRecipientProfileId
        );
        const hookResult = await Promise.allSettled([
            processRevokeHooks(recipientProfile, instance.credential),
        ]);
        const hooksFailed = hookResult.some(item => item.status === 'rejected');

        if (revocation.statusList === 'missing-entry') {
            console.warn('[revokeBoostRecipientGroup] migration-gap', {
                credentialId: instance.credential.id,
                reason: 'missing-entry',
            });
        }

        if (!revocation.found || revocation.statusList === 'failed' || hooksFailed) {
            result.failedCredentialUris.push(uri);
        } else if (revocation.wasAlreadyRevoked) {
            result.alreadyRevokedCredentialUris.push(uri);
        } else {
            result.revokedCredentialUris.push(uri);
        }
    } catch (error) {
        console.error('[revokeBoostRecipientGroup] credential failed', {
            credentialId: instance.credential.id,
            error,
        });
        result.failedCredentialUris.push(uri);
    }
}

if (result.revokedCredentialUris.length > 0) {
    try {
        await addNotificationToQueue({
            type: LCNNotificationTypeEnumValidator.enum.CREDENTIAL_REVOKED,
            to: {
                did: getDidWeb(ctx.domain, resolvedRecipientProfileId),
                profileId: resolvedRecipientProfileId,
                ...(recipientProfile.notificationsWebhook && {
                    notificationsWebhook: recipientProfile.notificationsWebhook,
                }),
            },
            from: {
                did: getDidWeb(ctx.domain, ctx.user.profile.profileId),
                profileId: ctx.user.profile.profileId,
                displayName: ctx.user.profile.displayName,
            },
            message: getNotificationMessage(
                boost.name ? 'credentialRevokedNamed' : 'credentialRevokedUnnamed',
                resolveRecipientLocale(recipientProfile),
                {
                    credentialName: boost.name ?? undefined,
                    issuer: ctx.user.profile.displayName ?? ctx.user.profile.profileId,
                }
            ),
            data: { vcUris: result.revokedCredentialUris },
        });
    } catch (error) {
        console.error('Failed to queue group CREDENTIAL_REVOKED notification', error);
    }
}

return result;
```

Close the mutation and route object after `return result;`. The notification block deliberately excludes `alreadyRevokedCredentialUris` so an idempotent repeat does not notify the holder again.

-   [ ] **Step 12: Run the new backend suite and fix only failures in its contract**

Run the command from Step 6.

Expected: all group route cases pass. If the partial-failure spy identifies credentials by URI, use `getIdFromUri` so the assertion is independent of URI formatting.

-   [ ] **Step 13: Run the existing per-instance and cleanup regressions**

Run:

```bash
env SEED=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
  bun run --cwd services/learn-card-network/brain-service test -- run \
  test/revoke-suspend-per-instance.spec.ts \
  test/revoke-credential.spec.ts
```

Expected: existing per-instance targeting, latest fallback, suspension, Bitstring, permissions, and connection cleanup tests pass unchanged.

-   [ ] **Step 14: Build the shared types package**

Run:

```bash
bun run --cwd packages/learn-card-types build
```

Expected: build succeeds with the new validator exported through `src/index.ts`'s existing `export * from './lcn'`.

-   [ ] **Step 15: Commit the backend group operation**

```bash
git add packages/learn-card-types/src/lcn.ts \
  services/learn-card-network/brain-service/src/helpers/status-list.helpers.ts \
  services/learn-card-network/brain-service/src/accesslayer/credential/relationships/update.ts \
  services/learn-card-network/brain-service/src/accesslayer/credential/read.ts \
  services/learn-card-network/brain-service/src/routes/boosts.ts \
  services/learn-card-network/brain-service/test/revoke-boost-recipient-group.spec.ts
git commit -m "feat: revoke all ScoutPass group credentials"
```

### Task 3: Expose the group mutation through the plugin and React Query

**Files:**

-   Modify: `packages/plugins/learn-card-network/src/types.ts`
-   Modify: `packages/plugins/learn-card-network/src/plugin.ts`
-   Create: `packages/learn-card-base/src/react-query/mutations/revokeBoostRecipientGroup.ts`
-   Create: `packages/learn-card-base/src/react-query/mutations/__tests__/revokeBoostRecipientGroup.test.tsx`
-   Modify: `packages/learn-card-base/src/index.ts`

**Interfaces:**

-   Consumes: brain-client mutation `client.boost.revokeBoostRecipientGroup.mutate({ boostUri, recipientProfileId })` and `RevokeBoostRecipientGroupResult` from `@learncard/types`.
-   Produces: plugin method `revokeBoostRecipientGroup(boostUri, recipientProfileId)` and hook `useRevokeBoostRecipientGroup()`.

-   [ ] **Step 1: Write a failing React Query mutation test**

Create `revokeBoostRecipientGroup.test.tsx` with a mocked wallet method and a real `QueryClient`. Assert positional plugin invocation and settled invalidation:

```ts
await result.current.mutateAsync({
    boostUri: 'lc:network:test:boost:troop',
    recipientProfileId: 'scout-1',
});

expect(mocks.revokeBoostRecipientGroup).toHaveBeenCalledWith(
    'lc:network:test:boost:troop',
    'scout-1'
);
expect(invalidateSpy).toHaveBeenCalledWith({
    queryKey: ['credentialStatus'],
});
```

Repeat with `mocks.revokeBoostRecipientGroup.mockRejectedValueOnce(new Error('offline'))` and assert the same invalidation prefixes are called from `onSettled`.

-   [ ] **Step 2: Run the mutation test and verify it fails**

Run:

```bash
bun run --cwd packages/learn-card-base test -- \
  src/react-query/mutations/__tests__/revokeBoostRecipientGroup.test.tsx
```

Expected: FAIL because the hook does not exist.

-   [ ] **Step 3: Add the typed network plugin method**

Import `RevokeBoostRecipientGroupResult` in `packages/plugins/learn-card-network/src/types.ts` and add:

```ts
revokeBoostRecipientGroup: (boostUri: string, recipientProfileId: string) =>
    Promise<RevokeBoostRecipientGroupResult>;
```

Add the implementation beside `revokeBoostRecipient` in `plugin.ts`:

```ts
revokeBoostRecipientGroup: async (_learnCard, boostUri, recipientProfileId) => {
    await ensureUser();
    return client.boost.revokeBoostRecipientGroup.mutate({
        boostUri,
        recipientProfileId,
    });
},
```

-   [ ] **Step 4: Implement the focused React Query mutation**

Create `revokeBoostRecipientGroup.ts`:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { RevokeBoostRecipientGroupResult } from '@learncard/types';
import { useWallet } from '../../hooks/useWallet';

export interface RevokeBoostRecipientGroupParams {
    boostUri: string;
    recipientProfileId: string;
}

const INVALIDATION_PREFIXES = [
    ['boostRecipients'],
    ['getPaginatedBoostRecipients'],
    ['getBoostRecipientCount'],
    ['boosts'],
    ['useNetworkMembers'],
    ['getMyActivities'],
    ['getActivityStats'],
    ['credentialStatus'],
] as const;

export const useRevokeBoostRecipientGroup = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation<RevokeBoostRecipientGroupResult, Error, RevokeBoostRecipientGroupParams>({
        mutationFn: async ({ boostUri, recipientProfileId }) => {
            const wallet = await initWallet();
            const method = wallet?.invoke?.revokeBoostRecipientGroup;
            if (!method) throw new Error('Group removal is unavailable');
            return method(boostUri, recipientProfileId);
        },
        onSettled: async () => {
            await Promise.all(
                INVALIDATION_PREFIXES.map(queryKey =>
                    queryClient.invalidateQueries({ queryKey: [...queryKey] })
                )
            );
        },
    });
};
```

Export it from `packages/learn-card-base/src/index.ts`.

-   [ ] **Step 5: Run the mutation test and package builds**

Run:

```bash
bun run --cwd packages/learn-card-base test -- \
  src/react-query/mutations/__tests__/revokeBoostRecipientGroup.test.tsx
bun run --cwd packages/plugins/learn-card-network build
```

Expected: mutation tests and the typed network plugin build pass.

-   [ ] **Step 6: Commit the client API path**

```bash
git add packages/plugins/learn-card-network/src/types.ts \
  packages/plugins/learn-card-network/src/plugin.ts \
  packages/learn-card-base/src/react-query/mutations/revokeBoostRecipientGroup.ts \
  packages/learn-card-base/src/react-query/mutations/__tests__/revokeBoostRecipientGroup.test.tsx \
  packages/learn-card-base/src/index.ts
git commit -m "feat: expose ScoutPass group revocation mutation"
```

### Task 4: Replace ScoutPass list inference with lifecycle presentation

**Files:**

-   Create: `apps/scouts/src/pages/troop/troopIdStatus.helpers.ts`
-   Create: `apps/scouts/src/pages/troop/__tests__/troopIdStatus.helpers.test.ts`
-   Modify: `apps/scouts/src/pages/troop/TroopIdStatusButton.tsx`

**Interfaces:**

-   Consumes: shared `useCredentialStatus({ credential, uri, enabled })`.
-   Produces: `TroopIdCredentialStatus`, `TroopIdIssuanceState`, `deriveTroopIdStatus`, `isCredentialActionRestricted`, and object-returning `useTroopIDStatus`.

-   [ ] **Step 1: Write the pure ScoutPass status tests**

Create `troopIdStatus.helpers.test.ts` with Bun's test API:

```ts
import { describe, expect, it } from 'bun:test';
import { deriveTroopIdStatus, isCredentialActionRestricted } from '../troopIdStatus.helpers';

describe('deriveTroopIdStatus', () => {
    it('uses revoked and suspended lifecycle states before issuance state', () => {
        expect(deriveTroopIdStatus({ lifecycleStatus: 'revoked', issuanceState: 'pending' })).toBe(
            'revoked'
        );
        expect(
            deriveTroopIdStatus({ lifecycleStatus: 'suspended', issuanceState: 'accepted' })
        ).toBe('suspended');
    });

    it('uses explicit pending metadata and otherwise reports valid', () => {
        expect(deriveTroopIdStatus({ lifecycleStatus: 'active', issuanceState: 'pending' })).toBe(
            'pending'
        );
        expect(deriveTroopIdStatus({ lifecycleStatus: 'active', issuanceState: 'accepted' })).toBe(
            'valid'
        );
    });

    it('keeps loading neutral and restricts actions until resolved', () => {
        expect(deriveTroopIdStatus({ lifecycleStatus: 'active', isLoading: true })).toBeUndefined();
        expect(isCredentialActionRestricted(undefined)).toBe(true);
        expect(isCredentialActionRestricted('valid')).toBe(false);
        expect(isCredentialActionRestricted('pending')).toBe(true);
        expect(isCredentialActionRestricted('suspended')).toBe(true);
        expect(isCredentialActionRestricted('revoked')).toBe(true);
    });
});
```

-   [ ] **Step 2: Run the helper test and verify it fails**

Run:

```bash
bun test apps/scouts/src/pages/troop/__tests__/troopIdStatus.helpers.test.ts
```

Expected: FAIL because the helper file does not exist.

-   [ ] **Step 3: Implement the pure presentation adapter**

Create `troopIdStatus.helpers.ts`:

```ts
import type { CredentialLifecycleStatus } from 'learn-card-base';

export type TroopIdCredentialStatus = 'valid' | 'pending' | 'suspended' | 'revoked';
export type TroopIdIssuanceState = 'accepted' | 'pending';

export interface DeriveTroopIdStatusOptions {
    lifecycleStatus: CredentialLifecycleStatus;
    issuanceState?: TroopIdIssuanceState;
    isLoading?: boolean;
}

export const deriveTroopIdStatus = ({
    lifecycleStatus,
    issuanceState = 'accepted',
    isLoading = false,
}: DeriveTroopIdStatusOptions): TroopIdCredentialStatus | undefined => {
    if (isLoading) return undefined;
    if (lifecycleStatus === 'revoked') return 'revoked';
    if (lifecycleStatus === 'suspended') return 'suspended';
    if (issuanceState === 'pending') return 'pending';
    return 'valid';
};

export const isCredentialActionRestricted = (
    status: TroopIdCredentialStatus | undefined
): boolean => status !== 'valid';
```

-   [ ] **Step 4: Replace `useTroopIDStatus` recipient queries**

In `TroopIdStatusButton.tsx`, remove `useGetBoostRecipients`, `useGetCurrentLCNUser`, and `useGetIDs`. Define:

```ts
export interface UseTroopIdStatusOptions {
    credential?: VC;
    credentialUri?: string;
    issuanceState?: TroopIdIssuanceState;
    enabled?: boolean;
}

export const useTroopIDStatus = ({
    credential,
    credentialUri,
    issuanceState = 'accepted',
    enabled = true,
}: UseTroopIdStatusOptions) => {
    const lifecycle = useCredentialStatus({
        credential,
        uri: credentialUri,
        enabled: enabled && Boolean(credentialUri),
    });
    return {
        ...lifecycle,
        status: deriveTroopIdStatus({
            lifecycleStatus: lifecycle.status,
            issuanceState,
            isLoading: lifecycle.isLoading,
        }),
    };
};
```

Update `TroopIdStatusButtonProps` to accept `credentialUri`, `issuanceState`, and `lifecycleEnabled`. Add `Suspended` and `Unavailable` enum values. Preserve expired/invalid proof precedence, then map lifecycle presentation to:

```ts
case TroopIdStatusEnum.Suspended:
    text = 'ID Suspended';
    buttonColor = 'bg-amber-500';
    break;
case TroopIdStatusEnum.Unavailable:
    text = 'Status Unavailable';
    buttonColor = 'bg-amber-500';
    break;
```

Render the skeleton while either proof data or lifecycle data is loading. An `isError` lifecycle result may show `Status Unavailable`, but it must never choose `Revoked`.

-   [ ] **Step 5: Run the pure tests and build ScoutPass**

Run:

```bash
bun test apps/scouts/src/pages/troop/__tests__/troopIdStatus.helpers.test.ts
bunx nx build scouts
```

Expected: helper tests and ScoutPass TypeScript/Vite build pass after updating any direct callers to the new object-returning hook signature with destructuring only; URI wiring is completed in Task 5.

-   [ ] **Step 6: Prove list absence no longer drives lifecycle**

Run:

```bash
rg -n "useGetBoostRecipients|isClaimedError|isAllError|useIsTroopIDRevokedFake" \
  apps/scouts/src/pages/troop/TroopIdStatusButton.tsx
```

Expected: no matches.

-   [ ] **Step 7: Commit the ScoutPass lifecycle adapter**

```bash
git add apps/scouts/src/pages/troop/troopIdStatus.helpers.ts \
  apps/scouts/src/pages/troop/__tests__/troopIdStatus.helpers.test.ts \
  apps/scouts/src/pages/troop/TroopIdStatusButton.tsx
git commit -m "fix: use authoritative ScoutPass ID status"
```

### Task 5: Propagate credential URIs and gate sharing/protected actions

**Files:**

-   Modify: `apps/scouts/src/components/boost/hooks/useBoostMenu.tsx`
-   Modify: `apps/scouts/src/components/boost/boost-options-menu/BoostOptionsMenu.tsx`
-   Modify: `apps/scouts/src/components/boost/boost-earned-card/BoostEarnedIDCard.tsx`
-   Modify: `apps/scouts/src/pages/ids/IdDisplayContainer.tsx`
-   Modify: `apps/scouts/src/pages/troop/TroopPage.tsx`
-   Modify: `apps/scouts/src/pages/troop/TroopPageIdAndTroopBox.tsx`
-   Modify: `apps/scouts/src/pages/troop/TroopPageFooter.tsx`
-   Modify: `apps/scouts/src/pages/troop/ViewTroopIdModal.tsx`
-   Modify: `apps/scouts/src/pages/troop/ViewTroopIdTemplate.tsx`
-   Test: `apps/scouts/src/pages/troop/__tests__/troopIdStatus.helpers.test.ts`

**Interfaces:**

-   Consumes: `useTroopIDStatus({ credential, credentialUri, issuanceState, enabled })` and `isCredentialActionRestricted(status)`.
-   Produces: `credentialUri?: string` across earned-ID display/detail props, `canShare` from `useBoostMenu`, and explicit `showShareButton` in `BoostOptionsMenu`.

-   [ ] **Step 1: Extend the status helper test with share/protected-action assertions**

Add a table test that treats unresolved, pending, suspended, and revoked states as restricted, and only valid as unrestricted:

```ts
it.each([
    [undefined, true],
    ['pending', true],
    ['suspended', true],
    ['revoked', true],
    ['valid', false],
] as const)('maps %s to restricted=%s', (status, expected) => {
    expect(isCredentialActionRestricted(status)).toBe(expected);
});
```

-   [ ] **Step 2: Run the helper test and confirm the gating contract**

Run:

```bash
bun test apps/scouts/src/pages/troop/__tests__/troopIdStatus.helpers.test.ts
```

Expected: PASS; this is the pure rule every UI entry point must consume.

-   [ ] **Step 3: Gate the options-menu Share action**

In `useBoostMenu.tsx`, call lifecycle status only for earned Troop IDs using the second argument (`boostUri`) as the credential-record URI:

```ts
const isTroopID = isTroopCategory(categoryType as BoostCategoryOptionsEnum);
const { status, isLoading: statusLoading } = useTroopIDStatus({
    credential: boost as VC,
    credentialUri: boostUri,
    enabled: menuType === BoostMenuType.earned && isTroopID,
});
const canShare = !isTroopID || (!statusLoading && !isCredentialActionRestricted(status));
```

Pass `showShareButton={menuType === BoostMenuType.earned && canShare}` to `BoostOptionsMenu`, guard `handleShareBoost` with `if (!canShare) return false`, and return `canShare` from the hook.

In `BoostOptionsMenu.tsx`, add `showShareButton?: boolean` and change the menu condition to:

```ts
if (menuType === BoostMenuType.earned && showShareButton) {
    boostMenuOptions.push({
        id: 2,
        title: 'Share',
        icon: <ReplyIcon version="2" className="text-grayscale-900" />,
        onClick: handleShare,
    });
}
```

-   [ ] **Step 4: Pass the earned credential-record URI through card and detail views**

Add `credentialUri?: string` and `canShare?: boolean` to `IdDisplayContainerProps`, with `canShare = true` in the component destructuring so non-Troop call sites keep their existing behavior. In `BoostEarnedIDCard.tsx`:

```tsx
const { handlePresentBoostMenuModal, canShare } = useBoostMenu(
    credential as VC,
    uri ?? '',
    credential as Boost,
    credentialCategoryType,
    BoostMenuType.earned
);

const presentShareBoostLink = () => {
    if (!credential || !canShare) return;
    newPreviewModal(
        <ShareTroopIdModal
            credential={(credential as VC & { boostCredential?: VC }).boostCredential ?? credential}
            uri={(credential as VC & { boostId?: string }).boostId ?? uri ?? ''}
        />,
        { sectionClassName: '!bg-transparent !shadow-none !max-w-[355px]' },
        { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
    );
};

// Add these props to the existing IdDisplayContainer call:
credentialUri = { uri };
canShare = { canShare };
```

Pass this guarded callback to `BoostPreview`:

```tsx
qrCodeOnClick={
    canShare
        ? () => {
              closePreviewModal();
              presentShareBoostLink();
          }
        : undefined
}
```

-   [ ] **Step 5: Gate card QR actions and pass the URI into `TroopPage`**

In `IdDisplayContainer.tsx`:

```tsx
<TroopIdStatusButton credential={cred?.boostCredential ?? cred} credentialUri={credentialUri} />;

{
    !loading && canShare && (
        <button
            onClick={event => {
                event.stopPropagation();
                handleQRCodeClick();
            }}
            className="absolute top-[10px] right-[10px] flex items-center justify-center bg-white rounded-full p-[10px] z-50 shadow-3xl"
        >
            <QRCodeScanner className="h-[30px] w-[30px] text-grayscale-900" />
        </button>
    );
}

<TroopPage
    credential={cred.boostCredential ?? cred}
    credentialUri={credentialUri}
    handleShare={handleQRCodeClick}
/>;
```

Managed cards pass neither `credentialUri` nor `canShare`; their Boost URI must not reach the holder lifecycle hook.

-   [ ] **Step 6: Distinguish held record URI from managed Boost URI in `TroopPage`**

Add `credentialUri?: string` to `TroopPageProps`. Keep `_boostUri` for Boost queries, request both accepted and pending recipient metadata, and derive holder state separately:

```ts
const { data: recipients } = useGetBoostRecipients(_boostUri, true, true);
const holderCredentialUri = credentialUri ?? currentUserRecipient?.uri;
const ownsCurrentId = Boolean(credentialUri) || (recipients ? Boolean(currentUserRecipient) : true);
const holderIssuanceState = currentUserRecipient
    ? currentUserRecipient.received
        ? 'accepted'
        : 'pending'
    : 'accepted';
const { status, isLoading: lifecycleLoading } = useTroopIDStatus({
    credential: _credential,
    credentialUri: holderCredentialUri,
    issuanceState: holderIssuanceState,
    enabled: ownsCurrentId && Boolean(holderCredentialUri),
});
const isRestricted =
    !hasParentAdminAccess && (lifecycleLoading || isCredentialActionRestricted(status));
```

Pass `holderCredentialUri` and `holderIssuanceState` to `TroopPageIdAndTroopBox`, hide `TroopChildrenBox` and `TroopPageMembersBox` when `isRestricted`, and pass `isRestricted` to the footer. Parent-admin managed views retain their explicit access bypass without manufacturing holder status.

-   [ ] **Step 7: Use the same status in the ID box and footer**

Add `credentialUri?: string` and `issuanceState?: TroopIdIssuanceState` to `TroopPageIdAndTroopBoxProps`, pass both to the hook and `TroopIdStatusButton`, and compute:

```ts
const isRestricted = lifecycleLoading || isCredentialActionRestricted(status);
```

The QR button must be disabled and have `disabled:opacity-40 disabled:cursor-not-allowed` when restricted. Rename the footer prop from `isRevoked` to `isRestricted`, suppress its protected options for all restricted states, and change its edit guard to `const showEditButton = !isRestricted && role !== ScoutsRoleEnum.scout && canEdit`.

-   [ ] **Step 8: Gate sharing in the full-screen member ID view**

Add `credentialUri?: string` and `issuanceState?: TroopIdIssuanceState` to `ViewTroopIdModalProps` and `ViewTroopIdTemplateProps`. In `ViewTroopIdModal.tsx`, derive:

```ts
const { status, isLoading: statusLoading } = useTroopIDStatus({
    credential,
    credentialUri,
    issuanceState,
    enabled: Boolean(credentialUri),
});
const canShare = !statusLoading && !isCredentialActionRestricted(status);
```

Resolve the exact issuance instead of overwriting it with the Boost template:

```ts
const { data: resolvedCredential } = useResolveBoost(credentialUri ?? boostUri);
credential = resolvedCredential?.boostCredential ?? resolvedCredential ?? credential;
```

Pass `credentialUri` and `issuanceState` to `ViewTroopIdTemplate`. Render its divet QR button and footer Share button only when `handleShare && canShare`. In `ViewTroopIdTemplate.tsx`, change status visibility to `isHidden={isClaimMode && !isAlreadyClaimed}` and replace `otherUserProfileID` on the status button with:

```tsx
credentialUri={credentialUri}
issuanceState={issuanceState}
lifecycleEnabled={Boolean(credentialUri)}
```

-   [ ] **Step 9: Build ScoutPass and inspect every lifecycle call site**

Run:

```bash
bunx nx build scouts
rg -n "useTroopIDStatus\(" apps/scouts/src
rg -n "credentialUri=|showShareButton|canShare" \
  apps/scouts/src/components/boost \
  apps/scouts/src/pages/ids \
  apps/scouts/src/pages/troop
```

Expected: build passes; earned flows supply record URIs; managed flows omit them; every direct share entry point is guarded.

-   [ ] **Step 10: Commit URI propagation and action gating**

```bash
git add apps/scouts/src/components/boost/hooks/useBoostMenu.tsx \
  apps/scouts/src/components/boost/boost-options-menu/BoostOptionsMenu.tsx \
  apps/scouts/src/components/boost/boost-earned-card/BoostEarnedIDCard.tsx \
  apps/scouts/src/pages/ids/IdDisplayContainer.tsx \
  apps/scouts/src/pages/troop/TroopPage.tsx \
  apps/scouts/src/pages/troop/TroopPageIdAndTroopBox.tsx \
  apps/scouts/src/pages/troop/TroopPageFooter.tsx \
  apps/scouts/src/pages/troop/ViewTroopIdModal.tsx \
  apps/scouts/src/pages/troop/ViewTroopIdTemplate.tsx \
  apps/scouts/src/pages/troop/__tests__/troopIdStatus.helpers.test.ts
git commit -m "fix: gate ScoutPass actions by credential lifecycle"
```

### Task 6: Use group revocation for every administrator removal role

**Files:**

-   Modify: `apps/scouts/src/hooks/useTroopMembers.tsx`
-   Modify: `apps/scouts/src/pages/troop/TroopPageMembersBox.tsx`
-   Create: `apps/scouts/src/pages/troop/groupRemoval.helpers.ts`
-   Create: `apps/scouts/src/pages/troop/__tests__/groupRemoval.helpers.test.ts`
-   Modify: `apps/scouts/src/pages/troop/IdOptionsModal.tsx`

**Interfaces:**

-   Consumes: `useRevokeBoostRecipientGroup()` and `RevokeBoostRecipientGroupResult`.
-   Produces: member rows with `credentialUri`/`issuanceState` and one removal handler for Scout, Member, and Administrator rows.

-   [ ] **Step 1: Write full/partial response interpretation tests**

Create `groupRemoval.helpers.test.ts`:

```ts
import { describe, expect, it } from 'bun:test';
import { getGroupRemovalOutcome } from '../groupRemoval.helpers';

describe('getGroupRemovalOutcome', () => {
    it('accepts new and already-revoked complete outcomes', () => {
        expect(
            getGroupRemovalOutcome({
                revokedCredentialUris: ['credential:1'],
                alreadyRevokedCredentialUris: [],
                failedCredentialUris: [],
            })
        ).toBe('complete');
        expect(
            getGroupRemovalOutcome({
                revokedCredentialUris: [],
                alreadyRevokedCredentialUris: ['credential:1'],
                failedCredentialUris: [],
            })
        ).toBe('complete');
    });

    it('reports a retryable partial outcome when any URI failed', () => {
        expect(
            getGroupRemovalOutcome({
                revokedCredentialUris: ['credential:1'],
                alreadyRevokedCredentialUris: [],
                failedCredentialUris: ['credential:2'],
            })
        ).toBe('partial');
    });
});
```

-   [ ] **Step 2: Run the helper test and verify it fails**

Run:

```bash
bun test apps/scouts/src/pages/troop/__tests__/groupRemoval.helpers.test.ts
```

Expected: FAIL because the outcome helper does not exist.

-   [ ] **Step 3: Implement exact outcome interpretation**

Create `groupRemoval.helpers.ts`:

```ts
import type { RevokeBoostRecipientGroupResult } from '@learncard/types';

export type GroupRemovalOutcome = 'complete' | 'partial';

export const getGroupRemovalOutcome = (
    result: RevokeBoostRecipientGroupResult
): GroupRemovalOutcome => (result.failedCredentialUris.length === 0 ? 'complete' : 'partial');
```

-   [ ] **Step 4: Retain recipient issuance metadata in member rows**

Export or update `MemberRow` in `useTroopMembers.tsx`:

```ts
type MemberRow = {
    name: string;
    image: string;
    profileId: string;
    type: 'Scout' | 'Leader' | 'Admin';
    boostUri: string;
    credentialUri?: string;
    issuanceState: 'accepted' | 'pending';
    isPersonalId: boolean;
    canManageId: boolean;
};
```

Request accepted and pending issuances in all three recipient queries:

```ts
const { data: scoutRecipients } = useGetBoostRecipients(scoutBoostUri, !skipMembers, true);
const { data: leaderRecipients } = useGetBoostRecipients(troopBoostUri, !skipMembers, true);
const { data: currentBoostRecipients } = useGetBoostRecipients(uri, !skipMembers, true);
```

For every recipient mapping, preserve:

```ts
credentialUri: recipient.uri,
issuanceState: recipient.received ? 'accepted' : 'pending',
```

Keep deduplication by profile ID because the UI row represents a person and server-side removal now owns all-instance enumeration.

-   [ ] **Step 5: Pass issuance metadata to the options modal**

In `TroopPageMembersBox.tsx`, add:

```tsx
credentialUri={member.credentialUri}
issuanceState={member.issuanceState}
```

Place those two props on the existing `IdOptionsModal` element next to `boostUri={member.boostUri}` and `type={member.type}`.

Add both optional fields to `IdOptionsModalProps`:

```ts
credentialUri?: string;
issuanceState?: TroopIdIssuanceState;
```

Resolve the exact displayed issuance without changing the removal target:

```ts
const { data: resolvedCredential } = useResolveBoost(credentialUri ?? boostUri);
const displayCredential = resolvedCredential?.boostCredential ?? resolvedCredential ?? credential;
```

Pass `displayCredential`, `credentialUri`, and `issuanceState` into `ViewTroopIdModal` from `handleViewId`. Use `credentialUri ?? boostUri` only for resolving the exact credential shown; keep `boostUri` as the group-removal target.

-   [ ] **Step 6: Replace role-specific client orchestration with one group mutation**

In `IdOptionsModal.tsx`:

-   Remove `useWallet`, `useRevokeBoostRecipient`, `PermissionsByRole`, `removeBoostAdmin`, and `updateBoostPermissions` from administrator removal.
-   Keep the personal `Leave` branch unchanged.
-   Use one mutation for every non-personal removable row:

```ts
const { mutateAsync: revokeGroup, isPending: isRevoking } = useRevokeBoostRecipientGroup();

const handleRemoveFromGroup = async (): Promise<void> => {
    await confirm({
        text: `Are you sure you want to remove ${ownerName} from ${credential?.name}?`,
        onConfirm: async () => {
            try {
                const result = await revokeGroup({
                    boostUri,
                    recipientProfileId: ownerProfileId,
                });

                if (getGroupRemovalOutcome(result) === 'partial') {
                    presentToast(
                        `Some IDs could not be revoked. Please try removing ${ownerName} again.`,
                        { type: ToastTypeEnum.Error, hasDismissButton: true }
                    );
                    return;
                }

                presentToast(`${ownerName} has been removed from ${credential?.name}`, {
                    type: ToastTypeEnum.Success,
                    hasDismissButton: true,
                });
                closeAllModals();
            } catch (error) {
                log.error('Failed to remove group member', error);
                presentToast(`Failed to remove ${ownerName}. Please try again.`, {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            }
        },
        cancelButtonClassName:
            'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px]',
        confirmButtonClassName:
            'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
    });
};
```

Both the Administrator row and Scout/Member row call `handleRemoveFromGroup`.

-   [ ] **Step 7: Add a visible async state to the remove row**

Extend `IdOptionRow` with `disabled?: boolean` and render contextual copy:

```tsx
<IdOptionRow
    text={isRevoking ? 'Removing...' : `Remove from ${troopOrNetwork}`}
    icon={isRevoking ? <LoadingSpinner /> : <PeaceIcon />}
    onClick={handleRemoveFromGroup}
    disabled={isRevoking}
/>
```

Set the button's `disabled` attribute and add `disabled:opacity-40 disabled:cursor-not-allowed` to its existing classes.

-   [ ] **Step 8: Run outcome tests and build ScoutPass**

Run:

```bash
bun test apps/scouts/src/pages/troop/__tests__/groupRemoval.helpers.test.ts
bunx nx build scouts
```

Expected: response interpretation tests pass and all role paths compile against the group mutation.

-   [ ] **Step 9: Prove the old removal APIs are absent from the modal**

Run:

```bash
rg -n "useRevokeBoostRecipient|removeBoostAdmin|updateBoostPermissions|PermissionsByRole" \
  apps/scouts/src/pages/troop/IdOptionsModal.tsx
```

Expected: no matches.

-   [ ] **Step 10: Commit the unified removal flow**

```bash
git add apps/scouts/src/hooks/useTroopMembers.tsx \
  apps/scouts/src/pages/troop/TroopPageMembersBox.tsx \
  apps/scouts/src/pages/troop/groupRemoval.helpers.ts \
  apps/scouts/src/pages/troop/__tests__/groupRemoval.helpers.test.ts \
  apps/scouts/src/pages/troop/IdOptionsModal.tsx
git commit -m "fix: revoke every ID when removing ScoutPass members"
```

### Task 7: Retain revoked records, update documentation, and verify the runtime slice

**Files:**

-   Modify: `apps/scouts/src/AppRouter.tsx`
-   Modify: `docs/apps/scouts/credential-revocation.md`
-   Modify: `apps/scouts/AGENTS.md`
-   Verify: all files changed by Tasks 1–6

**Interfaces:**

-   Consumes: completed runtime behavior from Tasks 1–6.
-   Produces: ScoutPass no longer deletes revoked records during app startup and project guidance describes the authoritative model.

-   [ ] **Step 1: Remove deletion-based synchronization from ScoutPass**

Delete `useSyncRevokedCredentials` from the `learn-card-base` import in `AppRouter.tsx` and remove:

```ts
useSyncRevokedCredentials(enablePrefetch);
```

Do not remove the shared hook implementation or LearnCard App usage in this runtime cycle.

-   [ ] **Step 2: Update the ScoutPass revocation documentation**

Rewrite `docs/apps/scouts/credential-revocation.md` around these exact sections:

```md
# ScoutPass credential revocation

## Lifecycle source of truth

ScoutPass reads the issuer-controlled lifecycle recorded by LearnCard Network for the specific credential URI. If that record is unavailable, it verifies the credential's Bitstring Status List entry. A loading state, missing list entry, or request failure is never treated as proof of revocation.

## Removing a member

Removing a member revokes every active, pending, or suspended credential issued from that group ID to the profile. LearnCard also removes permissions, administrator grants, and connections created by those credentials. Repeating the operation is safe; a partial result remains visible so the administrator can retry.

## Holder experience

Revoked IDs remain in the holder's credential list and display **ID Revoked**. Suspended and unaccepted IDs display **ID Suspended** and **Pending Acceptance**. Sharing and membership-protected actions are unavailable in all three states.

## Legacy credentials

Credentials issued before Bitstring Status List support still receive authoritative LearnCard Network revocation, but their old signed copies cannot be changed. External cryptographic revocation for those IDs requires controlled reissuance, retirement or blocklisting of old identifiers, and verifier cutover in a separate migration cycle.
```

Use user-facing language in headings and explanatory prose; reserve graph and Bitstring terms for the technical lifecycle section.

-   [ ] **Step 3: Replace outdated agent guidance**

In `apps/scouts/AGENTS.md`, replace the recipient-list status table and parent-admin workaround text with:

```md
## Troop credential lifecycle

-   `learn-card-base/useCredentialStatus` is the shared authoritative holder lifecycle hook.
-   `TroopIdStatusButton.tsx` adapts lifecycle plus explicit acceptance metadata for ScoutPass presentation.
-   Earned views must pass a credential-record URI; managed views must not pass a Boost URI as a credential URI.
-   Missing/query-error recipient data must never be interpreted as revocation.
-   Administrator group removal uses `useRevokeBoostRecipientGroup`; the existing singular mutation remains per-instance.
-   Revoked credentials remain visible. Do not mount deletion-based revoked-credential synchronization in ScoutPass.
```

Keep the still-correct hierarchy and issuance guidance.

-   [ ] **Step 4: Run focused unit and integration verification**

Run:

```bash
bun run --cwd packages/learn-card-base test -- \
  src/hooks/__tests__/deriveLifecycleStatus.test.ts \
  src/hooks/__tests__/useCredentialStatus.test.tsx \
  src/react-query/mutations/__tests__/revokeBoostRecipientGroup.test.tsx
bun run --cwd apps/learn-card-app test:unit -- \
  src/hooks/__tests__/useCredentialStatus.test.ts
bun test \
  apps/scouts/src/pages/troop/__tests__/troopIdStatus.helpers.test.ts \
  apps/scouts/src/pages/troop/__tests__/groupRemoval.helpers.test.ts
env SEED=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
  bun run --cwd services/learn-card-network/brain-service test -- run \
  test/revoke-boost-recipient-group.spec.ts \
  test/revoke-suspend-per-instance.spec.ts \
  test/revoke-credential.spec.ts \
  test/scouts-hierarchy.spec.ts
```

Expected: every listed suite passes. DIDKit native fallback warnings and deliberate missing-entry migration-gap warnings are acceptable; test failures are not.

-   [ ] **Step 5: Run package builds**

Run:

```bash
bun run --cwd packages/learn-card-types build
bun run --cwd packages/plugins/learn-card-network build
bunx nx build scouts
```

Expected: all builds exit zero.

-   [ ] **Step 6: Run static acceptance searches**

Run:

```bash
rg -n "useSyncRevokedCredentials" apps/scouts/src
rg -n "isClaimedError|isAllError|useIsTroopIDRevokedFake" apps/scouts/src
rg -n "removeBoostAdmin|updateBoostPermissions" apps/scouts/src/pages/troop/IdOptionsModal.tsx
git diff --check
```

Expected: the three `rg` commands return no matches and `git diff --check` emits no errors.

-   [ ] **Step 7: Perform OrbStack-backed manual acceptance checks**

With the existing OrbStack Docker runtime, start the local services and ScoutPass in separate terminals:

```bash
orbctl start
bun run --cwd apps/scouts dev:services
```

```bash
bun run --cwd apps/scouts docker-start
```

Then verify:

1. Issue the same Scout ID twice to one profile and leave another issuance pending.
2. Suspend one accepted instance.
3. Remove the profile once and confirm the UI reports complete success.
4. Confirm member counts/list refresh and no membership-protected content remains for the holder.
5. Confirm each held record remains visible with `ID Revoked` and no Share/QR action.
6. Verify a status-enabled credential against its status-list endpoint and confirm the revocation bit is set.
7. Repeat removal and confirm it succeeds as an already-revoked no-op without duplicate notification.
8. Simulate an offline lifecycle request and confirm ScoutPass shows neither `ID Revoked` nor a false successful removal.

-   [ ] **Step 8: Commit retention and documentation**

```bash
git add apps/scouts/src/AppRouter.tsx \
  docs/apps/scouts/credential-revocation.md \
  apps/scouts/AGENTS.md
git commit -m "docs: describe ScoutPass authoritative revocation"
```

-   [ ] **Step 9: Confirm the branch is ready for review**

Run:

```bash
git status --short --branch
git log --oneline --decorate origin/main..HEAD
```

Expected: clean worktree and one focused commit per task, plus the approved design and implementation-plan commits.

## Final Acceptance Matrix

| Requirement                                   | Primary implementation    | Verification                                      |
| --------------------------------------------- | ------------------------- | ------------------------------------------------- |
| Authoritative holder lifecycle                | Task 1, Task 4            | Shared hook tests; Scout helper tests             |
| No error/list-absence false revocation        | Task 1, Task 4            | Fail-open hook cases; static search               |
| Revoke all active/pending/suspended instances | Task 2                    | Group integration suite                           |
| Bitstring revocation for capable credentials  | Task 2                    | Status-list bit assertions                        |
| Legacy gap visible without blocking runtime   | Task 2                    | Migration-gap log assertion                       |
| Idempotent retry repairs partial work         | Task 2                    | Partial-cleanup retry test                        |
| Existing per-instance API unchanged           | Task 2                    | Existing per-instance regression suite            |
| Typed plugin/client path                      | Task 3                    | Mutation test; plugin build                       |
| Retained revoked IDs                          | Task 7                    | Static search; manual holder check                |
| Share/protected actions disabled              | Task 5                    | Pure restriction tests; Scout build; manual check |
| Scout/Member/Admin removal unified            | Task 6                    | Outcome tests; static search; manual check        |
| Self-service Leave excluded                   | Global constraint, Task 6 | Review diff for unchanged personal branch         |
| Documentation current                         | Task 7                    | Documentation review                              |
