# @learncard/escrow-canary

## 0.3.0

### Minor Changes

- [#1878](https://github.com/learningeconomy/LearnCard/pull/1878) [`4c3f904c1c3727461d14f52ece2cf7b0543329b1`](https://github.com/learningeconomy/LearnCard/commit/4c3f904c1c3727461d14f52ece2cf7b0543329b1) Thanks [@Custard7](https://github.com/Custard7)! - Add an operator provisioning tool (`dist/provision.mjs`) that creates canary accounts through the normal user path (email-code login, new SSS key, escrow opt-in or PIN) and writes their secrets with staged, compare-and-swap Secrets Manager updates. Not part of the Lambda bundle.

### Patch Changes

- Updated dependencies [[`372c1431e78a9708454f9c4c2f2c99dd5486b8e9`](https://github.com/learningeconomy/LearnCard/commit/372c1431e78a9708454f9c4c2f2c99dd5486b8e9), [`c20460f6fef685272227f506f536b6811f90b8a0`](https://github.com/learningeconomy/LearnCard/commit/c20460f6fef685272227f506f536b6811f90b8a0)]:
    - @learncard/sss-key-manager@0.2.6
    - @learncard/init@2.5.8

## 0.2.0

### Minor Changes

- [#1877](https://github.com/learningeconomy/LearnCard/pull/1877) [`6b0385d43e1efa06a69267af2a4bcc78be4ce31e`](https://github.com/learningeconomy/LearnCard/commit/6b0385d43e1efa06a69267af2a4bcc78be4ce31e) Thanks [@Custard7](https://github.com/Custard7)! - Add the tier 3 (7-day recovery) canary runner, deadline evaluator and canary inbox reader, off by default. Tiers 1/2 keep their behaviour; `CANARY_TIER` is now parsed strictly (`1`, `2` or `3`).

### Patch Changes

- Updated dependencies [[`b0c7891371fa621a1c2c4a419a1d4f330ed2993a`](https://github.com/learningeconomy/LearnCard/commit/b0c7891371fa621a1c2c4a419a1d4f330ed2993a)]:
    - @learncard/sss-key-manager@0.2.5
    - @learncard/init@2.5.7

## 0.1.1

### Patch Changes

- Updated dependencies []:
    - @learncard/init@2.5.6
    - @learncard/sss-key-manager@0.2.4
