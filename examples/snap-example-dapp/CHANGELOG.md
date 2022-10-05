# Changelog

## 1.0.9

### Patch Changes

-   Updated dependencies [[`e8f1ba3`](https://github.com/learningeconomy/LearnCard/commit/e8f1ba3594bc749caf18959962da4b85c97db4a6)]:
    -   @learncard/core@7.0.1
    -   @learncard/meta-mask-snap@1.0.9

## 1.0.8

### Patch Changes

-   Updated dependencies [[`25349fe`](https://github.com/learningeconomy/LearnCard/commit/25349fe064c751a004092bcab24e1674fadfd5fe)]:
    -   @learncard/core@7.0.0
    -   @learncard/meta-mask-snap@1.0.8

## 1.0.7

### Patch Changes

-   Updated dependencies [[`27e4ecd`](https://github.com/learningeconomy/LearnCard/commit/27e4ecd6641cf16b97d198434250f55135d09e97)]:
    -   @learncard/core@6.4.0
    -   @learncard/meta-mask-snap@1.0.7

## 1.0.6

### Patch Changes

-   Updated dependencies [[`e085abd`](https://github.com/learningeconomy/LearnCard/commit/e085abd72d3b4c085cdfc5c623864b40e35cf302)]:
    -   @learncard/core@6.3.1
    -   @learncard/meta-mask-snap@1.0.6

## 1.0.5

### Patch Changes

-   Updated dependencies [[`f6734b2`](https://github.com/learningeconomy/LearnCard/commit/f6734b2dff7eade58dca5a03b8f46f058773c3b0)]:
    -   @learncard/core@6.3.0
    -   @learncard/meta-mask-snap@1.0.5

## 1.0.4

### Patch Changes

-   Updated dependencies [[`02c7de0`](https://github.com/learningeconomy/LearnCard/commit/02c7de09f88ae78882d59c9f8ac898a7d5bac342), [`02c7de0`](https://github.com/learningeconomy/LearnCard/commit/02c7de09f88ae78882d59c9f8ac898a7d5bac342), [`02c7de0`](https://github.com/learningeconomy/LearnCard/commit/02c7de09f88ae78882d59c9f8ac898a7d5bac342), [`02c7de0`](https://github.com/learningeconomy/LearnCard/commit/02c7de09f88ae78882d59c9f8ac898a7d5bac342)]:
    -   @learncard/core@6.2.0
    -   @learncard/meta-mask-snap@1.0.4

## 1.0.3

### Patch Changes

-   Updated dependencies [[`c1befdc`](https://github.com/learningeconomy/LearnCard/commit/c1befdc8a30d3cc111d938c530493b1a5b87aa00)]:
    -   @learncard/core@6.1.0
    -   @learncard/meta-mask-snap@1.0.3

## 1.0.2

### Patch Changes

-   [#82](https://github.com/learningeconomy/LearnCard/pull/82) [`7d6f1a4`](https://github.com/learningeconomy/LearnCard/commit/7d6f1a41656329f99c4acf560da3ec59d9e29104) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Update ReadMe

-   Updated dependencies [[`7d6f1a4`](https://github.com/learningeconomy/LearnCard/commit/7d6f1a41656329f99c4acf560da3ec59d9e29104), [`7d6f1a4`](https://github.com/learningeconomy/LearnCard/commit/7d6f1a41656329f99c4acf560da3ec59d9e29104), [`7d6f1a4`](https://github.com/learningeconomy/LearnCard/commit/7d6f1a41656329f99c4acf560da3ec59d9e29104)]:
    -   @learncard/core@6.0.0
    -   @learncard/meta-mask-snap@1.0.2

## 1.0.1

### Patch Changes

-   Updated dependencies [[`8a10504`](https://github.com/learningeconomy/LearnCard/commit/8a105049df0d1f4f8ede062ca72fecbf55896562), [`074989f`](https://github.com/learningeconomy/LearnCard/commit/074989f2eb4b7d8cb9b2d6a62451cdcf047d72d5), [`120744b`](https://github.com/learningeconomy/LearnCard/commit/120744bc4cf9d03254049fcf37707763b10ddeab), [`8a10504`](https://github.com/learningeconomy/LearnCard/commit/8a105049df0d1f4f8ede062ca72fecbf55896562), [`8a10504`](https://github.com/learningeconomy/LearnCard/commit/8a105049df0d1f4f8ede062ca72fecbf55896562)]:
    -   @learncard/core@5.1.1
    -   @learncard/meta-mask-snap@1.0.1
        All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.7.0]

### Changed

-   Package renamed to `@metamask/template-snap`
-   @metamask/snaps-cli@0.7.0 ([#4](https://github.com/MetaMask/snap-template/pull/4))
-   Add more content to the custom confirmation
-   Add cleanup script, more instructions in readme

## [0.6.1]

### Fixed

-   `snap_confirm` call ([#168](https://github.com/MetaMask/snaps-skunkworks/pull/168))
    -   The Snap was passing invalid parameters to the method.

## [0.6.0]

### Added

-   SVG icon ([#163](https://github.com/MetaMask/snaps-skunkworks/pull/163))
    -   Adds an icon file at `images/icon.svg` and a reference to it in `snap.manifest.json`.

### Changed

-   **BREAKING:** Support the new Snaps publishing specification ([#140](https://github.com/MetaMask/snaps-skunkworks/pull/140), [#157](https://github.com/MetaMask/snaps-skunkworks/pull/157))
    -   This introduces several breaking changes to how Snaps are developed, hosted, and represented at runtime. See [the specification](https://github.com/MetaMask/specifications/blob/d4a5bf5d6990bb5b02a98bd3f95a24ffb28c701c/snaps/publishing.md) and the referenced pull requests for details.

## [0.4.0]

### Added

-   Initial release.

[unreleased]: https://github.com/MetaMask/snap-template/compare/v0.7.0...HEAD
[0.7.0]: https://github.com/MetaMask/snap-template/compare/v0.6.1...v0.7.0
[0.6.1]: https://github.com/MetaMask/snap-template/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/MetaMask/snap-template/compare/v0.4.0...v0.6.0
[0.4.0]: https://github.com/MetaMask/snap-template/releases/tag/v0.4.0
