# Revocation / Suspension Follow-ups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the credential revocation/suspension lifecycle started in LC-1862 (PR #1271) — close the issuer/backend gaps (LC-1894) and add the holder-facing UX (LC-1913).

**Architecture:** Backend changes in the brain-service tRPC routes/helpers (Neo4j-backed): flip the default status-purpose set at issuance, add revoked/suspended counts to the activity-stats query, and emit holder notifications from the revoke/suspend/unsuspend routes. Frontend changes in learn-card-app: migrate the bespoke `useIntegrationActivity` fetcher to react-query so lifecycle mutations auto-refresh issuer views, and add a revoked/suspended visual treatment (seal-badge swap + colored corner pill + desaturation) to holder credential cards driven by a lazy, cached per-card status check.

**Tech Stack:** TypeScript, tRPC, Neo4j (neogma/Cypher), Zod, React, @tanstack/react-query, Vitest, W3C Bitstring Status List v2.

**Spec:** `docs/superpowers/specs/2026-07-07-revocation-followups-design.md`

**Reference — Figma revoked badge SVGs** (captured to scratchpad during brainstorming; re-export from Figma node `2422:101057` if the scratchpad is gone):

-   Seal outline path (fill = state color): the scalloped seal `<path d="M2.41061 1.63793C…Z">` (same silhouette as the verified badge).
-   White X: two strokes `M7.673 2.148 L2.148 7.673` and `M7.673 7.673 L2.148 2.148`, `stroke="#fff" stroke-width="1.5" stroke-linecap="round"`, in a 9.821px box offset `translate(1.964, 1.964)` inside a `0 0 13.75 13.75` viewBox.
-   Colors: revoked `#DC2626` (red-600), suspended `#EA580C` (orange-600), verified `#22c55e` (existing green).

---

## Conventions

-   **Run a single brain-service test file:** `cd services/learn-card-network/brain-service && bunx vitest run test/<file>.spec.ts` (append `-t "<test name>"` to run one test).
-   **Run a single learn-card-app test:** `bunx nx test learn-card-app --testFile=<path>` (or `bunx vitest run <path>` from the app dir).
-   **Type-check brain-service:** `cd services/learn-card-network/brain-service && bunx tsc --noEmit`.
-   Commit after every green step. Keep backend (LC-1894 A1/A3 + B1) and frontend commits separate so they can ship as coordinated PRs.

## File Structure

**Backend (brain-service):**

-   Modify `src/helpers/status-list.helpers.ts:306` — flip default `statusPurposes` to `['revocation', 'suspension']` (A1).
-   Modify `src/accesslayer/credential-activity/read.ts` — add `revoked`/`suspended` counts to `getActivityStatsForProfile` (A3).
-   Modify `src/types/activity.ts` — extend `CredentialActivityStatsValidator` with `revoked`/`suspended` (A3).
-   Modify `src/routes/boosts.ts` — emit holder notifications in `revokeBoostRecipient` (~1996), `suspendBoostRecipient` (~2083), `unsuspendBoostRecipient` (~2161) (B1).
-   Modify `packages/learn-card-types/src/lcn.ts:896` — add `CREDENTIAL_REVOKED`/`CREDENTIAL_SUSPENDED`/`CREDENTIAL_UNSUSPENDED` notification types (B1).
-   Tests: `test/bitstring-status-list.spec.ts` (A1), `test/credential-activity.spec.ts` or nearest activity test (A3), `test/boosts.*.spec.ts` (B1). Confirm exact test filenames in Task steps.

**Frontend (learn-card-app):**

-   Modify `packages/learn-card-base/src/react-query/mutations/mutations.ts` — add activity query invalidations to the three lifecycle mutations (A4).
-   Rewrite `apps/learn-card-app/src/pages/appStoreDeveloper/dashboards/hooks/useIntegrationActivity.ts` — react-query `useInfiniteQuery` (A4).
-   Modify `apps/learn-card-app/src/components/issuances/IssuanceList.tsx` + `IssuanceDetailModal.tsx` — remove `onActionComplete`/`refreshKey` plumbing (A4).
-   Modify `apps/learn-card-app/src/components/issuances/IssuancesSummary.tsx` — show revoked/suspended counts (A3 FE).
-   New `apps/learn-card-app/src/components/credential-status/CredentialStatusBadge.tsx` — seal-badge variant (`active | revoked | suspended`) (B3).
-   Modify holder credential card (`BoostEarnedCard.tsx` / issuer row) + wallet Earned-tab render (B2 + B3 + B4).
-   New/modify `apps/learn-card-app/src/stores/autoVerifyStore.ts` consumers — lazy per-card status hook (B2).

> **Execution order:** Tasks 1–4 are backend (A1, A2, A3, B1). Tasks 5–6 are the issuer-side frontend (A4 react-query migration, A3 summary). Tasks 7–9 are the holder-side frontend (B3 shared-card treatment, B2 lazy status, B4 earned-tab confirmation). Backend and frontend commit groups are separable into coordinated PRs.

---

## Task 1: A1 — Flip default statusPurposes so suspension is externally verifiable

**Files:**

-   Modify: `services/learn-card-network/brain-service/src/helpers/status-list.helpers.ts:306`
-   Test: `services/learn-card-network/brain-service/test/bitstring-status-list.spec.ts`

-   [ ] **Step 1: Write the failing test**

Add this test inside the `describe('Bitstring Status List issuance', …)` block in `test/bitstring-status-list.spec.ts` (it reuses the existing `sendBoostWithStatus` helper and `getEntryForPurpose`/`isStatusBitSet` helpers already in the file):

```typescript
it('allocates BOTH revocation and suspension entries by default (no statusPurposes passed)', async () => {
    // sendBoostWithStatus() with the default arg issues a plain boost credential
    // WITHOUT passing statusPurposes, so it exercises the backend default.
    const { credential } = await sendBoostWithStatus();

    // Revocation entry still present (existing behavior)
    expect(getEntryForPurpose(credential, 'revocation').type).toBe('BitstringStatusListEntry');
    // NEW: suspension entry is now present by default
    expect(getEntryForPurpose(credential, 'suspension').type).toBe('BitstringStatusListEntry');
    // Both bits start unset
    expect(await isStatusBitSet(getEntryForPurpose(credential, 'revocation'))).toBe(false);
    expect(await isStatusBitSet(getEntryForPurpose(credential, 'suspension'))).toBe(false);
});
```

-   [ ] **Step 2: Run test to verify it fails**

Run: `cd services/learn-card-network/brain-service && bunx vitest run test/bitstring-status-list.spec.ts -t "allocates BOTH revocation and suspension"`
Expected: FAIL — `getEntryForPurpose` throws `Missing suspension status entry` (only revocation is allocated today).

-   [ ] **Step 3: Flip the default**

