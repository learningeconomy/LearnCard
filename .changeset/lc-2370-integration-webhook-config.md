---
'@learncard/types': minor
'@learncard/network-brain-service': minor
'@learncard/network-brain-client': patch
---

Add contract-event webhook configuration to Integrations. The new `setIntegrationWebhook` route (`POST /integration/{id}/webhook`) sets, replaces or removes (`null`) the webhook URL, which must be an `http` or `https` URL, and returns the signing secret once, when the first URL is set. `updateIntegration` accepts `contractEventsEnabled`; setting it to `false` stops both new feed records and delivery of records that are already queued. Integrations expose `webhookUrl`, `hasWebhookSecret` and `contractEventsEnabledAt`. The new `rotateIntegrationWebhookSecret` route replaces the signing secret, returns the new one once and keeps the previous secret valid for 24 hours. Secrets are stored encrypted and are never returned by a read route. Adds the `IntegrationEvent` validators used by the upcoming change feed.
