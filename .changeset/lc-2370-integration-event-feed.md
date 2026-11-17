---
'@learncard/network-brain-service': minor
'@learncard/network-brain-client': patch
---

Add the Integration change feed. Consent and request events are fanned out to one thin, ordered `IntegrationEvent` record per subscribed Integration (owner, writers, data recipients and the requester), with a per-Integration sequence number. The new `getIntegrationEvents` route (`GET /integrations/{id}/events`) pages the feed with an opaque cursor and returns `latestCursor`. Records are kept for 30 days; an older cursor is rejected with `CURSOR_EXPIRED` (HTTP 409). Fan-out runs inline and in the contract-events worker; retention runs in the daily maintenance job (Lambda and Docker).
