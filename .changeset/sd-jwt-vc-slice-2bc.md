---
'@learncard/sd-jwt-vc-plugin': patch
'@learncard/openid4vc-plugin': minor
'@learncard/init': minor
---

Slice 2b + 2c — SD-JWT-VC plumbed end-to-end into the LearnCard SDK.

**`@learncard/openid4vc-plugin`** — when an OID4VCI issuer returns a `dc+sd-jwt` or `vc+sd-jwt` credential, the wallet now:

- Delegates parse to the sd-jwt-vc plugin via `learnCard.invoke.parseSdJwtVc()` at runtime (no hard dep; throws a clear `unsupported_format` if the plugin isn't installed).
- Synthesizes a W3C-VC-shaped object (`type: ['VerifiableCredential', 'SdJwtVcCredential']`) so the wallet's existing store/index/read pipelines work without per-format branches. The original compact SD-JWT is preserved under `proof.jwt`; the `vct` is exposed under the `sdJwtVct` extension field.
- Routes category resolution through `learnCard.invoke.categorizeSdJwtVct(vct)` when the SD-JWT vc is detected; falls back to the existing W3C-`type[]` heuristic otherwise.

**`@learncard/init`** — every seed-based initializer (`learnCardFromSeed`, `networkLearnCardFromSeed`, `didWebLearnCardFromSeed`, `didWebNetworkLearnCardFromSeed`) now auto-wires the sd-jwt-vc plugin alongside openid4vc. Existing apps pick up SD-JWT-VC support on upgrade with **no code changes**.

Tested via mocked-plugin unit tests in `openid4vc/src/vci/store.test.ts` (delegation, fallback, missing-plugin failure, legacy `vc+sd-jwt` format). Manual smoke against walt.id documented in the sd-jwt-vc README.
