---
'@learncard/types': minor
'@learncard/network-brain-service': minor
'@learncard/network-brain-client': patch
'@learncard/network-plugin': patch
'@learncard/email-templates': minor
---

`sendContractRequest` accepts `targetEmail` as an alternative to `targetProfileId`. An email-addressed request is stored as an invite, always answers `{ requestId, status: 'pending' }`, and becomes an ordinary request when a profile verifies that email. The sender sees only the email, never the profile or DID, until the request is accepted.

Add the `contract-request-invite` email template, sent when the address has no account (at most 3 per contract and address per day). Invites expire after 30 days through the daily maintenance job; `getContractRequest`, `getContractSentRequests` and `cancelContractRequest` cover invites that are not attached to a profile yet.
