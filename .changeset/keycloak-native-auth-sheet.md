---
"learn-card-base": patch
---

Keycloak auth provider: add an optional `navigate` redirect-navigator seam so native hosts can complete sign-in through a system auth sheet instead of a page redirect, and best-effort revoke the refresh token on sign-out paths that never reach Keycloak's `end_session` endpoint (e.g. native).
