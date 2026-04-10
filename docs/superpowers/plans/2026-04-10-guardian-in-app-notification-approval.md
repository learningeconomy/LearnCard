# Guardian In-App Notification Approval — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow guardians who already have a LearnCard account and MANAGES relationship with a child to approve/reject guardian-gated credentials via in-app notifications instead of OTP.

**Architecture:** Two new authenticated brain-service routes handle approve/reject without OTP. The `issueToInbox` helper detects existing MANAGES relationships and sends in-app notifications alongside the existing email. The `GuardianCredentialApprovalPage` gains OTP-skip logic when the authenticated user has MANAGES. A new `NotificationGuardianApprovalCard` renders approve/reject buttons inline.

**Tech Stack:** tRPC (brain-service routes), Neo4j/neogma (access layer), React/Ionic (frontend), Tailwind (styling), `@tanstack/react-query` (mutations)

**Spec:** `docs/superpowers/specs/2026-04-10-guardian-in-app-notification-approval-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `services/learn-card-network/brain-service/src/accesslayer/profile-manager/relationships/read.ts` | Modify | Add `doesProfileManageProfile` query |
| `services/learn-card-network/brain-service/src/accesslayer/inbox-credential/read.ts` | Modify | Add `getInboxCredentialById` query |
| `services/learn-card-network/brain-service/src/routes/inbox.ts` | Modify | Add 2 authenticated routes, enhance `getGuardianPendingCredential` |
| `services/learn-card-network/brain-service/src/helpers/inbox.helpers.ts` | Modify | Add MANAGES detection + notification trigger in `issueToInbox` |
| `packages/plugins/learn-card-network/src/types.ts` | Modify | Add 2 new method types |
| `packages/plugins/learn-card-network/src/plugin.ts` | Modify | Add 2 new method implementations |
| `apps/learn-card-app/src/components/notifications/notificationsV2/NotificationGuardianApprovalCard.tsx` | Create | Guardian approval card with Approve/Reject buttons |
| `apps/learn-card-app/src/components/notifications/notificationsV2/NotificationGuardianOutcomeCard.tsx` | Create | Info-only card for student (approved/rejected) |
| `apps/learn-card-app/src/components/notifications/notificationsV2/NotificationCardContainer.tsx` | Modify | Add dispatch cases for 3 new notification types |
| `apps/learn-card-app/src/pages/interactions/GuardianCredentialApprovalPage.tsx` | Modify | OTP-skip logic + MANAGES verbiage |
| `services/learn-card-network/brain-service/src/helpers/guardian-approval.helpers.ts` | Modify | Add LC-1730/1731 status code comments |

---

## Task 1: Access Layer — `doesProfileManageProfile` Query

**Files:**
- Modify: `services/learn-card-network/brain-service/src/accesslayer/profile-manager/relationships/read.ts`

- [ ] **Step 1: Add the `doesProfileManageProfile` function**

Add after the existing `getProfilesManagedByProfile` function (after line 81):

```typescript
/**
 * Checks whether a guardian profile has a MANAGES relationship with a child profile.
 * Traverses: (guardian:Profile)<-[:ADMINISTRATED_BY]-(pm:ProfileManager)-[:MANAGES]->(child:Profile)
 */
