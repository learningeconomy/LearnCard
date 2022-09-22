---
id: "CredentialRequestEvent"
title: "Class: CredentialRequestEvent"
sidebar_label: "CredentialRequestEvent"
sidebar_position: 0
custom_edit_url: null
---

## Constructors

### constructor

• **new CredentialRequestEvent**(`args`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `Object` |
| `args.credentialHandler` | `any` |
| `args.credentialRequestOptions` | `any` |
| `args.credentialRequestOrigin` | `string` |
| `args.hintKey` | `string` |

#### Defined in

[packages/learn-card-core/src/types/global.d.ts:50](https://github.com/learningeconomy/LearnCard/blob/30b85c7f/packages/learn-card-core/src/types/global.d.ts#L50)

## Properties

### \_credentialHandler

• **\_credentialHandler**: `any`

#### Defined in

[packages/learn-card-core/src/types/global.d.ts:59](https://github.com/learningeconomy/LearnCard/blob/30b85c7f/packages/learn-card-core/src/types/global.d.ts#L59)

___

### credentialRequestOptions

• **credentialRequestOptions**: `any`

#### Defined in

[packages/learn-card-core/src/types/global.d.ts:63](https://github.com/learningeconomy/LearnCard/blob/30b85c7f/packages/learn-card-core/src/types/global.d.ts#L63)

___

### credentialRequestOrigin

• **credentialRequestOrigin**: `string`

#### Defined in

[packages/learn-card-core/src/types/global.d.ts:61](https://github.com/learningeconomy/LearnCard/blob/30b85c7f/packages/learn-card-core/src/types/global.d.ts#L61)

___

### hintKey

• **hintKey**: `string`

#### Defined in

[packages/learn-card-core/src/types/global.d.ts:65](https://github.com/learningeconomy/LearnCard/blob/30b85c7f/packages/learn-card-core/src/types/global.d.ts#L65)

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

[packages/learn-card-core/src/types/global.d.ts:67](https://github.com/learningeconomy/LearnCard/blob/30b85c7f/packages/learn-card-core/src/types/global.d.ts#L67)

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

[packages/learn-card-core/src/types/global.d.ts:69](https://github.com/learningeconomy/LearnCard/blob/30b85c7f/packages/learn-card-core/src/types/global.d.ts#L69)

___

### type

• **type**: `string`

#### Defined in

[packages/learn-card-core/src/types/global.d.ts:57](https://github.com/learningeconomy/LearnCard/blob/30b85c7f/packages/learn-card-core/src/types/global.d.ts#L57)
