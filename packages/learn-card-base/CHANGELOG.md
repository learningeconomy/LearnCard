# learn-card-base

## 0.1.11

### Patch Changes

-   Updated dependencies []:
    -   @learncard/lca-api-plugin@1.1.8

## 0.1.10

### Patch Changes

-   Updated dependencies []:
    -   @learncard/lca-api-plugin@1.1.7

## 0.1.9

### Patch Changes

-   [#952](https://github.com/learningeconomy/LearnCard/pull/952) [`e41a15b2b2850fc3c562b254b3aef707d34e5437`](https://github.com/learningeconomy/LearnCard/commit/e41a15b2b2850fc3c562b254b3aef707d34e5437) Thanks [@Custard7](https://github.com/Custard7)! - fix: Encrypt for Recipient with SA

## 0.1.8

### Patch Changes

-   [#933](https://github.com/learningeconomy/LearnCard/pull/933) [`1247b3b2b372626b06d6193b5c9227504c23a3be`](https://github.com/learningeconomy/LearnCard/commit/1247b3b2b372626b06d6193b5c9227504c23a3be) Thanks [@goblincore](https://github.com/goblincore)! - [LC-1511] Override unknown issuer verifier state text and use roles in Scouts app

-   [#934](https://github.com/learningeconomy/LearnCard/pull/934) [`6319f43e11a231396f08b41a0bafb4198b4622a0`](https://github.com/learningeconomy/LearnCard/commit/6319f43e11a231396f08b41a0bafb4198b4622a0) Thanks [@goblincore](https://github.com/goblincore)! - [LC-1524] fix: Suppress toast displaying "Registration: no valid private key error" on login screen

-   [#933](https://github.com/learningeconomy/LearnCard/pull/933) [`1247b3b2b372626b06d6193b5c9227504c23a3be`](https://github.com/learningeconomy/LearnCard/commit/1247b3b2b372626b06d6193b5c9227504c23a3be) Thanks [@goblincore](https://github.com/goblincore)! - [LC-1511] Override unknown issuer verifier state text and use roles in Scouts app

-   [#938](https://github.com/learningeconomy/LearnCard/pull/938) [`20c48c727aade41921e226e3f26922d3798c7b5e`](https://github.com/learningeconomy/LearnCard/commit/20c48c727aade41921e226e3f26922d3798c7b5e) Thanks [@gerardopar](https://github.com/gerardopar)! - chore: [LC-1498] - 🚀 Migrate Capacitor & Plugins from v7 → v8 + 🔥 Firebase v12

-   [#938](https://github.com/learningeconomy/LearnCard/pull/938) [`20c48c727aade41921e226e3f26922d3798c7b5e`](https://github.com/learningeconomy/LearnCard/commit/20c48c727aade41921e226e3f26922d3798c7b5e) Thanks [@gerardopar](https://github.com/gerardopar)! - chore: [LC-1498] - 🚀 Migrate Capacitor & Plugins from v7 → v8 + 🔥 Firebase v12

## 0.1.7

### Patch Changes

-   Updated dependencies []:
    -   @learncard/helpers@1.2.4
    -   @learncard/lca-api-plugin@1.1.6

## 0.1.6

### Patch Changes

-   [#920](https://github.com/learningeconomy/LearnCard/pull/920) [`49abe4ecae0e9eaa446668dbb23abc6ff64793e5`](https://github.com/learningeconomy/LearnCard/commit/49abe4ecae0e9eaa446668dbb23abc6ff64793e5) Thanks [@rhen92](https://github.com/rhen92)! - chore: [LC-1505] Change skills to competencies for ScoutPass

-   Updated dependencies []:
    -   @learncard/helpers@1.2.3
    -   @learncard/lca-api-plugin@1.1.5

## 0.1.5

### Patch Changes

-   [#912](https://github.com/learningeconomy/LearnCard/pull/912) [`e61da3230f946b3d7238588baad502b16cee3ea1`](https://github.com/learningeconomy/LearnCard/commit/e61da3230f946b3d7238588baad502b16cee3ea1) Thanks [@Custard7](https://github.com/Custard7)! - feat: In-App CLI

## 0.1.4

### Patch Changes

-   Updated dependencies []:
    -   @learncard/helpers@1.2.2
    -   @learncard/lca-api-plugin@1.1.4

## 0.1.3

### Patch Changes

-   Updated dependencies []:
    -   @learncard/lca-api-plugin@1.1.3

## 0.1.2

### Patch Changes

-   Updated dependencies []:
    -   @learncard/helpers@1.2.1
    -   @learncard/lca-api-plugin@1.1.2

## 0.1.1

### Patch Changes

-   [#892](https://github.com/learningeconomy/LearnCard/pull/892) [`72dd77fd6b2cf455f36a9b05a629adb32c144b4b`](https://github.com/learningeconomy/LearnCard/commit/72dd77fd6b2cf455f36a9b05a629adb32c144b4b) Thanks [@rhen92](https://github.com/rhen92)! - fix: [LC-1479] Can't switch themes as an organization account

-   Updated dependencies []:
    -   @learncard/lca-api-plugin@1.1.1

## 0.1.0

### Minor Changes

-   [#858](https://github.com/learningeconomy/LearnCard/pull/858) [`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9) Thanks [@Custard7](https://github.com/Custard7)! - Upgrade build tooling (esbuild `0.27.1`) and migrate to Zod v4 + TypeScript `5.9.3` across the monorepo.

    This includes follow-up fixes for Zod v4 behavior and typing changes:

    -   Update query validators to preserve runtime deep-partial semantics while keeping TypeScript inference compatible with `{}` defaults.
    -   Prevent `.partial()` + `.default()` from materializing omitted fields in permission updates (`canManageChildrenProfiles`).
    -   Allow `Infinity` for generational query inputs in brain-service routes.
    -   Document running Vitest in non-watch mode (`pnpm test -- run`).

### Patch Changes

-   [#858](https://github.com/learningeconomy/LearnCard/pull/858) [`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9) Thanks [@Custard7](https://github.com/Custard7)! - feat: App Store CRUD & Partner Portal

-   [#880](https://github.com/learningeconomy/LearnCard/pull/880) [`1e25b1cb990fb1e2af9d887da77c265e2a875fd5`](https://github.com/learningeconomy/LearnCard/commit/1e25b1cb990fb1e2af9d887da77c265e2a875fd5) Thanks [@gerardopar](https://github.com/gerardopar)! - fix: Logout Behavior

-   Updated dependencies [[`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9)]:
    -   @learncard/lca-api-plugin@1.1.0
    -   @learncard/helpers@1.2.0

## 0.0.2

### Patch Changes

-   Updated dependencies []:
    -   @learncard/lca-api-plugin@1.0.1
