---
'@learncard/sd-jwt-vc-plugin': minor
'@learncard/openid4vc-plugin': minor
'@learncard/init': minor
---

Slice 2b + 2c — SD-JWT-VC plumbed end-to-end into the LearnCard SDK with real verification at both receipt and display time.

**`@learncard/sd-jwt-vc-plugin`** — adds a `verifyCredential` extension method following the same `VerifyExtension` pattern used by `@learncard/expiration-plugin`. When the credential's `proof.type` is `SdJwtCompactProof`, it routes through the SD-JWT-aware verifier (DID resolution + disclosure-hash check + issuer signature); everything else falls through to the chained vc-plugin / DIDKit verifier. The wallet's existing `learnCard.invoke.verifyCredential(vc)` call site (`VCDisplayCardWrapper2`) gets correct SD-JWT-VC verification with **zero changes to vc-plugin** and zero app-side branching. This closes the silent-pass hole where DIDKit returned `{ errors: [] }` for unknown proof types.

**`@learncard/openid4vc-plugin`** — when an OID4VCI issuer returns a `dc+sd-jwt` or `vc+sd-jwt` credential, the wallet now:

- Delegates parse to the sd-jwt-vc plugin via `learnCard.invoke.parseSdJwtVc()` at runtime (no hard dep; throws a clear `unsupported_format` if the plugin isn't installed).
- Synthesizes a W3C-VC-shaped object (`type: ['VerifiableCredential', 'SdJwtVcCredential']`) so the wallet's existing store/index/read pipelines work without per-format branches. The original compact SD-JWT is preserved under `proof.jwt`; the `vct` is exposed under the `sdJwtVct` extension field.
- Routes category resolution through `learnCard.invoke.categorizeSdJwtVct(vct)` when the SD-JWT vc is detected; falls back to the existing W3C-`type[]` heuristic otherwise.

**`@learncard/init`** — every seed-based initializer (`learnCardFromSeed`, `networkLearnCardFromSeed`, `didWebLearnCardFromSeed`, `didWebNetworkLearnCardFromSeed`) now auto-wires the sd-jwt-vc plugin alongside openid4vc. Existing apps pick up SD-JWT-VC support on upgrade with **no code changes**.

Tested via mocked-plugin unit tests in `openid4vc/src/vci/store.test.ts` (delegation, fallback, missing-plugin failure, legacy `vc+sd-jwt` format). Manual smoke against walt.id documented in the sd-jwt-vc README.
