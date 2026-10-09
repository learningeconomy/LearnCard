---
"learn-card-app": patch
---

Serve the deploy's build stage from `/__tenant-config`. A web deploy built with `STAGE=keycloak-staging` now resolves to that overlay on staging.learncard.ai instead of the hostname-derived `staging` overlay, so the edge config and the baked config agree. The keycloak-staging overlay now matches staging apart from auth (notifications endpoint, staging sample personas, escrow settings).
