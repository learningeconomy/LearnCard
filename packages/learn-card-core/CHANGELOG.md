# learn-card-core

## 8.5.0

### Minor Changes

-   [#213](https://github.com/learningeconomy/LearnCard/pull/213) [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add DID-Auth helpers and allow DID-Auth JWTs to be made

### Patch Changes

-   [#213](https://github.com/learningeconomy/LearnCard/pull/213) [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Allow resolving did:web dids that have ports

-   [#213](https://github.com/learningeconomy/LearnCard/pull/213) [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Use most recent plugin for the did method of the ID plane

-   [#213](https://github.com/learningeconomy/LearnCard/pull/213) [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add better defaults for verification method, making it easier to issue VCs/VPs with did:webs

-   [#213](https://github.com/learningeconomy/LearnCard/pull/213) [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add getDIDObject method to make it easier to encrypt things

-   [#213](https://github.com/learningeconomy/LearnCard/pull/213) [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Allow encrypting with a did:web (provided that the did:web correctly exposes an X25519 Key)

## 8.4.2

### Patch Changes

-   [#209](https://github.com/learningeconomy/LearnCard/pull/209) [`9652a2f`](https://github.com/learningeconomy/LearnCard/commit/9652a2f59bc305ed3ef4cd7d53731608f81a54c6) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix index methods wiping out everything else in IDX index

## 8.4.1

### Patch Changes

-   [#205](https://github.com/learningeconomy/LearnCard/pull/205) [`d2e5817`](https://github.com/learningeconomy/LearnCard/commit/d2e581790d63a75d304c2ace8b02133ce122c7ce) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Widen read/store plane types to include VPs and VCs

## 8.4.0

### Minor Changes

-   [#203](https://github.com/learningeconomy/LearnCard/pull/203) [`e78c77d`](https://github.com/learningeconomy/LearnCard/commit/e78c77dc8dfa6c69d7163ed49b551bd739de2f09) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Allow manual management of IDX

## 8.3.1

### Patch Changes

-   [#201](https://github.com/learningeconomy/LearnCard/pull/201) [`d6ebc5b`](https://github.com/learningeconomy/LearnCard/commit/d6ebc5baa52eab591398e81267adb40b3dce74f3) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix abort-controller issues with Webpack

## 8.3.0

### Minor Changes

-   [#194](https://github.com/learningeconomy/LearnCard/pull/194) [`d817fde`](https://github.com/learningeconomy/LearnCard/commit/d817fdecfc98023b3907451750338561df9d577c) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix Multi-Plane issues:

    -   Fix race condition in `get`
    -   Dedupe `index.all` results by `id` rather than by object reference
    -   Fix race condition in cache `get` methods

## 8.2.0

### Minor Changes

-   [#191](https://github.com/learningeconomy/LearnCard/pull/191) [`ace9b60`](https://github.com/learningeconomy/LearnCard/commit/ace9b60b02932e36090e7392a1b7b6a13a9593b8) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add addMany method to index plane

## 8.1.1

### Patch Changes

-   [#187](https://github.com/learningeconomy/LearnCard/pull/187) [`42d02db`](https://github.com/learningeconomy/LearnCard/commit/42d02dba24129983664aceb7da5aaeb4039f8b04) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix Built Types

## 8.1.0

### Minor Changes

-   [#148](https://github.com/learningeconomy/LearnCard/pull/148) [`36e938b`](https://github.com/learningeconomy/LearnCard/commit/36e938b1211b53b96962663e8b33b50f24b2ca51) Thanks [@Custard7](https://github.com/Custard7)! - - WE-2532 - Add JWE Encryption Options to Ceramic Upload.

    -   Add `uploadEncrypted` as optional method for Store Control Plane
    -   Implement `uploadEncrypted` Store Plane method for Ceramic Plugin

-   [#148](https://github.com/learningeconomy/LearnCard/pull/148) [`36e938b`](https://github.com/learningeconomy/LearnCard/commit/36e938b1211b53b96962663e8b33b50f24b2ca51) Thanks [@Custard7](https://github.com/Custard7)! - WE-2532 - Add JWE Encryption Options to Ceramic Upload

## 8.0.7

### Patch Changes

-   [#170](https://github.com/learningeconomy/LearnCard/pull/170) [`c388fd4`](https://github.com/learningeconomy/LearnCard/commit/c388fd49f2832cadcb201779de17d45d3fe7b660) Thanks [@Custard7](https://github.com/Custard7)! - Fix: Update READMEs to 8.0 syntax

## 8.0.6

### Patch Changes

-   [#173](https://github.com/learningeconomy/LearnCard/pull/173) [`b3ae77e`](https://github.com/learningeconomy/LearnCard/commit/b3ae77ef20a10dee303a2c8318faa8bf28344215) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Update context

## 8.0.5

### Patch Changes

-   [#164](https://github.com/learningeconomy/LearnCard/pull/164) [`a3aafb3`](https://github.com/learningeconomy/LearnCard/commit/a3aafb39db6fccae19e999fb4fc89a588bc14555) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Sync Didkit/SSI

## 8.0.4

### Patch Changes

-   [#166](https://github.com/learningeconomy/LearnCard/pull/166) [`86f3541`](https://github.com/learningeconomy/LearnCard/commit/86f35413e6006a17a596d71ea3f186f915e90f28) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Allow making a JFF 2 VC in VC-Templates plugin

## 8.0.3

### Patch Changes

-   [#162](https://github.com/learningeconomy/LearnCard/pull/162) [`8ba3a12`](https://github.com/learningeconomy/LearnCard/commit/8ba3a128602a1dee4ce1d3a73652cb6f96efc2d3) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Eject from aqu and fix tests

-   Updated dependencies [[`8ba3a12`](https://github.com/learningeconomy/LearnCard/commit/8ba3a128602a1dee4ce1d3a73652cb6f96efc2d3)]:
    -   @learncard/helpers@1.0.1

## 8.0.2

### Patch Changes

-   [#153](https://github.com/learningeconomy/LearnCard/pull/153) [`7c6945c`](https://github.com/learningeconomy/LearnCard/commit/7c6945cfe4be8574c869c2515f7806123c372765) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add optional removeAll method to index plane

## 8.0.1

### Patch Changes

-   [`1cafab4`](https://github.com/learningeconomy/LearnCard/commit/1cafab43a6c053914305e0a8b938748ed2a5fd31) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Update Contexts

## 8.0.0

### Major Changes

-   [#130](https://github.com/learningeconomy/LearnCard/pull/130) [`e7cfb63`](https://github.com/learningeconomy/LearnCard/commit/e7cfb636b21cfdd834e3b0cb028036819326a2f9) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - BREAKING CHANGE: Control Planes Overhaul

    _Breaking Changes_

    -   Universal Wallets are now returned directly by `initLearnCard`, rather than a wrapped object.
        -   This means you can now call `addPlugin` directly on the return value of `initLearnCard`:

    ```ts
    const learnCard = await initLearnCard();
    const bespokeLearnCard = await learnCard.addPlugin(plugin);
    ```

    -   Universal Wallets now implement _Control Planes_ as well as just methods
    -   These are top-level objects with standardized functions that allow plugins/consumers access to a unified interface for common operations. When it makes sense, a specific plugin implementing a plane can also be chosen, such as choosing where to store a credential when uploading.
    -   There are currently five planes, with more planned for the future:
        -   Read, which implements `get`
            -   `get` simply resolves a URI to a VC
        -   Store, which implements `upload` and (optionally) `uploadMany`
            -   `upload` stores a VC and returns a URI that can be resolved
            -   `uploadMany` stores an array of VCs, returning an array of URIs that can be resolved
        -   Index, which implements `get`, `add`, `update`, and `remove`
            -   `get` returns a list of the holder's credential objects (currently named `IDXCredential`s)
                -   These objects contain (at a minimum) an `id` and a `uri` that can be resolved to a VC
            -   `add` adds a credential to the holder's list
            -   `update` updates an object in the holder's list
            -   `remove` removes an object from the holder's list
        -   Cache, which implements `getIndex`, `setIndex`, `flushIndex`, `getVc`, `setVc`, and `flushVc`
            -   `getIndex` returns the hodler's credential list as it exists in the cache
            -   `setIndex` sets the holder's credential list in the cache
            -   `flushIndex` emptys the holder's credential list cache
            -   `getVc` returns a VC for a URI if it exists in the cache
            -   `setVc` sets a VC for a URI in the cache
            -   `flushVc` emptys all VCs from the cache
        -   Id, which implements `did` and `keypair`
            -   `did` is identical to the previous `wallet.did` method, returning a did for a given method
            -   `keypair` is identical to the previous `wallet.keypair` method, returning a JWK for a given cryptographic algorithm
    -   Plugins implement planes via the second generic parameter to the `Plugin` type
        -   For example, a plugin implementing the Read and Store planes would be typed like this: `Plugin<'Test', 'read' | 'store'>`
    -   Plugins may continue to expose methods the same way they have, instead using the third generic parameter instead of the second:
        -   For example, a plugin implementing the `getSubjectDid` method would be typed like this: `Plugin<'Test', any, { getSubjectDid: (did?: string) => string }>`
    -   Plugins may depend on wallets that implement planes/methods in the same way

        -   For example, a wallet implementing the id plane and the `getSubjectDid` method may be typed like this: `Wallet<any, 'id', { getSubjectDid: (did?: string) => string }>`

    -   The `pluginMethods` key has been renamed to `methods` when creating a plugin, and `invoke` when calling them from a wallet
    -   The old `LearnCard` type has been removed
    -   The `Wallet` type has been renamed to `LearnCard`
    -   `generateWallet` has been renamed to `generateLearnCard`
        -   This function should now be considered private. If you'd like to construct a fully custom LearnCard, please use `initLearnCard({ custom: true })` instead
    -   The `did` method now has had its type loosened to just `string`
    -   The `verifyCredential` method now returns a `VerificationCheck` directly, unless you explicitly ask for the prettified version via a flag
        -   I.e. `wallet.verifyCredential(vc)` is now `wallet.invoke.verifyCredential(vc, {}, true)`
    -   The `name` field is now _required_ for plugins, and they may optionally specify a `displayName` and `description`
    -   `walletFromKey` has been renamed to `learnCardFromSeed`
    -   `walletFromApiUrl` has been renamed to `learnCardFromApiUrl`
    -   `emptyWallet` has been renamed to `emptyLearnCard`

    _Migration Steps_

    For the most part, you can simply rename calls and everything will just work

    -   `wallet.did` is now `wallet.id.did`
    -   `wallet.keypair` is now `wallet.id.keypair`
    -   `wallet.newCredential` is now `wallet.invoke.newCredential`
    -   `wallet.newPresentation` is now `wallet.invoke.newPresentation`
    -   `wallet.verifyCredential` is now `wallet.invoke.verifyCredential`
        -   As per above, if you'd like to retain the same output format, you will need to pass true as the third argument
            -   I.e. `wallet.verifyCredential(vc)` is now `wallet.invoke.verifyCredential(vc, {}, true)`
    -   `wallet.issueCredential` is now `wallet.invoke.issueCredential`
    -   `wallet.issuePresentation` is now `wallet.invoke.issuePresentation`
    -   `wallet.verifyPresentation` is now `wallet.invoke.verifyPresentation`
    -   `wallet.getCredential` is _a bit_ more complex, as it was actually wrapping two operations:
        -   Getting a credential with a given id
        -   Resolving that credential
        -   This can now be replaced with the following code:

    ```ts
    // Old
    const vc = await lc.getCredential('test');

    // New
    const record = (await lc.index.all.get()).find(record => record.id === 'test');
    const vc = await lc.read.get(record.uri);
    ```

    If this proves to be too cumbersome, we may add back in the `getCredential` method as helper in `invoke`

    -   `wallet.getCredentials` has the same issue as `wallet.getCredential`, it can be replaced with the following code:

    ```ts
    const vcs = await lc.getCredentials();

    // New
    const uris = (await lc.index.all.get()).map(record => record.uri);
    const vcs = await Promise.all(uris.map(async uri => lc.read.get(uri)));
    ```

    -   `wallet.getCredentialsList` is now `wallet.index.all.get`
    -   `wallet.publishCredential` is now `wallet.store.Ceramic.upload`
    -   `wallet.addCredential` is now `wallet.index.IDX.add`
    -   `wallet.removeCredential` is now `wallet.index.IDX.remove`
    -   `wallet.resolveDid` is now `wallet.invoke.resolveDid`
    -   `wallet.readFromCeramic` is now `wallet.invoke.readContentFromCeramic`
    -   `wallet.resolveCredential` is now `wallet.read.get`
    -   `wallet.getTestVc` is now `wallet.invoke.getTestVc`
    -   `wallet.getTestVp` is now `wallet.invoke.getTestVp`
    -   `wallet.getEthereumAddress` is now `wallet.invoke.getEthereumAddress`
    -   `wallet.getBalance` is now `wallet.invoke.getBalance`
    -   `wallet.getBalanceForAddress` is now `wallet.invoke.getBalanceForAddress`
    -   `wallet.transferTokens` is now `wallet.invoke.transferTokens`
    -   `wallet.getCurrentNetwork` is now `wallet.invoke.getCurrentNetwork`
    -   `wallet.changeNetwork` is now `wallet.invoke.changeNetwork`
    -   `wallet.addInfuraProjectId` is now `wallet.invoke.addInfuraProjectId`
    -   `wallet.vpFromQrCode` is now `wallet.invoke.vpFromQrCode`
    -   `wallet.vpToQrCode` is now `wallet.invoke.vpToQrCode`
    -   `wallet.installChapiHandler` is now `wallet.invoke.installChapiHandler`
    -   `wallet.activateChapiHandler` is now `wallet.invoke.activateChapiHandler`
    -   `wallet.receiveChapiEvent` is now `wallet.invoke.receiveChapiEvent`
    -   `wallet.storePresentationViaChapi` is now `wallet.invoke.storePresentationViaChapi`
    -   `wallet.storeCredentialViaChapiDidAuth` is now `wallet.invoke.storeCredentialViaChapiDidAuth`

    Because the `LearnCard` and `Wallet` types have changed, if you were using either, you will need to
    update your code:

    ```ts
    let test: LearnCard | undefined = undefined; // Old

    let test: LearnCardFromSeed['returnValue'] | undefined = undefined; // New
    let test: LearnCard<any> | undefined = undefined; // Also valid if you don't know which instantiation function will be used

    let test: Wallet<any, { getSubjectDid: (did?: string) => string }>; // Old

    let test: LearnCard<any, any, { getSubjectDid: (did?: string) => string }>; // New
    ```

### Patch Changes

-   [#130](https://github.com/learningeconomy/LearnCard/pull/130) [`e7cfb63`](https://github.com/learningeconomy/LearnCard/commit/e7cfb636b21cfdd834e3b0cb028036819326a2f9) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add custom instantiation target

## 7.0.3

### Patch Changes

-   [#124](https://github.com/learningeconomy/LearnCard/pull/124) [`2a4f635`](https://github.com/learningeconomy/LearnCard/commit/2a4f63521b2ce68961868359873064a25394dd99) Thanks [@smurflo2](https://github.com/smurflo2)! - Add getGasPrice method

## 7.0.2

### Patch Changes

-   [#121](https://github.com/learningeconomy/LearnCard/pull/121) [`00b119a`](https://github.com/learningeconomy/LearnCard/commit/00b119a56769bcdc921502a5ad0591d07ad667e8) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Default to Ed25519Signature2020 instead of Ed25519Signature2018 when issuing

## 7.0.1

### Patch Changes

-   [`e8f1ba3`](https://github.com/learningeconomy/LearnCard/commit/e8f1ba3594bc749caf18959962da4b85c97db4a6) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix VC Validation

## 7.0.0

### Major Changes

-   [#113](https://github.com/learningeconomy/LearnCard/pull/113) [`25349fe`](https://github.com/learningeconomy/LearnCard/commit/25349fe064c751a004092bcab24e1674fadfd5fe) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - BREAKING CHANGE: IDX Schemas are now different, leveraging URIs rather than just StreamIDs. Old Schemas will be silently migrated, so this _should_ be pretty painless, but be advised of this change!

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
