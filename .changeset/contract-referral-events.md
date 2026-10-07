---
"@learncard/types": minor
"@learncard/network-brain-service": minor
"@learncard/network-brain-client": patch
"@learncard/network-plugin": minor
"learn-card-base": patch
"learn-card-app": patch
---

Add attributed generic contract requests, target-only denial, retained cancellation history, and optional referral identity on consent history and exports. Preserve legacy AI request payloads and owner-only consent behavior.

Persist correlated notification intents with consent mutations and retry via a leased Lambda/Docker worker. Fan out to the owner and current data recipients; give a requester outside that audience only a minimal decision. Recheck audience membership and current consent permissions before delivery, including queued notifications, and expose stable event and delivery IDs for downstream deduplication.

Keep app request hooks and legacy AI component props aligned with the shared request status type, including retained generic cancellations.
