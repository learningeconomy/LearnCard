---
"@learncard/lca-api-service": patch
---

Catch module-load index creation failures so a Mongo connect that outlives a frozen Lambda invocation no longer crashes the next request (seen as a 500 on `/oidc/authorize` during Keycloak sign-in).