export const doesProfileManageProfile = async (
    guardianProfileId: string,
    childProfileId: string
): Promise<boolean> => {
    const results = convertQueryResultToPropertiesObjectArray<{
        pm: { id: string };
    }>(
        await new QueryBuilder(new BindParam({ guardianProfileId, childProfileId }))
            .match({
                related: [
                    { model: Profile, where: { profileId: guardianProfileId }, identifier: 'guardian' },
                    {
                        ...ProfileManager.getRelationshipByAlias('administratedBy'),
                        direction: 'in',
                    },
                    { model: ProfileManager, identifier: 'pm' },
                    ProfileManager.getRelationshipByAlias('manages'),
                    { model: Profile, where: { profileId: childProfileId }, identifier: 'child' },
                ],
            })
            .return('pm')
            .limit(1)
            .run()
    );

    return results.length > 0;
};
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
cd services/learn-card-network/brain-service && pnpm exec tsc --noEmit --pretty 2>&1 | head -20
```

Expected: No errors related to `doesProfileManageProfile`.

- [ ] **Step 3: Commit**

```bash
git add services/learn-card-network/brain-service/src/accesslayer/profile-manager/relationships/read.ts
git commit -m "feat(brain): add doesProfileManageProfile access layer query"
```

---

## Task 2: Access Layer — `getInboxCredentialById` Query

**Files:**
- Modify: `services/learn-card-network/brain-service/src/accesslayer/inbox-credential/read.ts`

- [ ] **Step 1: Add `getInboxCredentialById` function**

Add after `getInboxCredentialByIdAndGuardianEmail` (after line 204). Follow the same QueryBuilder pattern:

```typescript
export const getInboxCredentialById = async (
    id: string
): Promise<InboxCredentialType | null> => {
    const results = convertQueryResultToPropertiesObjectArray<{
        ic: InboxCredentialProperties;
    }>(
        await new QueryBuilder(new BindParam({ id }))
            .match({
                model: InboxCredential,
                where: { id },
                identifier: 'ic',
            })
            .return('ic')
            .limit(1)
            .run()
    );

    return results[0]?.ic ?? null;
};
```

Note: Check what `InboxCredentialProperties` type is used in the existing functions (it may be `InboxCredentialType` directly — match the pattern of `getInboxCredentialByIdAndGuardianEmail`).

- [ ] **Step 2: Verify it compiles**

Run:
```bash
cd services/learn-card-network/brain-service && pnpm exec tsc --noEmit --pretty 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add services/learn-card-network/brain-service/src/accesslayer/inbox-credential/read.ts
git commit -m "feat(brain): add getInboxCredentialById access layer query"
```

---

## Task 3: Backend Routes — Authenticated Approve/Reject + Enhanced `getGuardianPendingCredential`

**Files:**
- Modify: `services/learn-card-network/brain-service/src/routes/inbox.ts`

- [ ] **Step 1: Add import for `doesProfileManageProfile` and `getInboxCredentialById`**

At the top of inbox.ts, add to the existing imports:

After line 66 (`import { getProfilesThatManageAProfile } from '@accesslayer/profile/relationships/read';`), add:
```typescript
import { doesProfileManageProfile } from '@accesslayer/profile-manager/relationships/read';
```

After line 68 (`import { getProfileForInboxCredential } from '@accesslayer/inbox-credential/read';`), ensure `getInboxCredentialById` is also imported from the same module:
```typescript
import {
    getInboxCredentialsForProfile,
    getInboxCredentialByIdAndGuardianEmail,
    getContactMethodForInboxCredential,
    getApprovedInboxCredentialsByGuardianEmail,
    getInboxCredentialById,
    getProfileForInboxCredential,
} from '@accesslayer/inbox-credential/read';
```

- [ ] **Step 2: Enhance `getGuardianPendingCredential` response with `canApproveInApp`**

In the `getGuardianPendingCredential` route (starting at line 750), update the output schema to add `canApproveInApp`:

Change the output (line 762-770) from:
```typescript
z.object({
    inboxCredentialId: z.string(),
    guardianStatus: z.string(),
    issuer: z.object({ displayName: z.string(), profileId: z.string() }),
    credentialName: z.string().optional(),
    createdAt: z.string(),
    expiresAt: z.string(),
})
```
to:
```typescript
z.object({
    inboxCredentialId: z.string(),
    guardianStatus: z.string(),
    issuer: z.object({ displayName: z.string(), profileId: z.string() }),
    credentialName: z.string().optional(),
    createdAt: z.string(),
    expiresAt: z.string(),
    canApproveInApp: z.boolean(),
})
```

At the end of the query handler (before the `return` on line 804), add the MANAGES check. The route is an `openRoute` so `ctx` won't have a profile by default, but we can check if the request has auth context. Since this is an open route, we do a best-effort check:

Replace the return block (lines 804-814) with:
```typescript
            // Best-effort check: if the caller has an authenticated profile,
            // check MANAGES relationship for OTP-skip eligibility
            let canApproveInApp = false;
            try {
                // ctx.user may exist if the caller happens to be authenticated
                // (e.g., they opened the email link while logged in)
                const callerProfile = ctx?.user?.profile;
                if (callerProfile?.profileId) {
                    const childProfile = await getProfileForInboxCredential(inboxCredential.id);
                    if (childProfile) {
                        canApproveInApp = await doesProfileManageProfile(
                            callerProfile.profileId,
                            childProfile.profileId
                        );
                    }
                }
            } catch {
                // Non-critical — default to false (OTP flow)
            }

            return {
                inboxCredentialId: inboxCredential.id,
                guardianStatus: inboxCredential.guardianStatus ?? 'AWAITING_GUARDIAN',
                issuer: {
                    displayName: issuerProfile?.displayName ?? 'Unknown Issuer',
                    profileId: issuerProfile?.profileId ?? '',
                },
                credentialName,
                createdAt: inboxCredential.createdAt,
                expiresAt: inboxCredential.expiresAt,
                canApproveInApp,
            };
