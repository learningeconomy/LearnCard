---
'@learncard/openid4vc-plugin': minor
'@learncard/init': patch
---

Initial release of `@learncard/openid4vc-plugin` (OpenID4VCI + OpenID4VP + SIOPv2 + DCQL + JARM holder support). Auto-wired into every seed-based initializer in `@learncard/init`, so hosts pick it up on upgrade without code changes.

- PEX matching uses the platform's native `RegExp` behind `safe-regex` + a 512-char pattern cap, keeping the plugin bundleable into browser wallets without polyfills.
- Bitstring Status List revocation/suspension checking is delegated to `@learncard/didkit-plugin` — `lc.invoke.verifyCredential(vc)` automatically validates `BitstringStatusListEntry` / `StatusList2021Entry` / `RevocationList2020` entries when the credential carries a `credentialStatus`.
