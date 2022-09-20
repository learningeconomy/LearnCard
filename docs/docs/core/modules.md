---
id: "modules"
title: "@learncard/core"
sidebar_label: "Exports"
sidebar_position: 0.5
custom_edit_url: null
---

## LearnCard Methods

### AddCredential

Ƭ **AddCredential**: (`credential`: [`IDXCredential`](modules.md#idxcredential)) => `Promise`<`void`\>

#### Type declaration

▸ (`credential`): `Promise`<`void`\>

Adds a stream ID  pointing to a credential (such as the one returned by `publishCredential`)
to IDX with a bespoke title

The credential may then be retrieved using `getCredential` and passing in that bespoke title,
or by using `getCredentials` to get a list of all credentials that have been added to IDX

##### Parameters

| Name | Type |
| :------ | :------ |
| `credential` | [`IDXCredential`](modules.md#idxcredential) |

##### Returns

`Promise`<`void`\>

#### Defined in

[types/methods.ts:109](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/methods.ts#L109)

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

[types/methods.ts:208](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/methods.ts#L208)

___

### AllLearnCardMethods

Ƭ **AllLearnCardMethods**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
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
| `issueCredential` | [`IssueCredential`](modules.md#issuecredential) |
| `issuePresentation` | [`IssuePresentation`](modules.md#issuepresentation) |
| `keypair` | [`Keypair`](modules.md#keypair-1) |
| `publishCredential` | [`PublishCredential`](modules.md#publishcredential) |
| `readFromCeramic` | [`ReadFromCeramic`](modules.md#readfromceramic) |
| `removeCredential` | [`RemoveCredential`](modules.md#removecredential) |
| `transferTokens` | [`TransferTokens`](modules.md#transfertokens) |
| `verifyCredential` | [`VerifyCredential`](modules.md#verifycredential) |
| `verifyPresentation` | [`VerifyPresentation`](modules.md#verifypresentation) |
| `vpFromQrCode` | [`VpFromQrCode`](modules.md#vpfromqrcode) |
| `vpToQrCode` | [`VpToQrCode`](modules.md#vptoqrcode) |

#### Defined in

[types/methods.ts:227](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/methods.ts#L227)

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

[types/methods.ts:200](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/methods.ts#L200)

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

[types/methods.ts:22](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/methods.ts#L22)

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

[types/methods.ts:164](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/methods.ts#L164)

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

[types/methods.ts:172](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/methods.ts#L172)

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

[types/methods.ts:73](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/methods.ts#L73)

___

### GetCredentials

Ƭ **GetCredentials**: () => `Promise`<`VC`[]\>

#### Type declaration

▸ (): `Promise`<`VC`[]\>

Returns all credentials from IDX

##### Returns

`Promise`<`VC`[]\>

#### Defined in

[types/methods.ts:80](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/methods.ts#L80)

___

### GetCredentialsList

Ƭ **GetCredentialsList**: () => `Promise`<[`IDXCredential`](modules.md#idxcredential)[]\>

#### Type declaration

▸ (): `Promise`<[`IDXCredential`](modules.md#idxcredential)[]\>

Returns all credentials from IDX

##### Returns

`Promise`<[`IDXCredential`](modules.md#idxcredential)[]\>

#### Defined in

[types/methods.ts:87](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/methods.ts#L87)

___

### GetCurrentNetwork

Ƭ **GetCurrentNetwork**: () => `ethers.providers.Networkish`

#### Type declaration

▸ (): `ethers.providers.Networkish`

Get your current Ethereum network

##### Returns

`ethers.providers.Networkish`

#### Defined in

[types/methods.ts:193](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/methods.ts#L193)

___

### GetEthereumAddress

Ƭ **GetEthereumAddress**: () => `string`

#### Type declaration

▸ (): `string`

Returns Ethereum public address

##### Returns

`string`

#### Defined in

[types/methods.ts:156](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/methods.ts#L156)

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

[types/methods.ts:139](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/methods.ts#L139)

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

[types/methods.ts:149](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/methods.ts#L149)

___

### IssueCredential

Ƭ **IssueCredential**: (`credential`: `UnsignedVC`) => `Promise`<`VC`\>

#### Type declaration

▸ (`credential`): `Promise`<`VC`\>

Signs an unsigned Verifiable Credential, returning the signed VC

##### Parameters

| Name | Type |
| :------ | :------ |
| `credential` | `UnsignedVC` |

##### Returns

`Promise`<`VC`\>

#### Defined in

[types/methods.ts:42](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/methods.ts#L42)

___

### IssuePresentation

Ƭ **IssuePresentation**: (`presentation`: `UnsignedVP`) => `Promise`<`VP`\>

#### Type declaration

▸ (`presentation`): `Promise`<`VP`\>

Creates a signed Verifiable Presentation from a signed Verifiable Credential

##### Parameters

| Name | Type |
| :------ | :------ |
| `presentation` | `UnsignedVP` |

##### Returns

`Promise`<`VP`\>

#### Defined in

[types/methods.ts:58](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/methods.ts#L58)

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

[types/methods.ts:29](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/methods.ts#L29)

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

[types/methods.ts:98](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/methods.ts#L98)

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

[types/methods.ts:130](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/methods.ts#L130)

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

[types/methods.ts:120](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/methods.ts#L120)

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

[types/methods.ts:182](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/methods.ts#L182)

___

### VerifyCredential

Ƭ **VerifyCredential**: (`credential`: `VC`) => `Promise`<`VerificationItem`[]\>

#### Type declaration

▸ (`credential`): `Promise`<`VerificationItem`[]\>

Verifies a signed Verifiable Credential

Empty error/warnings arrays means verification was successful

##### Parameters

| Name | Type |
| :------ | :------ |
| `credential` | `VC` |

##### Returns

`Promise`<`VerificationItem`[]\>

#### Defined in

[types/methods.ts:51](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/methods.ts#L51)

___

### VerifyPresentation

Ƭ **VerifyPresentation**: (`presentation`: `VP`) => `Promise`<`VerificationCheck`\>

#### Type declaration

▸ (`presentation`): `Promise`<`VerificationCheck`\>

Verifies a signed Verifiable Presentation

Empry error/warnings arrays means verification was successful

##### Parameters

| Name | Type |
| :------ | :------ |
| `presentation` | `VP` |

##### Returns

`Promise`<`VerificationCheck`\>

#### Defined in

[types/methods.ts:66](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/methods.ts#L66)

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

[types/methods.ts:215](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/methods.ts#L215)

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

[types/methods.ts:222](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/methods.ts#L222)

## DidKey Plugin

### Algorithm

Ƭ **Algorithm**: ``"ed25519"`` \| ``"secp256k1"``

#### Defined in

[wallet/plugins/didkey/types.ts:4](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/didkey/types.ts#L4)

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
| `generateEd25519KeyFromBytes` | (`bytes`: `Uint8Array`) => [`KeyPair`](modules.md#keypair) |
| `generateSecp256k1KeyFromBytes` | (`bytes`: `Uint8Array`) => [`KeyPair`](modules.md#keypair) |
| `keyToDid` | (`type`: `T`, `keypair`: [`KeyPair`](modules.md#keypair)) => `string` |

#### Defined in

[wallet/plugins/didkey/types.ts:7](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/didkey/types.ts#L7)

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
| `getSubjectKeypair` | (`type?`: [`Algorithm`](modules.md#algorithm)) => { `crv`: `string` ; `d`: `string` ; `kty`: `string` ; `x`: `string` ; `y?`: `string`  } |

#### Defined in

[wallet/plugins/didkey/types.ts:30](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/didkey/types.ts#L30)

___

### JWK

Ƭ **JWK**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `@context` | `string`[] |
| `controller?` | `string` |
| `description` | `string` |
| `generatedFrom?` | [`string`] |
| `id` | `string` |
| `image` | `string` |
| `name` | `string` |
| `privateKeyJwk?` | `any` |
| `publicKeyJwk?` | `any` |
| `tags` | `string`[] |
| `type` | `string` \| `string`[] |
| `value?` | `string` |

#### Defined in

[wallet/plugins/didkey/types.ts:14](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/didkey/types.ts#L14)

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

[wallet/plugins/idx/types.ts:6](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/idx/types.ts#L6)

___

### CredentialsList

Ƭ **CredentialsList**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `credentials` | [`IDXCredential`](modules.md#idxcredential)[] |

#### Defined in

[wallet/plugins/idx/types.ts:35](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/idx/types.ts#L35)

___

### IDXCredential

Ƭ **IDXCredential**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `id` | `string` |
| `storageType?` | [`StorageType`](modules.md#storagetype) |
| `title` | `string` |

#### Defined in

[wallet/plugins/idx/types.ts:28](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/idx/types.ts#L28)

___

### IDXPluginMethods

Ƭ **IDXPluginMethods**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `addVerifiableCredentialInIdx` | (`cred`: [`IDXCredential`](modules.md#idxcredential)) => `Promise`<`StreamID`\> |
| `getCredentialsListFromIdx` | (`alias?`: `string`) => `Promise`<[`CredentialsList`](modules.md#credentialslist)\> |
| `getVerifiableCredentialFromIdx` | (`title`: `string`) => `Promise`<`VC`\> |
| `getVerifiableCredentialsFromIdx` | () => `Promise`<`VC`[]\> |
| `publishContentToCeramic` | (`cred`: `any`) => `Promise`<`string`\> |
| `readContentFromCeramic` | (`streamId`: `string`) => `Promise`<`any`\> |
| `removeVerifiableCredentialInIdx` | (`title`: `string`) => `Promise`<`StreamID`\> |

#### Defined in

[wallet/plugins/idx/types.ts:14](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/idx/types.ts#L14)

___

### StorageType

Ƭ **StorageType**: ``"ceramic"``

#### Defined in

[wallet/plugins/idx/types.ts:25](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/idx/types.ts#L25)

## DIDKit Plugin

### DidMethod

Ƭ **DidMethod**: ``"key"`` \| ``"tz"`` \| ``"ethr"`` \| \`pkh:${"tz" \| "tezos" \| "sol" \| "solana" \| "eth" \| "celo" \| "poly" \| "btc" \| "doge" \| "eip155" \| "bip122"}\` \| \`pkh:eip155:${string}\` \| \`pkh:bip122:${string}\`

#### Defined in

[wallet/plugins/didkit/types.ts:4](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/didkit/types.ts#L4)

___

### DidkitPluginMethods

Ƭ **DidkitPluginMethods**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `contextLoader` | (`url`: `string`) => `Promise`<`Record`<`string`, `any`\>\> |
| `generateEd25519KeyFromBytes` | (`bytes`: `Uint8Array`) => [`KeyPair`](modules.md#keypair) |
| `generateSecp256k1KeyFromBytes` | (`bytes`: `Uint8Array`) => [`KeyPair`](modules.md#keypair) |
| `issueCredential` | (`credential`: `UnsignedVC`, `options`: [`ProofOptions`](modules.md#proofoptions), `keypair`: [`KeyPair`](modules.md#keypair)) => `Promise`<`VC`\> |
| `issuePresentation` | (`presentation`: `UnsignedVP`, `options`: [`ProofOptions`](modules.md#proofoptions), `keypair`: [`KeyPair`](modules.md#keypair)) => `Promise`<`VP`\> |
| `keyToDid` | (`type`: [`DidMethod`](modules.md#didmethod), `keypair`: [`KeyPair`](modules.md#keypair)) => `string` |
| `keyToVerificationMethod` | (`type`: `string`, `keypair`: [`KeyPair`](modules.md#keypair)) => `Promise`<`string`\> |
| `verifyCredential` | (`credential`: `VC`) => `Promise`<`VerificationCheck`\> |
| `verifyPresentation` | (`presentation`: `VP`) => `Promise`<`VerificationCheck`\> |

#### Defined in

[wallet/plugins/didkit/types.ts:33](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/didkit/types.ts#L33)

___

### KeyPair

Ƭ **KeyPair**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `crv` | `string` |
| `d` | `string` |
| `kty` | `string` |
| `x` | `string` |
| `y?` | `string` |

#### Defined in

[wallet/plugins/didkit/types.ts:24](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/didkit/types.ts#L24)

___

### ProofOptions

Ƭ **ProofOptions**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `proofPurpose` | `string` |
| `verificationMethod` | `string` |

#### Defined in

[wallet/plugins/didkit/types.ts:27](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/didkit/types.ts#L27)

## LearnCard

### EmptyLearnCard

Ƭ **EmptyLearnCard**: [`LearnCard`](modules.md#learncard)<``"verifyCredential"`` \| ``"verifyPresentation"``, [`Wallet`](modules.md#wallet)<``"DIDKit"`` \| ``"Expiration"``, [`DidkitPluginMethods`](modules.md#didkitpluginmethods) & [`VerifyExtension`](modules.md#verifyextension)\>\>

#### Defined in

[types/LearnCard.ts:43](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/LearnCard.ts#L43)

___

### LearnCard

Ƭ **LearnCard**<`Methods`, `RawWallet`\>: { `_wallet`: `RawWallet`  } & `Pick`<[`AllLearnCardMethods`](modules.md#alllearncardmethods), `Methods`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Methods` | extends keyof [`AllLearnCardMethods`](modules.md#alllearncardmethods) = keyof [`AllLearnCardMethods`](modules.md#alllearncardmethods) |
| `RawWallet` | extends [`Wallet`](modules.md#wallet)<`any`, `any`\> = [`LearnCardRawWallet`](modules.md#learncardrawwallet) |

#### Defined in

[types/LearnCard.ts:32](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/LearnCard.ts#L32)

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

[types/LearnCard.ts:49](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/LearnCard.ts#L49)

## Init Functions

### EmptyWallet

Ƭ **EmptyWallet**: `InitFunction`<`undefined`, ``"didkit"``, [`EmptyLearnCard`](modules.md#emptylearncard)\>

#### Defined in

[types/LearnCard.ts:57](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/LearnCard.ts#L57)

___

### InitLearnCard

Ƭ **InitLearnCard**: `GenericInitFunction`<[[`EmptyWallet`](modules.md#emptywallet), [`WalletFromKey`](modules.md#walletfromkey)]\>

#### Defined in

[types/LearnCard.ts:62](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/LearnCard.ts#L62)

___

### WalletFromKey

Ƭ **WalletFromKey**: `InitFunction`<{ `seed`: `string`  }, keyof [`LearnCardConfig`](modules.md#learncardconfig), [`LearnCard`](modules.md#learncard)\>

#### Defined in

[types/LearnCard.ts:59](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/LearnCard.ts#L59)

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

[wallet/initializers/emptyWallet.ts:13](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/initializers/emptyWallet.ts#L13)

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

[wallet/init.ts:16](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/init.ts#L16)

▸ **initLearnCard**(`config`): `Promise`<[`WalletFromKey`](modules.md#walletfromkey)[``"returnValue"``]\>

Generates a full wallet from a 32 byte seed

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | { `seed`: `string`  } & `Partial`<`Pick`<[`LearnCardConfig`](modules.md#learncardconfig), keyof [`LearnCardConfig`](modules.md#learncardconfig)\>\> |

#### Returns

`Promise`<[`WalletFromKey`](modules.md#walletfromkey)[``"returnValue"``]\>

#### Defined in

[wallet/init.ts:23](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/init.ts#L23)

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

[wallet/initializers/walletFromKey.ts:19](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/initializers/walletFromKey.ts#L19)

## Ethereum Plugin

### EthereumConfig

Ƭ **EthereumConfig**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `infuraProjectId?` | `string` |
| `network?` | `providers.Networkish` |

#### Defined in

[wallet/plugins/EthereumPlugin/types.ts:19](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/EthereumPlugin/types.ts#L19)

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

[wallet/plugins/EthereumPlugin/types.ts:4](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/EthereumPlugin/types.ts#L4)

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

[wallet/plugins/EthereumPlugin/types.ts:25](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/EthereumPlugin/types.ts#L25)

___

### TokenList

Ƭ **TokenList**: [`Token`](modules.md#token)[]

#### Defined in

[wallet/plugins/EthereumPlugin/types.ts:36](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/EthereumPlugin/types.ts#L36)

## Universal Wallets

### LearnCardRawWallet

Ƭ **LearnCardRawWallet**: [`Wallet`](modules.md#wallet)<``"DIDKit"`` \| ``"DID Key"`` \| ``"VC"`` \| ``"IDX"`` \| ``"Expiration"`` \| ``"Ethereum"`` \| ``"Vpqr"``, [`DidKeyPluginMethods`](modules.md#didkeypluginmethods)<[`DidMethod`](modules.md#didmethod)\> & [`VCPluginMethods`](modules.md#vcpluginmethods) & [`IDXPluginMethods`](modules.md#idxpluginmethods) & [`EthereumPluginMethods`](modules.md#ethereumpluginmethods) & [`VpqrPluginMethods`](modules.md#vpqrpluginmethods)\>

#### Defined in

[types/LearnCard.ts:20](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/LearnCard.ts#L20)

___

### Plugin

Ƭ **Plugin**<`Name`, `PublicMethods`\>: `Object`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Name` | extends `string` |
| `PublicMethods` | extends `Record`<`string`, (...`args`: `any`[]) => `any`\> = `Record`<`never`, `never`\> |

#### Type declaration

| Name | Type |
| :------ | :------ |
| `name?` | `Name` |
| `pluginMethods` | { [Key in keyof PublicMethods]: Function } |

#### Defined in

[types/wallet.ts:2](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/wallet.ts#L2)

___

### Wallet

Ƭ **Wallet**<`PluginNames`, `PluginMethods`\>: `PublicFieldsObj`<`PluginMethods`\> & { `add`: (`content`: `any`) => `Promise`<[`Wallet`](modules.md#wallet)<`PluginNames`, `PluginMethods`\>\> ; `addPlugin`: <Name, Methods\>(`plugin`: [`Plugin`](modules.md#plugin)<`Name`, `Methods`\>) => `Promise`<[`Wallet`](modules.md#wallet)<``""`` extends `PluginNames` ? `Name` : `PluginNames` \| `Name`, `Record`<`never`, `never`\> extends `PluginMethods` ? `Methods` : `PluginMethods` & `Methods`\>\> ; `contents`: `any`[] ; `plugins`: [`Plugin`](modules.md#plugin)<`PluginNames`, `Record`<`string`, (...`args`: `any`[]) => `any`\>\>[] ; `remove`: (`contentId`: `string`) => `Promise`<[`Wallet`](modules.md#wallet)<`PluginNames`, `PluginMethods`\>\>  }

#### Type parameters

| Name | Type |
| :------ | :------ |
| `PluginNames` | extends `string` = ``""`` |
| `PluginMethods` | extends `Record`<`string`, (...`args`: `any`[]) => `any`\> = `Record`<`never`, `never`\> |

#### Defined in

[types/wallet.ts:23](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/types/wallet.ts#L23)

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

[wallet/base/wallet.ts:66](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/base/wallet.ts#L66)

## VC Plugin

### VCPluginDependentMethods

Ƭ **VCPluginDependentMethods**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `getSubjectDid` | (`type`: ``"key"``) => `string` |
| `getSubjectKeypair` | () => [`KeyPair`](modules.md#keypair) |
| `issueCredential` | (`credential`: `UnsignedVC`, `options`: [`ProofOptions`](modules.md#proofoptions), `keypair`: [`KeyPair`](modules.md#keypair)) => `Promise`<`VC`\> |
| `issuePresentation` | (`presentation`: `UnsignedVP`, `options`: [`ProofOptions`](modules.md#proofoptions), `keypair`: [`KeyPair`](modules.md#keypair)) => `Promise`<`VP`\> |
| `keyToVerificationMethod` | (`type`: `string`, `keypair`: [`KeyPair`](modules.md#keypair)) => `Promise`<`string`\> |
| `verifyCredential` | (`credential`: `VC`) => `Promise`<`VerificationCheck`\> |
| `verifyPresentation` | (`presentation`: `VP`) => `Promise`<`VerificationCheck`\> |

#### Defined in

[wallet/plugins/vc/types.ts:5](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/vc/types.ts#L5)

___

### VCPluginMethods

Ƭ **VCPluginMethods**: [`VCPluginDependentMethods`](modules.md#vcplugindependentmethods) & { `getTestVc`: (`subject?`: `string`) => `UnsignedVC` ; `getTestVp`: (`credential?`: `VC`) => `Promise`<`UnsignedVP`\> ; `issueCredential`: (`credential`: `UnsignedVC`) => `Promise`<`VC`\> ; `issuePresentation`: (`credential`: `UnsignedVP`) => `Promise`<`VP`\> ; `verifyCredential`: (`credential`: `VC`) => `Promise`<`VerificationCheck`\> ; `verifyPresentation`: (`presentation`: `VP`) => `Promise`<`VerificationCheck`\>  }

#### Defined in

[wallet/plugins/vc/types.ts:24](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/vc/types.ts#L24)

___

### VerifyExtension

Ƭ **VerifyExtension**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `verifyCredential` | (`credential`: `VC`) => `Promise`<`VerificationCheck`\> |

#### Defined in

[wallet/plugins/vc/types.ts:34](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/vc/types.ts#L34)

## VPQR Plugin

### VpqrPluginDependentMethods

Ƭ **VpqrPluginDependentMethods**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `contextLoader` | (`url`: `string`) => `Promise`<`Record`<`string`, `any`\>\> |

#### Defined in

[wallet/plugins/vpqr/types.ts:10](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/vpqr/types.ts#L10)

___

### VpqrPluginMethods

Ƭ **VpqrPluginMethods**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `vpFromQrCode` | (`text`: `string`) => `Promise`<`VP`\> |
| `vpToQrCode` | (`vp`: `VP`) => `Promise`<`string`\> |

#### Defined in

[wallet/plugins/vpqr/types.ts:4](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/vpqr/types.ts#L4)

## Plugins

### ExpirationPlugin

▸ **ExpirationPlugin**(`wallet`): [`Plugin`](modules.md#plugin)<``"Expiration"``, [`VerifyExtension`](modules.md#verifyextension)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `wallet` | [`Wallet`](modules.md#wallet)<`any`, [`VerifyExtension`](modules.md#verifyextension)\> |

#### Returns

[`Plugin`](modules.md#plugin)<``"Expiration"``, [`VerifyExtension`](modules.md#verifyextension)\>

#### Defined in

[wallet/plugins/expiration/index.ts:7](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/expiration/index.ts#L7)

___

### getDidKeyPlugin

▸ **getDidKeyPlugin**<`DidMethod`\>(`wallet`, `key`): `Promise`<[`Plugin`](modules.md#plugin)<``"DID Key"``, [`DidKeyPluginMethods`](modules.md#didkeypluginmethods)<`DidMethod`\>\>\>

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

`Promise`<[`Plugin`](modules.md#plugin)<``"DID Key"``, [`DidKeyPluginMethods`](modules.md#didkeypluginmethods)<`DidMethod`\>\>\>

#### Defined in

[wallet/plugins/didkey/index.ts:15](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/didkey/index.ts#L15)

___

### getDidKitPlugin

▸ **getDidKitPlugin**(`input?`): `Promise`<[`Plugin`](modules.md#plugin)<``"DIDKit"``, [`DidkitPluginMethods`](modules.md#didkitpluginmethods)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `input?` | `InitInput` \| `Promise`<`InitInput`\> |

#### Returns

`Promise`<[`Plugin`](modules.md#plugin)<``"DIDKit"``, [`DidkitPluginMethods`](modules.md#didkitpluginmethods)\>\>

#### Defined in

[wallet/plugins/didkit/index.ts:23](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/didkit/index.ts#L23)

___

### getEthereumPlugin

▸ **getEthereumPlugin**(`initWallet`, `config`): [`Plugin`](modules.md#plugin)<``"Ethereum"``, [`EthereumPluginMethods`](modules.md#ethereumpluginmethods)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `initWallet` | [`Wallet`](modules.md#wallet)<`string`, { `getSubjectDid`: (`type`: [`DidMethod`](modules.md#didmethod)) => `string` ; `getSubjectKeypair`: (`type?`: [`Algorithm`](modules.md#algorithm)) => [`KeyPair`](modules.md#keypair)  }\> |
| `config` | [`EthereumConfig`](modules.md#ethereumconfig) |

#### Returns

[`Plugin`](modules.md#plugin)<``"Ethereum"``, [`EthereumPluginMethods`](modules.md#ethereumpluginmethods)\>

#### Defined in

[wallet/plugins/EthereumPlugin/index.ts:23](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/EthereumPlugin/index.ts#L23)

___

### getIDXPlugin

▸ **getIDXPlugin**(`wallet`, `__namedParameters`): `Promise`<[`Plugin`](modules.md#plugin)<``"IDX"``, [`IDXPluginMethods`](modules.md#idxpluginmethods)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `wallet` | [`Wallet`](modules.md#wallet)<`any`, { `getKey`: () => `string`  }\> |
| `__namedParameters` | [`CeramicIDXArgs`](modules.md#ceramicidxargs) |

#### Returns

`Promise`<[`Plugin`](modules.md#plugin)<``"IDX"``, [`IDXPluginMethods`](modules.md#idxpluginmethods)\>\>

#### Defined in

[wallet/plugins/idx/idx.ts:40](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/idx/idx.ts#L40)

___

### getVCPlugin

▸ **getVCPlugin**(`wallet`): `Promise`<[`Plugin`](modules.md#plugin)<``"VC"``, [`VCPluginMethods`](modules.md#vcpluginmethods)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `wallet` | [`Wallet`](modules.md#wallet)<`string`, [`VCPluginDependentMethods`](modules.md#vcplugindependentmethods)\> |

#### Returns

`Promise`<[`Plugin`](modules.md#plugin)<``"VC"``, [`VCPluginMethods`](modules.md#vcpluginmethods)\>\>

#### Defined in

[wallet/plugins/vc/vc.ts:14](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/vc/vc.ts#L14)

___

### getVpqrPlugin

▸ **getVpqrPlugin**(`wallet`): [`Plugin`](modules.md#plugin)<``"Vpqr"``, [`VpqrPluginMethods`](modules.md#vpqrpluginmethods)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `wallet` | [`Wallet`](modules.md#wallet)<`string`, [`VpqrPluginDependentMethods`](modules.md#vpqrplugindependentmethods)\> |

#### Returns

[`Plugin`](modules.md#plugin)<``"Vpqr"``, [`VpqrPluginMethods`](modules.md#vpqrpluginmethods)\>

#### Defined in

[wallet/plugins/vpqr/index.ts:11](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/plugins/vpqr/index.ts#L11)

## Functions

### passwordToKey

▸ **passwordToKey**(`password`, `salt?`, `iterations?`, `digest?`): `Promise`<`Uint8Array`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `password` | `string` | `undefined` |
| `salt` | `string` | `'salt'` |
| `iterations` | `number` | `100000` |
| `digest` | `string` | `'SHA-256'` |

#### Returns

`Promise`<`Uint8Array`\>

#### Defined in

[wallet/base/functions/passwordToKey.ts:3](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/base/functions/passwordToKey.ts#L3)

___

### seedToId

▸ **seedToId**(`seed`): `Promise`<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `seed` | `Uint8Array` |

#### Returns

`Promise`<`string`\>

#### Defined in

[wallet/base/functions/seedToId.ts:3](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/learn-card-core/src/wallet/base/functions/seedToId.ts#L3)
