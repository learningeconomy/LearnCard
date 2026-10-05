---
"learn-card-app": minor
"learn-card-base": minor
"@learncard/network-plugin": minor
"@learncard/network-brain-service": patch
---

Add gated referral invitations with attributed cards, audience and permission review, confirmed decline, and pending invitation recovery after alert dismissal. Require both tenant configuration and the enableContractRequests rollout flag; preserve existing AI and owner-only consent flows. Localize the experience in English, Spanish, French, and Arabic.

Show receiving organizations in consent and connected-app details and recheck current referral state before consent submission. Include a signed HTTP outcome acceptance lab and integration walkthrough.

Bind referral acceptance to the reviewed request ID under the contract lock, reject expired contracts on consent/re-consent, and keep invitation conflicts in the review screen. Stop polling terminal invitations, localize permission summaries, retry failed dismissals, and support host-reachable webhook capture from Docker.

Document the complete referral, auto-boost, outcome, claim, synchronization and webhook lifecycle. Add tested integrator snippets for recipient contracts, signing authority setup, scoped runtime tokens and polling recovery, including the client activity required for live sharing.
