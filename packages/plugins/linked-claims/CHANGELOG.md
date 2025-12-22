# @learncard/linked-claims-plugin

## 0.2.1

### Patch Changes

-   Updated dependencies [[`3727c732ad54b4a8ccb89c6354291799e953c8ab`](https://github.com/learningeconomy/LearnCard/commit/3727c732ad54b4a8ccb89c6354291799e953c8ab), [`bb6749d4cd123ca1fcee8d6f657861ae77a614a2`](https://github.com/learningeconomy/LearnCard/commit/bb6749d4cd123ca1fcee8d6f657861ae77a614a2)]:
    -   @learncard/types@5.11.0
    -   @learncard/core@9.4.1
    -   @learncard/vc-plugin@1.3.1

## 0.2.0

### Minor Changes

-   [#858](https://github.com/learningeconomy/LearnCard/pull/858) [`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9) Thanks [@Custard7](https://github.com/Custard7)! - Upgrade build tooling (esbuild `0.27.1`) and migrate to Zod v4 + TypeScript `5.9.3` across the monorepo.

    This includes follow-up fixes for Zod v4 behavior and typing changes:

    -   Update query validators to preserve runtime deep-partial semantics while keeping TypeScript inference compatible with `{}` defaults.
    -   Prevent `.partial()` + `.default()` from materializing omitted fields in permission updates (`canManageChildrenProfiles`).
    -   Allow `Infinity` for generational query inputs in brain-service routes.
    -   Document running Vitest in non-watch mode (`pnpm test -- run`).

### Patch Changes

-   Updated dependencies [[`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9), [`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9)]:
    -   @learncard/types@5.10.0
    -   @learncard/core@9.4.0
    -   @learncard/vc-plugin@1.3.0

## 0.1.4

### Patch Changes

-   Updated dependencies [[`cb518c2f15b8257eb07fa2c606f52dd3304bc9ea`](https://github.com/learningeconomy/LearnCard/commit/cb518c2f15b8257eb07fa2c606f52dd3304bc9ea)]:
    -   @learncard/types@5.9.2
    -   @learncard/core@9.3.44
    -   @learncard/vc-plugin@1.2.7

## 0.1.3

### Patch Changes

-   Updated dependencies [[`a8ba030d48e75094fd64cd3da0725c3c0f468cf2`](https://github.com/learningeconomy/LearnCard/commit/a8ba030d48e75094fd64cd3da0725c3c0f468cf2)]:
    -   @learncard/types@5.9.1
    -   @learncard/core@9.3.43
    -   @learncard/vc-plugin@1.2.6

## 0.1.2

### Patch Changes

-   Updated dependencies [[`f56a417dc005623e793945e19808d6d9a9193357`](https://github.com/learningeconomy/LearnCard/commit/f56a417dc005623e793945e19808d6d9a9193357)]:
    -   @learncard/types@5.9.0
    -   @learncard/core@9.3.42
    -   @learncard/vc-plugin@1.2.5

## 0.1.1

### Patch Changes

-   [#789](https://github.com/learningeconomy/LearnCard/pull/789) [`26014ad0da2b91c7078f3e2149a9d0f89b6d2e97`](https://github.com/learningeconomy/LearnCard/commit/26014ad0da2b91c7078f3e2149a9d0f89b6d2e97) Thanks [@Custard7](https://github.com/Custard7)! - Feat: LinkedClaims Plugin - Endorsements
