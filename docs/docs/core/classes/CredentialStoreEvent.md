---
id: "CredentialStoreEvent"
title: "Class: CredentialStoreEvent"
sidebar_label: "CredentialStoreEvent"
sidebar_position: 0
custom_edit_url: null
---

## Constructors

### constructor

• **new CredentialStoreEvent**(`args`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `Object` |
| `args.credential` | `WebCredential` |
| `args.credentialHandler` | `any` |
| `args.credentialRequestOrigin` | `string` |
| `args.hintKey` | `string` |

#### Defined in

[packages/learn-card-core/src/types/global.d.ts:73](https://github.com/learningeconomy/LearnCard/blob/30b85c7f/packages/learn-card-core/src/types/global.d.ts#L73)

## Properties

### \_credentialHandler

• **\_credentialHandler**: `any`

#### Defined in

[packages/learn-card-core/src/types/global.d.ts:82](https://github.com/learningeconomy/LearnCard/blob/30b85c7f/packages/learn-card-core/src/types/global.d.ts#L82)

___

### credential

• **credential**: `WebCredential`

#### Defined in

[packages/learn-card-core/src/types/global.d.ts:86](https://github.com/learningeconomy/LearnCard/blob/30b85c7f/packages/learn-card-core/src/types/global.d.ts#L86)

___

### credentialRequestOrigin

• **credentialRequestOrigin**: `string`

#### Defined in

[packages/learn-card-core/src/types/global.d.ts:84](https://github.com/learningeconomy/LearnCard/blob/30b85c7f/packages/learn-card-core/src/types/global.d.ts#L84)

___

### hintKey

• **hintKey**: `string`

#### Defined in

[packages/learn-card-core/src/types/global.d.ts:88](https://github.com/learningeconomy/LearnCard/blob/30b85c7f/packages/learn-card-core/src/types/global.d.ts#L88)

___

### openWindow

• **openWindow**: (`url`: `string`) => `Promise`<`any`\>

#### Type declaration

▸ (`url`): `Promise`<`any`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `url` | `string` |

##### Returns

`Promise`<`any`\>

#### Defined in

[packages/learn-card-core/src/types/global.d.ts:90](https://github.com/learningeconomy/LearnCard/blob/30b85c7f/packages/learn-card-core/src/types/global.d.ts#L90)

___

### respondWith

• **respondWith**: (`handlerResponse`: `Promise`<``null`` \| { `data`: `any` ; `dataType`: `string`  }\>) => `void`

#### Type declaration

▸ (`handlerResponse`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `handlerResponse` | `Promise`<``null`` \| { `data`: `any` ; `dataType`: `string`  }\> |

##### Returns

`void`

#### Defined in

[packages/learn-card-core/src/types/global.d.ts:92](https://github.com/learningeconomy/LearnCard/blob/30b85c7f/packages/learn-card-core/src/types/global.d.ts#L92)

___

### type

• **type**: `string`

#### Defined in

[packages/learn-card-core/src/types/global.d.ts:80](https://github.com/learningeconomy/LearnCard/blob/30b85c7f/packages/learn-card-core/src/types/global.d.ts#L80)
