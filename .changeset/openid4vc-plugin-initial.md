---
'@learncard/openid4vc-plugin': minor
'@learncard/status-list-plugin': minor
'@learncard/init': patch
---

Initial release of `@learncard/openid4vc-plugin` (OpenID4VCI + OpenID4VP + SIOPv2 + DCQL + JARM holder support) and `@learncard/status-list-plugin` (W3C Bitstring Status List checking). Both plugins are auto-wired into every seed-based initializer in `@learncard/init`, so hosts pick them up on upgrade without code changes.

- PEX matching now uses the platform's native `RegExp` behind `safe-regex` + a 512-char pattern cap instead of the `re2` native binding, keeping the plugin bundleable into browser wallets without polyfills.