In `src/helpers/status-list.helpers.ts`, change the `appendBitstringStatusListEntries` default parameter:

```typescript
export const appendBitstringStatusListEntries = async (
    credential: UnsignedVC,
    ownerProfileId: string,
    domain: string,
    statusPurposes: BitstringStatusPurpose[] = ['revocation', 'suspension']
): Promise<UnsignedVC> => {
```

(Only line 306 changes: `['revocation']` → `['revocation', 'suspension']`. The existing `alreadyHasPurpose` guard inside the function makes this idempotent for credentials that already carry a purpose.)

-   [ ] **Step 4: Run test to verify it passes**

Run: `cd services/learn-card-network/brain-service && bunx vitest run test/bitstring-status-list.spec.ts`
Expected: PASS — the new test passes and all pre-existing status-list tests still pass (the `'adds a revocation entry…'` and suspend/unsuspend tests are unaffected).

-   [ ] **Step 5: Update docs**

Search docs for any statement that suspension is opt-in via `statusPurposes`:

Run: `grep -rn "statusPurposes" docs/`
For each hit describing suspension as opt-in (e.g. `sendBoost(..., { statusPurposes: ['revocation','suspension'] })`), update the prose to state that revocation **and** suspension entries are now allocated by default at issuance. If there are no such docs, note "no doc changes needed" in the commit body.

-   [ ] **Step 6: Commit**

```bash
git add services/learn-card-network/brain-service/src/helpers/status-list.helpers.ts \
        services/learn-card-network/brain-service/test/bitstring-status-list.spec.ts
# add any docs touched in Step 5
git commit -m "feat(status-list): allocate suspension entry by default at issuance (LC-1894)

Flip appendBitstringStatusListEntries default statusPurposes to
['revocation','suspension'] so suspended credentials are externally
verifiable. Only affects newly-issued VC2 credentials.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

> **Coordination note for the executor:** This changes every newly-issued credential's shape/size. Do not merge the PR containing this task until Taylor (#1223 author) has been given a heads-up. Implementation can proceed now.

---

## Task 2: A2 — Verify >25-recipient status coverage (regression guard, no product code expected)

**Files:**

-   Test: `services/learn-card-network/brain-service/test/` (add to the nearest activity/boost-recipient status test; confirm filename with `ls test | grep -i activ`)

-   [ ] **Step 1: Locate the activity/status test file**

Run: `cd services/learn-card-network/brain-service && ls test | grep -iE "activ|recipient|boost"`
Pick the file that already exercises `getMyActivities` / per-instance `credStatus` (activity status). If none exists, create `test/credential-activity-status.spec.ts` following the setup pattern in `test/bitstring-status-list.spec.ts` (same `getUser`, `beforeEach` cleanup).

-   [ ] **Step 2: Write the test — status is correct beyond 25 recipients**

Add a test that issues one boost to 26 recipients, revokes the credential of the **26th** recipient, then asserts `getMyActivities` (or `getActivitiesForProfile`) reports that instance's `status === 'revoked'` while an unrevoked instance reports `active`. Skeleton (adapt identifiers to the chosen test file's existing helpers):

```typescript
it('reports per-instance revoked status beyond the historical 25-recipient cap', async () => {
    const boostUri = await userA.clients.fullAuth.boost.createBoost({
        credential: statusBoostTemplate,
    });

    const recipientUris: string[] = [];
    for (let i = 0; i < 26; i++) {
        // create/lookup recipient i, send the boost, collect the credentialUri
        recipientUris.push(await sendBoostToRecipient(userA, boostUri, i));
    }

    // Revoke the 26th recipient's instance (index 25) — beyond the old cap
    await userA.clients.fullAuth.boost.revokeBoostRecipient({
        boostUri,
        recipientProfileId: recipientProfileIdFor(25),
        credentialUri: recipientUris[25],
    });

    const activities = await userA.clients.fullAuth.activity.getMyActivities({
        boostUri,
        limit: 100,
    });
    const revokedRecord = activities.records.find(r => r.credentialUri === recipientUris[25]);
    const activeRecord = activities.records.find(r => r.credentialUri === recipientUris[0]);

    expect(revokedRecord?.status).toBe('revoked');
    expect(activeRecord?.status).toBe('active');
});
```

-   [ ] **Step 3: Run the test**

Run: `cd services/learn-card-network/brain-service && bunx vitest run test/<chosen-file>.spec.ts -t "beyond the historical 25-recipient cap"`
Expected: **PASS** with no product-code change (PR #1271 already reads status per-instance off the activity record). If it FAILS, the 25-cap gap is real — stop and fold the fix into `getActivitiesForProfile` in `src/accesslayer/credential-activity/read.ts` (surface `credStatus` for all recipients, not a capped overlay), then re-run.

-   [ ] **Step 4: Commit**

```bash
git add services/learn-card-network/brain-service/test/
git commit -m "test(activity): guard per-instance status beyond 25 recipients (LC-1894 A2)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: A3 — Add revoked/suspended counts to activity stats

**Files:**

-   Modify: `services/learn-card-network/brain-service/src/types/activity.ts:72-82`
-   Modify: `services/learn-card-network/brain-service/src/accesslayer/credential-activity/read.ts:203-347` (`getActivityStatsForProfile`)
-   Test: `services/learn-card-network/brain-service/test/<activity stats test>.spec.ts`

-   [ ] **Step 1: Extend the stats type**

In `src/types/activity.ts`, add two fields to `CredentialActivityStatsValidator`:

```typescript
export const CredentialActivityStatsValidator = z.object({
    totalEvents: z.number(),
    total: z.number(),
    created: z.number(),
    delivered: z.number(),
    claimed: z.number(),
    expired: z.number(),
    failed: z.number(),
    revoked: z.number(),
    suspended: z.number(),
    claimRate: z.number(),
});
```

-   [ ] **Step 2: Write the failing test**

Add a test (in the activity-stats test file; confirm name via `ls test | grep -i activ`) that sends a boost to 2 recipients, revokes one and suspends the other, then asserts the stats counts. Skeleton:

```typescript
it('returns revoked and suspended counts in activity stats', async () => {
    const { boostUri, revokedUri, suspendedUri } = await seedRevokedAndSuspended(); // helper: 2 recipients, 1 revoked, 1 suspended
    const stats = await userA.clients.fullAuth.activity.getActivityStats({ boostUris: [boostUri] });

    expect(stats.revoked).toBe(1);
    expect(stats.suspended).toBe(1);
});
```

-   [ ] **Step 3: Run test to verify it fails**

Run: `cd services/learn-card-network/brain-service && bunx vitest run test/<file>.spec.ts -t "revoked and suspended counts"`
Expected: FAIL — `stats.revoked` is `undefined` (Zod output would also reject; property does not exist yet).

