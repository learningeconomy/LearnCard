---
id: "modules"
title: "@learncard/core"
sidebar_label: "Exports"
sidebar_position: 0.5
custom_edit_url: null
---

## LearnCard Methods

### ActivateChapiHandler

Ƭ **ActivateChapiHandler**: (`args`: { `get?`: (`event`: [`CredentialRequestEvent`](modules.md#credentialrequestevent)) => `Promise`<[`HandlerResponse`](modules.md#handlerresponse)\> ; `mediatorOrigin?`: `string` ; `store?`: (`event`: [`CredentialStoreEvent`](modules.md#credentialstoreevent)) => `Promise`<[`HandlerResponse`](modules.md#handlerresponse)\>  }) => `Promise`<`void`\>

#### Type declaration

▸ (`args`): `Promise`<`void`\>

Activates CHAPI

##### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `Object` |
| `args.get?` | (`event`: [`CredentialRequestEvent`](modules.md#credentialrequestevent)) => `Promise`<[`HandlerResponse`](modules.md#handlerresponse)\> |
| `args.mediatorOrigin?` | `string` |
| `args.store?` | (`event`: [`CredentialStoreEvent`](modules.md#credentialstoreevent)) => `Promise`<[`HandlerResponse`](modules.md#handlerresponse)\> |

##### Returns

`Promise`<`void`\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:278](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L278)

___

### AddCredential

Ƭ **AddCredential**: (`credential`: `IDXCredential`) => `Promise`<`void`\>

#### Type declaration

▸ (`credential`): `Promise`<`void`\>

Adds a stream ID  pointing to a credential (such as the one returned by `publishCredential`)
to IDX with a bespoke title

The credential may then be retrieved using `getCredential` and passing in that bespoke title,
or by using `getCredentials` to get a list of all credentials that have been added to IDX

##### Parameters

| Name | Type |
| :------ | :------ |
| `credential` | `IDXCredential` |

##### Returns

`Promise`<`void`\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:141](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L141)

___

### AddInfuraProjectId

Ƭ **AddInfuraProjectId**: (`infuraProjectIdToAdd`: `string`) => `void`

#### Type declaration

▸ (`infuraProjectIdToAdd`): `void`

Add an infura project id to an existing wallet.
Really only useful for testing with the CLI right now...

##### Parameters

| Name | Type |
| :------ | :------ |
| `infuraProjectIdToAdd` | `string` |

##### Returns

`void`

#### Defined in

[packages/learn-card-core/src/types/methods.ts:250](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L250)

___

### AllLearnCardMethods

Ƭ **AllLearnCardMethods**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `activateChapiHandler` | [`ActivateChapiHandler`](modules.md#activatechapihandler) |
| `addCredential` | [`AddCredential`](modules.md#addcredential) |
| `addInfuraProjectId` | [`AddInfuraProjectId`](modules.md#addinfuraprojectid) |
| `changeNetwork` | [`ChangeNetwork`](modules.md#changenetwork) |
| `did` | [`Did`](modules.md#did) |
| `getBalance` | [`GetBalance`](modules.md#getbalance) |
| `getBalanceForAddress` | [`GetBalanceForAddress`](modules.md#getbalanceforaddress) |
| `getCredential` | [`GetCredential`](modules.md#getcredential) |
| `getCredentials` | [`GetCredentials`](modules.md#getcredentials) |
| `getCredentialsList` | [`GetCredentialsList`](modules.md#getcredentialslist) |
| `getCurrentNetwork` | [`GetCurrentNetwork`](modules.md#getcurrentnetwork) |
| `getEthereumAddress` | [`GetEthereumAddress`](modules.md#getethereumaddress) |
| `getTestVc` | [`GetTestVc`](modules.md#gettestvc) |
| `getTestVp` | [`GetTestVp`](modules.md#gettestvp) |
| `installChapiHandler` | [`InstallChapiHandler`](modules.md#installchapihandler) |
| `issueCredential` | [`IssueCredential`](modules.md#issuecredential) |
| `issuePresentation` | [`IssuePresentation`](modules.md#issuepresentation) |
| `keypair` | [`Keypair`](modules.md#keypair) |
| `newCredential` | [`NewCredential`](modules.md#newcredential) |
| `newPresentation` | [`NewPresentation`](modules.md#newpresentation) |
| `publishCredential` | [`PublishCredential`](modules.md#publishcredential) |
| `readFromCeramic` | [`ReadFromCeramic`](modules.md#readfromceramic) |
| `receiveChapiEvent` | [`ReceiveChapiEvent`](modules.md#receivechapievent) |
| `removeCredential` | [`RemoveCredential`](modules.md#removecredential) |
| `resolveDid` | [`ResolveDid`](modules.md#resolvedid) |
| `storeCredentialViaChapiDidAuth` | [`StoreCredentialViaChapiDidAuth`](modules.md#storecredentialviachapididauth) |
| `storePresentationViaChapi` | [`StorePresentationViaChapi`](modules.md#storepresentationviachapi) |
| `transferTokens` | [`TransferTokens`](modules.md#transfertokens) |
| `verifyCredential` | [`VerifyCredential`](modules.md#verifycredential) |
| `verifyPresentation` | [`VerifyPresentation`](modules.md#verifypresentation) |
| `vpFromQrCode` | [`VpFromQrCode`](modules.md#vpfromqrcode) |
| `vpToQrCode` | [`VpToQrCode`](modules.md#vptoqrcode) |

#### Defined in

[packages/learn-card-core/src/types/methods.ts:313](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L313)

___

### ChangeNetwork

Ƭ **ChangeNetwork**: (`network`: `ethers.providers.Networkish`) => `void`

#### Type declaration

▸ (`network`): `void`

Change your Ethereum network

##### Parameters

| Name | Type |
| :------ | :------ |
| `network` | `ethers.providers.Networkish` |

##### Returns

`void`

#### Defined in

[packages/learn-card-core/src/types/methods.ts:242](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L242)

___

### Did

Ƭ **Did**: (`type?`: [`DidMethod`](modules.md#didmethod)) => `string`

#### Type declaration

▸ (`type?`): `string`

Wallet holder's did

##### Parameters

| Name | Type |
| :------ | :------ |
| `type?` | [`DidMethod`](modules.md#didmethod) |

##### Returns

`string`

#### Defined in

[packages/learn-card-core/src/types/methods.ts:28](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L28)

___

### GetBalance

Ƭ **GetBalance**: (`symbolOrAddress?`: `string`) => `Promise`<`string`\>

#### Type declaration

▸ (`symbolOrAddress?`): `Promise`<`string`\>

Get the balance of an ERC20 token
  Defaults to ETH if symbolOrAddress is not provided

##### Parameters

| Name | Type |
| :------ | :------ |
| `symbolOrAddress?` | `string` |

##### Returns

`Promise`<`string`\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:206](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L206)

___

### GetBalanceForAddress

Ƭ **GetBalanceForAddress**: (`walletAddress`: `string`, `symbolOrAddress?`: `string`) => `Promise`<`string`\>

#### Type declaration

▸ (`walletAddress`, `symbolOrAddress?`): `Promise`<`string`\>

Get the balance of an ERC20 token for a given address
  Defaults to ETH if symbolOrAddress is not provided

##### Parameters

| Name | Type |
| :------ | :------ |
| `walletAddress` | `string` |
| `symbolOrAddress?` | `string` |

##### Returns

`Promise`<`string`\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:214](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L214)

___

### GetCredential

Ƭ **GetCredential**: (`title`: `string`) => `Promise`<`VC`\>

#### Type declaration

▸ (`title`): `Promise`<`VC`\>

Returns the credential marked with `title` from IDX

##### Parameters

| Name | Type |
| :------ | :------ |
| `title` | `string` |

##### Returns

`Promise`<`VC`\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:105](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L105)

___

### GetCredentials

Ƭ **GetCredentials**: () => `Promise`<`VC`[]\>

#### Type declaration

▸ (): `Promise`<`VC`[]\>

Returns all credentials from IDX

##### Returns

`Promise`<`VC`[]\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:112](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L112)

___

### GetCredentialsList

Ƭ **GetCredentialsList**: () => `Promise`<`IDXCredential`[]\>

#### Type declaration

▸ (): `Promise`<`IDXCredential`[]\>

Returns all credentials from IDX

##### Returns

`Promise`<`IDXCredential`[]\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:119](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L119)

___

### GetCurrentNetwork

Ƭ **GetCurrentNetwork**: () => `ethers.providers.Networkish`

#### Type declaration

▸ (): `ethers.providers.Networkish`

Get your current Ethereum network

##### Returns

`ethers.providers.Networkish`

#### Defined in

[packages/learn-card-core/src/types/methods.ts:235](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L235)

___

### GetEthereumAddress

Ƭ **GetEthereumAddress**: () => `string`

#### Type declaration

▸ (): `string`

Returns Ethereum public address

##### Returns

`string`

#### Defined in

[packages/learn-card-core/src/types/methods.ts:198](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L198)

___

### GetTestVc

Ƭ **GetTestVc**: (`subject?`: `string`) => `UnsignedVC`

#### Type declaration

▸ (`subject?`): `UnsignedVC`

Returns an example credential, optionally allowing a subject's did to be passed in

You can use this to test out implementations that use this library!

##### Parameters

| Name | Type |
| :------ | :------ |
| `subject?` | `string` |

##### Returns

`UnsignedVC`

#### Defined in

[packages/learn-card-core/src/types/methods.ts:181](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L181)

___

### GetTestVp

Ƭ **GetTestVp**: (`credential?`: `VC`) => `Promise`<`UnsignedVP`\>

#### Type declaration

▸ (`credential?`): `Promise`<`UnsignedVP`\>

Wraps a crednetial in an exmaple presentaion. If no credential is provided, a new one will be
generated using getTestVc

You can use this to test out implementations that use this library!

##### Parameters

| Name | Type |
| :------ | :------ |
| `credential?` | `VC` |

##### Returns

`Promise`<`UnsignedVP`\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:191](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L191)

___

### InstallChapiHandler

Ƭ **InstallChapiHandler**: () => `Promise`<`void`\>

#### Type declaration

▸ (): `Promise`<`void`\>

Sets up CHAPI

##### Returns

`Promise`<`void`\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:271](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L271)

___

### IssueCredential

Ƭ **IssueCredential**: (`credential`: `UnsignedVC`, `signingOptions?`: `Partial`<[`ProofOptions`](modules.md#proofoptions)\>) => `Promise`<`VC`\>

#### Type declaration

▸ (`credential`, `signingOptions?`): `Promise`<`VC`\>

Signs an unsigned Verifiable Credential, returning the signed VC

##### Parameters

| Name | Type |
| :------ | :------ |
| `credential` | `UnsignedVC` |
| `signingOptions?` | `Partial`<[`ProofOptions`](modules.md#proofoptions)\> |

##### Returns

`Promise`<`VC`\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:62](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L62)

___

### IssuePresentation

Ƭ **IssuePresentation**: (`presentation`: `UnsignedVP`, `signingOptions?`: `Partial`<[`ProofOptions`](modules.md#proofoptions)\>) => `Promise`<`VP`\>

#### Type declaration

▸ (`presentation`, `signingOptions?`): `Promise`<`VP`\>

Signs an unsigned Verifiable Presentation, returning the signed VP

##### Parameters

| Name | Type |
| :------ | :------ |
| `presentation` | `UnsignedVP` |
| `signingOptions?` | `Partial`<[`ProofOptions`](modules.md#proofoptions)\> |

##### Returns

`Promise`<`VP`\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:84](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L84)

___

### Keypair

Ƭ **Keypair**: (`type?`: [`Algorithm`](modules.md#algorithm)) => { `crv`: `string` ; `d`: `string` ; `kty`: `string` ; `x`: `string` ; `y?`: `string`  }

#### Type declaration

▸ (`type?`): `Object`

Wallet holder's ed25519 key pair

##### Parameters

| Name | Type |
| :------ | :------ |
| `type?` | [`Algorithm`](modules.md#algorithm) |

##### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `crv` | `string` |
| `d` | `string` |
| `kty` | `string` |
| `x` | `string` |
| `y?` | `string` |

#### Defined in

[packages/learn-card-core/src/types/methods.ts:35](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L35)

___

### NewCredential

Ƭ **NewCredential**: `NewCredentialFunction`

Generates a new Unsigned VC from a template

#### Defined in

[packages/learn-card-core/src/types/methods.ts:48](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L48)

___

### NewPresentation

Ƭ **NewPresentation**: (`credential`: `VC`, `args?`: { `did?`: `string`  }) => `Promise`<`UnsignedVP`\>

#### Type declaration

▸ (`credential`, `args?`): `Promise`<`UnsignedVP`\>

Wraps a VC in a simple Presentation

##### Parameters

| Name | Type |
| :------ | :------ |
| `credential` | `VC` |
| `args?` | `Object` |
| `args.did?` | `string` |

##### Returns

`Promise`<`UnsignedVP`\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:55](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L55)

___

### PublishCredential

Ƭ **PublishCredential**: (`credential`: `VC`) => `Promise`<`string`\>

#### Type declaration

▸ (`credential`): `Promise`<`string`\>

Publishes a credential to Ceramic, returning the credential's stream ID

This stream ID may then be shared/persisted/resolved to gain access to the credential

Resolving a stream ID can be done by passing the stream ID to `readFromCeramic`

##### Parameters

| Name | Type |
| :------ | :------ |
| `credential` | `VC` |

##### Returns

`Promise`<`string`\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:130](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L130)

___

### ReadFromCeramic

Ƭ **ReadFromCeramic**: (`streamId`: `string`) => `Promise`<`any`\>

#### Type declaration

▸ (`streamId`): `Promise`<`any`\>

Resolves a stream ID, returning its contents

This can be given the return value of `publishCredential` to gain access to the credential
that was published

##### Parameters

| Name | Type |
| :------ | :------ |
| `streamId` | `string` |

##### Returns

`Promise`<`any`\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:172](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L172)

___

### ReceiveChapiEvent

Ƭ **ReceiveChapiEvent**: () => `Promise`<[`CredentialRequestEvent`](modules.md#credentialrequestevent) \| [`CredentialStoreEvent`](modules.md#credentialstoreevent)\>

#### Type declaration

▸ (): `Promise`<[`CredentialRequestEvent`](modules.md#credentialrequestevent) \| [`CredentialStoreEvent`](modules.md#credentialstoreevent)\>

Receives a CHAPI Event

##### Returns

`Promise`<[`CredentialRequestEvent`](modules.md#credentialrequestevent) \| [`CredentialStoreEvent`](modules.md#credentialstoreevent)\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:289](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L289)

___

### RemoveCredential

Ƭ **RemoveCredential**: (`title`: `string`) => `Promise`<`void`\>

#### Type declaration

▸ (`title`): `Promise`<`void`\>

Adds a stream ID  pointing to a credential (such as the one returned by `publishCredential`)
to IDX with a bespoke title

The credential may then be retrieved using `getCredential` and passing in that bespoke title,
or by using `getCredentials` to get a list of all credentials that have been added to IDX

##### Parameters

| Name | Type |
| :------ | :------ |
| `title` | `string` |

##### Returns

`Promise`<`void`\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:152](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L152)

___

### ResolveDid

Ƭ **ResolveDid**: (`did`: `string`, `inputMetadata?`: [`InputMetadata`](modules.md#inputmetadata)) => `Promise`<`Record`<`string`, `any`\>\>

#### Type declaration

▸ (`did`, `inputMetadata?`): `Promise`<`Record`<`string`, `any`\>\>

Resolves a did to its did document

##### Parameters

| Name | Type |
| :------ | :------ |
| `did` | `string` |
| `inputMetadata?` | [`InputMetadata`](modules.md#inputmetadata) |

##### Returns

`Promise`<`Record`<`string`, `any`\>\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:159](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L159)

___

### StoreCredentialViaChapiDidAuth

Ƭ **StoreCredentialViaChapiDidAuth**: (`credential`: `UnsignedVC`) => `Promise`<{ `success`: ``true``  } \| { `reason`: ``"did not auth"`` \| ``"auth failed verification"`` \| ``"did not store"`` ; `success`: ``false``  }\>

#### Type declaration

▸ (`credential`): `Promise`<{ `success`: ``true``  } \| { `reason`: ``"did not auth"`` \| ``"auth failed verification"`` \| ``"did not store"`` ; `success`: ``false``  }\>

Stores a Credential via CHAPI using DIDAuth

##### Parameters

| Name | Type |
| :------ | :------ |
| `credential` | `UnsignedVC` |

##### Returns

`Promise`<{ `success`: ``true``  } \| { `reason`: ``"did not auth"`` \| ``"auth failed verification"`` \| ``"did not store"`` ; `success`: ``false``  }\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:303](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L303)

___

### StorePresentationViaChapi

Ƭ **StorePresentationViaChapi**: (`presentation`: `VP`) => `Promise`<`Credential` \| `undefined`\>

#### Type declaration

▸ (`presentation`): `Promise`<`Credential` \| `undefined`\>

Stores a VP via CHAPI

##### Parameters

| Name | Type |
| :------ | :------ |
| `presentation` | `VP` |

##### Returns

`Promise`<`Credential` \| `undefined`\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:296](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L296)

___

### TransferTokens

Ƭ **TransferTokens**: (`tokenSymbolOrAddress`: `string`, `amount`: `number`, `toAddress`: `string`) => `Promise`<`string`\>

#### Type declaration

▸ (`tokenSymbolOrAddress`, `amount`, `toAddress`): `Promise`<`string`\>

Transfer tokens to a given address

##### Parameters

| Name | Type |
| :------ | :------ |
| `tokenSymbolOrAddress` | `string` |
| `amount` | `number` |
| `toAddress` | `string` |

##### Returns

`Promise`<`string`\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:224](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L224)

___

### VerifyCredential

Ƭ **VerifyCredential**: (`credential`: `VC`, `options?`: `Partial`<[`ProofOptions`](modules.md#proofoptions)\>) => `Promise`<`VerificationItem`[]\>

#### Type declaration

▸ (`credential`, `options?`): `Promise`<`VerificationItem`[]\>

Verifies a signed Verifiable Credential

Empty error/warnings arrays means verification was successful

##### Parameters

| Name | Type |
| :------ | :------ |
| `credential` | `VC` |
| `options?` | `Partial`<[`ProofOptions`](modules.md#proofoptions)\> |

##### Returns

`Promise`<`VerificationItem`[]\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:74](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L74)

___

### VerifyPresentation

Ƭ **VerifyPresentation**: (`presentation`: `VP`, `options?`: `Partial`<[`ProofOptions`](modules.md#proofoptions)\>) => `Promise`<`VerificationCheck`\>

#### Type declaration

▸ (`presentation`, `options?`): `Promise`<`VerificationCheck`\>

Verifies a signed Verifiable Presentation

Empry error/warnings arrays means verification was successful

##### Parameters

| Name | Type |
| :------ | :------ |
| `presentation` | `VP` |
| `options?` | `Partial`<[`ProofOptions`](modules.md#proofoptions)\> |

##### Returns

`Promise`<`VerificationCheck`\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:95](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L95)

___

### VpFromQrCode

Ƭ **VpFromQrCode**: (`text`: `string`) => `Promise`<`VP`\>

#### Type declaration

▸ (`text`): `Promise`<`VP`\>

Returns a Verifiable Presentation (VP) from a QR code base-64 image data string containing a VP compressed by CBOR-LD.

##### Parameters

| Name | Type |
| :------ | :------ |
| `text` | `string` |

##### Returns

`Promise`<`VP`\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:257](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L257)

___

### VpToQrCode

Ƭ **VpToQrCode**: (`vp`: `VP`) => `Promise`<`string`\>

#### Type declaration

▸ (`vp`): `Promise`<`string`\>

Returns a QR-embeddable base-64 image data string from a Verifiable Presentation, compressed using CBOR-LD.

##### Parameters

| Name | Type |
| :------ | :------ |
| `vp` | `VP` |

##### Returns

`Promise`<`string`\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:264](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/methods.ts#L264)

## DidKey Plugin

### Algorithm

Ƭ **Algorithm**: ``"ed25519"`` \| ``"secp256k1"``

#### Defined in

[packages/learn-card-core/src/wallet/plugins/didkey/types.ts:4](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/didkey/types.ts#L4)

___

### DependentMethods

Ƭ **DependentMethods**<`T`\>: `Object`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `string` |

#### Type declaration

| Name | Type |
| :------ | :------ |
| `generateEd25519KeyFromBytes` | (`bytes`: `Uint8Array`) => `JWK` |
| `generateSecp256k1KeyFromBytes` | (`bytes`: `Uint8Array`) => `JWK` |
| `keyToDid` | (`type`: `T`, `keypair`: `JWK`) => `string` |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/didkey/types.ts:7](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/didkey/types.ts#L7)

___

### DidKeyPluginMethods

Ƭ **DidKeyPluginMethods**<`DidMethod`\>: `Object`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `DidMethod` | extends `string` |

#### Type declaration

| Name | Type |
| :------ | :------ |
| `getKey` | () => `string` |
| `getSubjectDid` | (`type`: `DidMethod`) => `string` |
| `getSubjectKeypair` | (`type?`: [`Algorithm`](modules.md#algorithm)) => `JWK` |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/didkey/types.ts:14](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/didkey/types.ts#L14)

## CHAPI Plugin

### CHAPIPluginDependentMethods

Ƭ **CHAPIPluginDependentMethods**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `getTestVp` | (`credential?`: `VC`) => `Promise`<`UnsignedVP`\> |
| `issueCredential` | (`credential`: `UnsignedVC`, `signingOptions?`: `Partial`<[`ProofOptions`](modules.md#proofoptions)\>) => `Promise`<`VC`\> |
| `issuePresentation` | (`credential`: `UnsignedVP`, `signingOptions?`: `Partial`<[`ProofOptions`](modules.md#proofoptions)\>) => `Promise`<`VP`\> |
| `verifyPresentation` | (`presentation`: `VP`, `options?`: `Partial`<[`ProofOptions`](modules.md#proofoptions)\>) => `Promise`<`VerificationCheck`\> |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/chapi/types.ts:71](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/chapi/types.ts#L71)

___

### CHAPIPluginMethods

Ƭ **CHAPIPluginMethods**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `activateChapiHandler` | (`args`: { `get?`: (`event`: [`CredentialRequestEvent`](modules.md#credentialrequestevent)) => `Promise`<[`HandlerResponse`](modules.md#handlerresponse)\> ; `mediatorOrigin?`: `string` ; `store?`: (`event`: [`CredentialStoreEvent`](modules.md#credentialstoreevent)) => `Promise`<[`HandlerResponse`](modules.md#handlerresponse)\>  }) => `Promise`<`void`\> |
| `installChapiHandler` | () => `Promise`<`void`\> |
| `receiveChapiEvent` | () => `Promise`<[`CredentialRequestEvent`](modules.md#credentialrequestevent) \| [`CredentialStoreEvent`](modules.md#credentialstoreevent)\> |
| `storeCredentialViaChapiDidAuth` | (`credential`: `UnsignedVC`) => `Promise`<{ `success`: ``true``  } \| { `reason`: ``"did not auth"`` \| ``"auth failed verification"`` \| ``"did not store"`` ; `success`: ``false``  }\> |
| `storePresentationViaChapi` | (`presentation`: `UnsignedVP` \| `VP`) => `Promise`<`Credential` \| `undefined`\> |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/chapi/types.ts:88](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/chapi/types.ts#L88)

___

### CredentialRequestEvent

Ƭ **CredentialRequestEvent**: `Object`

#### Call signature

• **new CredentialRequestEvent**(`args`): [`CredentialRequestEvent`](modules.md#credentialrequestevent)

##### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `Object` |
| `args.credentialHandler` | `any` |
| `args.credentialRequestOptions` | `any` |
| `args.credentialRequestOrigin` | `string` |
| `args.hintKey` | `string` |

##### Returns

[`CredentialRequestEvent`](modules.md#credentialrequestevent)

#### Type declaration

| Name | Type |
| :------ | :------ |
| `_credentialHandler` | `any` |
| `credentialRequestOptions` | `any` |
| `credentialRequestOrigin` | `string` |
| `hintKey` | `string` |
| `openWindow` | (`url`: `string`) => `Promise`<`any`\> |
| `respondWith` | (`handlerResponse`: `Promise`<``null`` \| { `data`: `any` ; `dataType`: `string`  }\>) => `void` |
| `type` | `string` |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/chapi/types.ts:18](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/chapi/types.ts#L18)

___

### CredentialStoreEvent

Ƭ **CredentialStoreEvent**: `Object`

#### Call signature

• **new CredentialStoreEvent**(`args`): [`CredentialStoreEvent`](modules.md#credentialstoreevent)

##### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `Object` |
| `args.credential` | [`WebCredential`](modules.md#webcredential) |
| `args.credentialHandler` | `any` |
| `args.credentialRequestOrigin` | `string` |
| `args.hintKey` | `string` |

##### Returns

[`CredentialStoreEvent`](modules.md#credentialstoreevent)

#### Type declaration

| Name | Type |
| :------ | :------ |
| `_credentialHandler` | `any` |
| `credential` | [`WebCredential`](modules.md#webcredential) |
| `credentialRequestOrigin` | `string` |
| `hintKey` | `string` |
| `openWindow` | (`url`: `string`) => `Promise`<`any`\> |
| `respondWith` | (`handlerResponse`: `Promise`<``null`` \| { `data`: `any` ; `dataType`: `string`  }\>) => `void` |
| `type` | `string` |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/chapi/types.ts:42](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/chapi/types.ts#L42)

___

### HandlerResponse

Ƭ **HandlerResponse**: { `type`: ``"redirect"`` ; `url`: `string`  } \| { `data`: `any` ; `dataType`: `string` ; `type`: ``"response"``  }

#### Defined in

[packages/learn-card-core/src/wallet/plugins/chapi/types.ts:66](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/chapi/types.ts#L66)

___

### WebCredential

Ƭ **WebCredential**: `Object`

#### Call signature

• **new WebCredential**(`dataType`, `data`, `options?`): [`WebCredential`](modules.md#webcredential)

##### Parameters

| Name | Type |
| :------ | :------ |
| `dataType` | `string` |
| `data` | `Object` |
| `data.@context` | `string`[] |
| `data.holder?` | `string` |
| `data.id?` | `string` |
| `data.proof` | { `[x: string]`: `any`; `challenge?`: `string` ; `created`: `string` ; `domain?`: `string` ; `jws?`: `string` ; `nonce?`: `string` ; `proofPurpose`: `string` ; `type`: `string` ; `verificationMethod`: `string`  } \| { `[x: string]`: `any`; `challenge?`: `string` ; `created`: `string` ; `domain?`: `string` ; `jws?`: `string` ; `nonce?`: `string` ; `proofPurpose`: `string` ; `type`: `string` ; `verificationMethod`: `string`  }[] |
| `data.type` | [`string`, ...string[]] |
| `data.verifiableCredential` | { `[x: string]`: `any`; `@context`: `string`[] ; `credentialSchema?`: { `id`: `string` ; `type`: `string`  }[] ; `credentialStatus?`: { `id`: `string` ; `type`: `string`  } ; `credentialSubject`: { `[x: string]`: `any`; `id?`: `string`  } \| { `[x: string]`: `any`; `id?`: `string`  }[] ; `expirationDate?`: `string` ; `id?`: `string` ; `issuanceDate`: `string` ; `issuer`: `string` \| { `[x: string]`: `any`; `additionalName?`: `string` ; `address?`: { `addressCountry?`: `string` ; `addressCountryCode?`: `string` ; `addressLocality?`: `string` ; `addressRegion?`: `string` ; `geo?`: { `latitude`: `number` ; `longitude`: `number` ; `type`: `string` \| [`string`, ...string[]]  } ; `postOfficeBoxNumber?`: `string` ; `postalCode?`: `string` ; `streetAddress?`: `string` ; `type`: `string` \| [`string`, ...string[]]  } ; `dateOfBirth?`: `string` ; `description?`: `string` ; `email?`: `string` ; `endorsement?`: `any`[] ; `familyName?`: `string` ; `familyNamePrefix?`: `string` ; `givenName?`: `string` ; `honorificPrefix?`: `string` ; `honorificSuffix?`: `string` ; `id?`: `string` ; `image?`: `string` \| { `caption?`: `string` ; `id`: `string` ; `type`: `string`  } ; `name?`: `string` ; `official?`: `string` ; `otherIdentifier?`: { `identifier`: `string` ; `identifierType`: `string` ; `type`: `string` \| [`string`, ...string[]]  }[] ; `parentOrg?`: `any` ; `patronymicName?`: `string` ; `phone?`: `string` ; `type?`: [`string`, ...string[]] ; `url?`: `string`  } ; `proof`: { `[x: string]`: `any`; `challenge?`: `string` ; `created`: `string` ; `domain?`: `string` ; `jws?`: `string` ; `nonce?`: `string` ; `proofPurpose`: `string` ; `type`: `string` ; `verificationMethod`: `string`  } \| { `[x: string]`: `any`; `challenge?`: `string` ; `created`: `string` ; `domain?`: `string` ; `jws?`: `string` ; `nonce?`: `string` ; `proofPurpose`: `string` ; `type`: `string` ; `verificationMethod`: `string`  }[] ; `refreshService?`: { `[x: string]`: `any`; `id`: `string` ; `type`: `string`  } ; `type`: [`string`, ...string[]]  } \| { `[x: string]`: `any`; `@context`: `string`[] ; `credentialSchema?`: { `id`: `string` ; `type`: `string`  }[] ; `credentialStatus?`: { `id`: `string` ; `type`: `string`  } ; `credentialSubject`: { `[x: string]`: `any`; `id?`: `string`  } \| { `[x: string]`: `any`; `id?`: `string`  }[] ; `expirationDate?`: `string` ; `id?`: `string` ; `issuanceDate`: `string` ; `issuer`: `string` \| { `[x: string]`: `any`; `additionalName?`: `string` ; `address?`: { `addressCountry?`: `string` ; `addressCountryCode?`: `string` ; `addressLocality?`: `string` ; `addressRegion?`: `string` ; `geo?`: { `latitude`: `number` ; `longitude`: `number` ; `type`: `string` \| [`string`, ...string[]]  } ; `postOfficeBoxNumber?`: `string` ; `postalCode?`: `string` ; `streetAddress?`: `string` ; `type`: `string` \| [`string`, ...string[]]  } ; `dateOfBirth?`: `string` ; `description?`: `string` ; `email?`: `string` ; `endorsement?`: `any`[] ; `familyName?`: `string` ; `familyNamePrefix?`: `string` ; `givenName?`: `string` ; `honorificPrefix?`: `string` ; `honorificSuffix?`: `string` ; `id?`: `string` ; `image?`: `string` \| { `caption?`: `string` ; `id`: `string` ; `type`: `string`  } ; `name?`: `string` ; `official?`: `string` ; `otherIdentifier?`: { `identifier`: `string` ; `identifierType`: `string` ; `type`: `string` \| [`string`, ...string[]]  }[] ; `parentOrg?`: `any` ; `patronymicName?`: `string` ; `phone?`: `string` ; `type?`: [`string`, ...string[]] ; `url?`: `string`  } ; `proof`: { `[x: string]`: `any`; `challenge?`: `string` ; `created`: `string` ; `domain?`: `string` ; `jws?`: `string` ; `nonce?`: `string` ; `proofPurpose`: `string` ; `type`: `string` ; `verificationMethod`: `string`  } \| { `[x: string]`: `any`; `challenge?`: `string` ; `created`: `string` ; `domain?`: `string` ; `jws?`: `string` ; `nonce?`: `string` ; `proofPurpose`: `string` ; `type`: `string` ; `verificationMethod`: `string`  }[] ; `refreshService?`: { `[x: string]`: `any`; `id`: `string` ; `type`: `string`  } ; `type`: [`string`, ...string[]]  }[] |
| `options?` | `Object` |
| `options.recommendedHandlerOrigins` | `string`[] |

##### Returns

[`WebCredential`](modules.md#webcredential)

#### Type declaration

| Name | Type |
| :------ | :------ |
| `data` | `VP` |
| `dataType` | `string` |
| `options` | { `recommendedHandlerOrigins`: `string`[]  } |
| `options.recommendedHandlerOrigins` | `string`[] |
| `type` | `string` |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/chapi/types.ts:5](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/chapi/types.ts#L5)

## IDXPlugin

### CeramicIDXArgs

Ƭ **CeramicIDXArgs**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `ceramicEndpoint` | `string` |
| `credentialAlias` | `string` |
| `defaultContentFamily` | `string` |
| `modelData` | `ModelAliases` |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/idx/types.ts:7](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/idx/types.ts#L7)

___

### CredentialsList

Ƭ **CredentialsList**: `z.infer`<typeof [`CredentialsListValidator`](modules.md#credentialslistvalidator)\>

#### Defined in

[packages/learn-card-core/src/wallet/plugins/idx/types.ts:30](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/idx/types.ts#L30)

___

### IDXPluginMethods

Ƭ **IDXPluginMethods**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `addVerifiableCredentialInIdx` | (`cred`: `IDXCredential`) => `Promise`<`StreamID`\> |
| `getCredentialsListFromIdx` | (`alias?`: `string`) => `Promise`<[`CredentialsList`](modules.md#credentialslist)\> |
| `getVerifiableCredentialFromIdx` | (`title`: `string`) => `Promise`<`VC`\> |
| `getVerifiableCredentialsFromIdx` | () => `Promise`<`VC`[]\> |
| `publishContentToCeramic` | (`cred`: `any`) => `Promise`<`string`\> |
| `readContentFromCeramic` | (`streamId`: `string`) => `Promise`<`any`\> |
| `removeVerifiableCredentialInIdx` | (`title`: `string`) => `Promise`<`StreamID`\> |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/idx/types.ts:15](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/idx/types.ts#L15)

___

### CredentialsListValidator

• `Const` **CredentialsListValidator**: `ZodObject`<{ `credentials`: `ZodArray`<`ZodObject`<{ `id`: `ZodString` ; `storageType`: `ZodOptional`<`ZodEnum`<[``"ceramic"``]\>\> ; `title`: `ZodString`  }, ``"strip"``, `ZodTypeAny`, { `id`: `string` ; `storageType?`: ``"ceramic"`` ; `title`: `string`  }, { `id`: `string` ; `storageType?`: ``"ceramic"`` ; `title`: `string`  }\>, ``"many"``\>  }, ``"strict"``, `ZodTypeAny`, { `credentials`: { `id`: `string` ; `storageType?`: ``"ceramic"`` ; `title`: `string`  }[]  }, { `credentials`: { `id`: `string` ; `storageType?`: ``"ceramic"`` ; `title`: `string`  }[]  }\>

#### Defined in

[packages/learn-card-core/src/wallet/plugins/idx/types.ts:26](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/idx/types.ts#L26)

## DIDKit Plugin

### DidMethod

Ƭ **DidMethod**: ``"key"`` \| ``"tz"`` \| ``"ethr"`` \| \`pkh:${"tz" \| "tezos" \| "sol" \| "solana" \| "eth" \| "celo" \| "poly" \| "btc" \| "doge" \| "eip155" \| "bip122"}\` \| \`pkh:eip155:${string}\` \| \`pkh:bip122:${string}\`

#### Defined in

[packages/learn-card-core/src/wallet/plugins/didkit/types.ts:4](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/didkit/types.ts#L4)

___

### DidkitPluginMethods

Ƭ **DidkitPluginMethods**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `contextLoader` | (`url`: `string`) => `Promise`<`Record`<`string`, `any`\>\> |
| `generateEd25519KeyFromBytes` | (`bytes`: `Uint8Array`) => `JWK` |
| `generateSecp256k1KeyFromBytes` | (`bytes`: `Uint8Array`) => `JWK` |
| `issueCredential` | (`credential`: `UnsignedVC`, `options`: [`ProofOptions`](modules.md#proofoptions), `keypair`: `JWK`) => `Promise`<`VC`\> |
| `issuePresentation` | (`presentation`: `UnsignedVP`, `options`: [`ProofOptions`](modules.md#proofoptions), `keypair`: `JWK`) => `Promise`<`VP`\> |
| `keyToDid` | (`type`: [`DidMethod`](modules.md#didmethod), `keypair`: `JWK`) => `string` |
| `keyToVerificationMethod` | (`type`: `string`, `keypair`: `JWK`) => `Promise`<`string`\> |
| `resolveDid` | (`did`: `string`, `inputMetadata?`: [`InputMetadata`](modules.md#inputmetadata)) => `Promise`<`Record`<`string`, `any`\>\> |
| `verifyCredential` | (`credential`: `VC`, `options?`: [`ProofOptions`](modules.md#proofoptions)) => `Promise`<`VerificationCheck`\> |
| `verifyPresentation` | (`presentation`: `VP`, `options?`: [`ProofOptions`](modules.md#proofoptions)) => `Promise`<`VerificationCheck`\> |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/didkit/types.ts:43](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/didkit/types.ts#L43)

___

### InputMetadata

Ƭ **InputMetadata**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `accept?` | `string` |
| `noCache?` | `boolean` |
| `versionId?` | `string` |
| `versionTime?` | `string` |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/didkit/types.ts:35](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/didkit/types.ts#L35)

___

### ProofOptions

Ƭ **ProofOptions**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `challenge?` | `string` |
| `checks?` | (``"Proof"`` \| ``"JWS"`` \| ``"CredentialStatus"``)[] |
| `created?` | `string` |
| `domain?` | `string` |
| `proofPurpose?` | `string` |
| `type?` | `string` |
| `verificationMethod?` | `string` |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/didkit/types.ts:24](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/didkit/types.ts#L24)

## LearnCard

### EmptyLearnCard

Ƭ **EmptyLearnCard**: [`LearnCard`](modules.md#learncard)<``"newCredential"`` \| ``"newPresentation"`` \| ``"verifyCredential"`` \| ``"verifyPresentation"`` \| ``"resolveDid"`` \| ``"installChapiHandler"`` \| ``"activateChapiHandler"`` \| ``"receiveChapiEvent"`` \| ``"storePresentationViaChapi"`` \| ``"storeCredentialViaChapiDidAuth"``, [`Wallet`](modules.md#wallet)<``"DIDKit"`` \| ``"Expiration"`` \| ``"VC Templates"`` \| ``"CHAPI"``, [`MergeObjects`](modules.md#mergeobjects)<[[`DidkitPluginMethods`](modules.md#didkitpluginmethods), [`VerifyExtension`](modules.md#verifyextension), `VCTemplatePluginMethods`, [`CHAPIPluginMethods`](modules.md#chapipluginmethods)]\>\>\>

#### Defined in

[packages/learn-card-core/src/types/LearnCard.ts:64](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/LearnCard.ts#L64)

___

### LearnCard

Ƭ **LearnCard**<`Methods`, `RawWallet`\>: { `_wallet`: `RawWallet`  } & `Pick`<[`AllLearnCardMethods`](modules.md#alllearncardmethods), `Methods`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Methods` | extends keyof [`AllLearnCardMethods`](modules.md#alllearncardmethods) = keyof [`AllLearnCardMethods`](modules.md#alllearncardmethods) |
| `RawWallet` | extends [`Wallet`](modules.md#wallet)<`any`, `any`\> = [`LearnCardRawWallet`](modules.md#learncardrawwallet) |

#### Defined in

[packages/learn-card-core/src/types/LearnCard.ts:53](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/LearnCard.ts#L53)

___

### LearnCardConfig

Ƭ **LearnCardConfig**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `ceramicIdx` | [`CeramicIDXArgs`](modules.md#ceramicidxargs) |
| `defaultContents` | `any`[] |
| `didkit` | `InitInput` \| `Promise`<`InitInput`\> |
| `ethereumConfig` | [`EthereumConfig`](modules.md#ethereumconfig) |

#### Defined in

[packages/learn-card-core/src/types/LearnCard.ts:110](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/LearnCard.ts#L110)

___

### VCAPILearnCard

Ƭ **VCAPILearnCard**: [`LearnCard`](modules.md#learncard)<``"did"`` \| ``"newCredential"`` \| ``"newPresentation"`` \| ``"issueCredential"`` \| ``"verifyCredential"`` \| ``"issuePresentation"`` \| ``"verifyPresentation"`` \| ``"getTestVc"`` \| ``"getTestVp"`` \| ``"installChapiHandler"`` \| ``"activateChapiHandler"`` \| ``"receiveChapiEvent"`` \| ``"storePresentationViaChapi"`` \| ``"storeCredentialViaChapiDidAuth"``, [`Wallet`](modules.md#wallet)<``"VC API"`` \| ``"Expiration"`` \| ``"VC Templates"`` \| ``"CHAPI"``, [`MergeObjects`](modules.md#mergeobjects)<[`VCAPIPluginMethods`, [`VerifyExtension`](modules.md#verifyextension), `VCTemplatePluginMethods`, [`CHAPIPluginMethods`](modules.md#chapipluginmethods)]\>\>\>

#### Defined in

[packages/learn-card-core/src/types/LearnCard.ts:86](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/LearnCard.ts#L86)

## Init Functions

### EmptyWallet

Ƭ **EmptyWallet**: `InitFunction`<`undefined`, ``"didkit"``, [`EmptyLearnCard`](modules.md#emptylearncard)\>

#### Defined in

[packages/learn-card-core/src/types/LearnCard.ts:118](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/LearnCard.ts#L118)

___

### InitLearnCard

Ƭ **InitLearnCard**: `GenericInitFunction`<[[`EmptyWallet`](modules.md#emptywallet), [`WalletFromKey`](modules.md#walletfromkey), [`WalletFromVcApi`](modules.md#walletfromvcapi)]\>

#### Defined in

[packages/learn-card-core/src/types/LearnCard.ts:129](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/LearnCard.ts#L129)

___

### WalletFromKey

Ƭ **WalletFromKey**: `InitFunction`<{ `seed`: `string`  }, keyof [`LearnCardConfig`](modules.md#learncardconfig), [`LearnCard`](modules.md#learncard)\>

#### Defined in

[packages/learn-card-core/src/types/LearnCard.ts:120](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/LearnCard.ts#L120)

___

### WalletFromVcApi

Ƭ **WalletFromVcApi**: `InitFunction`<{ `did?`: `string` ; `vcApi`: ``true`` \| `string`  }, ``"defaultContents"``, [`VCAPILearnCard`](modules.md#vcapilearncard)\>

#### Defined in

[packages/learn-card-core/src/types/LearnCard.ts:122](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/LearnCard.ts#L122)

___

### emptyWallet

▸ **emptyWallet**(`__namedParameters?`): `Promise`<[`EmptyLearnCard`](modules.md#emptylearncard)\>

Generates an empty wallet with no key material

#### Parameters

| Name | Type |
| :------ | :------ |
| `__namedParameters` | `Partial`<`Pick`<[`LearnCardConfig`](modules.md#learncardconfig), ``"didkit"``\>\> |

#### Returns

`Promise`<[`EmptyLearnCard`](modules.md#emptylearncard)\>

#### Defined in

[packages/learn-card-core/src/wallet/initializers/emptyWallet.ts:15](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/initializers/emptyWallet.ts#L15)

___

### initLearnCard

▸ **initLearnCard**(`config?`): `Promise`<[`EmptyWallet`](modules.md#emptywallet)[``"returnValue"``]\>

Generates an Empty Wallet

#### Parameters

| Name | Type |
| :------ | :------ |
| `config?` | `Partial`<`Pick`<[`LearnCardConfig`](modules.md#learncardconfig), ``"didkit"``\>\> |

#### Returns

`Promise`<[`EmptyWallet`](modules.md#emptywallet)[``"returnValue"``]\>

#### Defined in

[packages/learn-card-core/src/wallet/init.ts:18](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/init.ts#L18)

▸ **initLearnCard**(`config`): `Promise`<[`WalletFromKey`](modules.md#walletfromkey)[``"returnValue"``]\>

Generates a full wallet from a 32 byte seed

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | { `seed`: `string`  } & `Partial`<`Pick`<[`LearnCardConfig`](modules.md#learncardconfig), keyof [`LearnCardConfig`](modules.md#learncardconfig)\>\> |

#### Returns

`Promise`<[`WalletFromKey`](modules.md#walletfromkey)[``"returnValue"``]\>

#### Defined in

[packages/learn-card-core/src/wallet/init.ts:25](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/init.ts#L25)

▸ **initLearnCard**(`config`): `Promise`<[`WalletFromVcApi`](modules.md#walletfromvcapi)[``"returnValue"``]\>

Generates a wallet that can sign VCs/VPs from a VC API

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | { `did?`: `string` ; `vcApi`: `string` \| ``true``  } & `Partial`<`Pick`<[`LearnCardConfig`](modules.md#learncardconfig), ``"defaultContents"``\>\> |

#### Returns

`Promise`<[`WalletFromVcApi`](modules.md#walletfromvcapi)[``"returnValue"``]\>

#### Defined in

[packages/learn-card-core/src/wallet/init.ts:32](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/init.ts#L32)

___

### walletFromApiUrl

▸ **walletFromApiUrl**(`url`, `did?`, `__namedParameters?`): `Promise`<[`VCAPILearnCard`](modules.md#vcapilearncard)\>

Generates a LearnCard Wallet from a 64 character seed string

#### Parameters

| Name | Type |
| :------ | :------ |
| `url` | `string` |
| `did?` | `string` |
| `__namedParameters` | `Partial`<[`LearnCardConfig`](modules.md#learncardconfig)\> |

#### Returns

`Promise`<[`VCAPILearnCard`](modules.md#vcapilearncard)\>

#### Defined in

[packages/learn-card-core/src/wallet/initializers/apiWallet.ts:15](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/initializers/apiWallet.ts#L15)

___

### walletFromKey

▸ **walletFromKey**(`key`, `__namedParameters?`): `Promise`<[`LearnCard`](modules.md#learncard)<keyof [`AllLearnCardMethods`](modules.md#alllearncardmethods), [`LearnCardRawWallet`](modules.md#learncardrawwallet)\>\>

Generates a LearnCard Wallet from a 64 character seed string

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `__namedParameters` | `Partial`<[`LearnCardConfig`](modules.md#learncardconfig)\> |

#### Returns

`Promise`<[`LearnCard`](modules.md#learncard)<keyof [`AllLearnCardMethods`](modules.md#alllearncardmethods), [`LearnCardRawWallet`](modules.md#learncardrawwallet)\>\>

#### Defined in

[packages/learn-card-core/src/wallet/initializers/walletFromKey.ts:21](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/initializers/walletFromKey.ts#L21)

## Ethereum Plugin

### EthereumConfig

Ƭ **EthereumConfig**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `infuraProjectId?` | `string` |
| `network?` | `providers.Networkish` |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/EthereumPlugin/types.ts:19](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/EthereumPlugin/types.ts#L19)

___

### EthereumPluginMethods

Ƭ **EthereumPluginMethods**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `addInfuraProjectId` | (`infuraProjectIdToAdd`: `string`) => `void` |
| `changeNetwork` | (`network`: `providers.Networkish`) => `void` |
| `getBalance` | (`symbolOrAddress?`: `string`) => `Promise`<`string`\> |
| `getBalanceForAddress` | (`walletAddress`: `string`, `symbolOrAddress?`: `string`) => `Promise`<`string`\> |
| `getCurrentNetwork` | () => `providers.Networkish` |
| `getEthereumAddress` | () => `string` |
| `transferTokens` | (`tokenSymbolOrAddress`: `string`, `amount`: `number`, `toAddress`: `string`) => `Promise`<`string`\> |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/EthereumPlugin/types.ts:4](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/EthereumPlugin/types.ts#L4)

___

### Token

Ƭ **Token**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `address` | `string` |
| `chainId` | `number` |
| `decimals` | `number` |
| `extensions` | `any` |
| `logoURI` | `string` |
| `name` | `string` |
| `symbol` | `string` |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/EthereumPlugin/types.ts:25](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/EthereumPlugin/types.ts#L25)

___

### TokenList

Ƭ **TokenList**: [`Token`](modules.md#token)[]

#### Defined in

[packages/learn-card-core/src/wallet/plugins/EthereumPlugin/types.ts:36](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/EthereumPlugin/types.ts#L36)

## Universal Wallets

### LearnCardRawWallet

Ƭ **LearnCardRawWallet**: [`Wallet`](modules.md#wallet)<``"DIDKit"`` \| ``"DID Key"`` \| ``"VC"`` \| ``"VC Templates"`` \| ``"IDX"`` \| ``"Expiration"`` \| ``"Ethereum"`` \| ``"Vpqr"`` \| ``"CHAPI"``, [`MergeObjects`](modules.md#mergeobjects)<[[`DidKeyPluginMethods`](modules.md#didkeypluginmethods)<[`DidMethod`](modules.md#didmethod)\>, [`VCPluginMethods`](modules.md#vcpluginmethods), `VCTemplatePluginMethods`, [`IDXPluginMethods`](modules.md#idxpluginmethods), [`EthereumPluginMethods`](modules.md#ethereumpluginmethods), [`VpqrPluginMethods`](modules.md#vpqrpluginmethods), [`CHAPIPluginMethods`](modules.md#chapipluginmethods)]\>\>

#### Defined in

[packages/learn-card-core/src/types/LearnCard.ts:27](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/LearnCard.ts#L27)

___

### Plugin

Ƭ **Plugin**<`Name`, `PublicMethods`, `DependentMethods`\>: `Object`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Name` | extends `string` |
| `PublicMethods` | extends `Record`<`string`, (...`args`: `any`[]) => `any`\> = `Record`<`never`, `never`\> |
| `DependentMethods` | extends `Record`<`string`, (...`args`: `any`[]) => `any`\> = `Record`<`never`, `never`\> |

#### Type declaration

| Name | Type |
| :------ | :------ |
| `name?` | `Name` |
| `pluginMethods` | { [Key in keyof PublicMethods]: Function } |

#### Defined in

[packages/learn-card-core/src/types/wallet.ts:4](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/wallet.ts#L4)

___

### Wallet

Ƭ **Wallet**<`PluginNames`, `PluginMethods`\>: `PublicFieldsObj`<`PluginMethods`\> & { `add`: (`content`: `any`) => `Promise`<[`Wallet`](modules.md#wallet)<`PluginNames`, `PluginMethods`\>\> ; `addPlugin`: <Name, Methods\>(`plugin`: [`Plugin`](modules.md#plugin)<`Name`, `Methods`\>) => `Promise`<[`Wallet`](modules.md#wallet)<``""`` extends `PluginNames` ? `Name` : `PluginNames` \| `Name`, `Record`<`never`, `never`\> extends `PluginMethods` ? `Methods` : [`MergeObjects`](modules.md#mergeobjects)<[`PluginMethods`, `Methods`]\>\>\> ; `contents`: `any`[] ; `plugins`: [`Plugin`](modules.md#plugin)<`PluginNames`, `Record`<`string`, (...`args`: `any`[]) => `any`\>\>[] ; `remove`: (`contentId`: `string`) => `Promise`<[`Wallet`](modules.md#wallet)<`PluginNames`, `PluginMethods`\>\>  }

#### Type parameters

| Name | Type |
| :------ | :------ |
| `PluginNames` | extends `string` = ``""`` |
| `PluginMethods` | extends `Record`<`string`, (...`args`: `any`[]) => `any`\> = `Record`<`never`, `never`\> |

#### Defined in

[packages/learn-card-core/src/types/wallet.ts:26](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/wallet.ts#L26)

___

### generateWallet

▸ **generateWallet**<`PluginNames`, `PluginMethods`\>(`contents?`, `_wallet?`): `Promise`<[`Wallet`](modules.md#wallet)<`PluginNames`, `PluginMethods`\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `PluginNames` | extends `string` |
| `PluginMethods` | extends `Record`<`string`, (...`args`: `any`[]) => `any`\> = `Record`<`never`, `never`\> |

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `contents` | `any`[] | `[]` |
| `_wallet` | `Partial`<[`Wallet`](modules.md#wallet)<`any`, `PluginMethods`\>\> | `{}` |

#### Returns

`Promise`<[`Wallet`](modules.md#wallet)<`PluginNames`, `PluginMethods`\>\>

#### Defined in

[packages/learn-card-core/src/wallet/base/wallet.ts:66](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/base/wallet.ts#L66)

## Utility Types

### MergeObjects

Ƭ **MergeObjects**<`Objects`\>: `undefined` extends `Objects`[``2``] ? `Omit`<`Objects`[``0``], keyof `Objects`[``1``]\> & `Objects`[``1``] : `Omit`<[`MergeObjects`](modules.md#mergeobjects)<`RemoveLast`<`Objects`\>\>, keyof `Last`<`Objects`\>\> & `Last`<`Objects`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Objects` | extends `Record`<`string`, `any`\>[] |

#### Defined in

[packages/learn-card-core/src/types/utilities.ts:12](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/types/utilities.ts#L12)

## VC Plugin

### VCImplicitWallet

Ƭ **VCImplicitWallet**: [`Wallet`](modules.md#wallet)<`string`, [`VCPluginMethods`](modules.md#vcpluginmethods) & [`VCPluginDependentMethods`](modules.md#vcplugindependentmethods)\>

#### Defined in

[packages/learn-card-core/src/wallet/plugins/vc/types.ts:43](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/vc/types.ts#L43)

___

### VCPluginDependentMethods

Ƭ **VCPluginDependentMethods**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `getSubjectDid` | (`type`: ``"key"``) => `string` |
| `getSubjectKeypair` | () => `JWK` |
| `issueCredential` | (`credential`: `UnsignedVC`, `options`: [`ProofOptions`](modules.md#proofoptions), `keypair`: `JWK`) => `Promise`<`VC`\> |
| `issuePresentation` | (`presentation`: `UnsignedVP`, `options`: [`ProofOptions`](modules.md#proofoptions), `keypair`: `JWK`) => `Promise`<`VP`\> |
| `keyToVerificationMethod` | (`type`: `string`, `keypair`: `JWK`) => `Promise`<`string`\> |
| `verifyCredential` | (`credential`: `VC`, `options?`: [`ProofOptions`](modules.md#proofoptions)) => `Promise`<`VerificationCheck`\> |
| `verifyPresentation` | (`presentation`: `VP`, `options?`: [`ProofOptions`](modules.md#proofoptions)) => `Promise`<`VerificationCheck`\> |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/vc/types.ts:6](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/vc/types.ts#L6)

___

### VCPluginMethods

Ƭ **VCPluginMethods**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `getTestVc` | (`subject?`: `string`) => `UnsignedVC` |
| `getTestVp` | (`credential?`: `VC`) => `Promise`<`UnsignedVP`\> |
| `issueCredential` | (`credential`: `UnsignedVC`, `signingOptions?`: `Partial`<[`ProofOptions`](modules.md#proofoptions)\>) => `Promise`<`VC`\> |
| `issuePresentation` | (`credential`: `UnsignedVP`, `signingOptions?`: `Partial`<[`ProofOptions`](modules.md#proofoptions)\>) => `Promise`<`VP`\> |
| `verifyCredential` | (`credential`: `VC`, `options?`: `Partial`<[`ProofOptions`](modules.md#proofoptions)\>) => `Promise`<`VerificationCheck`\> |
| `verifyPresentation` | (`presentation`: `VP`, `options?`: `Partial`<[`ProofOptions`](modules.md#proofoptions)\>) => `Promise`<`VerificationCheck`\> |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/vc/types.ts:21](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/vc/types.ts#L21)

___

### VerifyExtension

Ƭ **VerifyExtension**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `verifyCredential` | (`credential`: `VC`) => `Promise`<`VerificationCheck`\> |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/vc/types.ts:46](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/vc/types.ts#L46)

## VPQR Plugin

### VpqrPluginDependentMethods

Ƭ **VpqrPluginDependentMethods**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `contextLoader` | (`url`: `string`) => `Promise`<`Record`<`string`, `any`\>\> |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/vpqr/types.ts:10](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/vpqr/types.ts#L10)

___

### VpqrPluginMethods

Ƭ **VpqrPluginMethods**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `vpFromQrCode` | (`text`: `string`) => `Promise`<`VP`\> |
| `vpToQrCode` | (`vp`: `VP`) => `Promise`<`string`\> |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/vpqr/types.ts:4](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/vpqr/types.ts#L4)

## Plugins

### ExpirationPlugin

▸ **ExpirationPlugin**(`wallet`): [`Plugin`](modules.md#plugin)<``"Expiration"``, [`VerifyExtension`](modules.md#verifyextension), `Record`<`never`, `never`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `wallet` | [`Wallet`](modules.md#wallet)<`any`, [`VerifyExtension`](modules.md#verifyextension)\> |

#### Returns

[`Plugin`](modules.md#plugin)<``"Expiration"``, [`VerifyExtension`](modules.md#verifyextension), `Record`<`never`, `never`\>\>

#### Defined in

[packages/learn-card-core/src/wallet/plugins/expiration/index.ts:7](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/expiration/index.ts#L7)

___

### getCHAPIPlugin

▸ **getCHAPIPlugin**(): `Promise`<[`Plugin`](modules.md#plugin)<``"CHAPI"``, [`CHAPIPluginMethods`](modules.md#chapipluginmethods), [`CHAPIPluginDependentMethods`](modules.md#chapiplugindependentmethods)\>\>

#### Returns

`Promise`<[`Plugin`](modules.md#plugin)<``"CHAPI"``, [`CHAPIPluginMethods`](modules.md#chapipluginmethods), [`CHAPIPluginDependentMethods`](modules.md#chapiplugindependentmethods)\>\>

#### Defined in

[packages/learn-card-core/src/wallet/plugins/chapi/chapi.ts:10](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/chapi/chapi.ts#L10)

___

### getDidKeyPlugin

▸ **getDidKeyPlugin**<`DidMethod`\>(`wallet`, `key`): `Promise`<[`Plugin`](modules.md#plugin)<``"DID Key"``, [`DidKeyPluginMethods`](modules.md#didkeypluginmethods)<`DidMethod`\>, `Record`<`never`, `never`\>\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `DidMethod` | extends `string` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `wallet` | [`Wallet`](modules.md#wallet)<`string`, [`DependentMethods`](modules.md#dependentmethods)<`DidMethod`\>\> |
| `key` | `string` |

#### Returns

`Promise`<[`Plugin`](modules.md#plugin)<``"DID Key"``, [`DidKeyPluginMethods`](modules.md#didkeypluginmethods)<`DidMethod`\>, `Record`<`never`, `never`\>\>\>

#### Defined in

[packages/learn-card-core/src/wallet/plugins/didkey/index.ts:16](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/didkey/index.ts#L16)

___

### getDidKitPlugin

▸ **getDidKitPlugin**(`input?`): `Promise`<[`Plugin`](modules.md#plugin)<``"DIDKit"``, [`DidkitPluginMethods`](modules.md#didkitpluginmethods), `Record`<`never`, `never`\>\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `input?` | `InitInput` \| `Promise`<`InitInput`\> |

#### Returns

`Promise`<[`Plugin`](modules.md#plugin)<``"DIDKit"``, [`DidkitPluginMethods`](modules.md#didkitpluginmethods), `Record`<`never`, `never`\>\>\>

#### Defined in

[packages/learn-card-core/src/wallet/plugins/didkit/index.ts:24](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/didkit/index.ts#L24)

___

### getEthereumPlugin

▸ **getEthereumPlugin**(`initWallet`, `config`): [`Plugin`](modules.md#plugin)<``"Ethereum"``, [`EthereumPluginMethods`](modules.md#ethereumpluginmethods), `Record`<`never`, `never`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `initWallet` | [`Wallet`](modules.md#wallet)<`string`, { `getSubjectDid`: (`type`: [`DidMethod`](modules.md#didmethod)) => `string` ; `getSubjectKeypair`: (`type?`: [`Algorithm`](modules.md#algorithm)) => { `crv`: `string` ; `d`: `string` ; `kty`: `string` ; `x`: `string` ; `y?`: `string`  }  }\> |
| `config` | [`EthereumConfig`](modules.md#ethereumconfig) |

#### Returns

[`Plugin`](modules.md#plugin)<``"Ethereum"``, [`EthereumPluginMethods`](modules.md#ethereumpluginmethods), `Record`<`never`, `never`\>\>

#### Defined in

[packages/learn-card-core/src/wallet/plugins/EthereumPlugin/index.ts:27](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/EthereumPlugin/index.ts#L27)

___

### getIDXPlugin

▸ **getIDXPlugin**(`wallet`, `__namedParameters`): `Promise`<[`Plugin`](modules.md#plugin)<``"IDX"``, [`IDXPluginMethods`](modules.md#idxpluginmethods), `Record`<`never`, `never`\>\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `wallet` | [`Wallet`](modules.md#wallet)<`any`, { `getKey`: () => `string`  }\> |
| `__namedParameters` | [`CeramicIDXArgs`](modules.md#ceramicidxargs) |

#### Returns

`Promise`<[`Plugin`](modules.md#plugin)<``"IDX"``, [`IDXPluginMethods`](modules.md#idxpluginmethods), `Record`<`never`, `never`\>\>\>

#### Defined in

[packages/learn-card-core/src/wallet/plugins/idx/idx.ts:46](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/idx/idx.ts#L46)

___

### getVCPlugin

▸ **getVCPlugin**(`wallet`): [`Plugin`](modules.md#plugin)<``"VC"``, [`VCPluginMethods`](modules.md#vcpluginmethods), [`VCPluginDependentMethods`](modules.md#vcplugindependentmethods)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `wallet` | [`Wallet`](modules.md#wallet)<`string`, [`VCPluginDependentMethods`](modules.md#vcplugindependentmethods)\> |

#### Returns

[`Plugin`](modules.md#plugin)<``"VC"``, [`VCPluginMethods`](modules.md#vcpluginmethods), [`VCPluginDependentMethods`](modules.md#vcplugindependentmethods)\>

#### Defined in

[packages/learn-card-core/src/wallet/plugins/vc/vc.ts:12](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/vc/vc.ts#L12)

___

### getVpqrPlugin

▸ **getVpqrPlugin**(`wallet`): [`Plugin`](modules.md#plugin)<``"Vpqr"``, [`VpqrPluginMethods`](modules.md#vpqrpluginmethods), `Record`<`never`, `never`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `wallet` | [`Wallet`](modules.md#wallet)<`string`, [`VpqrPluginDependentMethods`](modules.md#vpqrplugindependentmethods)\> |

#### Returns

[`Plugin`](modules.md#plugin)<``"Vpqr"``, [`VpqrPluginMethods`](modules.md#vpqrpluginmethods), `Record`<`never`, `never`\>\>

#### Defined in

[packages/learn-card-core/src/wallet/plugins/vpqr/index.ts:11](https://github.com/learningeconomy/LearnCard/blob/cea29cad/packages/learn-card-core/src/wallet/plugins/vpqr/index.ts#L11)
