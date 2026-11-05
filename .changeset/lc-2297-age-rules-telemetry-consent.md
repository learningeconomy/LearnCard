---
'@learncard/lca-api-service': patch
'@learncard/helpers': patch
'learn-card-base': patch
'learn-card-app': patch
---

Enforce current profile age rules in analytics preferences and keep optional telemetry off until account and tenant permission resolve. Retire SDK sessions on opt-out without replaying queued data, while preserving necessary security error reporting.

Keep ordinary preferences available during profile-authority outages without erasing saved analytics consent. Share session-bound preference reads, preserve legacy ISO birth-date formats and avoid initializing web Firebase merely to disable collection.

Report unavailable analytics opt-in instead of silently accepting it, keep age-enforced reads available when a repair cannot be saved, and ensure preference writes target the newly selected account.