-   [ ] **Step 4: Join credStatus and count in the Cypher query**

In `getActivityStatsForProfile` (`src/accesslayer/credential-activity/read.ts`), after the `latestEvent` reduction and before the aggregation `WITH`, join the credential relationship exactly as `getActivitiesForProfile` does, then add `revoked`/`suspended` sums. Replace the aggregation query body so it reads:

```typescript
const query = `
        MATCH (a:CredentialActivity)
        ${whereClause}
        ${boostIds?.length ? 'MATCH (a)-[:FOR_BOOST]->(b:Boost)' : ''}
        ${boostFilter}
        WITH a.activityId as aid, COLLECT(a) as events
        WITH aid, events, REDUCE(latest = HEAD(events), e IN TAIL(events) |
            CASE WHEN e.timestamp > latest.timestamp THEN e ELSE latest END) as latestEvent
        ${postGroupFilter}
        WITH latestEvent
        OPTIONAL MATCH (sender)-[sent:CREDENTIAL_SENT { activityId: latestEvent.activityId }]->(cred:Credential)
            WHERE sender:Profile OR sender:AppStoreListing
        OPTIONAL MATCH (cred)-[received:CREDENTIAL_RECEIVED]->(:Profile)
        WITH latestEvent, coalesce(sent.status, received.status) AS credStatus
        WITH
            COUNT(DISTINCT latestEvent.activityId) as total,
            SUM(CASE WHEN latestEvent.eventType = 'CREATED' THEN 1 ELSE 0 END) as created,
            SUM(CASE WHEN latestEvent.eventType = 'DELIVERED' THEN 1 ELSE 0 END) as delivered,
            SUM(CASE WHEN latestEvent.eventType = 'CLAIMED' THEN 1 ELSE 0 END) as claimed,
            SUM(CASE WHEN latestEvent.eventType = 'EXPIRED' THEN 1 ELSE 0 END) as expired,
            SUM(CASE WHEN latestEvent.eventType = 'FAILED' THEN 1 ELSE 0 END) as failed,
            SUM(CASE WHEN credStatus = 'revoked' THEN 1 ELSE 0 END) as revoked,
            SUM(CASE WHEN credStatus = 'suspended' THEN 1 ELSE 0 END) as suspended
        RETURN total, created, delivered, claimed, expired, failed, revoked, suspended
    `;
```

Then read and return the two new counts alongside the others. Add, next to the existing `failedVal` extraction:

```typescript
const revokedVal = record.get('revoked');
const suspendedVal = record.get('suspended');
const revoked =
    typeof revokedVal?.toNumber === 'function' ? revokedVal.toNumber() : revokedVal ?? 0;
const suspended =
    typeof suspendedVal?.toNumber === 'function' ? suspendedVal.toNumber() : suspendedVal ?? 0;
```

Add `revoked` and `suspended` to BOTH the success `return { … }` and the two early-return zero objects (the `result.records.length === 0` and `!record` branches):

```typescript
return {
    totalEvents: created + delivered + claimed + expired + failed,
    total,
    created,
    delivered,
    claimed,
    expired,
    failed,
    revoked,
    suspended,
    claimRate: Math.round(claimRate * 100) / 100,
};
```

```typescript
    // both early-return objects gain:
        revoked: 0,
        suspended: 0,
```

-   [ ] **Step 5: Run test to verify it passes**

Run: `cd services/learn-card-network/brain-service && bunx vitest run test/<file>.spec.ts -t "revoked and suspended counts"`
Expected: PASS. Also run the full file to confirm existing stats tests still pass.

-   [ ] **Step 6: Type-check**

Run: `cd services/learn-card-network/brain-service && bunx tsc --noEmit`
Expected: no new errors. (The two early-return objects and the success return must all include `revoked`/`suspended` or `tsc` will flag the missing properties against the widened `CredentialActivityStats` type.)

-   [ ] **Step 7: Commit**

```bash
git add services/learn-card-network/brain-service/src/types/activity.ts \
        services/learn-card-network/brain-service/src/accesslayer/credential-activity/read.ts \
        services/learn-card-network/brain-service/test/
git commit -m "feat(activity): count revoked/suspended in getActivityStats (LC-1894 A3)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

> The frontend surfacing of these counts in `IssuancesSummary` is Task 7 (A3-FE), grouped with the react-query work so the summary refreshes correctly.

---

## Task 4: B1 — Notify holder on internal revoke / suspend / unsuspend

**Files:**

-   Modify: `packages/learn-card-types/src/lcn.ts:896-920` (notification type enum)
-   Modify: `services/learn-card-network/brain-service/src/routes/boosts.ts` — `revokeBoostRecipient` (~1996), `suspendBoostRecipient` (~2083), `unsuspendBoostRecipient` (~2161)
-   Test: `services/learn-card-network/brain-service/test/<boosts revoke test>.spec.ts`

-   [ ] **Step 1: Add notification types**

In `packages/learn-card-types/src/lcn.ts`, extend `LCNNotificationTypeEnumValidator` (currently ends `…, 'APP_NOTIFICATION']`) with three new members:

```typescript
export const LCNNotificationTypeEnumValidator = z.enum([
    'CONNECTION_REQUEST',
    // …existing members unchanged…
    'APP_NOTIFICATION',
    'CREDENTIAL_REVOKED',
    'CREDENTIAL_SUSPENDED',
    'CREDENTIAL_UNSUSPENDED',
]);
```

-   [ ] **Step 2: Build the notifications packages**

Run: `bunx nx build learn-card-types`
Expected: build succeeds so the brain-service picks up the new enum members.

-   [ ] **Step 3: Write the failing test**

In the boosts revoke/suspend test (confirm filename via `ls services/learn-card-network/brain-service/test | grep -iE "boost|revoke"`), add a test that asserts a notification is queued on revoke. The repo delivers notifications to cache under `e2e:notification-queue:*` when `IS_E2E_TEST` is set, and skips delivery under unit tests — so assert against the helper. Preferred approach: spy on `addNotificationToQueue`. Skeleton:

```typescript
import * as notifications from '../src/helpers/notifications.helpers';

