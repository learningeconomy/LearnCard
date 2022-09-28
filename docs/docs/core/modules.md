---
id: "modules"
title: "@learncard/core"
sidebar_label: "Exports"
sidebar_position: 0.5
custom_edit_url: null
---

## LearnCard Methods

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

[packages/learn-card-core/src/types/methods.ts:124](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L124)

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

[packages/learn-card-core/src/types/methods.ts:230](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L230)

___

### AllLearnCardMethods

Ƭ **AllLearnCardMethods**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `addCredential` | [`AddCredential`](../modules.md#addcredential-2) |
| `addInfuraProjectId` | [`AddInfuraProjectId`](../modules.md#addinfuraprojectid-2) |
| `changeNetwork` | [`ChangeNetwork`](../modules.md#changenetwork-2) |
| `did` | [`Did`](../modules.md#did-2) |
| `getBalance` | [`GetBalance`](../modules.md#getbalance-2) |
| `getBalanceForAddress` | [`GetBalanceForAddress`](../modules.md#getbalanceforaddress-2) |
| `getCredential` | [`GetCredential`](../modules.md#getcredential-2) |
| `getCredentials` | [`GetCredentials`](../modules.md#getcredentials-2) |
| `getCredentialsList` | [`GetCredentialsList`](../modules.md#getcredentialslist-2) |
| `getCurrentNetwork` | [`GetCurrentNetwork`](../modules.md#getcurrentnetwork-2) |
| `getEthereumAddress` | [`GetEthereumAddress`](../modules.md#getethereumaddress-2) |
| `getTestVc` | [`GetTestVc`](../modules.md#gettestvc-2) |
| `getTestVp` | [`GetTestVp`](../modules.md#gettestvp-2) |
| `issueCredential` | [`IssueCredential`](../modules.md#issuecredential-2) |
| `issuePresentation` | [`IssuePresentation`](../modules.md#issuepresentation-2) |
| `keypair` | [`Keypair`](../modules.md#keypair-5) |
| `newCredential` | [`NewCredential`](../modules.md#newcredential-2) |
| `newPresentation` | [`NewPresentation`](../modules.md#newpresentation-2) |
| `publishCredential` | [`PublishCredential`](../modules.md#publishcredential-2) |
| `readFromCeramic` | [`ReadFromCeramic`](../modules.md#readfromceramic-2) |
| `removeCredential` | [`RemoveCredential`](../modules.md#removecredential-2) |
| `resolveDid` | [`ResolveDid`](../modules.md#resolvedid-2) |
| `transferTokens` | [`TransferTokens`](../modules.md#transfertokens-2) |
| `verifyCredential` | [`VerifyCredential`](../modules.md#verifycredential-2) |
| `verifyPresentation` | [`VerifyPresentation`](../modules.md#verifypresentation-2) |
| `vpFromQrCode` | [`VpFromQrCode`](../modules.md#vpfromqrcode-2) |
| `vpToQrCode` | [`VpToQrCode`](../modules.md#vptoqrcode-2) |

#### Defined in

[packages/learn-card-core/src/types/methods.ts:249](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L249)

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

[packages/learn-card-core/src/types/methods.ts:222](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L222)

___

### Did

Ƭ **Did**: (`type?`: [`DidMethod`](../modules.md#didmethod-2)) => `string`

#### Type declaration

▸ (`type?`): `string`

Wallet holder's did

##### Parameters

| Name | Type |
| :------ | :------ |
| `type?` | [`DidMethod`](../modules.md#didmethod-2) |

##### Returns

`string`

#### Defined in

[packages/learn-card-core/src/types/methods.ts:23](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L23)

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

[packages/learn-card-core/src/types/methods.ts:186](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L186)

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

[packages/learn-card-core/src/types/methods.ts:194](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L194)

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

[packages/learn-card-core/src/types/methods.ts:88](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L88)

___

### GetCredentials

Ƭ **GetCredentials**: () => `Promise`<`VC`[]\>

#### Type declaration

▸ (): `Promise`<`VC`[]\>

Returns all credentials from IDX

##### Returns

`Promise`<`VC`[]\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:95](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L95)

___

### GetCredentialsList

Ƭ **GetCredentialsList**: () => `Promise`<`IDXCredential`[]\>

#### Type declaration

▸ (): `Promise`<`IDXCredential`[]\>

Returns all credentials from IDX

##### Returns

`Promise`<`IDXCredential`[]\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:102](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L102)

___

### GetCurrentNetwork

Ƭ **GetCurrentNetwork**: () => `ethers.providers.Networkish`

#### Type declaration

▸ (): `ethers.providers.Networkish`

Get your current Ethereum network

##### Returns

`ethers.providers.Networkish`

#### Defined in

[packages/learn-card-core/src/types/methods.ts:215](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L215)

___

### GetEthereumAddress

Ƭ **GetEthereumAddress**: () => `string`

#### Type declaration

▸ (): `string`

Returns Ethereum public address

##### Returns

`string`

#### Defined in

[packages/learn-card-core/src/types/methods.ts:178](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L178)

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

[packages/learn-card-core/src/types/methods.ts:161](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L161)

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

[packages/learn-card-core/src/types/methods.ts:171](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L171)

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

[packages/learn-card-core/src/types/methods.ts:57](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L57)

___

### IssuePresentation

Ƭ **IssuePresentation**: (`presentation`: `UnsignedVP`) => `Promise`<`VP`\>

#### Type declaration

▸ (`presentation`): `Promise`<`VP`\>

Signs an unsigned Verifiable Presentation, returning the signed VP

##### Parameters

| Name | Type |
| :------ | :------ |
| `presentation` | `UnsignedVP` |

##### Returns

`Promise`<`VP`\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:73](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L73)

___

### Keypair

Ƭ **Keypair**: (`type?`: [`Algorithm`](../modules.md#algorithm-2)) => { `crv`: `string` ; `d`: `string` ; `kty`: `string` ; `x`: `string` ; `y?`: `string`  }

#### Type declaration

▸ (`type?`): `Object`

Wallet holder's ed25519 key pair

##### Parameters

| Name | Type |
| :------ | :------ |
| `type?` | [`Algorithm`](../modules.md#algorithm-2) |

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

[packages/learn-card-core/src/types/methods.ts:30](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L30)

___

### NewCredential

Ƭ **NewCredential**: `NewCredentialFunction`

Generates a new Unsigned VC from a template

#### Defined in

[packages/learn-card-core/src/types/methods.ts:43](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L43)

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

[packages/learn-card-core/src/types/methods.ts:50](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L50)

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

[packages/learn-card-core/src/types/methods.ts:113](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L113)

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

[packages/learn-card-core/src/types/methods.ts:152](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L152)

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

[packages/learn-card-core/src/types/methods.ts:135](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L135)

___

### ResolveDid

Ƭ **ResolveDid**: (`did`: `string`) => `Promise`<`Record`<`string`, `any`\>\>

#### Type declaration

▸ (`did`): `Promise`<`Record`<`string`, `any`\>\>

Resolves a did to its did document

##### Parameters

| Name | Type |
| :------ | :------ |
| `did` | `string` |

##### Returns

`Promise`<`Record`<`string`, `any`\>\>

#### Defined in

[packages/learn-card-core/src/types/methods.ts:142](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L142)

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

[packages/learn-card-core/src/types/methods.ts:204](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L204)

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

[packages/learn-card-core/src/types/methods.ts:66](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L66)

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

[packages/learn-card-core/src/types/methods.ts:81](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L81)

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

[packages/learn-card-core/src/types/methods.ts:237](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L237)

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

[packages/learn-card-core/src/types/methods.ts:244](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/methods.ts#L244)

## DidKey Plugin

### Algorithm

Ƭ **Algorithm**: ``"ed25519"`` \| ``"secp256k1"``

#### Defined in

[packages/learn-card-core/src/wallet/plugins/didkey/types.ts:4](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/didkey/types.ts#L4)

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
| `generateEd25519KeyFromBytes` | (`bytes`: `Uint8Array`) => [`KeyPair`](../modules.md#keypair-4) |
| `generateSecp256k1KeyFromBytes` | (`bytes`: `Uint8Array`) => [`KeyPair`](../modules.md#keypair-4) |
| `keyToDid` | (`type`: `T`, `keypair`: [`KeyPair`](../modules.md#keypair-4)) => `string` |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/didkey/types.ts:7](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/didkey/types.ts#L7)

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
| `getSubjectKeypair` | (`type?`: [`Algorithm`](../modules.md#algorithm-2)) => { `crv`: `string` ; `d`: `string` ; `kty`: `string` ; `x`: `string` ; `y?`: `string`  } |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/didkey/types.ts:30](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/didkey/types.ts#L30)

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

[packages/learn-card-core/src/wallet/plugins/didkey/types.ts:14](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/didkey/types.ts#L14)

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

[packages/learn-card-core/src/wallet/plugins/idx/types.ts:7](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/idx/types.ts#L7)

___

### CredentialsList

Ƭ **CredentialsList**: `z.infer`<typeof [`CredentialsListValidator`](../modules.md#credentialslistvalidator-2)\>

#### Defined in

[packages/learn-card-core/src/wallet/plugins/idx/types.ts:30](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/idx/types.ts#L30)

___

### IDXPluginMethods

Ƭ **IDXPluginMethods**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `addVerifiableCredentialInIdx` | (`cred`: `IDXCredential`) => `Promise`<`StreamID`\> |
| `getCredentialsListFromIdx` | (`alias?`: `string`) => `Promise`<[`CredentialsList`](../modules.md#credentialslist-2)\> |
| `getVerifiableCredentialFromIdx` | (`title`: `string`) => `Promise`<`VC`\> |
| `getVerifiableCredentialsFromIdx` | () => `Promise`<`VC`[]\> |
| `publishContentToCeramic` | (`cred`: `any`) => `Promise`<`string`\> |
| `readContentFromCeramic` | (`streamId`: `string`) => `Promise`<`any`\> |
| `removeVerifiableCredentialInIdx` | (`title`: `string`) => `Promise`<`StreamID`\> |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/idx/types.ts:15](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/idx/types.ts#L15)

___

### CredentialsListValidator

• `Const` **CredentialsListValidator**: `ZodObject`<{ `credentials`: `ZodArray`<`ZodObject`<{ `id`: `ZodString` ; `storageType`: `ZodOptional`<`ZodEnum`<[``"ceramic"``]\>\> ; `title`: `ZodString`  }, ``"strip"``, `ZodTypeAny`, { `id`: `string` ; `storageType?`: ``"ceramic"`` ; `title`: `string`  }, { `id`: `string` ; `storageType?`: ``"ceramic"`` ; `title`: `string`  }\>, ``"many"``\>  }, ``"strict"``, `ZodTypeAny`, { `credentials`: { `id`: `string` ; `storageType?`: ``"ceramic"`` ; `title`: `string`  }[]  }, { `credentials`: { `id`: `string` ; `storageType?`: ``"ceramic"`` ; `title`: `string`  }[]  }\>

#### Defined in

[packages/learn-card-core/src/wallet/plugins/idx/types.ts:26](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/idx/types.ts#L26)

## DIDKit Plugin

### DidMethod

Ƭ **DidMethod**: ``"key"`` \| ``"tz"`` \| ``"ethr"`` \| \`pkh:${"tz" \| "tezos" \| "sol" \| "solana" \| "eth" \| "celo" \| "poly" \| "btc" \| "doge" \| "eip155" \| "bip122"}\` \| \`pkh:eip155:${string}\` \| \`pkh:bip122:${string}\`

#### Defined in

[packages/learn-card-core/src/wallet/plugins/didkit/types.ts:4](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/didkit/types.ts#L4)

___

### DidkitPluginMethods

Ƭ **DidkitPluginMethods**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `contextLoader` | (`url`: `string`) => `Promise`<`Record`<`string`, `any`\>\> |
| `generateEd25519KeyFromBytes` | (`bytes`: `Uint8Array`) => [`KeyPair`](../modules.md#keypair-4) |
| `generateSecp256k1KeyFromBytes` | (`bytes`: `Uint8Array`) => [`KeyPair`](../modules.md#keypair-4) |
| `issueCredential` | (`credential`: `UnsignedVC`, `options`: [`ProofOptions`](../modules.md#proofoptions-2), `keypair`: [`KeyPair`](../modules.md#keypair-4)) => `Promise`<`VC`\> |
| `issuePresentation` | (`presentation`: `UnsignedVP`, `options`: [`ProofOptions`](../modules.md#proofoptions-2), `keypair`: [`KeyPair`](../modules.md#keypair-4)) => `Promise`<`VP`\> |
| `keyToDid` | (`type`: [`DidMethod`](../modules.md#didmethod-2), `keypair`: [`KeyPair`](../modules.md#keypair-4)) => `string` |
| `keyToVerificationMethod` | (`type`: `string`, `keypair`: [`KeyPair`](../modules.md#keypair-4)) => `Promise`<`string`\> |
| `resolveDid` | (`did`: `string`) => `Promise`<`Record`<`string`, `any`\>\> |
| `verifyCredential` | (`credential`: `VC`) => `Promise`<`VerificationCheck`\> |
| `verifyPresentation` | (`presentation`: `VP`) => `Promise`<`VerificationCheck`\> |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/didkit/types.ts:33](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/didkit/types.ts#L33)

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

[packages/learn-card-core/src/wallet/plugins/didkit/types.ts:24](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/didkit/types.ts#L24)

___

### ProofOptions

Ƭ **ProofOptions**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `proofPurpose` | `string` |
| `verificationMethod` | `string` |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/didkit/types.ts:27](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/didkit/types.ts#L27)

## LearnCard

### EmptyLearnCard

Ƭ **EmptyLearnCard**: [`LearnCard`](../modules.md#learncard-2)<``"newCredential"`` \| ``"newPresentation"`` \| ``"verifyCredential"`` \| ``"verifyPresentation"`` \| ``"resolveDid"``, [`Wallet`](../modules.md#wallet-2)<``"DIDKit"`` \| ``"Expiration"`` \| ``"VC Templates"``, [`DidkitPluginMethods`](../modules.md#didkitpluginmethods-2) & [`VerifyExtension`](../modules.md#verifyextension-2) & `VCTemplatePluginMethods`\>\>

#### Defined in

[packages/learn-card-core/src/types/LearnCard.ts:45](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/LearnCard.ts#L45)

___

### LearnCard

Ƭ **LearnCard**<`Methods`, `RawWallet`\>: { `_wallet`: `RawWallet`  } & `Pick`<[`AllLearnCardMethods`](../modules.md#alllearncardmethods-2), `Methods`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Methods` | extends keyof [`AllLearnCardMethods`](../modules.md#alllearncardmethods-2) = keyof [`AllLearnCardMethods`](../modules.md#alllearncardmethods-2) |
| `RawWallet` | extends [`Wallet`](../modules.md#wallet-2)<`any`, `any`\> = [`LearnCardRawWallet`](../modules.md#learncardrawwallet-2) |

#### Defined in

[packages/learn-card-core/src/types/LearnCard.ts:34](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/LearnCard.ts#L34)

___

### LearnCardConfig

Ƭ **LearnCardConfig**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `ceramicIdx` | [`CeramicIDXArgs`](../modules.md#ceramicidxargs-2) |
| `defaultContents` | `any`[] |
| `didkit` | `InitInput` \| `Promise`<`InitInput`\> |
| `ethereumConfig` | [`EthereumConfig`](../modules.md#ethereumconfig-2) |

#### Defined in

[packages/learn-card-core/src/types/LearnCard.ts:54](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/LearnCard.ts#L54)

## Init Functions

### EmptyWallet

Ƭ **EmptyWallet**: `InitFunction`<`undefined`, ``"didkit"``, [`EmptyLearnCard`](../modules.md#emptylearncard-2)\>

#### Defined in

[packages/learn-card-core/src/types/LearnCard.ts:62](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/LearnCard.ts#L62)

___

### InitLearnCard

Ƭ **InitLearnCard**: `GenericInitFunction`<[[`EmptyWallet`](../modules.md#emptywallet-4), [`WalletFromKey`](../modules.md#walletfromkey-4)]\>

#### Defined in

[packages/learn-card-core/src/types/LearnCard.ts:67](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/LearnCard.ts#L67)

___

### WalletFromKey

Ƭ **WalletFromKey**: `InitFunction`<{ `seed`: `string`  }, keyof [`LearnCardConfig`](../modules.md#learncardconfig-2), [`LearnCard`](../modules.md#learncard-2)\>

#### Defined in

[packages/learn-card-core/src/types/LearnCard.ts:64](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/LearnCard.ts#L64)

___

### emptyWallet

▸ **emptyWallet**(`__namedParameters?`): `Promise`<[`EmptyLearnCard`](../modules.md#emptylearncard-2)\>

Generates an empty wallet with no key material

#### Parameters

| Name | Type |
| :------ | :------ |
| `__namedParameters` | `Partial`<`Pick`<[`LearnCardConfig`](../modules.md#learncardconfig-2), ``"didkit"``\>\> |

#### Returns

`Promise`<[`EmptyLearnCard`](../modules.md#emptylearncard-2)\>

#### Defined in

[packages/learn-card-core/src/wallet/initializers/emptyWallet.ts:14](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/initializers/emptyWallet.ts#L14)

___

### initLearnCard

▸ **initLearnCard**(`config?`): `Promise`<[`EmptyWallet`](../modules.md#emptywallet-4)[``"returnValue"``]\>

Generates an Empty Wallet

#### Parameters

| Name | Type |
| :------ | :------ |
| `config?` | `Partial`<`Pick`<[`LearnCardConfig`](../modules.md#learncardconfig-2), ``"didkit"``\>\> |

#### Returns

`Promise`<[`EmptyWallet`](../modules.md#emptywallet-4)[``"returnValue"``]\>

#### Defined in

[packages/learn-card-core/src/wallet/init.ts:16](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/init.ts#L16)

▸ **initLearnCard**(`config`): `Promise`<[`WalletFromKey`](../modules.md#walletfromkey-4)[``"returnValue"``]\>

Generates a full wallet from a 32 byte seed

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | { `seed`: `string`  } & `Partial`<`Pick`<[`LearnCardConfig`](../modules.md#learncardconfig-2), keyof [`LearnCardConfig`](../modules.md#learncardconfig-2)\>\> |

#### Returns

`Promise`<[`WalletFromKey`](../modules.md#walletfromkey-4)[``"returnValue"``]\>

#### Defined in

[packages/learn-card-core/src/wallet/init.ts:23](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/init.ts#L23)

___

### walletFromKey

▸ **walletFromKey**(`key`, `__namedParameters?`): `Promise`<[`LearnCard`](../modules.md#learncard-2)<keyof [`AllLearnCardMethods`](../modules.md#alllearncardmethods-2), [`LearnCardRawWallet`](../modules.md#learncardrawwallet-2)\>\>

Generates a LearnCard Wallet from a 64 character seed string

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `__namedParameters` | `Partial`<[`LearnCardConfig`](../modules.md#learncardconfig-2)\> |

#### Returns

`Promise`<[`LearnCard`](../modules.md#learncard-2)<keyof [`AllLearnCardMethods`](../modules.md#alllearncardmethods-2), [`LearnCardRawWallet`](../modules.md#learncardrawwallet-2)\>\>

#### Defined in

[packages/learn-card-core/src/wallet/initializers/walletFromKey.ts:20](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/initializers/walletFromKey.ts#L20)

## Ethereum Plugin

### EthereumConfig

Ƭ **EthereumConfig**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `infuraProjectId?` | `string` |
| `network?` | `providers.Networkish` |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/EthereumPlugin/types.ts:19](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/EthereumPlugin/types.ts#L19)

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

[packages/learn-card-core/src/wallet/plugins/EthereumPlugin/types.ts:4](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/EthereumPlugin/types.ts#L4)

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

[packages/learn-card-core/src/wallet/plugins/EthereumPlugin/types.ts:25](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/EthereumPlugin/types.ts#L25)

___

### TokenList

Ƭ **TokenList**: [`Token`](../modules.md#token-2)[]

#### Defined in

[packages/learn-card-core/src/wallet/plugins/EthereumPlugin/types.ts:36](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/EthereumPlugin/types.ts#L36)

## Universal Wallets

### LearnCardRawWallet

Ƭ **LearnCardRawWallet**: [`Wallet`](../modules.md#wallet-2)<``"DIDKit"`` \| ``"DID Key"`` \| ``"VC"`` \| ``"VC Templates"`` \| ``"IDX"`` \| ``"Expiration"`` \| ``"Ethereum"`` \| ``"Vpqr"``, [`DidKeyPluginMethods`](../modules.md#didkeypluginmethods-2)<[`DidMethod`](../modules.md#didmethod-2)\> & [`VCPluginMethods`](../modules.md#vcpluginmethods-2) & `VCTemplatePluginMethods` & [`IDXPluginMethods`](../modules.md#idxpluginmethods-2) & [`EthereumPluginMethods`](../modules.md#ethereumpluginmethods-2) & [`VpqrPluginMethods`](../modules.md#vpqrpluginmethods-2)\>

#### Defined in

[packages/learn-card-core/src/types/LearnCard.ts:21](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/LearnCard.ts#L21)

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

[packages/learn-card-core/src/types/wallet.ts:2](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/wallet.ts#L2)

___

### Wallet

Ƭ **Wallet**<`PluginNames`, `PluginMethods`\>: `PublicFieldsObj`<`PluginMethods`\> & { `add`: (`content`: `any`) => `Promise`<[`Wallet`](../modules.md#wallet-2)<`PluginNames`, `PluginMethods`\>\> ; `addPlugin`: <Name, Methods\>(`plugin`: [`Plugin`](../modules.md#plugin-2)<`Name`, `Methods`\>) => `Promise`<[`Wallet`](../modules.md#wallet-2)<``""`` extends `PluginNames` ? `Name` : `PluginNames` \| `Name`, `Record`<`never`, `never`\> extends `PluginMethods` ? `Methods` : `PluginMethods` & `Methods`\>\> ; `contents`: `any`[] ; `plugins`: [`Plugin`](../modules.md#plugin-2)<`PluginNames`, `Record`<`string`, (...`args`: `any`[]) => `any`\>\>[] ; `remove`: (`contentId`: `string`) => `Promise`<[`Wallet`](../modules.md#wallet-2)<`PluginNames`, `PluginMethods`\>\>  }

#### Type parameters

| Name | Type |
| :------ | :------ |
| `PluginNames` | extends `string` = ``""`` |
| `PluginMethods` | extends `Record`<`string`, (...`args`: `any`[]) => `any`\> = `Record`<`never`, `never`\> |

#### Defined in

[packages/learn-card-core/src/types/wallet.ts:23](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/types/wallet.ts#L23)

___

### generateWallet

▸ **generateWallet**<`PluginNames`, `PluginMethods`\>(`contents?`, `_wallet?`): `Promise`<[`Wallet`](../modules.md#wallet-2)<`PluginNames`, `PluginMethods`\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `PluginNames` | extends `string` |
| `PluginMethods` | extends `Record`<`string`, (...`args`: `any`[]) => `any`\> = `Record`<`never`, `never`\> |

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `contents` | `any`[] | `[]` |
| `_wallet` | `Partial`<[`Wallet`](../modules.md#wallet-2)<`any`, `PluginMethods`\>\> | `{}` |

#### Returns

`Promise`<[`Wallet`](../modules.md#wallet-2)<`PluginNames`, `PluginMethods`\>\>

#### Defined in

[packages/learn-card-core/src/wallet/base/wallet.ts:66](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/base/wallet.ts#L66)

## VC Plugin

### VCPluginDependentMethods

Ƭ **VCPluginDependentMethods**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `getSubjectDid` | (`type`: ``"key"``) => `string` |
| `getSubjectKeypair` | () => [`KeyPair`](../modules.md#keypair-4) |
| `issueCredential` | (`credential`: `UnsignedVC`, `options`: [`ProofOptions`](../modules.md#proofoptions-2), `keypair`: [`KeyPair`](../modules.md#keypair-4)) => `Promise`<`VC`\> |
| `issuePresentation` | (`presentation`: `UnsignedVP`, `options`: [`ProofOptions`](../modules.md#proofoptions-2), `keypair`: [`KeyPair`](../modules.md#keypair-4)) => `Promise`<`VP`\> |
| `keyToVerificationMethod` | (`type`: `string`, `keypair`: [`KeyPair`](../modules.md#keypair-4)) => `Promise`<`string`\> |
| `verifyCredential` | (`credential`: `VC`) => `Promise`<`VerificationCheck`\> |
| `verifyPresentation` | (`presentation`: `VP`) => `Promise`<`VerificationCheck`\> |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/vc/types.ts:5](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/vc/types.ts#L5)

___

### VCPluginMethods

Ƭ **VCPluginMethods**: [`VCPluginDependentMethods`](../modules.md#vcplugindependentmethods-2) & { `getTestVc`: (`subject?`: `string`) => `UnsignedVC` ; `getTestVp`: (`credential?`: `VC`) => `Promise`<`UnsignedVP`\> ; `issueCredential`: (`credential`: `UnsignedVC`) => `Promise`<`VC`\> ; `issuePresentation`: (`credential`: `UnsignedVP`) => `Promise`<`VP`\> ; `verifyCredential`: (`credential`: `VC`) => `Promise`<`VerificationCheck`\> ; `verifyPresentation`: (`presentation`: `VP`) => `Promise`<`VerificationCheck`\>  }

#### Defined in

[packages/learn-card-core/src/wallet/plugins/vc/types.ts:24](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/vc/types.ts#L24)

___

### VerifyExtension

Ƭ **VerifyExtension**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `verifyCredential` | (`credential`: `VC`) => `Promise`<`VerificationCheck`\> |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/vc/types.ts:34](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/vc/types.ts#L34)

## VPQR Plugin

### VpqrPluginDependentMethods

Ƭ **VpqrPluginDependentMethods**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `contextLoader` | (`url`: `string`) => `Promise`<`Record`<`string`, `any`\>\> |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/vpqr/types.ts:10](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/vpqr/types.ts#L10)

___

### VpqrPluginMethods

Ƭ **VpqrPluginMethods**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `vpFromQrCode` | (`text`: `string`) => `Promise`<`VP`\> |
| `vpToQrCode` | (`vp`: `VP`) => `Promise`<`string`\> |

#### Defined in

[packages/learn-card-core/src/wallet/plugins/vpqr/types.ts:4](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/vpqr/types.ts#L4)

## Plugins

### ExpirationPlugin

▸ **ExpirationPlugin**(`wallet`): [`Plugin`](../modules.md#plugin-2)<``"Expiration"``, [`VerifyExtension`](../modules.md#verifyextension-2)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `wallet` | [`Wallet`](../modules.md#wallet-2)<`any`, [`VerifyExtension`](../modules.md#verifyextension-2)\> |

#### Returns

[`Plugin`](../modules.md#plugin-2)<``"Expiration"``, [`VerifyExtension`](../modules.md#verifyextension-2)\>

#### Defined in

[packages/learn-card-core/src/wallet/plugins/expiration/index.ts:7](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/expiration/index.ts#L7)

___

### getDidKeyPlugin

▸ **getDidKeyPlugin**<`DidMethod`\>(`wallet`, `key`): `Promise`<[`Plugin`](../modules.md#plugin-2)<``"DID Key"``, [`DidKeyPluginMethods`](../modules.md#didkeypluginmethods-2)<`DidMethod`\>\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `DidMethod` | extends `string` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `wallet` | [`Wallet`](../modules.md#wallet-2)<`string`, [`DependentMethods`](../modules.md#dependentmethods-2)<`DidMethod`\>\> |
| `key` | `string` |

#### Returns

`Promise`<[`Plugin`](../modules.md#plugin-2)<``"DID Key"``, [`DidKeyPluginMethods`](../modules.md#didkeypluginmethods-2)<`DidMethod`\>\>\>

#### Defined in

[packages/learn-card-core/src/wallet/plugins/didkey/index.ts:15](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/didkey/index.ts#L15)

___

### getDidKitPlugin

▸ **getDidKitPlugin**(`input?`): `Promise`<[`Plugin`](../modules.md#plugin-2)<``"DIDKit"``, [`DidkitPluginMethods`](../modules.md#didkitpluginmethods-2)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `input?` | `InitInput` \| `Promise`<`InitInput`\> |

#### Returns

`Promise`<[`Plugin`](../modules.md#plugin-2)<``"DIDKit"``, [`DidkitPluginMethods`](../modules.md#didkitpluginmethods-2)\>\>

#### Defined in

[packages/learn-card-core/src/wallet/plugins/didkit/index.ts:24](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/didkit/index.ts#L24)

___

### getEthereumPlugin

▸ **getEthereumPlugin**(`initWallet`, `config`): [`Plugin`](../modules.md#plugin-2)<``"Ethereum"``, [`EthereumPluginMethods`](../modules.md#ethereumpluginmethods-2)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `initWallet` | [`Wallet`](../modules.md#wallet-2)<`string`, { `getSubjectDid`: (`type`: [`DidMethod`](../modules.md#didmethod-2)) => `string` ; `getSubjectKeypair`: (`type?`: [`Algorithm`](../modules.md#algorithm-2)) => [`KeyPair`](../modules.md#keypair-4)  }\> |
| `config` | [`EthereumConfig`](../modules.md#ethereumconfig-2) |

#### Returns

[`Plugin`](../modules.md#plugin-2)<``"Ethereum"``, [`EthereumPluginMethods`](../modules.md#ethereumpluginmethods-2)\>

#### Defined in

[packages/learn-card-core/src/wallet/plugins/EthereumPlugin/index.ts:23](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/EthereumPlugin/index.ts#L23)

___

### getIDXPlugin

▸ **getIDXPlugin**(`wallet`, `__namedParameters`): `Promise`<[`Plugin`](../modules.md#plugin-2)<``"IDX"``, [`IDXPluginMethods`](../modules.md#idxpluginmethods-2)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `wallet` | [`Wallet`](../modules.md#wallet-2)<`any`, { `getKey`: () => `string`  }\> |
| `__namedParameters` | [`CeramicIDXArgs`](../modules.md#ceramicidxargs-2) |

#### Returns

`Promise`<[`Plugin`](../modules.md#plugin-2)<``"IDX"``, [`IDXPluginMethods`](../modules.md#idxpluginmethods-2)\>\>

#### Defined in

[packages/learn-card-core/src/wallet/plugins/idx/idx.ts:46](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/idx/idx.ts#L46)

___

### getVCPlugin

▸ **getVCPlugin**(`wallet`): [`Plugin`](../modules.md#plugin-2)<``"VC"``, [`VCPluginMethods`](../modules.md#vcpluginmethods-2)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `wallet` | [`Wallet`](../modules.md#wallet-2)<`string`, [`VCPluginDependentMethods`](../modules.md#vcplugindependentmethods-2)\> |

#### Returns

[`Plugin`](../modules.md#plugin-2)<``"VC"``, [`VCPluginMethods`](../modules.md#vcpluginmethods-2)\>

#### Defined in

[packages/learn-card-core/src/wallet/plugins/vc/vc.ts:14](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/vc/vc.ts#L14)

___

### getVpqrPlugin

▸ **getVpqrPlugin**(`wallet`): [`Plugin`](../modules.md#plugin-2)<``"Vpqr"``, [`VpqrPluginMethods`](../modules.md#vpqrpluginmethods-2)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `wallet` | [`Wallet`](../modules.md#wallet-2)<`string`, [`VpqrPluginDependentMethods`](../modules.md#vpqrplugindependentmethods-2)\> |

#### Returns

[`Plugin`](../modules.md#plugin-2)<``"Vpqr"``, [`VpqrPluginMethods`](../modules.md#vpqrpluginmethods-2)\>

#### Defined in

[packages/learn-card-core/src/wallet/plugins/vpqr/index.ts:11](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/plugins/vpqr/index.ts#L11)

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

[packages/learn-card-core/src/wallet/base/functions/passwordToKey.ts:3](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/base/functions/passwordToKey.ts#L3)

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

[packages/learn-card-core/src/wallet/base/functions/seedToId.ts:3](https://github.com/learningeconomy/LearnCard/blob/2bb0c1e1/packages/learn-card-core/src/wallet/base/functions/seedToId.ts#L3)