```

**Note:** The `openRoute` may or may not have `ctx.user` populated depending on whether the caller sent auth headers. Check how `openRoute` is defined in `@routes` — if it never populates `ctx.user`, this check will always be false for the email link path. That's acceptable for now (the email link path falls back to OTP). The in-app notification card calls the separate authenticated routes directly.

- [ ] **Step 3: Add `approveGuardianCredentialInApp` authenticated route**

Add after the `claimPendingGuardianLinks` route (after line ~1159). This uses `profileRoute` (requires authentication):

```typescript
    // Authenticated route: guardian approves a credential in-app (no OTP needed)
    approveGuardianCredentialInApp: profileRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/inbox/guardian-credential-approval/in-app/approve',
                tags: ['Universal Inbox'],
                summary: 'Approve Guardian Credential In-App',
                description:
                    'Authenticated guardian approves a pending credential. Requires MANAGES relationship with the child. No OTP needed.',
            },
        })
        .input(z.object({ inboxCredentialId: z.string() }))
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const { inboxCredentialId } = input;
            const guardianProfile = ctx.user.profile;

            // Fetch the inbox credential
            const inboxCredential = await getInboxCredentialById(inboxCredentialId);
            if (!inboxCredential) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Credential not found.' });
            }

            if (inboxCredential.guardianStatus !== 'AWAITING_GUARDIAN') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Credential is already ${inboxCredential.guardianStatus?.toLowerCase().replace(/_/g, ' ')}.`,
                });
            }

            // Verify caller MANAGES the child
            const childProfile = await getProfileForInboxCredential(inboxCredentialId);
            if (!childProfile) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Child profile not found for this credential.' });
            }

            const manages = await doesProfileManageProfile(guardianProfile.profileId, childProfile.profileId);
            if (!manages) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not have a guardian relationship with this child.',
                });
            }

            // Approve the credential
            await updateInboxCredential(inboxCredentialId, {
                guardianStatus: 'GUARDIAN_APPROVED',
                isAccepted: true,
                guardianApprovedAt: new Date().toISOString(),
                guardianApprovedByDid: guardianProfile.did,
            });

            // Invalidate any outstanding email approval token
            if (inboxCredential.guardianEmail) {
                try {
                    // Find and mark the token as used by searching for it
                    // The token is stored in Redis keyed by token value; we can't easily
                    // look it up by inboxCredentialId. The token will expire naturally (7 days).
                    // The approve/reject routes already check guardianStatus !== AWAITING_GUARDIAN,
                    // so the email path will fail gracefully.
                } catch {}
            }

            // Notify the student via email
            try {
                const studentContactMethod = await getContactMethodForInboxCredential(inboxCredentialId);
                if (studentContactMethod) {
                    const issuerProfile = await getProfileByDid(inboxCredential.issuerDid);
                    const deliveryService = getDeliveryService(studentContactMethod);
                    await deliveryService.send({
                        contactMethod: studentContactMethod,
                        templateId: 'guardian-approved-claim',
                        templateModel: {
                            issuer: { name: issuerProfile?.displayName ?? 'Your issuer' },
                        },
                        messageStream: 'universal-inbox',
                    });
                }
            } catch (err) {
                console.error('[approveGuardianCredentialInApp] Failed to send student email:', err);
            }

            // Notify the student via in-app notification
            try {
                const studentProfile = await getProfileForInboxCredential(inboxCredentialId);
                if (studentProfile) {
                    let credentialName: string | undefined;
                    try {
                        const parsed = JSON.parse(inboxCredential.credential);
                        credentialName = parsed?.name ?? parsed?.credentialSubject?.achievement?.name;
                    } catch {}

                    await addNotificationToQueue({
                        type: LCNNotificationTypeEnumValidator.enum.GUARDIAN_APPROVED,
                        to: studentProfile,
                        from: guardianProfile,
                        message: {
                            title: 'Credential Approved',
                            body: `Your guardian approved "${credentialName ?? 'a credential'}" for you.`,
                        },
                        data: { inboxCredentialId, credentialName },
                    });
                }
            } catch (err) {
                console.error('[approveGuardianCredentialInApp] Failed to send student notification:', err);
            }

            return { success: true };
        }),
```

- [ ] **Step 4: Add `rejectGuardianCredentialInApp` authenticated route**

Add immediately after `approveGuardianCredentialInApp`:

```typescript
    // Authenticated route: guardian rejects a credential in-app (no OTP needed)
    rejectGuardianCredentialInApp: profileRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/inbox/guardian-credential-approval/in-app/reject',
                tags: ['Universal Inbox'],
                summary: 'Reject Guardian Credential In-App',
                description:
                    'Authenticated guardian rejects a pending credential. Requires MANAGES relationship with the child. No OTP needed.',
            },
        })
        .input(z.object({ inboxCredentialId: z.string() }))
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const { inboxCredentialId } = input;
            const guardianProfile = ctx.user.profile;

            // Fetch the inbox credential
            const inboxCredential = await getInboxCredentialById(inboxCredentialId);
            if (!inboxCredential) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Credential not found.' });
            }

            if (inboxCredential.guardianStatus !== 'AWAITING_GUARDIAN') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Credential is already ${inboxCredential.guardianStatus?.toLowerCase().replace(/_/g, ' ')}.`,
                });
            }

            // Verify caller MANAGES the child
            const childProfile = await getProfileForInboxCredential(inboxCredentialId);
            if (!childProfile) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Child profile not found for this credential.' });
            }

            const manages = await doesProfileManageProfile(guardianProfile.profileId, childProfile.profileId);
            if (!manages) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not have a guardian relationship with this child.',
                });
            }

            // Reject the credential
            await updateInboxCredential(inboxCredentialId, {
                guardianStatus: 'GUARDIAN_REJECTED',
            });

            // Notify the student via email
            try {
                const studentContactMethod = await getContactMethodForInboxCredential(inboxCredentialId);
                if (studentContactMethod) {
                    const issuerProfile = await getProfileByDid(inboxCredential.issuerDid);
                    const deliveryService = getDeliveryService(studentContactMethod);
                    await deliveryService.send({
                        contactMethod: studentContactMethod,
                        templateId: 'guardian-rejected-credential',
                        templateModel: {
                            issuer: { name: issuerProfile?.displayName ?? 'Your issuer' },
                        },
                        messageStream: 'universal-inbox',
                    });
                }
            } catch (err) {
                console.error('[rejectGuardianCredentialInApp] Failed to send student email:', err);
            }

            // Notify the student via in-app notification
            try {
                const studentProfile = await getProfileForInboxCredential(inboxCredentialId);
                if (studentProfile) {
                    let credentialName: string | undefined;
                    try {
                        const parsed = JSON.parse(inboxCredential.credential);
                        credentialName = parsed?.name ?? parsed?.credentialSubject?.achievement?.name;
                    } catch {}

                    await addNotificationToQueue({
                        type: LCNNotificationTypeEnumValidator.enum.GUARDIAN_REJECTED,
                        to: studentProfile,
                        from: guardianProfile,
                        message: {
                            title: 'Credential Rejected',
                            body: `Your guardian did not approve "${credentialName ?? 'a credential'}".`,
                        },
                        data: { inboxCredentialId, credentialName },
                    });
                }
            } catch (err) {
                console.error('[rejectGuardianCredentialInApp] Failed to send student notification:', err);
            }

            return { success: true };
        }),