it('queues a CREDENTIAL_REVOKED notification to the holder on revoke', async () => {
    const spy = vi
        .spyOn(notifications, 'addNotificationToQueue')
        .mockResolvedValue(undefined as any);

    const { boostUri, credentialUri, recipientProfileId } = await seedClaimedBoost(); // 1 recipient, claimed
    await userA.clients.fullAuth.boost.revokeBoostRecipient({
        boostUri,
        recipientProfileId,
        credentialUri,
    });

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'CREDENTIAL_REVOKED' }));
    spy.mockRestore();
});
```

-   [ ] **Step 4: Run test to verify it fails**

Run: `cd services/learn-card-network/brain-service && bunx vitest run test/<file>.spec.ts -t "CREDENTIAL_REVOKED notification"`
Expected: FAIL — `addNotificationToQueue` is never called by the revoke route yet.

-   [ ] **Step 5: Emit the notification in each route**

At the top of `src/routes/boosts.ts`, ensure these imports exist (add if missing — check the existing import block):

```typescript
import { addNotificationToQueue } from '@helpers/notifications.helpers';
import { getDidWeb } from '@helpers/did.helpers';
import { LCNNotificationTypeEnumValidator } from '@learncard/types';
```

In `revokeBoostRecipient`, replace the final `return true;` (after `await processRevokeHooks(recipientProfile, credential);`) with:

```typescript
// Notify the holder (fire-and-forget — must not fail the revoke)
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
            did: getDidWeb(ctx.domain, profile.profileId),
            profileId: profile.profileId,
            displayName: profile.displayName,
        },
        message: {
            title: 'Credential revoked',
            body: `Your "${boost.name ?? 'credential'}" was revoked by ${
                profile.displayName ?? profile.profileId
            }.`,
        },
        data: { vcUris: [credential.id] },
    });
} catch (e) {
    console.error('Failed to queue CREDENTIAL_REVOKED notification', e);
}

return true;
```

In `suspendBoostRecipient`, replace its final `return true;` with the same block but `type: …enum.CREDENTIAL_SUSPENDED`, title `'Credential suspended'`, body `Your "${boost.name ?? 'credential'}" was suspended by ${…}.`

In `unsuspendBoostRecipient`, replace its final `return true;` with the same block but `type: …enum.CREDENTIAL_UNSUSPENDED`, title `'Credential reinstated'`, body `Your "${boost.name ?? 'credential'}" was reinstated by ${…}.` — note this route does **not** fetch `recipientProfile`, so drop the `notificationsWebhook` spread (or add a `getProfileByProfileId(resolvedRecipientProfileId)` lookup mirroring the other two routes if the webhook is needed; keep it simple and omit the webhook spread).

-   [ ] **Step 6: Run test to verify it passes**

Run: `cd services/learn-card-network/brain-service && bunx vitest run test/<file>.spec.ts -t "CREDENTIAL_REVOKED notification"`
Expected: PASS.

-   [ ] **Step 7: Add suspend + unsuspend notification assertions**

Mirror the Step 3 test for suspend (`CREDENTIAL_SUSPENDED`) and unsuspend (`CREDENTIAL_UNSUSPENDED`), run them, expect PASS.

-   [ ] **Step 8: Type-check + commit**

Run: `cd services/learn-card-network/brain-service && bunx tsc --noEmit` (expect no new errors).

```bash
git add packages/learn-card-types/src/lcn.ts services/learn-card-network/brain-service/src/routes/boosts.ts \
        services/learn-card-network/brain-service/test/
git commit -m "feat(notifications): notify holder on revoke/suspend/unsuspend (LC-1913 B1)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: A4 — Migrate `useIntegrationActivity` to react-query

**Files:**

-   Modify: `packages/learn-card-base/src/react-query/mutations/mutations.ts` — `useRevokeBoostRecipient` (507-546), `useSuspendBoostRecipient` (554-591), `useUnsuspendBoostRecipient` (596-633)
-   Rewrite: `apps/learn-card-app/src/pages/appStoreDeveloper/dashboards/hooks/useIntegrationActivity.ts`
-   Modify: `apps/learn-card-app/src/components/issuances/IssuanceList.tsx` (remove `refreshKey`)
-   Modify: `apps/learn-card-app/src/components/issuances/IssuanceDetailModal.tsx` (remove `onActionComplete`)
-   Modify: `apps/learn-card-app/src/pages/appStoreDeveloper/dashboards/UnifiedIntegrationDashboard.tsx` (remove `refreshKey` state)
-   Modify: `apps/learn-card-app/src/pages/appStoreDeveloper/dashboards/tabs/OverviewTab.tsx` (remove `refreshKey` prop)

-   [ ] **Step 1: Add activity-query invalidations to the three lifecycle mutations**

In `mutations.ts`, in EACH of the three hooks' `onSuccess` blocks, add two invalidations alongside the existing ones (after the `['boosts']` invalidation, before/after `['useNetworkMembers']` — order doesn't matter):

```typescript
queryClient.invalidateQueries({
    queryKey: ['getMyActivities'],
});
queryClient.invalidateQueries({
    queryKey: ['getActivityStats'],
});
```

Apply the identical addition to `useRevokeBoostRecipient`, `useSuspendBoostRecipient`, and `useUnsuspendBoostRecipient`. (An `invalidateQueries` with a prefix key matches any query whose key starts with that prefix, so these reach the keyed queries created in Step 3.)

-   [ ] **Step 2: Build the base package**

Run: `bunx nx build learn-card-base`
Expected: build succeeds.

-   [ ] **Step 3: Rewrite the hook body to use react-query**

Replace the hook implementation in `useIntegrationActivity.ts` (the `export function useIntegrationActivity(...)` block, lines 193-349) with the react-query version below. **Keep all the exported helper functions and interfaces above/below it unchanged** (`getActivityLabel`, `formatRelativeTime`, etc.). Also extend the local `CredentialActivityStats` interface (lines 39-48) and the `IntegrationActivityResult['stats']` shape (lines 169-178) with `revoked` and `suspended`:

```typescript
// lines 39-48 — add revoked/suspended:
interface CredentialActivityStats {
    totalEvents: number;
    total: number;
    created: number;
    delivered: number;
    claimed: number;
    expired: number;
    failed: number;
    revoked: number;
    suspended: number;
    claimRate: number;
}
```

```typescript
// IntegrationActivityResult.stats — add revoked/suspended:
stats: {
    totalSent: number;
    totalClaimed: number;
    total: number;
    totalEvents: number;
    expired: number;
    failed: number;
    revoked: number;
    suspended: number;
    pendingClaims: number;
    claimRate: number;
}
```

Then the new hook body (replaces lines 193-349), adding this import near the top of the file (`import { useWallet } from 'learn-card-base';` already exists):

