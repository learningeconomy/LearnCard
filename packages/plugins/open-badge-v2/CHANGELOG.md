# @learncard/open-badge-v2-plugin

## 1.1.4

### Patch Changes

-   Updated dependencies [[`016b7edc231273aab962b89b4351a3e229fca025`](https://github.com/learningeconomy/LearnCard/commit/016b7edc231273aab962b89b4351a3e229fca025)]:
    -   @learncard/types@5.11.3
    -   @learncard/core@9.4.4
    -   @learncard/vc-plugin@1.3.4
    -   @learncard/crypto-plugin@1.1.4

## 1.1.3

### Patch Changes

-   Updated dependencies [[`73865cc62ea292badb99fe41ca8b0f484a12728f`](https://github.com/learningeconomy/LearnCard/commit/73865cc62ea292badb99fe41ca8b0f484a12728f)]:
    -   @learncard/types@5.11.2
    -   @learncard/core@9.4.3
    -   @learncard/vc-plugin@1.3.3
    -   @learncard/crypto-plugin@1.1.3

## 1.1.2

### Patch Changes

-   Updated dependencies [[`f8e50b1e3ceafccde28bef859b2c8b220acb2b7d`](https://github.com/learningeconomy/LearnCard/commit/f8e50b1e3ceafccde28bef859b2c8b220acb2b7d)]:
    -   @learncard/types@5.11.1
    -   @learncard/core@9.4.2
    -   @learncard/vc-plugin@1.3.2
    -   @learncard/crypto-plugin@1.1.2

## 1.1.1

### Patch Changes

-   Updated dependencies [[`3727c732ad54b4a8ccb89c6354291799e953c8ab`](https://github.com/learningeconomy/LearnCard/commit/3727c732ad54b4a8ccb89c6354291799e953c8ab), [`bb6749d4cd123ca1fcee8d6f657861ae77a614a2`](https://github.com/learningeconomy/LearnCard/commit/bb6749d4cd123ca1fcee8d6f657861ae77a614a2)]:
    -   @learncard/types@5.11.0
    -   @learncard/core@9.4.1
    -   @learncard/vc-plugin@1.3.1
    -   @learncard/crypto-plugin@1.1.1

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
    -   @learncard/types@5.10.0
    -   @learncard/core@9.4.0
    -   @learncard/crypto-plugin@1.1.0
    -   @learncard/vc-plugin@1.3.0

## 1.0.12

### Patch Changes

-   Updated dependencies [[`cb518c2f15b8257eb07fa2c606f52dd3304bc9ea`](https://github.com/learningeconomy/LearnCard/commit/cb518c2f15b8257eb07fa2c606f52dd3304bc9ea)]:
    -   @learncard/types@5.9.2
    -   @learncard/core@9.3.44
    -   @learncard/vc-plugin@1.2.7
    -   @learncard/crypto-plugin@1.0.55

## 1.0.11

### Patch Changes

-   Updated dependencies [[`a8ba030d48e75094fd64cd3da0725c3c0f468cf2`](https://github.com/learningeconomy/LearnCard/commit/a8ba030d48e75094fd64cd3da0725c3c0f468cf2)]:
    -   @learncard/types@5.9.1
    -   @learncard/core@9.3.43
    -   @learncard/vc-plugin@1.2.6
    -   @learncard/crypto-plugin@1.0.54

## 1.0.10

### Patch Changes

-   Updated dependencies [[`f56a417dc005623e793945e19808d6d9a9193357`](https://github.com/learningeconomy/LearnCard/commit/f56a417dc005623e793945e19808d6d9a9193357)]:
    -   @learncard/types@5.9.0
    -   @learncard/core@9.3.42
    -   @learncard/vc-plugin@1.2.5
    -   @learncard/crypto-plugin@1.0.53

## 1.0.9

### Patch Changes

-   Updated dependencies [[`5fbc434308423d97db4fc8cf63898ed8f8980959`](https://github.com/learningeconomy/LearnCard/commit/5fbc434308423d97db4fc8cf63898ed8f8980959)]:
    -   @learncard/types@5.8.11
    -   @learncard/core@9.3.41
    -   @learncard/vc-plugin@1.2.4
    -   @learncard/crypto-plugin@1.0.52

## 1.0.8

### Patch Changes

-   Updated dependencies [[`9d8e71a4e4ca97c004d0d639fcc2869bc008b67e`](https://github.com/learningeconomy/LearnCard/commit/9d8e71a4e4ca97c004d0d639fcc2869bc008b67e)]:
    -   @learncard/types@5.8.9
    -   @learncard/core@9.3.40
    -   @learncard/vc-plugin@1.2.3
    -   @learncard/crypto-plugin@1.0.51

## 1.0.7

### Patch Changes

-   Updated dependencies []:
    -   @learncard/vc-plugin@1.2.2

## 1.0.6

### Patch Changes

-   Updated dependencies [[`8c3f9ad3846c57b0442b5a09c74ee63323e47c34`](https://github.com/learningeconomy/LearnCard/commit/8c3f9ad3846c57b0442b5a09c74ee63323e47c34)]:
    -   @learncard/types@5.8.7
    -   @learncard/core@9.3.39
    -   @learncard/vc-plugin@1.2.1
    -   @learncard/crypto-plugin@1.0.50

## 1.0.5

### Patch Changes

-   Updated dependencies [[`cfabf6686a0233ed89de6201a70c01598c5ab298`](https://github.com/learningeconomy/LearnCard/commit/cfabf6686a0233ed89de6201a70c01598c5ab298)]:
    -   @learncard/vc-plugin@1.2.0

## 1.0.4

### Patch Changes

-   Updated dependencies [[`f61e75a7a1de5913e4a7a2b381aa9815e726cec3`](https://github.com/learningeconomy/LearnCard/commit/f61e75a7a1de5913e4a7a2b381aa9815e726cec3), [`beb9c54789a2f48b06e1f82082e1dd51eab6b51d`](https://github.com/learningeconomy/LearnCard/commit/beb9c54789a2f48b06e1f82082e1dd51eab6b51d)]:
    -   @learncard/types@5.8.6
    -   @learncard/vc-plugin@1.1.60
    -   @learncard/core@9.3.38
    -   @learncard/crypto-plugin@1.0.49

## 1.0.3

### Patch Changes

-   Updated dependencies [[`00c5403c2932185290ae4e226ca4bf446a1d636c`](https://github.com/learningeconomy/LearnCard/commit/00c5403c2932185290ae4e226ca4bf446a1d636c)]:
    -   @learncard/types@5.8.5
    -   @learncard/core@9.3.37
    -   @learncard/vc-plugin@1.1.59
    -   @learncard/crypto-plugin@1.0.48

## 1.0.2

### Patch Changes

-   Updated dependencies [[`3707252bea0526aed3c17f0501ec3275e162f6bb`](https://github.com/learningeconomy/LearnCard/commit/3707252bea0526aed3c17f0501ec3275e162f6bb)]:
    -   @learncard/types@5.8.4
    -   @learncard/core@9.3.36
    -   @learncard/vc-plugin@1.1.58
    -   @learncard/crypto-plugin@1.0.47

## 1.0.1

### Patch Changes

-   [#786](https://github.com/learningeconomy/LearnCard/pull/786) [`632f516a38aed4397f68abecc89cd7c6c6fa5fcf`](https://github.com/learningeconomy/LearnCard/commit/632f516a38aed4397f68abecc89cd7c6c6fa5fcf) Thanks [@Custard7](https://github.com/Custard7)! - [LC-1293] - feat: Add OpenBadgeV2 SDK Plugin
