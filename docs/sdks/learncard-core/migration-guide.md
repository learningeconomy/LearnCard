---
description: Did you upgrade and something broke? Here's how to fix it!
---

# Changelog

We try not to needlessly add breaking changes, but sometimes it can happen! To find out how to migrate between versions, follow this guide.

> “Love doesn't just sit there, like a stone, it has to be made, like bread; remade all the time, made new.” **- Ursula Le Guin, the Lathe of Heaven**

## 8.0 -> 9.0

### BREAKING CHANGE: @learncard/core package split

#### Breaking Changes

* `initLearnCard` is no longer exported by `@learncard/core`, as it is now the responsibility of `@learncard/init`

```typescript
// Old
import { initLearnCard } from '@learncard/core';

// New
import { initLearnCard } from '@learncard/init';
```

* The didkit wasm binary is no longer exported by `@learncard/core`, as it is now the responsibility of `@learncard/init`

```typescript
// Old
import didkit from '@learncard/core/dist/didkit/didkit_wasm_bg.wasm';

// New
import didkit from '@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm';
```

* `@learncard/network-plugin` and `@learncard/did-web-plugin` no longer export their own version of `initLearnCard`, and are instead now proper instantiation targets from `@learncard/init`

```typescript
// Old
import { initNetworkLearnCard } from '@learncard/network-plugin';
import { initDidWebLearnCard } from '@learncard/did-web-plugin';

const networkLearnCard = await initNetworkLearnCard({ seed: 'a'.repeat(64) });
const didWebLearnCard = await initDidWebLearnCard({ seed: 'a'.repeat(64), didWeb: 'did:web:test' });

// New
import { initLearnCard } from '@learncard/init';

const networkLearnCard = await initLearnCard({ seed: 'a'.repeat(64), network: true });
const didWebLearnCard = await initLearnCard({ seed: 'a'.repeat(64), didWeb: 'did:web:test' });
```

### Migration Steps

For the most part, you can just rename `@learncard/core` to `@learncard/init`, and everything should just work, with the exceptions listed above! In the rare case that doesn't immediately work, you _may_ need to import something directly from the plugin itself, such as the case with the didkit wasm binary.

### Notes

With this change, `@learncard/core` becomes version 9.0, however it also becomes much less public facing compared to the newly released `@learncard/init` (version 1.0). This documentation will continue to use the `@learncard/core` versioning.

## 7.0 -> 8.0

### BREAKING CHANGE: Control Planes Overhaul

#### Breaking Changes

* Universal Wallets are now returned directly by [`initLearnCard`](/broken/pages/br6yNgOwLe1zZAxr9kpC), rather than a wrapped object.
  * This means you can now call [`addPlugin`](/broken/pages/8H0hMQTbMTdDcpSZnw1v) directly on the return value of `initLearnCard`:

```typescript
const learnCard = await initLearnCard();
const bespokeLearnCard = await learnCard.addPlugin(plugin);
```

* Universal Wallets now implement[ _Control Planes_](../../core-concepts/architecture-and-principles/control-planes.md) as well as just methods - These are top-level objects with standardized functions that allow plugins/consumers access to a unified interface for common operations. When it makes sense, a specific plugin implementing a plane can also be chosen, such as choosing where to store a credential when uploading. - There are currently five planes, with more planned for the future:&#x20;
  * [**Read**](/broken/pages/s13FerGAbkHnrN13v85i), which implements `get`&#x20;
    * `get` simply resolves a URI to a VC
  * &#x20;[**Store**](/broken/pages/AacoBhj2Q6kUaK1EVNnj), which implements `upload` and (optionally) `uploadMany`&#x20;
    * `upload` stores a VC and returns a URI that can be resolved&#x20;
    * `uploadMany` stores an array of VCs, returning an array of URIs that can be resolved&#x20;
  * [**Index**](/broken/pages/plqXXrKGsTzgtcePKceH), which implements `get`, `add`, `update`, and `remove`&#x20;
    * `get` returns a list of the holder's credential objects (currently named `IDXCredential`s)&#x20;
      * These objects contain (at a minimum) an `id` and a `uri` that can be resolved to a VC&#x20;
    * `add` adds a credential to the holder's list&#x20;
    * `update` updates an object in the holder's list&#x20;
    * `remove` removes an object from the holder's list&#x20;
  * [**Cache**](/broken/pages/gwMHPTurOKzUunsu7wxm), which implements `getIndex`, `setIndex`, `flushIndex`, `getVc`, `setVc`, and `flushVc`&#x20;
    * `getIndex` returns the hodler's credential list as it exists in the cache&#x20;
    * `setIndex` sets the holder's credential list in the cache&#x20;
    * `flushIndex` emptys the holder's credential list cache&#x20;
    * `getVc` returns a VC for a URI if it exists in the cache&#x20;
    * `setVc` sets a VC for a URI in the cache&#x20;
    * `flushVc` emptys all VCs from the cache&#x20;
  * [**ID**](/broken/pages/IxLd9QFu08nEXrI65rwA)**,** which implements `did` and `keypair`&#x20;
    * `did` is identical to the previous `wallet.did` method, returning a did for a given method&#x20;
    * `keypair` is identical to the previous `wallet.keypair` method, returning a JWK for a given cryptographic algorithm&#x20;
* Plugins implement planes via the second generic parameter to the `Plugin` type&#x20;
  * For example, a plugin implementing the Read and Store planes would be typed like this: `Plugin<'Test', 'read' | 'store'>`&#x20;
* Plugins may continue to expose methods the same way they have, instead using the third generic parameter instead of the second:&#x20;
  * For example, a plugin implementing the `getSubjectDid` method would be typed like this: `Plugin<'Test', any, { getSubjectDid: (did?: string) => string }>`&#x20;
