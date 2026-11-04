# @learncard/escrow-canary

## 0.3.1

### Patch Changes

- [#1926](https://github.com/learningeconomy/LearnCard/pull/1926) [`367460fc1a2c9ad4ca858c9a2bac39c7f6d0064e`](https://github.com/learningeconomy/LearnCard/commit/367460fc1a2c9ad4ca858c9a2bac39c7f6d0064e) Thanks [@Custard7](https://github.com/Custard7)! - Provisioning no longer mistakes `DescribeSecret` lag for a takeover. `VersionIdsToStages` is eventually consistent, so right after a label move it can still show `PROVISIONING` absent, on the run's previous version, or where it was before the run started. The precheck, the fence, the failed-claim re-read and the check after a failed detach now re-read with a bounded backoff (4 s total) until they see the expected version. If the reads never settle, another run's version stops with `provisioning_label_moved` (exit 3), and a label still absent or on the run's own version stops with the retryable `secret: provisioning_label_lag` (exit 1).

- Updated dependencies [[`27be1a449118c3c9b69f1fd961cf0b7fe3cbcdb6`](https://github.com/learningeconomy/LearnCard/commit/27be1a449118c3c9b69f1fd961cf0b7fe3cbcdb6)]:
    - @learncard/sss-key-manager@0.2.7
    - @learncard/init@2.5.9

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
