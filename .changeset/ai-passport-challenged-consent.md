---
"learn-card-app": patch
---

Require challenge-based authentication for external AI Passport consent callbacks, including contract-provided redirects. Validate known destinations before saving consent and only report success after returned destinations and proofs are checked. Preserve in-app consent, relative navigation, and unrelated delegated consent integrations, including tenants with placeholder AI service configuration. Show a refresh-and-sign-in recovery message for rejected legacy callbacks.

Before release, confirm supported LearnCard and AI Passport versions and rollback plans no longer require legacy unchallenged callbacks. Already-running clients must refresh and sign in again to acquire this cleanup.