```typescript
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';

const EMPTY_STATS: IntegrationActivityResult['stats'] = {
    totalSent: 0,
    totalClaimed: 0,
    total: 0,
    totalEvents: 0,
    expired: 0,
    failed: 0,
    revoked: 0,
    suspended: 0,
    pendingClaims: 0,
    claimRate: 0,
};

export function useIntegrationActivity(
    templates: CredentialTemplate[],
    options: {
        limit?: number;
        integrationId?: string;
        listingId?: string;
        eventType?: CredentialEventType;
        boostUri?: string;
    } = {}
): IntegrationActivityResult {
    const { limit = 25, integrationId, listingId, eventType, boostUri } = options;
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    const boostUris = templates.map(t => t.boostUri).filter(Boolean) as string[];
    const boostUrisKey = boostUris.join(',');

    const activityQuery = useInfiniteQuery({
        queryKey: ['getMyActivities', { limit, integrationId, listingId, eventType, boostUri }],
        initialPageParam: undefined as string | undefined,
        queryFn: async ({ pageParam }) => {
            const wallet = await initWallet();
            const result = await (wallet.invoke as any).getMyActivities?.({
                limit,
                cursor: pageParam,
                integrationId,
                listingId,
                eventType,
                boostUri,
            });
            return {
                records: (result?.records ?? []) as CredentialActivityRecord[],
                cursor: result?.cursor as string | undefined,
                hasMore: (result?.hasMore ?? false) as boolean,
            };
        },
        getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.cursor : undefined),
    });

    const statsQuery = useQuery({
        queryKey: [
            'getActivityStats',
            { integrationId, listingId, boostUri, boostUris: boostUrisKey },
        ],
        queryFn: async () => {
            const wallet = await initWallet();
            const result = await (wallet.invoke as any).getActivityStats?.({
                boostUris: boostUri
                    ? [boostUri]
                    : !integrationId && !listingId && boostUris.length > 0
                    ? boostUris
                    : undefined,
                integrationId,
                listingId,
                boostUri,
            });
            return (result ?? undefined) as CredentialActivityStats | undefined;
        },
    });

    const activity = activityQuery.data?.pages.flatMap(p => p.records) ?? [];

    const apiStats = statsQuery.data;
    const stats: IntegrationActivityResult['stats'] = apiStats
        ? {
              totalSent: apiStats.delivered + apiStats.created + apiStats.claimed,
              totalClaimed: apiStats.claimed,
              total: apiStats.total,
              totalEvents: apiStats.totalEvents,
              expired: apiStats.expired,
              failed: apiStats.failed,
              revoked: apiStats.revoked ?? 0,
              suspended: apiStats.suspended ?? 0,
              pendingClaims: apiStats.delivered + apiStats.created,
              claimRate: apiStats.claimRate,
          }
        : EMPTY_STATS;

    const refetch = () => {
        activityQuery.refetch();
        statsQuery.refetch();
    };

    const loadMore = async () => {
        if (activityQuery.hasNextPage && !activityQuery.isFetchingNextPage) {
            await activityQuery.fetchNextPage();
        }
    };

    return {
        activity,
        isLoading: activityQuery.isLoading,
        isLoadingMore: activityQuery.isFetchingNextPage,
        hasMore: activityQuery.hasNextPage ?? false,
        error: (activityQuery.error ?? statsQuery.error ?? null) as Error | null,
        refetch,
        loadMore,
        stats,
    };
}
```

(`useQueryClient` is imported but only needed if you later add manual invalidation; it can be dropped if unused to avoid a lint warning. Remove the now-unused `useState`/`useEffect`/`useRef`/`useCallback`/`getLogger` imports if nothing else in the file uses them — check with `grep -n "useState\|useEffect\|useRef\|useCallback\|getLogger" useIntegrationActivity.ts`.)

-   [ ] **Step 4: Remove the `refreshKey` plumbing (now redundant)**

In `IssuanceList.tsx`: delete the `refreshKey?: number;` prop from `IssuanceListProps` (line 48), remove `refreshKey,` from the destructure (line 63), delete the refetch effect (lines 85-90), and remove `onActionComplete={refetch}` from the modal render — the `handleActivityItemClick` becomes:

```tsx
const handleActivityItemClick = (item: CredentialActivityRecord) => {
    newModal(<IssuanceDetailModal item={item} surface={surface} />, {
        sectionClassName: '!max-w-[450px]',
    });
};
```

In `OverviewTab.tsx`: remove `refreshKey?: number;` (line 27), the `refreshKey,` destructure (line 39), and the `refreshKey={refreshKey}` line passed to `<IssuanceList>` (line 181).

In `UnifiedIntegrationDashboard.tsx`: remove `const [refreshKey, setRefreshKey] = useState(0);` (line 189), remove the `setRefreshKey(k => k + 1);` line inside `handleRefresh` (keep `loadDashboardData(true)` and `refetchActivity()`), and remove `refreshKey={refreshKey}` passed to `<OverviewTab>` (line 575).

-   [ ] **Step 5: Remove the `onActionComplete` callback (now redundant)**

In `IssuanceDetailModal.tsx`: delete the `onActionComplete?: () => void;` prop and its JSDoc (lines 54-58), remove `onActionComplete` from the destructure (line 94), and remove the `onActionComplete?.();` call (line 169). **Keep** the `statusOverride` optimistic state (lines 101-103, 112-113, 161-168) — it drives immediate in-modal feedback and is orthogonal to cross-view refresh, which react-query now handles.

-   [ ] **Step 6: Type-check the frontend**

Run: `bunx tsc --noEmit -p apps/learn-card-app/tsconfig.json`
Expected: no new errors. In particular, no remaining references to `refreshKey` or `onActionComplete`.
Run: `grep -rn "refreshKey\|onActionComplete" apps/learn-card-app/src/components/issuances apps/learn-card-app/src/pages/appStoreDeveloper/dashboards`
Expected: no matches (all removed).

-   [ ] **Step 7: Manual/behavioral check**

Per the spec's acceptance criteria: revoke/suspend/unsuspend from the dashboard **and** the Managed tab must refresh the activity list, stats, and the Managed-tab `IssuancesSummary` with no hard refresh. If a dev server is available, verify; otherwise rely on the react-query invalidation wiring (Step 1) + the shared query keys (Step 3).

-   [ ] **Step 8: Commit**

