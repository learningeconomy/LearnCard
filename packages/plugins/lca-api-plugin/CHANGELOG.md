# lca-api-plugin

## 1.1.3

### Patch Changes

-   Updated dependencies []:
    -   @learncard/lca-api-client@1.1.3

## 1.1.2

### Patch Changes

-   Updated dependencies []:
    -   @learncard/lca-api-client@1.1.2

## 1.1.1

### Patch Changes

-   Updated dependencies []:
    -   @learncard/lca-api-client@1.1.1

## 1.1.0

### Minor Changes

-   [#858](https://github.com/learningeconomy/LearnCard/pull/858) [`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9) Thanks [@Custard7](https://github.com/Custard7)! - Upgrade build tooling (esbuild `0.27.1`) and migrate to Zod v4 + TypeScript `5.9.3` across the monorepo.

    This includes follow-up fixes for Zod v4 behavior and typing changes:

    -   Update query validators to preserve runtime deep-partial semantics while keeping TypeScript inference compatible with `{}` defaults.
    -   Prevent `.partial()` + `.default()` from materializing omitted fields in permission updates (`canManageChildrenProfiles`).
    -   Allow `Infinity` for generational query inputs in brain-service routes.
    -   Document running Vitest in non-watch mode (`pnpm test -- run`).

### Patch Changes

-   Updated dependencies [[`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9)]:
    -   @learncard/lca-api-client@1.1.0

## 1.0.1

### Patch Changes

-   Updated dependencies []:
    -   @learncard/lca-api-client@1.0.1
