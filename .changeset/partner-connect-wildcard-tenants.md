---
'@learncard/partner-connect': minor
---

Partner apps now work on any LearnCard-managed tenant out of the box.

- `hostOrigin` entries now support wildcard patterns for the host portion, e.g. `https://*.learncard.app`. Protocol and port must still match exactly; wildcards are only allowed as leading DNS label(s).
- Added a built-in whitelist `PartnerConnect.DEFAULT_TRUSTED_TENANTS` (`learncard.app`, `*.learncard.app`, `*.learncard.ai`, `vetpass.app`, `*.vetpass.app`) that is merged into `hostOrigin` automatically. New tenants under these domains work without a partner-app re-deploy. Opt out with `disableDefaultTenants: true`.
- Origin resolution now prefers `window.location.ancestorOrigins[0]` (the browser-reported parent origin) over the `lc_host_override` query param when available and trusted. This is unspoofable by query-param manipulation; a mismatched override is logged and ignored.
