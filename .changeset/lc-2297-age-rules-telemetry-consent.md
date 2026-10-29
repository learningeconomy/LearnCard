---
'@learncard/lca-api-service': patch
'@learncard/helpers': patch
'learn-card-base': patch
'learn-card-app': patch
---

Enforce current profile age rules in analytics preferences and keep optional telemetry off until account and tenant permission resolve. Retire SDK sessions on opt-out without replaying queued data, while preserving necessary security error reporting.
