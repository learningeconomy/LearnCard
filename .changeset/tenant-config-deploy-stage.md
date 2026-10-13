---
"learn-card-app": patch
---

Stage overlays now declare their deploy stage (`local`, `staging` or `production`). Named overlays such as `keycloak-staging` build again, and the edge-served config reports the correct `stage` on staging and local instead of defaulting to `production`.
