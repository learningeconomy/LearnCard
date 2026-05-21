# @learncard/openid4vc-plugin

## 0.1.0

### Minor Changes

-   [#1201](https://github.com/learningeconomy/LearnCard/pull/1201) [`37439411ac68618fc27898ac4c0f48dbef4e424b`](https://github.com/learningeconomy/LearnCard/commit/37439411ac68618fc27898ac4c0f48dbef4e424b) Thanks [@Custard7](https://github.com/Custard7)! - Initial release of `@learncard/openid4vc-plugin` (OpenID4VCI + OpenID4VP + SIOPv2 + DCQL + JARM holder support). Auto-wired into every seed-based initializer in `@learncard/init`, so hosts pick it up on upgrade without code changes.

    -   PEX matching uses the platform's native `RegExp` behind `safe-regex` + a 512-char pattern cap, keeping the plugin bundleable into browser wallets without polyfills.
    -   Bitstring Status List revocation/suspension checking is delegated to `@learncard/didkit-plugin` — `lc.invoke.verifyCredential(vc)` automatically validates `BitstringStatusListEntry` / `StatusList2021Entry` / `RevocationList2020` entries when the credential carries a `credentialStatus`.

### Patch Changes

-   Updated dependencies []:
    -   @learncard/core@9.4.19
    -   @learncard/didkit-plugin@1.8.10
    -   @learncard/vc-plugin@1.4.15
