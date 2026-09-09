# Errors & Limits

This reference details the errors, rate limits, and validation rules enforced by the LearnCard Network API and SDK.

## Rate Limits

The LearnCard Network enforces fixed-window rate limits to prevent abuse. When a limit is exceeded, the API returns a `TOO_MANY_REQUESTS` (HTTP 429) error.

| Limit            | Window     | Description                                             |
| :--------------- | :--------- | :------------------------------------------------------ |
| **100 requests** | Per minute | App counter increments (`app-counter-rate`)             |
| **80 requests**  | Per minute | Semantic skill searches (`skill-semantic-search-rate`)  |
| **1 request**    | Per hour   | App notifications per user (`app-notif-rate`)           |
| **1 request**    | Per hour   | Server-wide app notifications (`app-notif-server-rate`) |

## Recipient Auto-Detection

When using `learnCard.invoke.send()`, the `recipient` string is automatically parsed to determine the delivery method:

| Format         | Detection Rule                                                              | Delivery Method                                  |
| :------------- | :-------------------------------------------------------------------------- | :----------------------------------------------- |
| **DID**        | Starts with `did:`                                                          | Direct network issuance or remote DID resolution |
| **Email**      | Matches `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`                                      | Universal Inbox (Email delivery)                 |
| **Phone**      | 10+ digits with optional leading `+` (spaces and dashes are stripped first) | Universal Inbox (SMS delivery)                   |
| **Profile ID** | Any other string                                                            | Direct network issuance to a LearnCard profile   |

## Common Errors

The following errors may be returned by the Boosts and Inbox routes.

### Boosts & Issuance

| Error Message                                                          | Cause                                                            | Fix                                                     |
| :--------------------------------------------------------------------- | :--------------------------------------------------------------- | :------------------------------------------------------ |
| `Could not find boost`                                                 | The `templateUri` provided does not exist.                       | Verify the URI matches a published credential template. |
| `Profile does not have permissions to issue boost`                     | You are not an admin of the template.                            | Ensure your wallet is the creator or an added admin.    |
| `Draft Boosts can not be sent. Only Published Boosts can be sent.`     | The template is still in draft mode.                             | Publish the template before issuing.                    |
| `Recipient profile not found`                                          | The provided profile ID does not exist.                          | Verify the recipient has created a LearnCard profile.   |
| `No credential found for this recipient and boost`                     | Attempted to revoke/suspend a credential that wasn't issued.     | Verify the recipient actually holds the credential.     |
| `Cannot delete boost with children`                                    | Attempted to delete a template that has derived child templates. | Delete the child templates first.                       |
| `Boost must be viewable by claim link before generating a claim link.` | The template's privacy settings restrict claim links.            | Update the template settings to allow claim links.      |

### Universal Inbox & Delivery

| Error Message                                                          | Cause                                                    | Fix                                                         |
| :--------------------------------------------------------------------- | :------------------------------------------------------- | :---------------------------------------------------------- |
| `guardianEmail must differ from recipient (self-approval not allowed)` | The recipient and guardian emails are identical.         | Provide a different email for the guardian.                 |
| `Either templateUri, template, or signedCredential must be provided.`  | The `send()` request is missing the payload.             | Provide a `templateUri`, `template`, or `signedCredential`. |
| `Either credential or templateUri must be provided.`                   | The inbox `issue` request is missing the payload.        | Provide a valid `templateUri` or signed `credential`.       |
| `Failed to prepare boost credential template`                          | The template data is invalid or missing required fields. | Check the template schema and provided data.                |
| `Token is not a credential-scoped approval token.`                     | The provided token is invalid for guardian approval.     | Ensure you are using the correct token from the email.      |
| `Invalid or expired verification code.`                                | The 6-digit code is incorrect or has expired.            | Request a new verification code.                            |
| `Verification code does not match guardian email.`                     | The code was generated for a different email address.    | Use the code sent to the correct guardian email.            |
| `You do not have a guardian relationship with this child.`             | Attempted to approve a credential for an unlinked child. | Complete the guardian linking flow first.                   |

## Expiry Defaults

- **Inbox Claim Links:** Expire after 24 hours by default, or `24 × expiresInDays` hours when `expiresInDays` is set on the issuance.
- **Inbox Credentials:** The pending credential itself expires after 30 days by default (`expiresInDays`).
- **Contact Method Verification Tokens:** Expire after 24 hours.
