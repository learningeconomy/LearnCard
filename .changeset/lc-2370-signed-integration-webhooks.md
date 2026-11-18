---
'@learncard/network-brain-service': minor
'@learncard/network-brain-client': patch
---

Deliver Integration change-feed records to the Integration's webhook URL. Each POST body is the feed record and carries `X-LearnCard-Signature: t=<unix seconds>,v1=<hex HMAC-SHA256(secret, t + "." + body)>` (a second `v1` for the previous secret during rotation), plus `X-LearnCard-Event-Id` and `X-LearnCard-Delivery`. Delivery runs in the contract-events worker with leases and the outbox retry policy (12 attempts within 24 hours; 4xx other than 408, 425, 429 is final) and never removes a record from the feed. The new `sendIntegrationTestEvent` route sends a signed `integration.test` event and reports the result.
