# @learncard/openid4vc-plugin

## 0.1.2

### Patch Changes

-   [#1256](https://github.com/learningeconomy/LearnCard/pull/1256) [`1706490abb9a8c1b099882c84d144ccabf92ffe2`](https://github.com/learningeconomy/LearnCard/commit/1706490abb9a8c1b099882c84d144ccabf92ffe2) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix Node ESM consumers (e.g. `@learncard/init`'s published ESM bundle) being unable to resolve named exports from these plugins.

    These packages previously declared only `main` (CJS shim) and `module` (ESM bundle) without an `exports` map. Node ESM does not honor the `module` field, so it fell back to the CJS shim — a conditional `module.exports = require(...)` re-export that `cjs-module-lexer` cannot statically analyze, causing `SyntaxError: Named export 'X' not found` for every downstream ESM consumer.

    Each affected plugin now:

    -   declares `"type": "module"`,
    -   ships its CJS shim as `dist/index.cjs` (renamed from `.js`) and bundle outputs as `.cjs`,
    -   exposes a proper `exports` map with `import` → ESM bundle, `require` → CJS shim, and `types` → `.d.ts`.

    No runtime behavior changes for existing consumers; bundlers that read `module` continue to work, and CJS `require()` callers continue to load the same shim under a new extension.

    This change is verified by two new CI surfaces:

    -   `bun run validate-packages` runs `publint` + `@arethetypeswrong/cli` against every published `@learncard/*` package's built `dist/`. Catches missing `exports` maps, dangling file paths, condition ordering bugs, ESM-file-as-CJS extension mistakes, and the `workspace:*` protocol-leakage incident class statically, before publish.
    -   `.github/workflows/smoketest-npm-packages.yml` now also probes every published plugin's ESM + CJS export surface directly (not just `@learncard/init` transitively) and bundles a trivial consumer with esbuild to catch bundler-resolution-only regressions.

    Follow-up work tracked as advisory failures in both surfaces (not gating CI until fixed): `@learncard/ceramic-plugin`, `@learncard/didkey-plugin`, `@learncard/helpers`, `@learncard/idx-plugin`, `@learncard/lca-api-plugin`, `@learncard/learn-cloud-plugin`, `@learncard/network-plugin`, `@learncard/simple-signing-plugin` each have pre-existing publish-time bugs (CJS-only transitive deps imported via named ESM, dynamic `require()` in ESM bundles, or unmigrated upstream packages).

-   Updated dependencies [[`1706490abb9a8c1b099882c84d144ccabf92ffe2`](https://github.com/learningeconomy/LearnCard/commit/1706490abb9a8c1b099882c84d144ccabf92ffe2)]:
    -   @learncard/didkit-plugin@1.9.1
    -   @learncard/vc-plugin@1.5.1
    -   @learncard/core@9.4.21

## 0.1.1

### Patch Changes

-   Updated dependencies [[`7c5fea147f7c9876dd8d7cbe2ece082eb0e5a42b`](https://github.com/learningeconomy/LearnCard/commit/7c5fea147f7c9876dd8d7cbe2ece082eb0e5a42b)]:
    -   @learncard/didkit-plugin@1.9.0
    -   @learncard/vc-plugin@1.5.0
    -   @learncard/core@9.4.20

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
