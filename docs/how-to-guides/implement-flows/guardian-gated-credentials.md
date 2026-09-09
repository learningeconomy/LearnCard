---
description: 'How-To Guide: Sending credentials that require guardian approval before a minor can claim them'
---

# Guardian-Gated Credentials

Issue credentials that require guardian approval before the recipient can claim them. This is for organizations issuing credentials to minors or managed accounts.

**~5 minutes · Needs:** LearnCard SDK, a credential template

## Overview

When you send a credential with a `guardianEmail`:

1. The guardian receives an approval link.
2. The student receives a notice that their credential is awaiting approval.
3. The guardian approves or rejects via a 6-digit OTP.
4. The student is notified and can claim the credential if approved.

If the guardian has a LearnCard account with a MANAGES relationship to the student, they can approve directly in the app without OTP.

## Sending a Guardian-Gated Credential

Add `guardianEmail` to `options` when calling `send`:

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
console.log(result.inbox?.issuanceId); // Tracking ID
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

### What each person sees

- **The guardian** gets an approval email and approves via a 6-digit OTP.
- **The learner** gets a "pending guardian approval" notice until then, followed by the normal claim flow once approved.
- **You (the issuer)** see the credential status move from `AWAITING_GUARDIAN` to `GUARDIAN_APPROVED` or `GUARDIAN_REJECTED`.

### Requirements

- `guardianEmail` must be different from the recipient email
- The credential is held in `AWAITING_GUARDIAN` status until the guardian acts
- The student cannot claim the credential until the guardian approves

## Guardian Approval Flow

The guardian receives an email with an approval link:

1. Guardian clicks the link.
2. System shows credential details.
3. Guardian requests a 6-digit OTP.
4. Guardian enters OTP and approves or rejects.
5. Student receives an email notification.

### After Approval

- The credential status changes to `GUARDIAN_APPROVED` and becomes claimable
- If the guardian creates a LearnCard account afterward, the system automatically establishes a **MANAGES** relationship with the student
- Future credentials to that student are automatically guardian-gated (no `guardianEmail` needed from the issuer)

### After Rejection

- The credential status changes to `GUARDIAN_REJECTED`
- The student is notified but cannot claim the credential

## Automatic Guardian Gating (Managed Accounts)

Once a MANAGES relationship exists, **all future inbox credentials** sent to that student are automatically guardian-gated, even without `guardianEmail`.

- The guardian receives an in-app notification for each new credential
- The guardian can approve or reject directly in the LearnCard app (no OTP needed)
- The `finalize` response includes a `guardianPending` count showing how many credentials are awaiting approval

```typescript
const finalizeResult = await learnCard.invoke.finalizeInboxCredentials();
console.log(finalizeResult.guardianPending); // Number of credentials awaiting guardian approval
```

## Guardian Status Values

| Status              | Meaning                                                    |
| ------------------- | ---------------------------------------------------------- |
| `AWAITING_GUARDIAN` | Credential sent, waiting for guardian to approve or reject |
| `GUARDIAN_APPROVED` | Guardian approved, student can claim                       |
| `GUARDIAN_REJECTED` | Guardian rejected, student cannot claim                    |

## What you should see

When you send the credential, the API returns a tracking ID and a status of `AWAITING_GUARDIAN`. The guardian receives an email, and the student sees a pending notice.

## Troubleshooting

| If…                                              | Then                                                                                                            |
| :----------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| `guardianEmail must be different from recipient` | Ensure you are not sending the approval request to the student's own email address.                             |
| `Credential stuck in AWAITING_GUARDIAN`          | The guardian has not yet approved or rejected the credential. You can resend the approval email if necessary.   |
| `Student cannot claim credential`                | Verify the credential status is `GUARDIAN_APPROVED`. If it is `GUARDIAN_REJECTED`, the student cannot claim it. |

## Related

- [Send Credentials](../send-credentials.md) — General credential sending guide
- [Universal Inbox](../../core-concepts/network-and-interactions/universal-inbox.md) — How the inbox system works
- [Network Profiles](../../core-concepts/identities-and-keys/network-profiles.md) — Profile types including managed profiles
