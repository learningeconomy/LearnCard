---
'@learncard/openid4vc-plugin': minor
---

Update the OID4VCI holder flow from Draft 13 to OID4VCI 1.0 (final).

- Issuer and `oauth-authorization-server` metadata are now discovered by inserting the well-known segment between the host and path (§12.2.2 / RFC 8414) instead of appending it to the end of the identifier. This fixes discovery against issuers whose identifier carries a path.
- The credential request now sends `credential_configuration_id` and a `proofs` array instead of the Draft 13 `format` + `credential_definition` + singular `proof`.

Credential issuance is now 1.0-only on the wire; issuers still on Draft 13 are not supported for the credential request.
