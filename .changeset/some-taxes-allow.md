---
'@learncard/app-store-demo-request-learner-context': patch
'@learncard/learn-cloud-service': patch
'@learncard/network-brain-service': patch
'@learncard/partner-connect': patch
'@learncard/network-plugin': patch
'@learncard/lca-api-service': patch
'@learncard/types': patch
'learn-card-base': patch
'learn-card-app': patch
---

Add `requestLearnerContext` support across Partner Connect, the LearnCard host, and the network stack so embedded App Store apps can request learner context for AI flows.

This also allows `requestConsent()` to resolve the configured contract from the app listing's integration when a contract URI is not passed explicitly, and adds a request-learner-context demo app to exercise the full flow.
