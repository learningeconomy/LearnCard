# Guardian In-App Notification Approval

**Date:** 2026-04-10
**Status:** Draft
**Related tickets:** LC-1729, LC-1730, LC-1731

## Context

Guardian-gated credential issuance (LC-1729) currently requires the guardian to approve each credential via an email link + OTP flow. This works but creates friction when the guardian already has a LearnCard account and an established MANAGES relationship with the child. This spec adds an in-app notification approval path so returning guardians can approve credentials directly from their notifications list without leaving the app or entering OTP codes.

LC-1730 and LC-1731 are **not feature complete** and are part of a larger goal of making guardian child accounts independent of parent accounts. The current implementation creates a profile manager (MANAGES) relationship, but the guardian child account is a full independent account with a guardian — not the same as a family child account. Code comments should document this status.

## Decision: When to Use In-App vs OTP

- **In-app notification path:** Guardian has an existing LearnCard account AND has a MANAGES relationship with the child profile.
- **OTP email path (unchanged):** Guardian does not have an account, or has an account but no MANAGES relationship yet (first credential).
- **Both paths always send the email.** When in-app is triggered, the guardian gets both an email and an in-app notification. Either path can be used to approve.

## 1. Backend: Notification Trigger

**File:** `services/learn-card-network/brain-service/src/helpers/inbox.helpers.ts` (in `issueToInbox`)

When a guardian-gated credential is issued (`configuration.guardianEmail` is set):

