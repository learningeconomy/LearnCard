---
"@learncard/types": minor
"@learncard/network-brain-service": minor
"@learncard/network-brain-client": patch
"@learncard/network-plugin": minor
"learn-card-base": patch
"learn-card-app": patch
"scoutpass-app": patch
---

Add explicit consent contract data recipients and audience version acknowledgements. Enforce current consent status, expiry, category sharing, and recipient membership on consented data reads. Recipient additions freeze after first consent; removals immediately revoke API access and invalidate stale consent/update/sync acknowledgements.

Update existing app consent paths to review the current data audience, encrypt for all recipients, and cache copies by the full audience. Background synchronization reloads recipients and acknowledges the current version.