* Plugins may depend on wallets that implement planes/methods in the same way&#x20;
  * For example, a wallet implementing the id plane and the `getSubjectDid` method may be typed like this: `Wallet<any, 'id', { getSubjectDid: (did?: string) => string }>`
* The `pluginMethods` key has been renamed to `methods` when creating a plugin, and `invoke` when calling them from a wallet
* The old `LearnCard` type has been removed
* The `Wallet` type has been renamed to `LearnCard`
* `generateWallet` has been renamed to `generateLearnCard`
  * This function should now be considered private. If you'd like to construct a fully custom LearnCard, please use [`initLearnCard({ custom: true })`](construction.md) instead
* The `did` method now has had its type loosened to just `string`
* The `verifyCredential` method now returns a `VerificationCheck` directly, unless you explicitly ask for the prettified version via a flag
  * I.e. `wallet.verifyCredential(vc)` is now `c(vc, {}, true)`
* The `name` field is now _required_ for plugins, and they may optionally specify a `displayName` and `description`
* `walletFromKey` has been renamed to `learnCardFromSeed`
* `walletFromApiUrl` has been renamed to `learnCardFromApiUrl`
* `emptyWallet` has been renamed to `emptyLearnCard`

### `Migration Steps`

For the most part, you can simply rename calls and everything will just work

* `wallet.did` is now `wallet.id.did`
* `wallet.keypair` is now `wallet.id.keypair`
* `wallet.newCredential` is now `wallet.invoke.newCredential`
* `wallet.newPresentation` is now `wallet.invoke.newPresentation`
* `wallet.verifyCredential` is now `wallet.invoke.verifyCredential`
  * As per above, if you'd like to retain the same output format, you will need to pass true as the third argument
    * I.e. `wallet.verifyCredential(vc)` is now `wallet.invoke.verifyCredential(vc, {}, true)`
* `wallet.issueCredential` is now `wallet.invoke.issueCredential`
* `wallet.issuePresentation` is now `wallet.invoke.issuePresentation`
* `wallet.verifyPresentation` is now `wallet.invoke.verifyPresentation`
* `wallet.getCredential` is _a bit_ more complex, as it was actually wrapping two operations:
  * Getting a credential with a given id
  * Resolving that credential
  * This can now be replaced with the following code:

```typescript
// Old
const vc = await lc.getCredential('test');

// New
const record = (await lc.index.all.get()).find(record => record.id === 'test');
const vc = await lc.read.get(record.uri);
```

If this proves to be too cumbersome, we may add back in the `getCredential` method as helper in `invoke`

* `wallet.getCredentials` has the same issue as `wallet.getCredential`, it can be replaced with the following code:

```typescript
const vcs = await lc.getCredentials();

// New
const uris = (await lc.index.all.get()).map(record => record.uri);
const vcs = await Promise.all(uris.map(async uri => lc.read.get(uri)));
```

* `wallet.getCredentialsList` is now `wallet.index.all.get`
* `wallet.publishCredential` is now `wallet.store.Ceramic.upload`
* `wallet.addCredential` is now `wallet.index.IDX.add`
* `wallet.removeCredential` is now `wallet.index.IDX.remove`
* `wallet.resolveDid` is now `wallet.invoke.resolveDid`
* `wallet.readFromCeramic` is now `wallet.invoke.readContentFromCeramic`
* `wallet.resolveCredential` is now `wallet.read.get`
* `wallet.getTestVc` is now `wallet.invoke.getTestVc`
* `wallet.getTestVp` is now `wallet.invoke.getTestVp`
* `wallet.getEthereumAddress` is now `wallet.invoke.getEthereumAddress`
* `wallet.getBalance` is now `wallet.invoke.getBalance`
* `wallet.getBalanceForAddress` is now `wallet.invoke.getBalanceForAddress`
* `wallet.transferTokens` is now `wallet.invoke.transferTokens`
* `wallet.getCurrentNetwork` is now `wallet.invoke.getCurrentNetwork`
* `wallet.changeNetwork` is now `wallet.invoke.changeNetwork`
* `wallet.addInfuraProjectId` is now `wallet.invoke.addInfuraProjectId`
* `wallet.vpFromQrCode` is now `wallet.invoke.vpFromQrCode`
* `wallet.vpToQrCode` is now `wallet.invoke.vpToQrCode`
* `wallet.installChapiHandler` is now `wallet.invoke.installChapiHandler`
* `wallet.activateChapiHandler` is now `wallet.invoke.activateChapiHandler`
* `wallet.receiveChapiEvent` is now `wallet.invoke.receiveChapiEvent`
* `wallet.storePresentationViaChapi` is now `wallet.invoke.storePresentationViaChapi`
* `wallet.storeCredentialViaChapiDidAuth` is now `wallet.invoke.storeCredentialViaChapiDidAuth`

Because the `LearnCard` and `Wallet` types have changed, if you were using either, you will need to update your code:

```typescript
let test: LearnCard | undefined = undefined; // Old

let test: LearnCardFromSeed['returnValue'] | undefined = undefined; // New
let test: LearnCard<any> | undefined = undefined; // Also valid if you don't know which instantiation function will be used

let test: Wallet<any, { getSubjectDid: (did?: string) => string }>; // Old

let test: LearnCard<any, any, { getSubjectDid: (did?: string) => string }>; // New
```

### Notes

We are moving away from the term "wallet", preferring instead to use the term LearnCard in its place. You may notice that in updated documentation and examples, variables named `wallet` have been replaced with the name `learnCard`.
