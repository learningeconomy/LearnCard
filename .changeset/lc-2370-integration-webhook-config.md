---
'@learncard/types': minor
'@learncard/network-brain-service': minor
'@learncard/network-brain-client': patch
---

Add contract-event webhook configuration to Integrations. `updateIntegration` accepts `webhookUrl` and `contractEventsEnabled`; Integrations expose `webhookUrl`, `hasWebhookSecret` and `contractEventsEnabledAt`. The new `rotateIntegrationWebhookSecret` route returns the signing secret once and keeps the previous secret valid for 24 hours. Secrets are stored encrypted and are never returned by a read route. Adds the `IntegrationEvent` validators used by the upcoming change feed.
