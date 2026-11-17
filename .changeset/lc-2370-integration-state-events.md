---
'@learncard/network-brain-service': minor
'@learncard/network-brain-client': patch
---

Add the state-change events and the connections snapshot that a feed-only Integration needs. New integration-only events (no profile notifications): `contract_retired` and one `consent_withdrawn` with reason `contract_retired` per withdrawn terms when a contract is retired; `consent_paused` with reason `needs_reconsent` per terms paused by a contract update; `consent_suspended` when a re-consent deadline passes; and `consent_expired` when a consent's or its contract's `expiresAt` passes (found by a new index-backed scan in the consentFlowDeadline job, Lambda and Docker; the terms status is not changed). A contract's pending events are now fanned out oldest first so its feed keeps the order things happened. The new `getContractConnections` route (`GET /consent-flow-contracts/connections`, scope `contracts-data:read`, owner or data recipient) pages the current connections of a contract — identifiers, status and referral reference only — so a client can snapshot, follow the feed from `latestCursor`, and re-snapshot on `CURSOR_EXPIRED`.
