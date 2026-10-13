---
'@learncard/learn-cloud-service': patch
---

Adopt the shared service-config model: load checked-in non-secret per-stage configuration before environment validation, bootstrap every Lambda entrypoint through the shared lazy loader, and deliver runtime secrets through an optional AWS Secrets Manager bundle with a per-value fallback for stages without one.
