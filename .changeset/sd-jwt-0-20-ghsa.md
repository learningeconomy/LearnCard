---
'@learncard/sd-jwt-vc-plugin': patch
'@learncard/helpers': patch
'@learncard/credential-library': patch
'@learncard/init': patch
'@learncard/cli': patch
---

Upgrade `@sd-jwt/core` and `@sd-jwt/sd-jwt-vc` to 0.20 for [GHSA-f9j6-8p6x-r9j6](https://github.com/advisories/GHSA-f9j6-8p6x-r9j6). Version 0.19 silently dropped a disclosure whose digest didn't match the issuer-signed `_sd` array and returned the remaining claims.

- `@sd-jwt/decode` has no 0.20 release because it was merged into `@sd-jwt/core`. `@learncard/helpers` and `@learncard/sd-jwt-vc-plugin` now import `decodeSdJwt`, `getClaims` and the SD-JWT types from `@sd-jwt/core`.
- `parseSdJwtVc` and `verifySdJwtVc` now reject a tampered or unreferenced disclosure with `disclosure_hash_mismatch` before checking the signature.
- The credential display projection in `@learncard/helpers` drops every selectively disclosed claim when any disclosure is tampered, and keeps only the claims in the issuer payload. It previously kept the disclosures that still matched.
- `verifySdJwtVc` with `skipStatusCheck: true` no longer fetches or checks the credential's status list. On 0.19 it still fetched the list and failed when the list was revoked, unreachable or not signed by the issuer. OpenID4VCI receipt passes `skipStatusCheck`, so receipt no longer depends on the status list endpoint.
- The bundled CLI now ships `@sd-jwt/core@0.20.1` and `@sd-jwt/sd-jwt-vc@0.20.1`.
