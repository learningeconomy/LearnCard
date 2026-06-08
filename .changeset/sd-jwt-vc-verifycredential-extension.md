---
'@learncard/sd-jwt-vc-plugin': minor
'@learncard/openid4vc-plugin': patch
---

Wire SD-JWT-VC verification through the wallet's existing `verifyCredential` chain — closes the silent-pass gap where DIDKit returned `{ errors: [] }` for any proof type it didn't recognize.

The sd-jwt-vc plugin now implements `VerifyExtension` (same pattern as `expiration-plugin`), composing its own `verifyCredential` into the chain. When called:

- Credentials with `proof.type === 'SdJwtCompactProof'` (the marker `synthesizeSdJwtVc` sets on credentials received via OID4VCI) are routed to the SD-JWT-aware verifier — issuer DID resolution, signature check, disclosure hash integrity, assertion-method enforcement.
- All other credentials fall through to the previously-chained `verifyCredential` (vc-plugin / didkit) unchanged.

Plugin install order matters: the sd-jwt-vc plugin must be added **after** vc-plugin and any other `VerifyExtension`-providing plugins (e.g., expiration-plugin). The `@learncard/init` seed-based initializers already do this.

The OID4VCI receipt path (`synthesizeSdJwtVc` in openid4vc) now also verifies the issuer signature at receipt time — bad credentials land in `result.failures` instead of being silently stored. Display-time verification via `verifyCredential` is the canonical re-check; receipt-time verification is defense-in-depth.

The companion `JwtProof2020` silent-pass behaviour for OID4VCI-received `jwt_vc_json` credentials is a pre-existing gap and is tracked as a separate follow-up.