```

- [ ] **Step 5: Verify it compiles**

Run:
```bash
cd services/learn-card-network/brain-service && pnpm exec tsc --noEmit --pretty 2>&1 | head -30
```

- [ ] **Step 6: Commit**

```bash
git add services/learn-card-network/brain-service/src/routes/inbox.ts
git commit -m "feat(brain): add authenticated guardian approve/reject routes and canApproveInApp field"
```

---

## Task 4: Backend — `issueToInbox` MANAGES Detection & Notification Trigger

**Files:**
- Modify: `services/learn-card-network/brain-service/src/helpers/inbox.helpers.ts`

- [ ] **Step 1: Add imports**

At the top of inbox.helpers.ts, add the necessary imports. After line 14 (`import { getProfileByVerifiedContactMethod } from '@accesslayer/contact-method/relationships/read';`), add:

```typescript
import { getProfileByContactMethod } from '@accesslayer/contact-method/read';
import { doesProfileManageProfile } from '@accesslayer/profile-manager/relationships/read';
import { getProfileForInboxCredential } from '@accesslayer/inbox-credential/read';
```

Also ensure `LCNNotificationTypeEnumValidator` is already imported from `@learncard/types` (it is — line 1).

- [ ] **Step 2: Add in-app notification trigger in the `guardianEmail` block**

Inside the `if (guardianEmail)` block in `issueToInbox` (starting at line 361), **after** the guardian email is sent (after line 413, before the `} else if (!delivery?.suppress)` on line 414), add the MANAGES detection and in-app notification:

```typescript
            // Check if guardian already has an account with MANAGES relationship
            // If so, also send an in-app notification for faster approval
            try {
                const guardianContactMethod = await getContactMethodByValue('email', guardianEmail);
                if (guardianContactMethod) {
                    const guardianProfile = await getProfileByContactMethod(guardianContactMethod.id);
                    if (guardianProfile) {
                        const childProfile = await getProfileForInboxCredential(inboxCredential.id);
                        if (childProfile) {
                            const manages = await doesProfileManageProfile(
                                guardianProfile.profileId,
                                childProfile.profileId
                            );
                            if (manages) {
                                // Parse credential name for the notification
                                let credentialName: string | undefined;
                                try {
                                    credentialName = (credential as any)?.name
                                        ?? (credential as any)?.credentialSubject?.achievement?.name;
                                } catch {}

                                await addNotificationToQueue({
                                    type: LCNNotificationTypeEnumValidator.enum.GUARDIAN_APPROVAL_PENDING,
                                    to: guardianProfile,
                                    from: issuerProfile,
                                    message: {
                                        title: 'Credential Approval Request',
                                        body: `${credentialName ?? 'A credential'} for ${childProfile.displayName ?? 'your student'} from ${issuerProfile.displayName}`,
                                    },
                                    data: {
                                        inboxCredentialId: inboxCredential.id,
                                        childProfileId: childProfile.profileId,
                                        childDisplayName: childProfile.displayName ?? '',
                                        credentialName: credentialName ?? '',
                                        issuerDisplayName: issuerProfile.displayName,
                                    },
                                });
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('[issueToInbox] Failed to send guardian in-app notification:', err);
                // Non-critical — email path is always available as fallback
            }
```

- [ ] **Step 3: Verify it compiles**

Run:
```bash
cd services/learn-card-network/brain-service && pnpm exec tsc --noEmit --pretty 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add services/learn-card-network/brain-service/src/helpers/inbox.helpers.ts
git commit -m "feat(brain): send in-app notification to guardian when MANAGES relationship exists"
```

---

## Task 5: Plugin Layer — New Method Types and Implementations

**Files:**
- Modify: `packages/plugins/learn-card-network/src/types.ts`
- Modify: `packages/plugins/learn-card-network/src/plugin.ts`

- [ ] **Step 1: Add type definitions**

In `types.ts`, after the `rejectGuardianCredential` type (line 617), add:

```typescript
    approveGuardianCredentialInApp: (inboxCredentialId: string) => Promise<{ success: boolean }>;
    rejectGuardianCredentialInApp: (inboxCredentialId: string) => Promise<{ success: boolean }>;
```

Also update the `getGuardianPendingCredential` return type (line 607-613) to include `canApproveInApp`:

```typescript
    getGuardianPendingCredential: (token: string) => Promise<{
        inboxCredentialId: string;
        guardianStatus: string;
        issuer: { displayName: string; profileId: string };
        credentialName?: string;
        createdAt: string;
        expiresAt: string;
        canApproveInApp: boolean;
    }>;
```

- [ ] **Step 2: Add plugin implementations**

In `plugin.ts`, after the `rejectGuardianCredential` implementation (line 1597), add:

```typescript
            approveGuardianCredentialInApp: async (_learnCard, inboxCredentialId) => {
                await ensureUser();
                return client.inbox.approveGuardianCredentialInApp.mutate({ inboxCredentialId });
            },
            rejectGuardianCredentialInApp: async (_learnCard, inboxCredentialId) => {
                await ensureUser();
                return client.inbox.rejectGuardianCredentialInApp.mutate({ inboxCredentialId });
            },
```

- [ ] **Step 3: Verify types compile**

Run:
```bash
cd packages/plugins/learn-card-network && pnpm exec tsc --noEmit --pretty 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add packages/plugins/learn-card-network/src/types.ts packages/plugins/learn-card-network/src/plugin.ts
git commit -m "feat(plugin): add approveGuardianCredentialInApp and rejectGuardianCredentialInApp methods"
```

---

## Task 6: Frontend — `NotificationGuardianApprovalCard` Component

**Files:**
- Create: `apps/learn-card-app/src/components/notifications/notificationsV2/NotificationGuardianApprovalCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React, { useState } from 'react';
import moment from 'moment';
import { ErrorBoundary } from '@sentry/react';
import { UserProfilePicture, useLearnCard, useUpdateNotification } from 'learn-card-base';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import X from 'learn-card-base/svgs/X';
import { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';

type NotificationGuardianApprovalCardProps = {
    notification: NotificationType;
    onRead?: () => void;
};

type ActionState = 'pending' | 'approving' | 'rejecting' | 'approved' | 'rejected';

const NotificationGuardianApprovalCard: React.FC<NotificationGuardianApprovalCardProps> = ({
    notification,
    onRead,
}) => {
    const learnCard = useLearnCard();
    const { mutate: updateNotification } = useUpdateNotification();

    // Derive initial state from actionStatus
    const initialState: ActionState =
        notification?.actionStatus === 'COMPLETED'
            ? 'approved'
            : notification?.actionStatus === 'REJECTED'
            ? 'rejected'
            : 'pending';

    const [actionState, setActionState] = useState<ActionState>(initialState);

    const transactionDate = notification.sent;
    const formattedDate = moment(transactionDate).format('MMM D, YYYY h:mma');

    const inboxCredentialId = notification?.data?.inboxCredentialId as string | undefined;
    const credentialName = (notification?.data?.credentialName as string) || 'a credential';
    const childDisplayName = (notification?.data?.childDisplayName as string) || 'your student';
    const issuerDisplayName = (notification?.data?.issuerDisplayName as string) || 'an issuer';

    const handleApprove = async () => {
        if (!inboxCredentialId || actionState !== 'pending') return;
        setActionState('approving');
        try {
            await learnCard?.invoke?.approveGuardianCredentialInApp(inboxCredentialId);
            setActionState('approved');
            updateNotification({
                notificationId: notification?._id,
                payload: { actionStatus: 'COMPLETED', read: true },
            });
        } catch (err) {
            console.error('[NotificationGuardianApprovalCard] Approve failed:', err);
            setActionState('pending');
        }
    };

    const handleReject = async () => {
        if (!inboxCredentialId || actionState !== 'pending') return;
        setActionState('rejecting');
        try {
            await learnCard?.invoke?.rejectGuardianCredentialInApp(inboxCredentialId);
            setActionState('rejected');
            updateNotification({
                notificationId: notification?._id,
                payload: { actionStatus: 'REJECTED', read: true },
            });
        } catch (err) {
            console.error('[NotificationGuardianApprovalCard] Reject failed:', err);
            setActionState('pending');
        }
    };

    const handleMarkRead = async () => {
        await onRead?.();
    };

    const isProcessing = actionState === 'approving' || actionState === 'rejecting';
    const isResolved = actionState === 'approved' || actionState === 'rejected';

    return (
        <ErrorBoundary
            fallback={
                <div className="flex min-h-[120px] justify-start max-w-[600px] items-start relative w-full rounded-3xl py-[10px] px-[10px] bg-blue-50 my-[15px]">
                    Unable to load notification
                </div>
            }
        >
            <div
                onClick={handleMarkRead}
                className="flex gap-3 min-h-[120px] justify-start items-start max-w-[600px] relative w-full rounded-3xl py-[10px] px-[10px] bg-amber-50 my-[15px]"
            >
                <div className="notification-card-left-side px-[0px] flex cursor-pointer shrink-0">
                    <UserProfilePicture
                        user={notification.from}
                        customContainerClass="h-[60px] w-[60px] rounded-full text-white"
                        customImageClass="h-[60px] w-[60px]"
                        customSize={120}
                    />
                </div>

                <div className="text-left flex flex-col gap-[10px] items-start justify-start w-full">
                    <h4
                        className="cursor-pointer font-bold tracking-wide line-clamp-2 text-black text-[14px] pr-[20px] notification-card-title"
                        data-testid="notification-title"
                    >
                        Credential Approval Request
                    </h4>
                    <p
                        className="font-semibold p-0 leading-none tracking-wide text-[12px] text-grayscale-500"
                        data-testid="notification-type"
                    >
                        Guardian Approval{' '}
                        {transactionDate && (
                            <span className="text-grayscale-600 normal-case font-normal text-[12px]">
                                • {formattedDate}
                            </span>
                        )}
                    </p>
                    <p className="text-[13px] text-grayscale-700 leading-snug">
                        <strong>{credentialName}</strong> for <strong>{childDisplayName}</strong> from{' '}
                        {issuerDisplayName}
                    </p>

                    {!isResolved && (
                        <div className="flex items-center gap-2 mt-1 w-full">
                            <button
                                className={`flex items-center justify-center flex-1 rounded-[24px] border-2 border-solid font-semibold py-2 px-3 tracking-wide text-[13px] ${
                                    isProcessing
                                        ? 'border-grayscale-300 text-grayscale-400 bg-grayscale-100 cursor-not-allowed'
                                        : 'border-emerald-600 text-white bg-emerald-600 hover:bg-emerald-700'
                                }`}
                                onClick={handleApprove}
                                disabled={isProcessing}
                            >
                                {actionState === 'approving' ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                                className={`flex items-center justify-center flex-1 rounded-[24px] border-2 border-solid font-semibold py-2 px-3 tracking-wide text-[13px] ${
                                    isProcessing
                                        ? 'border-grayscale-300 text-grayscale-400 bg-white cursor-not-allowed'
                                        : 'border-red-500 text-red-500 bg-white hover:bg-red-50'
                                }`}
                                onClick={handleReject}
                                disabled={isProcessing}
                            >
                                {actionState === 'rejecting' ? 'Rejecting...' : 'Reject'}
                            </button>
                        </div>
                    )}

                    {actionState === 'approved' && (
                        <div className="flex items-center gap-1 mt-1 text-emerald-600 font-semibold text-[13px]">
                            <Checkmark className="h-[18px]" />
                            Approved
                        </div>
                    )}

                    {actionState === 'rejected' && (
                        <div className="flex items-center gap-1 mt-1 text-red-500 font-semibold text-[13px]">
                            <X className="h-[14px] w-[14px]" />
                            Rejected
                        </div>
                    )}
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default NotificationGuardianApprovalCard;
```

- [ ] **Step 2: Commit**

```bash
git add apps/learn-card-app/src/components/notifications/notificationsV2/NotificationGuardianApprovalCard.tsx
git commit -m "feat(app): add NotificationGuardianApprovalCard component"
```

---

## Task 7: Frontend — `NotificationGuardianOutcomeCard` (Student Info Card)

**Files:**
- Create: `apps/learn-card-app/src/components/notifications/notificationsV2/NotificationGuardianOutcomeCard.tsx`

- [ ] **Step 1: Create the component**

Follows the `NotificationProfileApprovalCard` pattern — info-only, no buttons:

```tsx
import React from 'react';
import moment from 'moment';
import { ErrorBoundary } from '@sentry/react';
import { UserProfilePicture } from 'learn-card-base';
import { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';

type NotificationGuardianOutcomeCardProps = {
    notification: NotificationType;
    variant: 'approved' | 'rejected';
    onRead?: () => void;
};

const NotificationGuardianOutcomeCard: React.FC<NotificationGuardianOutcomeCardProps> = ({
    notification,
    variant,
    onRead,
}) => {
    const transactionDate = notification.sent;
    const formattedDate = moment(transactionDate).format('MMM D, YYYY h:mma');

    const bgColor = variant === 'approved' ? 'bg-emerald-50' : 'bg-red-50';
    const accentColor = variant === 'approved' ? 'text-emerald-600' : 'text-red-500';
    const statusText = variant === 'approved' ? 'Approved' : 'Not Approved';

    const handleMarkRead = async () => {
        await onRead?.();
    };

    return (
        <ErrorBoundary
            fallback={
                <div className="flex min-h-[120px] justify-start max-w-[600px] items-start relative w-full rounded-3xl py-[10px] px-[10px] bg-blue-50 my-[15px]">
                    Unable to load notification
                </div>
            }
        >
            <div
                onClick={handleMarkRead}
                className={`flex gap-3 min-h-[100px] justify-start items-center max-w-[600px] relative w-full rounded-3xl py-[10px] px-[10px] ${bgColor} my-[15px]`}
            >
                <div className="notification-card-left-side px-[0px] flex cursor-pointer shrink-0">
                    <UserProfilePicture
                        user={notification.from}
                        customContainerClass="h-[60px] w-[60px] rounded-full text-white"
                        customImageClass="h-[60px] w-[60px]"
                        customSize={120}
                    />
                </div>

                <div className="text-left flex flex-col gap-[10px] items-start justify-start w-full">
                    <h4
                        className="cursor-pointer font-bold tracking-wide line-clamp-2 text-black text-[14px] pr-[20px] notification-card-title"
                        data-testid="notification-title"
                    >
                        {notification.message?.title}
                    </h4>
                    <p
                        className="font-semibold p-0 leading-none tracking-wide text-[12px] text-grayscale-500"
                        data-testid="notification-type"
                    >
                        <span className={accentColor}>{statusText}</span>{' '}
                        {transactionDate && (
                            <span className="text-grayscale-600 normal-case font-normal text-[12px]">
                                • {formattedDate}
                            </span>
                        )}
                    </p>
                    <p className="text-[13px] text-grayscale-700">{notification.message?.body}</p>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default NotificationGuardianOutcomeCard;
```

- [ ] **Step 2: Commit**

```bash
git add apps/learn-card-app/src/components/notifications/notificationsV2/NotificationGuardianOutcomeCard.tsx
git commit -m "feat(app): add NotificationGuardianOutcomeCard component for student notifications"
```

---

## Task 8: Frontend — Wire Notification Cards into `NotificationCardContainer`

**Files:**
- Modify: `apps/learn-card-app/src/components/notifications/notificationsV2/NotificationCardContainer.tsx`

- [ ] **Step 1: Add imports and NOTIFICATION_TYPES entries**

At the top of the file, add imports after line 15 (`import NotificationAppStoreCard from './NotificationAppStoreCard';`):

```typescript
import NotificationGuardianApprovalCard from './NotificationGuardianApprovalCard';
import NotificationGuardianOutcomeCard from './NotificationGuardianOutcomeCard';
```

Add entries to the `NOTIFICATION_TYPES` object (after line 36, the `APP_LISTING_REJECTED` entry):

```typescript
    GUARDIAN_APPROVAL_PENDING: 'GUARDIAN_APPROVAL_PENDING',
    GUARDIAN_APPROVED: 'GUARDIAN_APPROVED',
    GUARDIAN_REJECTED: 'GUARDIAN_REJECTED',
```

- [ ] **Step 2: Add dispatch cases**

Inside the `NotificationCardContainer` component, after the `PROFILE_PARENT_APPROVED` block (after line 300), add:

```typescript
    /* Guardian credential approval request */
    if (type === NOTIFICATION_TYPES.GUARDIAN_APPROVAL_PENDING) {
        return (
            <NotificationGuardianApprovalCard
                notification={notification}
                onRead={handleMarkAsRead}
            />
        );
    }
    /* Guardian approved a credential for the student */
    if (type === NOTIFICATION_TYPES.GUARDIAN_APPROVED) {
        return (
            <NotificationGuardianOutcomeCard
                notification={notification}
                variant="approved"
                onRead={handleMarkAsRead}
            />
        );
    }
    /* Guardian rejected a credential for the student */
    if (type === NOTIFICATION_TYPES.GUARDIAN_REJECTED) {
        return (
            <NotificationGuardianOutcomeCard
                notification={notification}
                variant="rejected"
                onRead={handleMarkAsRead}
            />
        );
    }
```

- [ ] **Step 3: Commit**

```bash
git add apps/learn-card-app/src/components/notifications/notificationsV2/NotificationCardContainer.tsx
git commit -m "feat(app): wire guardian notification cards into NotificationCardContainer"
```

---

## Task 9: Frontend — `GuardianCredentialApprovalPage` OTP-Skip + Verbiage

**Files:**
- Modify: `apps/learn-card-app/src/pages/interactions/GuardianCredentialApprovalPage.tsx`

- [ ] **Step 1: Update `CredentialInfo` type**

Update the `CredentialInfo` type (line 12-19) to include the new field:

```typescript
type CredentialInfo = {
    inboxCredentialId: string;
    guardianStatus: string;
    issuer: { displayName: string; profileId: string };
    credentialName?: string;
    createdAt: string;
    expiresAt: string;
    canApproveInApp: boolean;
};
```

Also update the `LCNOpenInvoke` type (line 33-38) to add the new methods:

```typescript
type LCNOpenInvoke = {
    getGuardianPendingCredential: (token: string) => Promise<CredentialInfo>;
    sendGuardianChallenge: (token: string) => Promise<{ message: string }>;
    approveGuardianCredential: (token: string, otpCode: string) => Promise<{ message: string; alreadyLinked: boolean }>;
    rejectGuardianCredential: (token: string, otpCode: string) => Promise<{ message: string }>;
    approveGuardianCredentialInApp: (inboxCredentialId: string) => Promise<{ success: boolean }>;
    rejectGuardianCredentialInApp: (inboxCredentialId: string) => Promise<{ success: boolean }>;
};
```

- [ ] **Step 2: Add `canSkipOtp` state and in-app handlers**

After the existing state declarations (line 61, after `const [otpCode, setOtpCode] = useState<string>('');`), add:

```typescript
    const [canSkipOtp, setCanSkipOtp] = useState<boolean>(false);
```

In the `init` function (lines 74-99), after `setCredentialInfo(info);` (line 85), and before the guardianStatus checks (line 87), add:

```typescript
                setCanSkipOtp(info.canApproveInApp);
```

After `handleReject` (line 141), add the in-app handlers:

```typescript
    const handleApproveInApp = async () => {
        if (!invokeRef.current || !credentialInfo?.inboxCredentialId) return;
        setState('approving');
        try {
            await invokeRef.current.approveGuardianCredentialInApp(credentialInfo.inboxCredentialId);
            setResultMessage('Credential approved.');
            setState('approved');
        } catch (e: unknown) {
            setError(toErrorMessage(e));
            setState('error');
        }
    };

    const handleRejectInApp = async () => {
        if (!invokeRef.current || !credentialInfo?.inboxCredentialId) return;
        setState('rejecting');
        try {
            await invokeRef.current.rejectGuardianCredentialInApp(credentialInfo.inboxCredentialId);
            setResultMessage('Credential rejected.');
            setState('rejected');
        } catch (e: unknown) {
            setError(toErrorMessage(e));
            setState('error');
        }
    };
```

- [ ] **Step 3: Update the `ready` state render to support OTP-skip**

Replace the `{state === 'ready' && (` block (lines 186-200) with:

```tsx
                            {state === 'ready' && !canSkipOtp && (
                                <div className="w-full max-w-sm">
                                    <p className="text-emerald-100 text-sm mb-4">
                                        To approve or reject, we'll send a verification code to your email.
                                    </p>
                                    <p className="text-emerald-200 text-xs mb-4 leading-relaxed">
                                        By approving, your account will be linked with the student's account
                                        and you'll be able to manage their future credential approvals directly
                                        from your notifications.
                                    </p>
                                    <IonButton
                                        expand="block"
                                        color="light"
                                        onClick={handleSendCode}
                                        disabled={isProcessing}
                                    >
                                        Send Verification Code
                                    </IonButton>
                                </div>
                            )}

                            {state === 'ready' && canSkipOtp && (
                                <div className="w-full max-w-sm">
                                    <p className="text-emerald-100 text-sm mb-4">
                                        You have a guardian relationship with this student.
                                        You can approve or reject this credential directly.
                                    </p>
                                    <IonButton
                                        expand="block"
                                        color="light"
                                        onClick={handleApproveInApp}
                                        disabled={isProcessing}
                                    >
                                        Approve
                                    </IonButton>
                                    <IonButton
                                        expand="block"
                                        fill="outline"
                                        color="light"
                                        onClick={handleRejectInApp}
                                        disabled={isProcessing}
                                        className="mt-2"
                                    >
                                        Reject
                                    </IonButton>
                                </div>
                            )}
```

- [ ] **Step 4: Commit**

```bash
git add apps/learn-card-app/src/pages/interactions/GuardianCredentialApprovalPage.tsx
git commit -m "feat(app): add OTP-skip logic and MANAGES verbiage to GuardianCredentialApprovalPage"
```

---

## Task 10: Code Comments — LC-1730/1731 Status

**Files:**
- Modify: `services/learn-card-network/brain-service/src/helpers/guardian-approval.helpers.ts`
- Modify: `services/learn-card-network/brain-service/src/routes/inbox.ts`
- Modify: `apps/learn-card-app/src/pages/interactions/GuardianCredentialApprovalPage.tsx`

- [ ] **Step 1: Add comment to `guardian-approval.helpers.ts`**

At the top of the file (before the first import), add:

```typescript
// NOTE: Guardian credential approval (LC-1729/1730/1731) is not feature complete.
// Current implementation creates a MANAGES relationship but guardian child accounts
// are full independent accounts with a guardian — not the same as family child accounts.
// This is part of a larger goal of making child accounts independent of parent accounts.
```

- [ ] **Step 2: Add comment to `inbox.ts`**

Above the `getGuardianPendingCredential` route (before line 749), add:

```typescript
    // ─── Guardian Credential Approval Routes ─────────────────────────────────────
    // NOTE: LC-1729/1730/1731 guardian features are not feature complete. The guardian
    // child account model creates a MANAGES relationship but guardian children are full
    // independent accounts — not the same as family child accounts. Part of a larger
    // effort to make child accounts independent of parent accounts.
```

- [ ] **Step 3: Add comment to `GuardianCredentialApprovalPage.tsx`**

At the top of the file (before the first import on line 1), add:

```typescript
// NOTE: Guardian credential approval (LC-1729/1730/1731) is not feature complete.
// Guardian child accounts are full independent accounts with a guardian — not the same
// as family child accounts. Part of a larger goal of making child accounts independent
// of parent accounts.
```

- [ ] **Step 4: Commit**

```bash
git add services/learn-card-network/brain-service/src/helpers/guardian-approval.helpers.ts services/learn-card-network/brain-service/src/routes/inbox.ts apps/learn-card-app/src/pages/interactions/GuardianCredentialApprovalPage.tsx
git commit -m "docs: add LC-1730/1731 status comments noting guardian features not feature complete"
```

---

## Task 11: Verification

- [ ] **Step 1: Build brain-service**

```bash
cd services/learn-card-network/brain-service && pnpm build
```

Expected: Build succeeds without errors.

- [ ] **Step 2: Build learn-card-network plugin**

```bash
pnpm exec nx build learn-card-network-plugin
```

Expected: Build succeeds.

- [ ] **Step 3: Run existing guardian tests**

```bash
cd services/learn-card-network/brain-service && pnpm test -- run --testFile=test/guardian-credential-approval.spec.ts
```

Expected: All existing tests pass (new routes are additive, don't break existing behavior).

- [ ] **Step 4: Run guardian gated routes tests**

```bash
cd services/learn-card-network/brain-service && pnpm test -- run --testFile=test/guardian-gated-routes.spec.ts
```

Expected: All existing tests pass.

- [ ] **Step 5: Manual verification checklist**

Verify these scenarios work end-to-end:

1. **First credential (no MANAGES):** Issue guardian-gated credential → guardian gets email only (no in-app notification) → OTP flow unchanged → MANAGES created
2. **Subsequent credential (MANAGES exists):** Issue another guardian-gated credential → guardian gets email AND in-app notification → approve via notification → student gets email + in-app notification → notification card shows "Approved ✓"
3. **Reject via notification:** Same as above but reject → student notified → card shows "Rejected"
4. **Email link while logged in:** Guardian clicks email link while logged in with MANAGES → page shows Approve/Reject directly (no OTP) → approve works
5. **Email link not logged in:** Guardian clicks email link not logged in → standard OTP flow
6. **Cross-path resolution:** Approve via email → notification card shows resolved state

- [ ] **Step 6: Commit any fixes from verification**
