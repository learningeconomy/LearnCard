# @learncard/ler-rs-plugin

## 0.1.16

### Patch Changes

-   [#1303](https://github.com/learningeconomy/LearnCard/pull/1303) [`59d79e9c2aed145284d6cc3de4c53ef0d3415299`](https://github.com/learningeconomy/LearnCard/commit/59d79e9c2aed145284d6cc3de4c53ef0d3415299) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Switch workspace development to Bun source-mode resolution while preserving package build outputs for npm publishing.

-   Updated dependencies [[`59d79e9c2aed145284d6cc3de4c53ef0d3415299`](https://github.com/learningeconomy/LearnCard/commit/59d79e9c2aed145284d6cc3de4c53ef0d3415299), [`8bcccce23f919e9bcd0d22d87e7d33242b557930`](https://github.com/learningeconomy/LearnCard/commit/8bcccce23f919e9bcd0d22d87e7d33242b557930), [`8bcccce23f919e9bcd0d22d87e7d33242b557930`](https://github.com/learningeconomy/LearnCard/commit/8bcccce23f919e9bcd0d22d87e7d33242b557930)]:
    -   @learncard/core@9.4.25
    -   @learncard/types@5.17.5
    -   @learncard/vc-plugin@1.5.5

## 0.1.15

### Patch Changes

-   [#1327](https://github.com/learningeconomy/LearnCard/pull/1327) [`9853f6a89fa9103975ec855367e789746aee5387`](https://github.com/learningeconomy/LearnCard/commit/9853f6a89fa9103975ec855367e789746aee5387) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Upgrade Astro example apps to the Zod 4-compatible Astro 6 line, remove the Astro-specific Zod 3 override, and keep package builds compatible with the updated esbuild runtime.

-   Updated dependencies [[`7a60dec7c32d19b2a3120b949eadc5770926f354`](https://github.com/learningeconomy/LearnCard/commit/7a60dec7c32d19b2a3120b949eadc5770926f354), [`6bebc466925987b23008b0de2229db554035a87e`](https://github.com/learningeconomy/LearnCard/commit/6bebc466925987b23008b0de2229db554035a87e)]:
    -   @learncard/types@5.17.4
    -   @learncard/core@9.4.24
    -   @learncard/vc-plugin@1.5.4

## 0.1.14

### Patch Changes

-   Updated dependencies [[`05fc8f650d9e3348232ddc5517a5c39e94b4f52f`](https://github.com/learningeconomy/LearnCard/commit/05fc8f650d9e3348232ddc5517a5c39e94b4f52f)]:
    -   @learncard/types@5.17.3
    -   @learncard/core@9.4.23
    -   @learncard/vc-plugin@1.5.3

## 0.1.13

### Patch Changes

-   Updated dependencies [[`3a0b110bd9503969c1f33c47505a43d2d199d083`](https://github.com/learningeconomy/LearnCard/commit/3a0b110bd9503969c1f33c47505a43d2d199d083), [`c749d55bec0fed881c3e488ffd90744e2eee021e`](https://github.com/learningeconomy/LearnCard/commit/c749d55bec0fed881c3e488ffd90744e2eee021e), [`3a0b110bd9503969c1f33c47505a43d2d199d083`](https://github.com/learningeconomy/LearnCard/commit/3a0b110bd9503969c1f33c47505a43d2d199d083), [`3a0b110bd9503969c1f33c47505a43d2d199d083`](https://github.com/learningeconomy/LearnCard/commit/3a0b110bd9503969c1f33c47505a43d2d199d083)]:
    -   @learncard/types@5.17.2
    -   @learncard/core@9.4.22
    -   @learncard/vc-plugin@1.5.2

## 0.1.12

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
    -   @learncard/types@5.17.1
    -   @learncard/vc-plugin@1.5.1
    -   @learncard/core@9.4.21

## 0.1.11

### Patch Changes

-   Updated dependencies [[`7e90089f517908562becf72eb3831e9208232278`](https://github.com/learningeconomy/LearnCard/commit/7e90089f517908562becf72eb3831e9208232278), [`406f5f64ff49aaecbf8cb499a7f6b294c7105cc3`](https://github.com/learningeconomy/LearnCard/commit/406f5f64ff49aaecbf8cb499a7f6b294c7105cc3), [`7c5fea147f7c9876dd8d7cbe2ece082eb0e5a42b`](https://github.com/learningeconomy/LearnCard/commit/7c5fea147f7c9876dd8d7cbe2ece082eb0e5a42b)]:
    -   @learncard/types@5.17.0
    -   @learncard/vc-plugin@1.5.0
    -   @learncard/core@9.4.20

## 0.1.10

### Patch Changes

-   Updated dependencies [[`3a05603c72d76020b43ec6bbd5e31b2b31c0fd2b`](https://github.com/learningeconomy/LearnCard/commit/3a05603c72d76020b43ec6bbd5e31b2b31c0fd2b), [`37439411ac68618fc27898ac4c0f48dbef4e424b`](https://github.com/learningeconomy/LearnCard/commit/37439411ac68618fc27898ac4c0f48dbef4e424b)]:
    -   @learncard/types@5.16.0
    -   @learncard/core@9.4.19
    -   @learncard/vc-plugin@1.4.15

## 0.1.9

### Patch Changes

-   Updated dependencies [[`b61cfb80e80f382b22d673e7e826fc60528161e7`](https://github.com/learningeconomy/LearnCard/commit/b61cfb80e80f382b22d673e7e826fc60528161e7)]:
    -   @learncard/types@5.15.0
    -   @learncard/vc-plugin@1.4.14
    -   @learncard/core@9.4.18

## 0.1.8

### Patch Changes

-   Updated dependencies [[`da8b402d78db16c52dfc651275df31a22d634b02`](https://github.com/learningeconomy/LearnCard/commit/da8b402d78db16c52dfc651275df31a22d634b02), [`da8b402d78db16c52dfc651275df31a22d634b02`](https://github.com/learningeconomy/LearnCard/commit/da8b402d78db16c52dfc651275df31a22d634b02)]:
    -   @learncard/types@5.14.0
    -   @learncard/core@9.4.17
    -   @learncard/vc-plugin@1.4.13

## 0.1.7

### Patch Changes

-   Updated dependencies [[`70ced8498dae6384f0f82a619fa1a02b878c972f`](https://github.com/learningeconomy/LearnCard/commit/70ced8498dae6384f0f82a619fa1a02b878c972f), [`8e408e48f89db234bcb7d357787a0faf3a605488`](https://github.com/learningeconomy/LearnCard/commit/8e408e48f89db234bcb7d357787a0faf3a605488)]:
    -   @learncard/types@5.13.6
    -   @learncard/core@9.4.16
    -   @learncard/vc-plugin@1.4.12

## 0.1.6

### Patch Changes

-   Updated dependencies [[`80943eba1b9451406f9e465e405fb7d785f5a43d`](https://github.com/learningeconomy/LearnCard/commit/80943eba1b9451406f9e465e405fb7d785f5a43d), [`c38452f9678c17aa13c2f3f6d16056cc8f9c7564`](https://github.com/learningeconomy/LearnCard/commit/c38452f9678c17aa13c2f3f6d16056cc8f9c7564), [`4250d4814b6f38fc9ed9982a94bcfb830ea36edc`](https://github.com/learningeconomy/LearnCard/commit/4250d4814b6f38fc9ed9982a94bcfb830ea36edc), [`68f8cfec63fa16f654a451efa120faa95dd5f362`](https://github.com/learningeconomy/LearnCard/commit/68f8cfec63fa16f654a451efa120faa95dd5f362)]:
    -   @learncard/types@5.13.5
    -   @learncard/core@9.4.15
    -   @learncard/vc-plugin@1.4.11

## 0.1.5

### Patch Changes

-   Updated dependencies [[`c68bed993c5304a667dc75d422a118858848737a`](https://github.com/learningeconomy/LearnCard/commit/c68bed993c5304a667dc75d422a118858848737a)]:
    -   @learncard/types@5.13.4
    -   @learncard/core@9.4.14
    -   @learncard/vc-plugin@1.4.10

## 0.1.4

### Patch Changes

-   Updated dependencies [[`fb6627b7fa3c4a07c83d4186619a937e6a83f369`](https://github.com/learningeconomy/LearnCard/commit/fb6627b7fa3c4a07c83d4186619a937e6a83f369)]:
    -   @learncard/types@5.13.3
    -   @learncard/core@9.4.13
    -   @learncard/vc-plugin@1.4.9

## 0.1.3

### Patch Changes

-   Updated dependencies [[`bba1f735e107d9cc86880e9f869413bc7072bff8`](https://github.com/learningeconomy/LearnCard/commit/bba1f735e107d9cc86880e9f869413bc7072bff8), [`fce9d2fd32898cfc64c59b88ca644dea3b53d1a5`](https://github.com/learningeconomy/LearnCard/commit/fce9d2fd32898cfc64c59b88ca644dea3b53d1a5)]:
    -   @learncard/types@5.13.2
    -   @learncard/core@9.4.12
    -   @learncard/vc-plugin@1.4.8

## 0.1.2

### Patch Changes

-   Updated dependencies [[`c83e3de987c11a6d95deec31c1fdb2401a990db2`](https://github.com/learningeconomy/LearnCard/commit/c83e3de987c11a6d95deec31c1fdb2401a990db2), [`fe4a1a265132271860460b8121e28ec0eacf4cb0`](https://github.com/learningeconomy/LearnCard/commit/fe4a1a265132271860460b8121e28ec0eacf4cb0)]:
    -   @learncard/types@5.13.1
    -   @learncard/core@9.4.11
    -   @learncard/vc-plugin@1.4.7

## 0.1.1

### Patch Changes

-   Updated dependencies [[`34ced8d1c933ca7015dd1d3bd37b6b2ff847de3c`](https://github.com/learningeconomy/LearnCard/commit/34ced8d1c933ca7015dd1d3bd37b6b2ff847de3c)]:
    -   @learncard/types@5.13.0
    -   @learncard/core@9.4.10
    -   @learncard/vc-plugin@1.4.6
