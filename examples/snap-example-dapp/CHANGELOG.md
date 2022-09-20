# Changelog

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
