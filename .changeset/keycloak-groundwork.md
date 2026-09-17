---
"@learncard/lca-api-service": minor
---

Add Keycloak token verification (`verifyKeycloakToken`) using `jose`: exact issuer allowlist, `aud`/`azp` client allowlist, ID/Bearer token-type check, and required `email_verified` / `phone_number_verified` claims. Configured with `KEYCLOAK_ISSUERS`, `KEYCLOAK_AUDIENCES`, and optional `KEYCLOAK_JWKS_URL_OVERRIDES`. Disabled (rejects all tokens) until issuers are configured.