1. Resolve guardian email → contact method → profile (existing pattern: `getContactMethodByValue` + `getProfileByContactMethod`)
2. If profile exists, check for MANAGES relationship between guardian profile and child profile (query: does any ProfileManager administered by guardian's profile MANAGE the child profile?)
3. **If MANAGES exists:**
   - Send in-app notification via `addNotificationToQueue()`:
     ```
     type: GUARDIAN_APPROVAL_PENDING
     to: guardianProfile
     from: childProfile (or issuer profile)
     message: { title: "Credential Approval Request", body: "[credentialName] for [childDisplayName] from [issuerDisplayName]" }
     data: { inboxCredentialId, childProfileId, childDisplayName, credentialName, issuerDisplayName }
     ```
   - **Also send the email** (existing flow unchanged — guardian gets both)
4. **If no MANAGES:** Current email-only + OTP flow (unchanged)

## 2. Backend: New Authenticated Routes

**File:** `services/learn-card-network/brain-service/src/routes/inbox.ts`

Two new **protected** (authenticated) routes:

### `approveGuardianCredentialInApp`

- **Input:** `{ inboxCredentialId: string }`
- **Auth:** Requires authenticated session (standard protectedRoute)
- **Verification:**
  1. Fetch InboxCredential by ID, verify `guardianStatus === 'AWAITING_GUARDIAN'`
  2. Get child profile from inbox credential (via `getProfileForInboxCredential`)
  3. Verify caller has MANAGES relationship with child profile (query managers of child, check caller's profileId is among them)
  4. If any check fails → FORBIDDEN
- **Actions:**
  1. Update InboxCredential: `guardianStatus = 'GUARDIAN_APPROVED'`, `isAccepted = true`, `guardianApprovedAt = now`, `guardianApprovedByDid = caller.did`
  2. Mark any outstanding approval token as used (prevent stale email link from double-approving)
  3. Send student email: `guardian-approved-claim` template (existing)
  4. Send student in-app notification: `GUARDIAN_APPROVED` type with credential name and guardian name
- **Returns:** `{ success: true }`

### `rejectGuardianCredentialInApp`

- **Input:** `{ inboxCredentialId: string }`
- **Auth/Verification:** Same as approve
- **Actions:**
  1. Update InboxCredential: `guardianStatus = 'GUARDIAN_REJECTED'`
  2. Mark outstanding approval token as used
  3. Send student email: `guardian-rejected-credential` template (existing)
  4. Send student in-app notification: `GUARDIAN_REJECTED` type
- **Returns:** `{ success: true }`

### Shared Helper: MANAGES Verification

Extract a reusable helper (or inline in routes):
```typescript
async function verifyGuardianManagesChild(
  guardianProfileId: string,
  childProfileId: string
): Promise<boolean>
```
Queries: does any `ProfileManager` that is `administratedBy` the guardian profile also `MANAGES` the child profile?

## 3. Backend: Access Layer Additions

**File:** `services/learn-card-network/brain-service/src/accesslayer/inbox-credential/read.ts`

- `getInboxCredentialById(inboxCredentialId: string)` — fetch credential by ID (may already exist, verify)

**File:** `services/learn-card-network/brain-service/src/accesslayer/profile-manager/relationships/read.ts`

- `doesProfileManageProfile(guardianProfileId: string, childProfileId: string): Promise<boolean>` — Cypher query checking MANAGES chain:
  ```cypher
  MATCH (guardian:Profile {profileId: $guardianProfileId})<-[:ADMINISTRATED_BY]-(manager:ProfileManager)-[:MANAGES]->(child:Profile {profileId: $childProfileId})
  RETURN count(manager) > 0 AS manages
  ```

## 4. Frontend: NotificationGuardianApprovalCard

**New file:** `apps/learn-card-app/src/components/notifications/notificationsV2/NotificationGuardianApprovalCard.tsx`

Follows `ConnectionRequestCard` pattern:

- **Layout:** Profile picture (child) | Title + body text | Approve button + Reject button
- **Title:** "Credential Approval Request"
- **Body:** "[Credential Name] for [Child Name] from [Issuer Name]" (parsed from `notification.data`)
- **Approve button:** Primary (blue), calls `approveGuardianCredentialInApp(inboxCredentialId)` via plugin, then `useUpdateNotification` to set `actionStatus: 'COMPLETED'`
- **Reject button:** Secondary (red outline), calls `rejectGuardianCredentialInApp(inboxCredentialId)` via plugin, then `useUpdateNotification` to set `actionStatus: 'REJECTED'`
- **Resolved state:** If `actionStatus` is already `COMPLETED` or `REJECTED` on render (e.g., approved via email path), show "Approved ✓" or "Rejected" text with disabled/grayed buttons
- **Loading state:** Disable both buttons while mutation is in flight

### NotificationCardContainer Update

**File:** `apps/learn-card-app/src/components/notifications/notificationsV2/NotificationCardContainer.tsx`

Add case:
```typescript
if (type === 'GUARDIAN_APPROVAL_PENDING') {
  return <NotificationGuardianApprovalCard notification={notification} />;
}
```

## 5. Frontend: Student Notification Cards

For `GUARDIAN_APPROVED` and `GUARDIAN_REJECTED` types — simple info-only cards:

- **GUARDIAN_APPROVED:** "Your credential [Name] has been approved by your guardian." Green accent/checkmark icon.
- **GUARDIAN_REJECTED:** "Your credential [Name] was not approved by your guardian." Red accent/X icon.

These follow the `NotificationProfileApprovalCard` pattern — informational, no action buttons.

Add cases in `NotificationCardContainer.tsx` for both types.

## 6. Frontend: Plugin Layer

**Files:**
- `packages/plugins/learn-card-network/src/types.ts`
- `packages/plugins/learn-card-network/src/plugin.ts`

Add two new methods:
- `approveGuardianCredentialInApp(inboxCredentialId: string): Promise<{ success: boolean }>`
- `rejectGuardianCredentialInApp(inboxCredentialId: string): Promise<{ success: boolean }>`

These call the corresponding brain-service tRPC routes.

## 7. Frontend: GuardianCredentialApprovalPage Enhancement

**File:** `apps/learn-card-app/src/pages/interactions/GuardianCredentialApprovalPage.tsx`

### OTP-Skip Logic

The existing `getGuardianPendingCredential` open route needs enhancement: if the request includes a valid auth header, the backend also checks whether the authenticated user has a MANAGES relationship with the child who owns the credential. It returns a new field `canApproveInApp: boolean` in the response (defaults to `false` for unauthenticated requests).

On the frontend, after fetching credential details via `getGuardianPendingCredential(token)`:

1. Check if `canApproveInApp` is `true` in the response
2. **If true:** Skip OTP states (`sending_code`, `code_sent`). Show credential details + Approve/Reject buttons that call the authenticated routes (`approveGuardianCredentialInApp` / `rejectGuardianCredentialInApp`).
3. **If false:** Current OTP flow unchanged.

**Backend change to `getGuardianPendingCredential` route:** Add optional auth detection. If caller is authenticated, resolve their profile and check `doesProfileManageProfile(callerProfileId, childProfileId)`. Include `canApproveInApp` and `inboxCredentialId` in response.

### MANAGES Relationship Verbiage

Add explanatory text visible during the **first-time OTP flow** (when MANAGES doesn't exist yet):

> "By approving this credential, your account will be linked with [Child Name]'s account. You'll receive future credential approval requests as in-app notifications and will be able to approve them directly without needing a verification code."

This text appears above the approve/reject buttons in the OTP flow.

## 8. Code Comments: LC-1730/1731 Status

Add comments in the following files noting that the guardian system is not feature complete:

- `services/learn-card-network/brain-service/src/helpers/guardian-approval.helpers.ts` — top of file
- `services/learn-card-network/brain-service/src/routes/inbox.ts` — near guardian routes section
- `apps/learn-card-app/src/pages/interactions/GuardianCredentialApprovalPage.tsx` — top of file

Comment template:
```
// NOTE: Guardian credential approval (LC-1729/1730/1731) is not feature complete.
// Current implementation creates a MANAGES relationship but guardian child accounts
// are full independent accounts with a guardian — not the same as family child accounts.
// This is part of a larger goal of making child accounts independent of parent accounts.
```

## 9. Data Flow Summary

```
Credential Issued with guardianEmail
  │
  ├─ Guardian has account + MANAGES? ──YES──┐
  │                                          │
  │  Send email (existing)                   │
  │  Send in-app notification ◄──────────────┘
  │  (GUARDIAN_APPROVAL_PENDING)
  │
  ├─ No account or no MANAGES ─────────────────
  │  Send email only (existing OTP flow)
  │
  ▼
Guardian receives notification
  │
  ├─ Via in-app notification card
  │   Approve/Reject buttons
  │   → approveGuardianCredentialInApp (authenticated)
  │   → rejectGuardianCredentialInApp (authenticated)
  │
  ├─ Via email link (logged in + MANAGES)
  │   GuardianCredentialApprovalPage detects auth + MANAGES
  │   → Skip OTP, show Approve/Reject buttons
  │   → Same authenticated routes
  │
  └─ Via email link (not logged in)
      Current OTP flow (unchanged)
  │
  ▼
On approve/reject:
  Update InboxCredential guardianStatus
  Invalidate outstanding approval token
  Send student email (existing templates)
  Send student in-app notification (GUARDIAN_APPROVED / GUARDIAN_REJECTED)
  Update notification actionStatus (resolved state on card)
```

## 10. Files to Modify

| File | Change |
|------|--------|
| `services/learn-card-network/brain-service/src/helpers/inbox.helpers.ts` | Trigger logic: detect MANAGES, send in-app notification |
| `services/learn-card-network/brain-service/src/routes/inbox.ts` | New routes: `approveGuardianCredentialInApp`, `rejectGuardianCredentialInApp` |
| `services/learn-card-network/brain-service/src/accesslayer/profile-manager/relationships/read.ts` | New query: `doesProfileManageProfile` |
| `services/learn-card-network/brain-service/src/accesslayer/inbox-credential/read.ts` | Verify `getInboxCredentialById` exists or add |
| `services/learn-card-network/brain-service/src/helpers/guardian-approval.helpers.ts` | LC-1730/1731 code comments |
| `packages/plugins/learn-card-network/src/types.ts` | Two new method types |
| `packages/plugins/learn-card-network/src/plugin.ts` | Two new method implementations |
| `apps/learn-card-app/src/components/notifications/notificationsV2/NotificationGuardianApprovalCard.tsx` | **New file**: Guardian approval card with buttons |
| `apps/learn-card-app/src/components/notifications/notificationsV2/NotificationCardContainer.tsx` | Add cases for GUARDIAN_APPROVAL_PENDING, GUARDIAN_APPROVED, GUARDIAN_REJECTED |
| `apps/learn-card-app/src/components/notifications/notificationsV2/NotificationGuardianOutcomeCard.tsx` | **New file**: Info-only card for student (approved/rejected) |
| `apps/learn-card-app/src/pages/interactions/GuardianCredentialApprovalPage.tsx` | OTP-skip logic + MANAGES verbiage + code comments |

## 11. Verification Plan

1. **Unit tests:** Add tests for `approveGuardianCredentialInApp` and `rejectGuardianCredentialInApp` routes in `test/guardian-credential-approval.spec.ts` — verify MANAGES check, status updates, notification sends
2. **Unit tests:** Test `doesProfileManageProfile` access layer query
3. **Integration test (manual):**
   - Issue credential to child with guardianEmail matching an existing guardian account that has MANAGES
   - Verify guardian receives both email AND in-app notification
   - Approve via in-app notification → verify credential status, student notification, resolved card state
   - Issue another credential → reject via email link (while logged in, skipping OTP)
   - Issue another credential → reject via email link (not logged in, OTP flow)
   - Verify cross-path resolution: approve via email, check notification card shows resolved state
4. **Edge case tests:**
   - Guardian approves via notification, then clicks email link → page shows already-approved state
   - Credential already rejected → notification card shows rejected state
   - Non-guardian tries authenticated route → FORBIDDEN
