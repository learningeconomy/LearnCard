---
'@learncard/core': major
---

BREAKING CHANGE: Control Planes Overhaul

_Breaking Changes_

-   Universal Wallets are now returned directly by `initLearnCard`, rather than a wrapped object.
    -   This means you can now call `addPlugin` directly on the return value of `initLearnCard`:

```ts
const learnCard = await initLearnCard();
const bespokeLearnCard = await learnCard.addPlugin(plugin);
```

-   Universal Wallets now implement _Control Planes_ as well as just methods - These are top-level objects with standardized functions that allow plugins/consumers access to
    a unified interface for common operations. When it makes sense, a specific plugin implementing a plane
    can also be chosen, such as choosing where to store a credential when uploading. - There are currently five planes, with more planned for the future: - Read, which implements `get` - `get` simply resolves a URI to a VC - Store, which implements `upload` and (optionally) `uploadMany` - `upload` stores a VC and returns a URI that can be resolved - `uploadMany` stores an array of VCs, returning an array of URIs that can be resolved - Index, which implements `get`, `add`, `update`, and `remove` - `get` returns a list of the holder's credential objects (currently named `IDXCredential`s) - These objects contain (at a minimum) an `id` and a `uri` that can be resolved to a VC - `add` adds a credential to the holder's list - `update` updates an object in the holder's list - `remove` removes an object from the holder's list - Cache, which implements `getIndex`, `setIndex`, `flushIndex`, `getVc`, `setVc`, and `flushVc` - `getIndex` returns the hodler's credential list as it exists in the cache - `setIndex` sets the holder's credential list in the cache - `flushIndex` emptys the holder's credential list cache - `getVc` returns a VC for a URI if it exists in the cache - `setVc` sets a VC for a URI in the cache - `flushVc` emptys all VCs from the cache - Id, which implements `did` and `keypair` - `did` is identical to the previous `wallet.did` method, returning a did for a given method - `keypair` is identical to the previous `wallet.keypair` method, returning a JWK for a given cryptographic algorithm - Plugins implement planes via the second generic parameter to the `Plugin` type - For example, a plugin implementing the Read and Store planes would be typed like this: `Plugin<'Test', 'read' | 'store'>` - Plugins may continue to expose methods the same way they have, instead using the third generic parameter instead of the second: - For example, a plugin implementing the `getSubjectDid` method would be typed like this: `Plugin<'Test', any, { getSubjectDid: (did?: string) => string }>` - Plugins may depend on wallets that implement planes/methods in the same way - For example, a wallet implementing the id plane and the `getSubjectDid` method may be typed like this: `Wallet<any, 'id', { getSubjectDid: (did?: string) => string }>`
-   The `pluginMethods` key has been renamed to `methods` when creating a plugin, and `invoke` when calling them from a wallet
-   The old `LearnCard` type has been removed
-   The `Wallet` type has been renamed to `LearnCard`
-   `generateWallet` has been renamed to `generateLearnCard`
-   The `did` method now has had its type loosened to just `string`
-   The `verifyCredential` method now returns a `VerificationCheck` directly, unless you explicitly ask for the prettified version via a flag
    -   I.e. `wallet.verifyCredential(vc)` is now `wallet.invoke.verifyCredential(vc, {}, true)`
- The `name` field is now _required_ for plugins, and they may optionally specify a `displayName` and `description`

_Migration Steps_

For the most part, you can simply rename calls and everything will just work

-   `wallet.did` is now `wallet.id.did`
-   `wallet.keypair` is now `wallet.id.keypair`
-   `wallet.newCredential` is now `wallet.invoke.newCredential`
-   `wallet.newPresentation` is now `wallet.invoke.newPresentation`
-   `wallet.verifyCredential` is now `wallet.invoke.verifyCredential`
    -   As per above, if you'd like to retain the same output format, you will need to pass true as the third argument, i.e.
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

let test: LearnCardFromKey['returnValue'] | undefined = undefined; // New
let test: LearnCard<any> | undefined = undefined; // Also valid if you don't know which instantiation function will be used

let test: Wallet<any, { getSubjectDid: (did?: string) => string }>; // Old

let test: LearnCard<any, any, { getSubjectDid: (did?: string) => string }>; // New
```
