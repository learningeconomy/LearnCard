---
'@learncard/network-plugin': minor
'@learncard/cli': patch
'learn-card-app': patch
---

Expose Integration webhooks and the change feed to clients. The network plugin gains `setIntegrationWebhook` (returns the signing secret once, when it creates the first one), `getIntegrationWebhook` (URL, state, delivery health, secret version), `rotateIntegrationWebhookSecret`, `sendIntegrationTestEvent` (`{ delivered, httpStatus, latencyMs, error }`), `getIntegrationEvents` and `getContractConnections`. The CLI lists them for `learncard call` (the secret-returning `setIntegrationWebhook` and `rotateIntegrationWebhookSecret` calls need `--show-secret`) and adds an `integration-webhooks` capability. The developer portal gets a Webhooks tab for integrations that use contracts: webhook URL (the first save shows the signing secret once), feed-only toggle, secret rotation, delivery health (state, last success and failure with its reason, waiting and retrying events, secret version), and a test event with HTTP status and latency. The server webhooks guide no longer shows an HMAC signature check for profile notification webhooks, which are verified with their `Authorization` bearer token.
