# @welibraryos/lca-api-service

## 1.1.2

### Patch Changes

-   Updated dependencies [[`3727c732ad54b4a8ccb89c6354291799e953c8ab`](https://github.com/learningeconomy/LearnCard/commit/3727c732ad54b4a8ccb89c6354291799e953c8ab), [`bb6749d4cd123ca1fcee8d6f657861ae77a614a2`](https://github.com/learningeconomy/LearnCard/commit/bb6749d4cd123ca1fcee8d6f657861ae77a614a2)]:
    -   @learncard/types@5.11.0
    -   @learncard/core@9.4.1
    -   @learncard/init@2.2.2
    -   @learncard/did-web-plugin@1.1.1
    -   @learncard/didkit-plugin@1.6.1

## 1.1.1

### Patch Changes

-   [#893](https://github.com/learningeconomy/LearnCard/pull/893) [`4b1d40356ffd974915396fbee05d656f6c16f9c0`](https://github.com/learningeconomy/LearnCard/commit/4b1d40356ffd974915396fbee05d656f6c16f9c0) Thanks [@Custard7](https://github.com/Custard7)! - fix: serverless-prune for lambdas

-   Updated dependencies []:
    -   @learncard/init@2.2.1

## 1.1.0

### Minor Changes

-   [#858](https://github.com/learningeconomy/LearnCard/pull/858) [`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9) Thanks [@Custard7](https://github.com/Custard7)! - Upgrade build tooling (esbuild `0.27.1`) and migrate to Zod v4 + TypeScript `5.9.3` across the monorepo.

    This includes follow-up fixes for Zod v4 behavior and typing changes:

    -   Update query validators to preserve runtime deep-partial semantics while keeping TypeScript inference compatible with `{}` defaults.
    -   Prevent `.partial()` + `.default()` from materializing omitted fields in permission updates (`canManageChildrenProfiles`).
    -   Allow `Infinity` for generational query inputs in brain-service routes.
    -   Document running Vitest in non-watch mode (`pnpm test -- run`).

### Patch Changes

-   Updated dependencies [[`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9), [`279e0491c5f284f9343ef0c39f3c38cd76e608f9`](https://github.com/learningeconomy/LearnCard/commit/279e0491c5f284f9343ef0c39f3c38cd76e608f9)]:
    -   @learncard/did-web-plugin@1.1.0
    -   @learncard/types@5.10.0
    -   @learncard/core@9.4.0
    -   @learncard/init@2.2.0
    -   @learncard/didkit-plugin@1.6.0

## 1.0.5

### Patch Changes

-   [#863](https://github.com/learningeconomy/LearnCard/pull/863) [`f294ed7af55904656f3945cef471f788b64dfbb5`](https://github.com/learningeconomy/LearnCard/commit/f294ed7af55904656f3945cef471f788b64dfbb5) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix Dockerfiles
