---
'@learncard/types': minor
'@learncard/network-brain-service': minor
'@learncard/network-brain-client': patch
---

Let a client that holds only an API token set up and check an Integration's webhook. New route `getIntegrationWebhook` (`GET /integration/{id}/webhook`, scope `integrations:read`, owner only) returns `IntegrationWebhookStatus`: the URL, its `state` (`active`, `failing` or `disabled`), `lastSuccessAt`, `lastFailureAt` and `lastFailureReason` (a fixed code such as `http_401`, `timeout`, `network_error`, or `invalid_webhook` for a redirect or an unsafe address — never a URL or a response body), `pendingDeliveries` and `retryingDeliveries`, `hasSecret`, `secretVersion` (0 without a secret, 1 for the first, plus 1 per rotation) and `previousSecretExpiresAt`; never a secret. Webhook delivery and test pings record the outcome of every attempt for this read, and replacing the webhook URL starts with empty health. `sendIntegrationTestEvent` now returns `{ delivered, httpStatus, latencyMs, error }` (`status` was renamed to `httpStatus`) and is limited to 10 test events per Integration per minute (`TOO_MANY_REQUESTS` beyond that).