```bash
git add packages/learn-card-base/src/react-query/mutations/mutations.ts \
        apps/learn-card-app/src/pages/appStoreDeveloper/dashboards/hooks/useIntegrationActivity.ts \
        apps/learn-card-app/src/components/issuances/IssuanceList.tsx \
        apps/learn-card-app/src/components/issuances/IssuanceDetailModal.tsx \
        apps/learn-card-app/src/pages/appStoreDeveloper/dashboards/UnifiedIntegrationDashboard.tsx \
        apps/learn-card-app/src/pages/appStoreDeveloper/dashboards/tabs/OverviewTab.tsx
git commit -m "refactor(activity): migrate useIntegrationActivity to react-query (LC-1894 A4)

useInfiniteQuery for activities + useQuery for stats, keyed getMyActivities/
getActivityStats. Lifecycle mutations now invalidate those keys, so issuer
views auto-refresh. Removes redundant refreshKey/onActionComplete plumbing.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: A3-FE — Surface revoked/suspended counts in IssuancesSummary

**Files:**

-   Modify: `apps/learn-card-app/src/components/issuances/IssuancesSummary.tsx`

Depends on Task 3 (backend `revoked`/`suspended` in stats) and Task 5 (react-query stats carrying those fields).

-   [ ] **Step 1: Show the revoked/suspended counts**

Replace the `IssuancesSummary` body so the summary line includes revoked/suspended when non-zero:

```tsx
export const IssuancesSummary: React.FC<IssuancesSummaryProps> = ({ boostUri, onManage }) => {
    const { stats } = useIntegrationActivity([], { boostUri, limit: 1 });
    const pending = stats.pendingClaims ?? 0;
    const revoked = stats.revoked ?? 0;
    const suspended = stats.suspended ?? 0;

    return (
        <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-500">
                {stats.totalSent ?? 0} issued · {stats.totalClaimed ?? 0} claimed
                {pending > 0 ? ` · ${pending} pending` : ''}
                {revoked > 0 ? ` · ${revoked} revoked` : ''}
                {suspended > 0 ? ` · ${suspended} suspended` : ''}
            </p>
            <button
                type="button"
                onClick={onManage}
                className="text-sm font-semibold text-indigo-500 text-left"
            >
                Manage Issuances
            </button>
        </div>
    );
};
```

-   [ ] **Step 2: Type-check**

Run: `bunx tsc --noEmit -p apps/learn-card-app/tsconfig.json`
Expected: no new errors (`stats.revoked` / `stats.suspended` now exist on the hook's return type from Task 5).

-   [ ] **Step 3: Commit**

```bash
git add apps/learn-card-app/src/components/issuances/IssuancesSummary.tsx
git commit -m "feat(issuances): show revoked/suspended counts in summary (LC-1894 A3)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Holder-UX overview (Tasks 7–9)

The holder credential card is a **shared, cross-package** component. The revoked/suspended treatment is added as an **additive `lifecycleStatus?: 'active' | 'revoked' | 'suspended'` prop** threaded through the render chain; it defaults to `'active'`, so every existing caller (including the Scouts app) is unaffected.

Render chain and where each piece lands:

-   `apps/learn-card-app/.../BoostEarnedCard.tsx` — computes status (Task 8, B2 hook) and passes `lifecycleStatus` in.
-   `packages/learn-card-base/.../wrappers/BoostGenericCardWrapper.tsx` — forwards `lifecycleStatus` to both the card and the verifier badge.
-   `packages/react-learn-card/.../BoostGenericCard/BoostGenericCard.tsx` — renders the corner **pill** + applies **desaturation** (scoped to image + text, NOT the pill/badge).
-   `packages/learn-card-base/.../CredentialBadge/CredentialVerificationDisplay.tsx` — swaps the green verified seal for the red/orange **X seal**.

**The revoked/suspended signal** (from `verifyCredential`): calling `wallet.invoke.verifyCredential(credential, {}, false)` returns the raw `VerificationCheck` whose optional `status: StatusCheckEntry[]` carries `{ statusPurpose, isSet }` per entry — `statusPurpose === 'revocation' && isSet` → revoked, `statusPurpose === 'suspension' && isSet` → suspended. Fallback for older WASM builds that omit `status`: scan `check.errors` for `/revok/i` and `/suspend/i`.

---

## Task 7: B3 (shared) — Thread `lifecycleStatus`, swap the badge, add pill + desaturation

**Files:**

-   Create: `packages/learn-card-base/src/components/CredentialBadge/CredentialStatusSealIcon.tsx`
-   Modify: `packages/learn-card-base/src/components/CredentialBadge/CredentialVerificationDisplay.tsx` (props 36-45, `renderIconOnlyBadge` 165-183)
-   Modify: `packages/learn-card-base/src/components/wrappers/BoostGenericCardWrapper.tsx` (props 17, render 118-141)
-   Modify: `packages/react-learn-card/src/components/types.ts` (`BoostGenericCardProps`)
-   Modify: `packages/react-learn-card/src/components/BoostGenericCard/BoostGenericCard.tsx` (root 50, image 74-90, title 100-102, issuer row 119-129)

-   [ ] **Step 1: Create the status seal icon (Figma node 2422:101057)**

Create `packages/learn-card-base/src/components/CredentialBadge/CredentialStatusSealIcon.tsx`:

```tsx
import React from 'react';

export type CredentialLifecycleStatus = 'active' | 'revoked' | 'suspended';

const SEAL_COLOR: Record<Exclude<CredentialLifecycleStatus, 'active'>, string> = {
    revoked: '#DC2626', // red-600
    suspended: '#EA580C', // orange-600
};

/**
 * Seal badge with a white X, same silhouette as the verified seal.
 * Used to mark a held credential as revoked (red) or suspended (orange).
 */
export const CredentialStatusSealIcon: React.FC<{
    status: 'revoked' | 'suspended';
    className?: string;
}> = ({ status, className }) => (
    <svg viewBox="0 0 13.75 13.75" className={className} xmlns="http://www.w3.org/2000/svg">
        <path
            d="M2.41061 1.63793C3.51526 1.76957 4.17919 1.41471 4.60846 0.424527C4.79162 0.000982146 5.31819 -0.13066 5.6845 0.144072C6.51441 0.779389 7.23558 0.779389 8.0655 0.144072C8.42609 -0.13066 8.95838 0.000982146 9.14154 0.424527C9.56508 1.40898 10.229 1.76957 11.3394 1.63793C11.7858 1.58641 12.1636 1.96989 12.1121 2.41061C11.9804 3.51526 12.3353 4.17919 13.3255 4.60846C13.749 4.79162 13.8807 5.31819 13.6059 5.6845C12.9706 6.51441 12.9706 7.23558 13.6059 8.0655C13.8807 8.42609 13.749 8.95838 13.3255 9.14154C12.341 9.56508 11.9804 10.229 12.1121 11.3394C12.1636 11.7858 11.7801 12.1636 11.3394 12.1121C10.2347 11.9804 9.57081 12.3353 9.14154 13.3255C8.95838 13.749 8.43181 13.8807 8.0655 13.6059C7.23558 12.9706 6.51441 12.9706 5.6845 13.6059C5.32391 13.8807 4.79162 13.749 4.60846 13.3255C4.18492 12.341 3.52098 11.9804 2.41061 12.1121C1.96417 12.1636 1.58641 11.7801 1.63793 11.3394C1.76957 10.2347 1.41471 9.57081 0.424527 9.14154C0.000982146 8.95838 -0.13066 8.43181 0.144072 8.0655C0.779389 7.23558 0.779389 6.51441 0.144072 5.6845C-0.13066 5.32391 0.000982146 4.79162 0.424527 4.60846C1.40898 4.18492 1.76957 3.52098 1.63793 2.41061C1.58641 1.96417 1.96989 1.58641 2.41061 1.63793Z"
            fill={SEAL_COLOR[status]}
        />
        <g transform="translate(1.964,1.964)">
            <path
                d="M7.673 2.148L2.148 7.673"
                stroke="#fff"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <path
                d="M7.673 7.673L2.148 2.148"
                stroke="#fff"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </g>
    </svg>
);
```

