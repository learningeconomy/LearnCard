---
'@learncard/openid4vc-plugin': minor
---

Update the OID4VCI holder flow to OID4VCI 1.0 (final), keeping Draft 13 support.

- Issuer and `oauth-authorization-server` metadata are now discovered by inserting the well-known segment between the host and path (§12.2.2 / RFC 8414). This fixes discovery against issuers whose identifier carries a path.
- The credential request sends the 1.0 shape (`credential_configuration_id` + a `proofs` array) by default.
- Draft 13 issuers remain supported: metadata discovery falls back to the legacy append-style well-known URL, and when that fallback fires the plugin sends the Draft 13 credential request shape (`format` + `credential_definition` + singular `proof`). The spec revision is detected once during discovery. All Draft-13-specific code is isolated in `vci/draft13-compat.ts` for easy removal once the ecosystem migrates.
