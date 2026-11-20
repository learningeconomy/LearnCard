---
'@learncard/types': minor
'@learncard/network-plugin': minor
'@learncard/network-brain-service': minor
'learn-card-app': minor
---

feat: [LC-2373] Attach referral-scoped outcomes with recipient-side verification. Add and remove selected outcomes from referral cards and Privacy & Data without changing category-wide sharing or sharing with other referrals. Expose outcome selections in consent data and derive proof, status, expected-issuer labels, and recognized issuer names independently of uploaded claims.

Bind positive recipient labels to the consenting learner and omit unproven registry names. Validate credential storage references, cap selections at 100, honor category filters, and record atomic audit deltas. Idempotent retries report unchanged state without duplicate events.

Use localized outcome-specific notifications and recheck queued attachment references against current selections. Omit issuer names for foreign or missing learner subjects, document current-DID attribution limits, and allow learners to remove legacy outcome references without admitting new unsupported attachments.
