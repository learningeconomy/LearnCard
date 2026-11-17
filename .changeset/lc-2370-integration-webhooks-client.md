---
'@learncard/network-plugin': minor
'@learncard/cli': patch
'learn-card-app': patch
---

Expose Integration webhooks and the change feed to clients. The network plugin gains `rotateIntegrationWebhookSecret`, `sendIntegrationTestEvent`, `getIntegrationEvents` and `getContractConnections`. The CLI lists them for `learncard call` (the secret-returning rotate call needs `--show-secret`) and adds an `integration-webhooks` capability. The developer portal gets a Webhooks tab for integrations that use contracts: webhook URL, feed-only toggle, reveal-once signing secret with rotation, and a test event. The server webhooks guide no longer shows an HMAC signature check for profile notification webhooks, which are verified with their `Authorization` bearer token.
