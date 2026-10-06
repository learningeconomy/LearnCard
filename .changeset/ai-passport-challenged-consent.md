---
"learn-card-app": patch
---

Require challenge-based authentication for AI Passport consent callbacks, including contract-provided redirects. Preserve unrelated delegated consent integrations and inline consent without a callback.

Before release, confirm supported LearnCard and AI Passport versions and rollback plans no longer require legacy unchallenged callbacks. Already-running clients must refresh and sign in again to acquire this cleanup.
