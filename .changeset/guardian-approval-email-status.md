---
'@learncard/types': minor
'@learncard/network-plugin': minor
'@learncard/network-brain-service': minor
'learn-card-app': patch
---

Track the outcome of account-level guardian approval emails (LC-2289). Adds `getGuardianApprovalStatus` (sending / accepted / failed / unknown, plus resend availability) and an additive `status: 'accepted'` field on the `sendGuardianApprovalEmail` response. `sendGuardianApprovalEmail` is now serialized and rate-limited: it returns `CONFLICT` while a send is in flight and `TOO_MANY_REQUESTS` during the resend cooldown or once the hourly attempt limit is reached, and it returns `BAD_REQUEST` for profiles that are not awaiting guardian approval. Each new approval email invalidates links from earlier sends, so `approveGuardianRequest` rejects superseded tokens with `BAD_REQUEST`. The app validates the guardian address format during onboarding and in the resend modal, says so on the onboarding completion screen when the email could not be sent, and shows the pending-approval banner in the dashboard recovery-banner slot (taking priority over it) with the real email status plus resend and email correction through the existing consent modal. The banner clears itself once the guardian approves.