-   [ ] **Step 2: Swap the badge in `CredentialVerificationDisplay`**

Add a `lifecycleStatus?: CredentialLifecycleStatus` prop to the component's props (the prop block at lines 36-45), importing the icon + type:

```tsx
import { CredentialStatusSealIcon, CredentialLifecycleStatus } from './CredentialStatusSealIcon';
```

At the very top of `renderIconOnlyBadge` (line 165, before the `verifierState` checks), short-circuit on lifecycle status so a revoked/suspended credential shows the X seal regardless of issuer trust:

```tsx
    const renderIconOnlyBadge = (badgeIconClassName = iconClassName) => {
        if (lifecycleStatus === 'revoked' || lifecycleStatus === 'suspended') {
            return (
                <CredentialStatusSealIcon
                    status={lifecycleStatus}
                    className={`w-[22px] h-[22px] ${badgeIconClassName}`}
                />
            );
        }
        // …existing verifierState branches unchanged…
```

(If `showText` full-label rendering is ever used on the card, also guard the label renderer at line 119; for the earned card it's icon-only, so Step 2 is sufficient. Add the same short-circuit to the label renderer for completeness, returning the icon plus an uppercase "Revoked"/"Suspended" label in the state color.)

-   [ ] **Step 3: Forward `lifecycleStatus` through `BoostGenericCardWrapper`**

Add `lifecycleStatus?: CredentialLifecycleStatus;` to `BoostGenericCardWrapperProps` (line 17 block), destructure it (default `'active'`), pass it to `CredentialVerificationDisplay` (lines 132-141) and to `BoostGenericCard` (the wrapped card component around line 118-127):

```tsx
<CredentialVerificationDisplay
    credential={credential}
    lifecycleStatus={lifecycleStatus}
    iconClassName="!w-[15px] !h-[15px]"
    showText={!!unknownVerifierTitle}
    unknownVerifierTitle={unknownVerifierTitle}
/>
```

and add `lifecycleStatus={lifecycleStatus}` to the `<BoostGenericCard … />` element it renders.

-   [ ] **Step 4: Add the prop to `BoostGenericCardProps`**

In `packages/react-learn-card/src/components/types.ts`, add to `BoostGenericCardProps`:

```ts
    lifecycleStatus?: 'active' | 'revoked' | 'suspended';
```

-   [ ] **Step 5: Render pill + desaturation in `BoostGenericCard`**

In `BoostGenericCard.tsx`, destructure `lifecycleStatus = 'active'` (line 10 block) and derive:

```tsx
const isInactive = lifecycleStatus === 'revoked' || lifecycleStatus === 'suspended';
const inactiveMedia = isInactive ? 'grayscale brightness-90' : '';
const inactiveText = isInactive ? 'grayscale opacity-60' : '';
const pillColor = lifecycleStatus === 'revoked' ? 'bg-[#DC2626]' : 'bg-[#EA580C]';
```

Apply `inactiveMedia` to the image sections (the bg image `<img>` at line 63 and the thumbnail `<section className={defaultThumbClass}>` / `<img>` at lines 74-90 — add the class to those elements' `className`), and `inactiveText` to the title span (line 100-102) and the issuer-row span (line 120). **Do NOT** apply any grayscale to a shared ancestor of the pill or the `verifierBadge` — per the spec's filter-scoping rule, the filter must sit only on the media + text nodes.

Add the corner pill as a direct child of the card root `<div>` (line 50, which is `relative overflow-hidden`), rendered BEFORE the media so it sits in the top-left, above the grayscale, at `z-20`:

```tsx
{
    isInactive && (
        <span
            className={`absolute top-[8px] left-[8px] z-20 rounded-full px-[9px] py-[3px] text-[10px] font-extrabold uppercase tracking-wide text-white ${pillColor}`}
        >
            {lifecycleStatus === 'revoked' ? 'Revoked' : 'Suspended'}
        </span>
    );
}
```

Note: the existing select-checkbox is also top-left `z-20` (line 165) but only renders in selection mode; on the earned wallet grid (non-selection) the pill has the corner to itself. If both can appear, offset the pill to `left-[44px]`.

-   [ ] **Step 6: Build the shared packages + type-check**

Run: `bunx nx build react-learn-card && bunx nx build learn-card-base`
Expected: both build.
Run: `bunx tsc --noEmit -p apps/learn-card-app/tsconfig.json`
Expected: no new errors.

-   [ ] **Step 7: Commit**

```bash
git add packages/learn-card-base/src/components/CredentialBadge/CredentialStatusSealIcon.tsx \
        packages/learn-card-base/src/components/CredentialBadge/CredentialVerificationDisplay.tsx \
        packages/learn-card-base/src/components/wrappers/BoostGenericCardWrapper.tsx \
        packages/react-learn-card/src/components/types.ts \
        packages/react-learn-card/src/components/BoostGenericCard/BoostGenericCard.tsx
git commit -m "feat(cards): add revoked/suspended lifecycleStatus treatment (LC-1913 B3)

Additive lifecycleStatus prop (default active): red/orange X seal badge,
colored corner pill, desaturated media/text. Filter scoped off the badge/pill.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: B2 — Lazy, cached per-card status; wire it into the earned card

**Files:**

-   Create: `apps/learn-card-app/src/hooks/useCredentialStatus.ts`
-   Modify: `apps/learn-card-app/src/components/boost/boost-earned-card/BoostEarnedCard.tsx` (resolved-credential region ~112-116; the three `BoostGenericCardWrapper` render branches)
-   Test: `apps/learn-card-app/src/hooks/__tests__/useCredentialStatus.test.ts`

> **Correction to the spec:** the spec named `autoVerifyStore` as the cache, but that store is only a monotonic success tick (no per-credential cache). Use react-query keyed by credential URI instead — it gives the lazy-on-render fetch + caching the spec intends.

-   [ ] **Step 1: Write the failing test for the status hook's derivation**

Create `apps/learn-card-app/src/hooks/__tests__/useCredentialStatus.test.ts`. Test the pure derivation helper (exported from the hook file) against mock `VerificationCheck` shapes:

```ts
import { deriveLifecycleStatus } from '../useCredentialStatus';

describe('deriveLifecycleStatus', () => {
    it('returns revoked when a revocation entry bit is set', () => {
        expect(
            deriveLifecycleStatus({
                checks: [],
                warnings: [],
                errors: [],
                status: [
                    {
                        entryType: 'BitstringStatusListEntry',
                        statusPurpose: 'revocation',
                        isSet: true,
                    },
                ],
            })
        ).toBe('revoked');
    });
    it('returns suspended when only a suspension entry bit is set', () => {
        expect(
            deriveLifecycleStatus({
                checks: [],
                warnings: [],
                errors: [],
                status: [
                    {
                        entryType: 'BitstringStatusListEntry',
                        statusPurpose: 'revocation',
                        isSet: false,
                    },
                    {
                        entryType: 'BitstringStatusListEntry',
                        statusPurpose: 'suspension',
                        isSet: true,
                    },
                ],
            })
        ).toBe('suspended');
    });
    it('returns active when no bits are set', () => {
        expect(
            deriveLifecycleStatus({
                checks: [],
                warnings: [],
                errors: [],
                status: [
                    {
                        entryType: 'BitstringStatusListEntry',
                        statusPurpose: 'revocation',
                        isSet: false,
                    },
                ],
            })
        ).toBe('active');
    });
    it('falls back to errors text when structured status is absent', () => {
        expect(
            deriveLifecycleStatus({ checks: [], warnings: [], errors: ['credential is revoked'] })
        ).toBe('revoked');
        expect(
            deriveLifecycleStatus({ checks: [], warnings: [], errors: ['credential is suspended'] })
        ).toBe('suspended');
    });
});
```

-   [ ] **Step 2: Run it — verify it fails**

Run: `bunx nx test learn-card-app --testFile=src/hooks/__tests__/useCredentialStatus.test.ts`
Expected: FAIL — `deriveLifecycleStatus` not exported yet.

-   [ ] **Step 3: Implement the hook + derivation**

Create `apps/learn-card-app/src/hooks/useCredentialStatus.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { useWallet } from 'learn-card-base';
import type { VC, VerificationCheck } from '@learncard/types';

export type CredentialLifecycleStatus = 'active' | 'revoked' | 'suspended';

/** Pure: map a raw VerificationCheck to a lifecycle status. Fail-open to 'active'. */
export const deriveLifecycleStatus = (
    check: Pick<VerificationCheck, 'errors' | 'status'> | undefined | null
): CredentialLifecycleStatus => {
    const entries = check?.status ?? [];
    if (entries.some(e => e.statusPurpose === 'revocation' && e.isSet)) return 'revoked';
    if (entries.some(e => e.statusPurpose === 'suspension' && e.isSet)) return 'suspended';

    // Fallback for WASM builds that omit structured status
    const errors = check?.errors ?? [];
    if (errors.some(e => /revok/i.test(e))) return 'revoked';
    if (errors.some(e => /suspend/i.test(e))) return 'suspended';

    return 'active';
};

/**
 * Lazily verify a held credential's status (revoked/suspended), cached by URI.
 * Runs when the card mounts; fail-open so a check error never renders as revoked.
 */
export const useCredentialStatus = (
    credential: VC | undefined,
    uri: string | undefined,
    enabled = true
): CredentialLifecycleStatus => {
    const { initWallet } = useWallet();

    const { data } = useQuery({
        queryKey: ['credentialStatus', uri],
        enabled: enabled && !!credential && !!uri,
        staleTime: 5 * 60 * 1000,
        queryFn: async (): Promise<CredentialLifecycleStatus> => {
            try {
                const wallet = await initWallet();
                const check = (await wallet?.invoke?.verifyCredential(
                    credential as VC,
                    {},
                    false
                )) as VerificationCheck;
                return deriveLifecycleStatus(check);
            } catch {
                return 'active'; // fail-open
            }
        },
    });

    return data ?? 'active';
};
```

-   [ ] **Step 4: Run the test — verify it passes**

Run: `bunx nx test learn-card-app --testFile=src/hooks/__tests__/useCredentialStatus.test.ts`
Expected: PASS.

-   [ ] **Step 5: Wire it into `BoostEarnedCard`**

In `BoostEarnedCard.tsx`, where the resolved credential is available (`useGetResolvedCredential(record?.uri, …)` ~line 112-116), add:

```tsx
const lifecycleStatus = useCredentialStatus(credential, record?.uri);
```

(import: `import { useCredentialStatus } from 'src/hooks/useCredentialStatus';`)

Pass `lifecycleStatus={lifecycleStatus}` to `<BoostGenericCardWrapper … />` in each of the three render branches (`!useWrapper` ~399-467, `verifierState` ~469-540, default ~546-652).

-   [ ] **Step 6: Type-check + commit**

Run: `bunx tsc --noEmit -p apps/learn-card-app/tsconfig.json` (expect no new errors).

```bash
git add apps/learn-card-app/src/hooks/useCredentialStatus.ts \
        apps/learn-card-app/src/hooks/__tests__/useCredentialStatus.test.ts \
        apps/learn-card-app/src/components/boost/boost-earned-card/BoostEarnedCard.tsx
git commit -m "feat(wallet): lazy per-card credential status drives revoked/suspended UI (LC-1913 B2)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: B4 — Confirm revoked/suspended credentials stay in the Earned tab

**Files:**

-   Inspect: `apps/learn-card-app/src/components/boost/boost-earned-card/BoostEarnedList.tsx` (map loop 115-150)

-   [ ] **Step 1: Verify no filtering by status**

Run: `grep -n "revoked\|suspended\|lifecycleStatus\|status" apps/learn-card-app/src/components/boost/boost-earned-card/BoostEarnedList.tsx`
Expected: no filtering that removes revoked/suspended credentials. The list maps every resolved record to a `BoostEarnedCard` (lines 115-150) and does not filter on status — which is the desired B4 behavior (revoked/suspended stay in place, styled by Task 7/8). If any status-based filter exists, remove it so inactive credentials remain in the Earned grid.

-   [ ] **Step 2: Behavioral confirmation**

With a dev server (if available), confirm a revoked credential still appears in the Earned tab grid with the pill + desaturated card + red X seal, and is still openable. Record the result. No code change expected for B4.

-   [ ] **Step 3: Commit (only if Step 1 required a change)**

```bash
git add apps/learn-card-app/src/components/boost/boost-earned-card/BoostEarnedList.tsx
git commit -m "chore(wallet): keep revoked/suspended credentials in Earned tab (LC-1913 B4)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Final verification (after all tasks)

-   [ ] Backend suite: `cd services/learn-card-network/brain-service && bunx vitest run` — all green.
-   [ ] Frontend type-check: `bunx tsc --noEmit -p apps/learn-card-app/tsconfig.json` — no new errors.
-   [ ] `grep -rn "refreshKey\|onActionComplete" apps/learn-card-app/src/components/issuances apps/learn-card-app/src/pages/appStoreDeveloper/dashboards` — no matches.
-   [ ] Spec cross-check: A1 (default flip), A2 (>25 guard), A3 (stats + summary), A4 (react-query), B1 (notifications), B2 (lazy status), B3 (badge+pill+desaturation), B4 (stay in Earned) — each has a completed task.
