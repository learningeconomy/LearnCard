---
description: 'How-To Guide: Sending credentials that require guardian approval before a minor can claim them'
---

# Guardian-Gated Credentials

This guide explains how to issue credentials that require guardian (parent) approval before the recipient can claim them. This is designed for organizations issuing credentials to minors or managed accounts where a trusted adult must consent before the credential is finalized.

## Overview

When you send a credential with a `guardianEmail`, the system:

1. **Emails the guardian** an approval link with credential details
2. **Emails the student** a notice that their credential is awaiting guardian approval
3. **Guardian approves or rejects** via a 6-digit OTP verification flow
4. **Student is notified** of the outcome and can claim the credential if approved

If the guardian already has a LearnCard account with a MANAGES relationship to the student, they can also approve directly in the app without OTP.

## Sending a Guardian-Gated Credential

Add `guardianEmail` to the `options` when calling `send`:

```typescript
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'student@school.edu',
    templateUri: 'urn:lc:boost:abc123',
    options: {
        guardianEmail: 'parent@example.com',
        branding: {
            issuerName: 'Springfield Elementary',
        },
    },
});

console.log(result.inbox?.guardianStatus); // 'AWAITING_GUARDIAN'
console.log(result.inbox?.issuanceId);     // Tracking ID
```

### REST API

```bash
POST /send
Authorization: Bearer <token>
Content-Type: application/json

{
    "type": "boost",
    "recipient": "student@school.edu",
    "templateUri": "urn:lc:boost:abc123",
    "options": {
        "guardianEmail": "parent@example.com"
    }
}
```

### Requirements

- `guardianEmail` must be different from the recipient email
- The credential is held in `AWAITING_GUARDIAN` status until the guardian acts
- The student cannot claim the credential until the guardian approves

## Guardian Approval Flow

The guardian receives an email with a link to the approval page. The flow is:

1. Guardian clicks the approval link
2. System shows credential details (issuer, credential name)
3. Guardian requests a 6-digit OTP (sent to their email)
4. Guardian enters OTP and approves or rejects
5. Student receives an email notification with the outcome

### After Approval

- The credential status changes to `GUARDIAN_APPROVED` and becomes claimable
- If the guardian creates a LearnCard account afterward, the system automatically establishes a **MANAGES** relationship with the student
- Future credentials to that student are automatically guardian-gated (no `guardianEmail` needed from the issuer)

### After Rejection

- The credential status changes to `GUARDIAN_REJECTED`
- The student is notified but cannot claim the credential

## Automatic Guardian Gating (Managed Accounts)

Once a MANAGES relationship exists between a guardian and a student, **all future inbox credentials** sent to that student are automatically guardian-gated — even without the issuer specifying `guardianEmail`.

- The guardian receives an in-app notification for each new credential
- The guardian can approve or reject directly in the LearnCard app (no OTP needed)
- The `finalize` response includes a `guardianPending` count showing how many credentials are awaiting approval

```typescript
const finalizeResult = await learnCard.invoke.finalizeInboxCredentials();
console.log(finalizeResult.guardianPending); // Number of credentials awaiting guardian approval
```

## Guardian Status Values

| Status | Meaning |
|--------|---------|
| `AWAITING_GUARDIAN` | Credential sent, waiting for guardian to approve or reject |
| `GUARDIAN_APPROVED` | Guardian approved, student can claim |
| `GUARDIAN_REJECTED` | Guardian rejected, student cannot claim |

## Related

- [Send Credentials](../send-credentials.md) — General credential sending guide
- [Universal Inbox](../../core-concepts/network-and-interactions/universal-inbox.md) — How the inbox system works
- [Network Profiles](../../core-concepts/identities-and-keys/network-profiles.md) — Profile types including managed profiles
