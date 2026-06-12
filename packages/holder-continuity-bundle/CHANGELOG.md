# @learncard/holder-continuity

## 0.2.2

### Patch Changes

-   Updated dependencies [[`3a0b110bd9503969c1f33c47505a43d2d199d083`](https://github.com/learningeconomy/LearnCard/commit/3a0b110bd9503969c1f33c47505a43d2d199d083), [`c749d55bec0fed881c3e488ffd90744e2eee021e`](https://github.com/learningeconomy/LearnCard/commit/c749d55bec0fed881c3e488ffd90744e2eee021e), [`3a0b110bd9503969c1f33c47505a43d2d199d083`](https://github.com/learningeconomy/LearnCard/commit/3a0b110bd9503969c1f33c47505a43d2d199d083), [`3a0b110bd9503969c1f33c47505a43d2d199d083`](https://github.com/learningeconomy/LearnCard/commit/3a0b110bd9503969c1f33c47505a43d2d199d083)]:
    -   @learncard/types@5.17.2
    -   @learncard/init@2.4.0
    -   @learncard/sss-key-manager@0.1.12

## 0.2.1

### Patch Changes

-   Updated dependencies [[`1706490abb9a8c1b099882c84d144ccabf92ffe2`](https://github.com/learningeconomy/LearnCard/commit/1706490abb9a8c1b099882c84d144ccabf92ffe2), [`1706490abb9a8c1b099882c84d144ccabf92ffe2`](https://github.com/learningeconomy/LearnCard/commit/1706490abb9a8c1b099882c84d144ccabf92ffe2)]:
    -   @learncard/init@2.3.21
    -   @learncard/types@5.17.1
    -   @learncard/sss-key-manager@0.1.11

## 0.2.0

### Minor Changes

-   [#1269](https://github.com/learningeconomy/LearnCard/pull/1269) [`406f5f64ff49aaecbf8cb499a7f6b294c7105cc3`](https://github.com/learningeconomy/LearnCard/commit/406f5f64ff49aaecbf8cb499a7f6b294c7105cc3) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - feat: [LC-1798] Holder continuity export, restore, and metadata

    Adds a new `@learncard/holder-continuity` package for creating encrypted holder continuity bundles, reading them back, importing credentials into a fresh wallet, and restoring the original wallet directly from the exported private-key seed.

    Updates `@learncard/cli` to consume the new package and expose REPL helpers for export, import, and restore.

    Adds holder export metadata types, an authenticated brain-service route, and a network plugin method for exporting consent records and transaction history without exposing credential payloads or key material from the service.

    Adds bounded status-list fetching, optional verify-before-import support, bundle size guards, and capped holder metadata pagination.

### Patch Changes

-   Updated dependencies [[`7e90089f517908562becf72eb3831e9208232278`](https://github.com/learningeconomy/LearnCard/commit/7e90089f517908562becf72eb3831e9208232278), [`406f5f64ff49aaecbf8cb499a7f6b294c7105cc3`](https://github.com/learningeconomy/LearnCard/commit/406f5f64ff49aaecbf8cb499a7f6b294c7105cc3)]:
    -   @learncard/types@5.17.0
    -   @learncard/init@2.3.20
    -   @learncard/sss-key-manager@0.1.10
