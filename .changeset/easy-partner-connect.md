---
"@learncard/partner-connect": minor
"@learncard/partner-connect-core": minor
"@learncard/types": minor
"@learncard/network-plugin": minor
"@learncard/network-brain-service": minor
"learn-card-app": patch
---

Make Partner Connect apps zero-config. Apps can send credentials from inline templates (`sendCredential({ alias, template, templateData })`) and request scoped consent (`requestConsent({ read, write, reason })`) without creating boosts or contracts in LearnCard first; the network creates and versions them on first use. New `@learncard/partner-connect-core` package holds the shared template compiler, validator, and manifest helpers.

Mock mode now captures an app manifest and offers a one-click publish link (`getCapturedManifest()`, `getPublishUrl()`), and `mock: 'auto'` also activates inside AI app-builder editor previews (Lovable, Bolt, v0, Replit) while never mocking on published app addresses. Adds template validation and preview, template issuance status and recipient queries, and a typed `PartnerConnectError`.

LearnCard gains a publish-from-link page with live preview and a consent designer, a simple app dashboard with manifest version diffs and one-step "Apply & Ship", and network routes plus plugin methods to submit, compare, and apply manifest versions. The publish page asks for the real address when an app was captured on a local or app-builder preview address.
