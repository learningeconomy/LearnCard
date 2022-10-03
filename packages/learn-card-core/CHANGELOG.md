# learn-card-core

## 6.4.0

### Minor Changes

-   [#111](https://github.com/learningeconomy/LearnCard/pull/111) [`27e4ecd`](https://github.com/learningeconomy/LearnCard/commit/27e4ecd6641cf16b97d198434250f55135d09e97) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Use/expose generic parameter of IDXCredential type in LC methods

## 6.3.1

### Patch Changes

-   [#104](https://github.com/learningeconomy/LearnCard/pull/104) [`e085abd`](https://github.com/learningeconomy/LearnCard/commit/e085abd72d3b4c085cdfc5c623864b40e35cf302) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix weird TS bug

## 6.3.0

### Minor Changes

-   [#100](https://github.com/learningeconomy/LearnCard/pull/100) [`f6734b2`](https://github.com/learningeconomy/LearnCard/commit/f6734b2dff7eade58dca5a03b8f46f058773c3b0) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add VC API Plugin/Instantiation target

## 6.2.0

### Minor Changes

-   [#85](https://github.com/learningeconomy/LearnCard/pull/85) [`02c7de0`](https://github.com/learningeconomy/LearnCard/commit/02c7de09f88ae78882d59c9f8ac898a7d5bac342) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add DependentMethods generic param to Plugin type

*   [#85](https://github.com/learningeconomy/LearnCard/pull/85) [`02c7de0`](https://github.com/learningeconomy/LearnCard/commit/02c7de09f88ae78882d59c9f8ac898a7d5bac342) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Update logic for determing a Wallet's PluginMethods to fix plugins not overwriting methods correctly

-   [#85](https://github.com/learningeconomy/LearnCard/pull/85) [`02c7de0`](https://github.com/learningeconomy/LearnCard/commit/02c7de09f88ae78882d59c9f8ac898a7d5bac342) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Create CHAPI Plugin

### Patch Changes

-   [#85](https://github.com/learningeconomy/LearnCard/pull/85) [`02c7de0`](https://github.com/learningeconomy/LearnCard/commit/02c7de09f88ae78882d59c9f8ac898a7d5bac342) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Create @learncard/helpers package

-   Updated dependencies [[`02c7de0`](https://github.com/learningeconomy/LearnCard/commit/02c7de09f88ae78882d59c9f8ac898a7d5bac342)]:
    -   @learncard/helpers@1.0.0

## 6.1.0

### Minor Changes

-   [#79](https://github.com/learningeconomy/LearnCard/pull/79) [`c1befdc`](https://github.com/learningeconomy/LearnCard/commit/c1befdc8a30d3cc111d938c530493b1a5b87aa00) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - New Plugin: VC Templates

    -   Allows creating new credentials/presentations easily based on pre-defined templates

    New methods: newCredential and newPresentation

    -   `wallet.newCredential()` is identical to `wallet.getTestVc()`
    -   `wallet.newCredential({ type: 'achievement' })` will provide you with a _different_ credential, and
        its fields are overwriteable via arguments passed to that function.
        E.g. `wallet.newCredential({ type: 'achievement', name: 'Nice!' })`

## 6.0.0

### Major Changes

-   [#82](https://github.com/learningeconomy/LearnCard/pull/82) [`7d6f1a4`](https://github.com/learningeconomy/LearnCard/commit/7d6f1a41656329f99c4acf560da3ec59d9e29104) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Stop re-exporting @learncard/types in @learncard/core

### Patch Changes

-   [#82](https://github.com/learningeconomy/LearnCard/pull/82) [`7d6f1a4`](https://github.com/learningeconomy/LearnCard/commit/7d6f1a41656329f99c4acf560da3ec59d9e29104) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Update ReadMe

*   [#82](https://github.com/learningeconomy/LearnCard/pull/82) [`7d6f1a4`](https://github.com/learningeconomy/LearnCard/commit/7d6f1a41656329f99c4acf560da3ec59d9e29104) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Update exposed methods for better docs

## 5.1.1

### Patch Changes

-   [#40](https://github.com/learningeconomy/LearnCard/pull/40) [`8a10504`](https://github.com/learningeconomy/LearnCard/commit/8a105049df0d1f4f8ede062ca72fecbf55896562) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix doc comment for issuePresentation

*   [#58](https://github.com/learningeconomy/LearnCard/pull/58) [`074989f`](https://github.com/learningeconomy/LearnCard/commit/074989f2eb4b7d8cb9b2d6a62451cdcf047d72d5) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Widen IDXCredential type and validate it with zod

-   [#81](https://github.com/learningeconomy/LearnCard/pull/81) [`120744b`](https://github.com/learningeconomy/LearnCard/commit/120744bc4cf9d03254049fcf37707763b10ddeab) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add resolveDid method

*   [#40](https://github.com/learningeconomy/LearnCard/pull/40) [`8a10504`](https://github.com/learningeconomy/LearnCard/commit/8a105049df0d1f4f8ede062ca72fecbf55896562) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Don't overwrite global crypto object if it already exists

-   [#40](https://github.com/learningeconomy/LearnCard/pull/40) [`8a10504`](https://github.com/learningeconomy/LearnCard/commit/8a105049df0d1f4f8ede062ca72fecbf55896562) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Move IDXCredential and StorageType types to @learncard/types

## 5.1.0

### Minor Changes

-   [#62](https://github.com/WeLibraryOS/LearnCard/pull/62) [`9942f25`](https://github.com/WeLibraryOS/LearnCard/commit/9942f25ccc39797bc74ad63cf7d4878b2619b208) Thanks [@Custard7](https://github.com/Custard7)! - Add VPQR Plugin

### Patch Changes

-   [#62](https://github.com/WeLibraryOS/LearnCard/pull/62) [`9942f25`](https://github.com/WeLibraryOS/LearnCard/commit/9942f25ccc39797bc74ad63cf7d4878b2619b208) Thanks [@Custard7](https://github.com/Custard7)! - Add VPQR Plugin

*   [#62](https://github.com/WeLibraryOS/LearnCard/pull/62) [`9942f25`](https://github.com/WeLibraryOS/LearnCard/commit/9942f25ccc39797bc74ad63cf7d4878b2619b208) Thanks [@Custard7](https://github.com/Custard7)! - Expose contextLoader in didkit plugin

## 5.0.0

### Major Changes

-   [#59](https://github.com/WeLibraryOS/LearnCard/pull/59) [`5c5f28b`](https://github.com/WeLibraryOS/LearnCard/commit/5c5f28b1db1a9527e56946522ea94d444a7f1eed) Thanks [@smurflo2](https://github.com/smurflo2)! - Significant functionality upgrade for Ethereum plugin.

    Can now generically check balance of and transfer ERC20 tokens.

    Public/private key is now generated from wallet seed material.
    BREAKING CHANGE: The ethereumAddress parameter has been removed from the ethereumConfig object passed into walletFromKey. That parameter should be removed from calling code. If you need to check the balance for a particular public address, the 'getBalanceForAddress' method can be used.

### Patch Changes

-   [#63](https://github.com/WeLibraryOS/LearnCard/pull/63) [`fab5557`](https://github.com/WeLibraryOS/LearnCard/commit/fab55579a1e75b438425ea019a1ac63ecb5634fe) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Expose contextLoader in didkit plugin

## 4.1.0

### Minor Changes

-   [#60](https://github.com/WeLibraryOS/LearnCard/pull/60) [`100899e`](https://github.com/WeLibraryOS/LearnCard/commit/100899e32db4385758dc1b3559da7b64f705d305) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add `initLearnCard` instantiation function

    While not strictly a breaking change (`walletFromKey` and `emptyWallet` are still exported and useable
    directly!), we now heavily advise changing instantiation methods to use `initLearnCard` instead of
    `walletFromKey` or `emptyWallet` directly!

    ```ts
    // old way
    const wallet = await walletFromKey('a');
    const emptyWallet = await emptyWallet();

    // new way
    const wallet = await initLearnCard({ seed: 'a' });
    const emptyWallet = await initLearnCard();
    ```

## 4.0.0

### Major Changes

-   [#53](https://github.com/WeLibraryOS/LearnCard/pull/53) [`7d40878`](https://github.com/WeLibraryOS/LearnCard/commit/7d40878f7f15d80b03701bdec859f2e7135559dd) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - LearnCardWallet -> LearnCard generic type

    To better accomadate different methods of instantiation, the `LearnCardWallet` type has been made
    generic. Additionally, we have renamed it to just `LearnCard`. `LearnCard` now takes in two (optional)
    generic parameters: the names of the method it exposes (allowing a slimmer `LearnCard` object to be
    made that does not expose all functionality), and the wallet type of `_wallet`.

    Migration Steps:

    -   Change any existing reference to `LearnCardWallet` to `LearnCard`

### Patch Changes

-   [#53](https://github.com/WeLibraryOS/LearnCard/pull/53) [`7d40878`](https://github.com/WeLibraryOS/LearnCard/commit/7d40878f7f15d80b03701bdec859f2e7135559dd) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add `emptyWallet` function

    This function allows consumers to instantiate an empty wallet that can only be used for verifying
    credentials and presentations. This can be very useful if you need to quickly verify a credential,
    but don't want to provide dummy key material and waste time building an object with functionality
    you won't be using!

## 3.0.0

### Major Changes

-   [#46](https://github.com/WeLibraryOS/LearnCard/pull/46) [`60e0f5b`](https://github.com/WeLibraryOS/LearnCard/commit/60e0f5b6ddaeb124959e87ac61189b2638c0b32b) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - wallet.issuePresentation now accepts an unsigned VP, and _not_ a VC! To get a test VP, use the newly exposed getTestVp method

## 2.1.0

### Minor Changes

-   [#42](https://github.com/WeLibraryOS/LearnCard/pull/42) [`4c6c11f`](https://github.com/WeLibraryOS/LearnCard/commit/4c6c11f30b81b103017883d7f57bd89e2f7d623e) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Expose removeCredential and getCredentialsList methods

### Patch Changes

-   [`7c09ebf`](https://github.com/WeLibraryOS/LearnCard/commit/7c09ebf0106ec207ac1aa2d7bcf1437d275328d7) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix build issues

## 2.0.1

### Patch Changes

-   [#41](https://github.com/WeLibraryOS/LearnCard/pull/41) [`7adc30e`](https://github.com/WeLibraryOS/LearnCard/commit/7adc30eba700da4c6886a086d48c40b9820dc05a) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Overwrite credentials when adding with the same title

*   [#43](https://github.com/WeLibraryOS/LearnCard/pull/43) [`b07187c`](https://github.com/WeLibraryOS/LearnCard/commit/b07187c4384152ec7f4c5be35a8f2b31a3aff079) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix ethers failing on node 18

## 2.0.0

### Major Changes

-   [#33](https://github.com/WeLibraryOS/LearnCard/pull/33) [`a131966`](https://github.com/WeLibraryOS/LearnCard/commit/a13196655378bcb51c35aaad2165b9bccac0526c) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - TS Refactor UnlockedWallet -> Wallet

## 1.5.1

### Patch Changes

-   [#35](https://github.com/WeLibraryOS/LearnCard/pull/35) [`4028716`](https://github.com/WeLibraryOS/LearnCard/commit/40287160de54d06f7baff000dee6f59f08f8623a) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix cross-fetch error

## 1.5.0

### Minor Changes

-   [#19](https://github.com/WeLibraryOS/LearnCard/pull/19) [`de4e724`](https://github.com/WeLibraryOS/LearnCard/commit/de4e7244961f0ef91b91e6cbf32a43f29ff58b96) Thanks [@smurflo2](https://github.com/smurflo2)! - Ethereum plugin! (hello world / base scaffolding)

## 1.4.0

### Minor Changes

-   [#26](https://github.com/WeLibraryOS/LearnCard/pull/26) [`e72b559`](https://github.com/WeLibraryOS/LearnCard/commit/e72b55994495e4bc6156b08abdd166c77fae67b7) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add secp256k1 keypair support and related did methods

## 1.3.1

### Patch Changes

-   [#27](https://github.com/WeLibraryOS/LearnCard/pull/27) [`da81189`](https://github.com/WeLibraryOS/LearnCard/commit/da811895ae672f4287fbcd2026bf1aac5a6447e1) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Test

## 1.3.0

### Minor Changes

-   Add more did methods

### Patch Changes

-   Add tests

*   Plugin-ify Didkit

## 1.2.0

### Minor Changes

-   Move didkit into its own plugin

## 1.1.5

### Patch Changes

-   Release @learncard/cli

## 1.1.4

### Patch Changes

-   Fix type exports

## 1.1.3

### Patch Changes

-   Fix botched release

## 1.1.2

### Patch Changes

-   Upgrade @learncard/types to use zod and implement types for VCs/OBv3

## 1.1.1

### Patch Changes

-   Better verification messages

## 1.1.0

### Minor Changes

-   Remove pluginConstants and force instantiation with key

## 1.0.2

### Patch Changes

-   Remove unused IDX package

## 1.0.1

### Patch Changes

-   Update ReadMe

## 1.0.0

### Major Changes

-   Rename to @learncard/core

## 0.3.5

### Patch Changes

-   Add minimum time for verification loader animation
-   Updated dependencies
    -   learn-card-types@1.2.1

## 0.3.4

### Patch Changes

-   Change message to just Valid

## 0.3.3

### Patch Changes

-   Updated dependencies
    -   learn-card-types@1.2.0

## 0.3.2

### Patch Changes

-   Better proof message

## 0.3.1

### Patch Changes

-   0a650d4: Move VC types to learn-card-types
-   Updated dependencies [0a650d4]
    -   learn-card-types@1.1.0

## 0.3.0

### Minor Changes

-   Better verification data

## 0.2.1

### Patch Changes

-   Don't attach didkit to window object
-   b16655b: Add Expiration Verification Plugin

## 0.2.0

### Minor Changes

-   Remove didkit from initial bundle, default to filestack, expose ability to host it yourself

## 0.1.1

### Patch Changes

-   Update ReadMe

## 0.1.0

### Minor Changes

-   Initial Release
