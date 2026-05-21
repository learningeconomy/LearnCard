# @learncard/sd-jwt-vc-plugin

## 0.1.0

### Minor Changes

-   [#1244](https://github.com/learningeconomy/LearnCard/pull/1244) [`1c0cc68548a23ec969f5f7ce6563fc18060beb71`](https://github.com/learningeconomy/LearnCard/commit/1c0cc68548a23ec969f5f7ce6563fc18060beb71) Thanks [@Custard7](https://github.com/Custard7)! - Initial release of `@learncard/sd-jwt-vc-plugin` — SD-JWT-VC holder + verifier read-path (RFC 9901 + draft-ietf-oauth-sd-jwt-vc-16). Holder can parse, reconstruct, and verify selectively-disclosed credentials from any DID-resolvable issuer (`did:key`, `did:web`, `did:jwk` plus the rest via the existing DIDKit bridge). Accepts both the canonical `dc+sd-jwt` (draft-16) and legacy `vc+sd-jwt` format strings. Browser-first; no Node-only dependencies.

    Out of scope this release (tracked as follow-ups): KB-JWT signing for presentations, per-claim consent UI, Token Status List, issuer-side signing, openid4vc transport wiring.

### Patch Changes

-   Updated dependencies []:
    -   @learncard/core@9.4.19
    -   @learncard/didkit-plugin@1.8.10
