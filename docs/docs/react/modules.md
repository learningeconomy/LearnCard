---
id: "modules"
title: "@learncard/react"
sidebar_label: "Exports"
sidebar_position: 0.5
custom_edit_url: null
---

## Enumerations

- [CircleLoadingState](enums/CircleLoadingState.md)

## Type Aliases

### ButtonProps

Ƭ **ButtonProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `className?` | `string` |
| `onClick` | `MouseEventHandler`<`HTMLButtonElement`\> |
| `text?` | `string` |

#### Defined in

[packages/react-learn-card/src/components/Button/Button.tsx:3](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/react-learn-card/src/components/Button/Button.tsx#L3)

___

### CircleIconProps

Ƭ **CircleIconProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `bgColor?` | `string` |
| `borderColor?` | `string` |
| `count?` | `string` \| `number` |
| `hideCount?` | `boolean` |
| `iconSrc?` | `string` |
| `innerPadding?` | `string` |
| `onClick?` | () => `void` |
| `size?` | `string` |

#### Defined in

[packages/react-learn-card/src/components/CircleIcon/CircleIcon.tsx:6](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/react-learn-card/src/components/CircleIcon/CircleIcon.tsx#L6)

___

### CircleSpinnerProps

Ƭ **CircleSpinnerProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `color?` | `string` |
| `loadingState?` | [`CircleLoadingState`](enums/CircleLoadingState.md) |
| `marginOffset?` | `number` |
| `size?` | `number` |
| `thickness?` | `number` |

#### Defined in

[packages/react-learn-card/src/components/Loading/CircleSpinner.tsx:8](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/react-learn-card/src/components/Loading/CircleSpinner.tsx#L8)

___

### CountCircleProps

Ƭ **CountCircleProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `bgColor?` | `string` |
| `className?` | `string` |
| `count?` | `string` \| `number` |
| `innerPadding?` | `string` |
| `onClick?` | () => {} |
| `size?` | `string` |

#### Defined in

[packages/react-learn-card/src/components/CircleIcon/CircleIcon.tsx:17](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/react-learn-card/src/components/CircleIcon/CircleIcon.tsx#L17)

___

### FlippyCardProps

Ƭ **FlippyCardProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `children` | `React.ReactChild`[] |

#### Defined in

[packages/react-learn-card/src/components/FlippyCard/FlippyCard.tsx:3](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/react-learn-card/src/components/FlippyCard/FlippyCard.tsx#L3)

___

### LearnCardCreditCardBackFaceProps

Ƭ **LearnCardCreditCardBackFaceProps**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `card` | [`LearnCardCreditCardProps`](modules.md#learncardcreditcardprops) | - |
| `className?` | `string` | custom className |
| `user` | [`LearnCardCreditCardUserProps`](modules.md#learncardcreditcarduserprops) | - |

#### Defined in

[packages/react-learn-card/src/components/LearnCardCreditCardBackFace/types.ts:1](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/react-learn-card/src/components/LearnCardCreditCardBackFace/types.ts#L1)

___

### LearnCardCreditCardFrontFaceProps

Ƭ **LearnCardCreditCardFrontFaceProps**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `actionButtonText?` | `string` | action button text  **`Param`**  Card" - set as default text. |
| `className?` | `string` | custom className |
| `onClick?` | () => `void` | action button click handler |
| `qrCodeValue?` | `string` | qr code value |
| `showActionButton?` | `boolean` | show or hide an action button  **`Param`**  Action button hidden by default. |
| `userImage?` | `string` | user image |
| `userImageComponent?` | `React.ReactNode` | custom image component |

#### Defined in

[packages/react-learn-card/src/components/LearnCardCreditCardFrontFace/types.ts:1](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/react-learn-card/src/components/LearnCardCreditCardFrontFace/types.ts#L1)

___

### LearnCardCreditCardProps

Ƭ **LearnCardCreditCardProps**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `cardExpirationDate` | `string` | card expiration date |
| `cardIssueDate?` | `string` | card issue date |
| `cardNumber` | `string` | card number |
| `cardSecurityCode?` | `string` | card security code |

#### Defined in

[packages/react-learn-card/src/components/LearnCardCreditCardBackFace/types.ts:24](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/react-learn-card/src/components/LearnCardCreditCardBackFace/types.ts#L24)

___

### LearnCardCreditCardUserProps

Ƭ **LearnCardCreditCardUserProps**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `fullName` | `string` | user full name |
| `username?` | `string` | unique user handle / username |

#### Defined in

[packages/react-learn-card/src/components/LearnCardCreditCardBackFace/types.ts:11](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/react-learn-card/src/components/LearnCardCreditCardBackFace/types.ts#L11)

___

### MiniVCThumbnailProps

Ƭ **MiniVCThumbnailProps**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `badgeImage?` | `string` | badge image |
| `className?` | `string` | custom className |
| `createdAt?` | `string` | issue date |
| `issuerImage?` | `string` | issuer image |
| `onClick?` | () => `void` |  |
| `title?` | `string` | thumbnail title |

#### Defined in

[packages/react-learn-card/src/components/MiniVCThumbnail/types.ts:1](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/react-learn-card/src/components/MiniVCThumbnail/types.ts#L1)

___

### NotificationProps

Ƭ **NotificationProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `className?` | `string` |
| `issueDate` | `string` |
| `issuerImage?` | `string` |
| `notificationType` | `NotificationTypeEnum` |
| `onClick` | () => `void` |
| `title` | `string` |

#### Defined in

[packages/react-learn-card/src/components/Notification/types.ts:10](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/react-learn-card/src/components/Notification/types.ts#L10)

___

### QRCodeCardProps

Ƭ **QRCodeCardProps**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `className?` | `string` | custom className |
| `qrCodeValue` | `string` | qr code value |
| `text?` | `string` | text to display on the card |
| `userHandle?` | `string` | user handle |

#### Defined in

[packages/react-learn-card/src/components/QRCodeCard/types.ts:1](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/react-learn-card/src/components/QRCodeCard/types.ts#L1)

___

### RoundedSquareProps

Ƭ **RoundedSquareProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `bgColor?` | `string` |
| `count?` | `string` \| `number` |
| `description?` | `string` |
| `iconSrc?` | `string` |
| `imgSrc?` | `string` |
| `onClick?` | () => `void` |
| `title?` | `string` |
| `type?` | `string` |

#### Defined in

[packages/react-learn-card/src/components/RoundedSquare/RoundedSquare.tsx:9](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/react-learn-card/src/components/RoundedSquare/RoundedSquare.tsx#L9)

___

### SchoolIDCardProps

Ƭ **SchoolIDCardProps**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `backgroundImage` | `string` | fixed ID background |
| `className?` | `string` | custom className |
| `containerClassName?` | `string` | custom container className |
| `extraText?` | `string` | extra text to display on the ID card |
| `text?` | `React.ReactNode` \| `string` | text to display below the student name |
| `userImage` | `string` | student image |
| `userName` | `string` | student name |

#### Defined in

[packages/react-learn-card/src/components/SchoolIdCard/types.ts:1](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/react-learn-card/src/components/SchoolIdCard/types.ts#L1)

___

### VCCardProps

Ƭ **VCCardProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `className?` | `string` |
| `credential` | `VC` |
| `issueeOverride?` | `Profile` |

#### Defined in

[packages/react-learn-card/src/components/VCCard/VCCard.tsx:7](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/react-learn-card/src/components/VCCard/VCCard.tsx#L7)

___

### VCDisplayCardPropsReal

Ƭ **VCDisplayCardPropsReal**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `className?` | `string` |
| `credential` | `VC` \| `AchievementCredential` |
| `issueeOverride?` | `Profile` |
| `loading?` | `boolean` |
| `verification?` | `VerificationItem`[] |

#### Defined in

[packages/react-learn-card/src/components/VCDisplayCard/VCDisplayCard.tsx:10](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/react-learn-card/src/components/VCDisplayCard/VCDisplayCard.tsx#L10)

___

### VCThumbnailProps

Ƭ **VCThumbnailProps**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `badgeImage?` | `string` | badge image |
| `className?` | `string` | custom className |
| `createdAt?` | `string` | issue date |
| `issuerImage?` | `string` | issuer image |
| `listView?` | `boolean` | condensed or full view of the thumbnail  **`Param`**  shows full view by default. |
| `onClick?` | () => `void` |  |
| `title?` | `string` | thumbnail title |
| `userImage?` | `string` | user image |

#### Defined in

[packages/react-learn-card/src/components/VCThumbnail/types.ts:1](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/react-learn-card/src/components/VCThumbnail/types.ts#L1)

___

### VCVerificationCheckProps

Ƭ **VCVerificationCheckProps**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `loading?` | `boolean` |
| `size?` | `string` \| `number` |

#### Defined in

[packages/react-learn-card/src/components/VCVerificationCheck/VCVerificationCheck.tsx:5](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/react-learn-card/src/components/VCVerificationCheck/VCVerificationCheck.tsx#L5)

## Variables

### NotificationTypeStyles

• `Const` **NotificationTypeStyles**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `achievement` | { `IconComponent`: `FC`<{ `className?`: `string` ; `color?`: `string`  }\> = Trophy; `claimedButtonStyles`: `string` = 'text-spice-400 bg-spice-50 border-spice-50'; `iconCircleStyles`: `string` = 'bg-spice-400'; `textStyles`: `string` = 'text-spice-400 capitalize'; `unclaimedButtonStyles`: `string` = 'text-white bg-spice-400 border-spice-400'; `viewButtonStyles`: `string` = 'border-spice-400 text-spice-400' } |
| `achievement.IconComponent` | `FC`<{ `className?`: `string` ; `color?`: `string`  }\> |
| `achievement.claimedButtonStyles` | `string` |
| `achievement.iconCircleStyles` | `string` |
| `achievement.textStyles` | `string` |
| `achievement.unclaimedButtonStyles` | `string` |
| `achievement.viewButtonStyles` | `string` |
| `currency` | { `IconComponent`: `FC`<{ `className?`: `string`  }\> = Coins; `claimedButtonStyles`: `string` = 'text-cyan-600 bg-cyan-50 border-cyan-50'; `iconCircleStyles`: `string` = 'bg-cyan-600'; `textStyles`: `string` = 'text-cyan-600 capitalize'; `unclaimedButtonStyles`: `string` = 'text-white bg-cyan-600 border-cyan-600'; `viewButtonStyles`: `string` = 'border-cyan-600 text-cyan-600' } |
| `currency.IconComponent` | `FC`<{ `className?`: `string`  }\> |
| `currency.claimedButtonStyles` | `string` |
| `currency.iconCircleStyles` | `string` |
| `currency.textStyles` | `string` |
| `currency.unclaimedButtonStyles` | `string` |
| `currency.viewButtonStyles` | `string` |
| `id` | { `IconComponent`: `FC`<{ `className?`: `string`  }\> = User; `claimedButtonStyles`: `string` = 'text-yellow-400 bg-yellow-50 border-yellow-50'; `iconCircleStyles`: `string` = 'bg-yellow-400'; `textStyles`: `string` = 'text-yellow-400 uppercase'; `unclaimedButtonStyles`: `string` = 'text-white bg-yellow-400 border-yellow-400'; `viewButtonStyles`: `string` = 'border-yellow-400 text-yellow-400' } |
| `id.IconComponent` | `FC`<{ `className?`: `string`  }\> |
| `id.claimedButtonStyles` | `string` |
| `id.iconCircleStyles` | `string` |
| `id.textStyles` | `string` |
| `id.unclaimedButtonStyles` | `string` |
| `id.viewButtonStyles` | `string` |
| `job` | { `IconComponent`: `FC`<{ `className?`: `string`  }\> = Briefcase; `claimedButtonStyles`: `string` = 'text-emerald-400 bg-emerald-50 border-emerald-50'; `iconCircleStyles`: `string` = 'bg-emerald-400'; `textStyles`: `string` = 'text-emerald-400 capitalize'; `unclaimedButtonStyles`: `string` = 'text-white bg-emerald-400 border-emerald-400'; `viewButtonStyles`: `string` = 'border-emerald-400 text-emerald-400' } |
| `job.IconComponent` | `FC`<{ `className?`: `string`  }\> |
| `job.claimedButtonStyles` | `string` |
| `job.iconCircleStyles` | `string` |
| `job.textStyles` | `string` |
| `job.unclaimedButtonStyles` | `string` |
| `job.viewButtonStyles` | `string` |
| `learning` | { `IconComponent`: `FC`<{ `className?`: `string`  }\> = Graduation; `claimedButtonStyles`: `string` = 'text-rose-400 bg-rose-50 border-rose-50'; `iconCircleStyles`: `string` = 'bg-rose-400'; `textStyles`: `string` = 'text-rose-400 capitalize'; `unclaimedButtonStyles`: `string` = 'text-white bg-rose-400 border-rose-400'; `viewButtonStyles`: `string` = 'border-rose-400 text-rose-400' } |
| `learning.IconComponent` | `FC`<{ `className?`: `string`  }\> |
| `learning.claimedButtonStyles` | `string` |
| `learning.iconCircleStyles` | `string` |
| `learning.textStyles` | `string` |
| `learning.unclaimedButtonStyles` | `string` |
| `learning.viewButtonStyles` | `string` |
| `skill` | { `IconComponent`: `FC`<{ `className?`: `string`  }\> = Lightbulb; `claimedButtonStyles`: `string` = 'text-indigo-400 bg-indigo-50 border-indigo-50'; `iconCircleStyles`: `string` = 'bg-indigo-400'; `textStyles`: `string` = 'text-indigo-400 capitalize'; `unclaimedButtonStyles`: `string` = 'text-white bg-indigo-400 border-indigo-400'; `viewButtonStyles`: `string` = 'border-indigo-400 text-indigo-400' } |
| `skill.IconComponent` | `FC`<{ `className?`: `string`  }\> |
| `skill.claimedButtonStyles` | `string` |
| `skill.iconCircleStyles` | `string` |
| `skill.textStyles` | `string` |
| `skill.unclaimedButtonStyles` | `string` |
| `skill.viewButtonStyles` | `string` |

#### Defined in

[packages/react-learn-card/src/components/Notification/types.ts:19](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/react-learn-card/src/components/Notification/types.ts#L19)

___

### TYPE\_TO\_IMG\_SRC

• `Const` **TYPE\_TO\_IMG\_SRC**: `Object`

#### Defined in

[packages/react-learn-card/src/components/RoundedSquare/constants.ts:17](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/react-learn-card/src/components/RoundedSquare/constants.ts#L17)

___

### TYPE\_TO\_WALLET\_COLOR

• `Const` **TYPE\_TO\_WALLET\_COLOR**: `Object`

#### Defined in

[packages/react-learn-card/src/components/RoundedSquare/constants.ts:26](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/react-learn-card/src/components/RoundedSquare/constants.ts#L26)

___

### WALLET\_SUBTYPES

• `Const` **WALLET\_SUBTYPES**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `ACHIEVEMENTS` | `string` |
| `CURRENCIES` | `string` |
| `IDS` | `string` |
| `JOB_HISTORY` | `string` |
| `LEARNING_HISTORY` | `string` |
| `SKILLS` | `string` |

#### Defined in

[packages/react-learn-card/src/components/RoundedSquare/constants.ts:8](https://github.com/WeLibraryOS/LearnCard/blob/324cd7ea/packages/react-learn-card/src/components/RoundedSquare/constants.ts#L8)

## Functions

### Briefcase

▸ **Briefcase**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<{ `className?`: `string`  }\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### Button

▸ **Button**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<[`ButtonProps`](modules.md#buttonprops)\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### Checkmark

▸ **Checkmark**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<{ `className?`: `string`  }\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### CircleIcon

▸ **CircleIcon**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<[`CircleIconProps`](modules.md#circleiconprops)\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### Coins

▸ **Coins**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<{ `className?`: `string`  }\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### CountCircle

▸ **CountCircle**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<[`CountCircleProps`](modules.md#countcircleprops)\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### CourseCard

▸ **CourseCard**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<`CourseCardProps`\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### FlippyCard

▸ **FlippyCard**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<[`FlippyCardProps`](modules.md#flippycardprops)\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### Graduation

▸ **Graduation**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<{ `className?`: `string`  }\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### LearnCardCreditCardBackFace

▸ **LearnCardCreditCardBackFace**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<[`LearnCardCreditCardBackFaceProps`](modules.md#learncardcreditcardbackfaceprops)\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### LearnCardCreditCardFrontFace

▸ **LearnCardCreditCardFrontFace**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<[`LearnCardCreditCardFrontFaceProps`](modules.md#learncardcreditcardfrontfaceprops)\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### Lightbulb

▸ **Lightbulb**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<{ `className?`: `string`  }\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### MiniVCThumbnail

▸ **MiniVCThumbnail**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<[`MiniVCThumbnailProps`](modules.md#minivcthumbnailprops)\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### Notification

▸ **Notification**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<[`NotificationProps`](modules.md#notificationprops)\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### QRCodeCard

▸ **QRCodeCard**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<[`QRCodeCardProps`](modules.md#qrcodecardprops)\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### RoundedSquare

▸ **RoundedSquare**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<[`RoundedSquareProps`](modules.md#roundedsquareprops)\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### SchoolIDCard

▸ **SchoolIDCard**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<[`SchoolIDCardProps`](modules.md#schoolidcardprops)\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### SkillVerticalCard

▸ **SkillVerticalCard**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<`SkillVerticalCardProps`\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### SkillsCard

▸ **SkillsCard**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<`SkillsCardProps`\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### SkillsMeterSegment

▸ **SkillsMeterSegment**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<`SkillsMeterSegmentProps`\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### SkillsStatsCard

▸ **SkillsStatsCard**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<`SkillsStatsCardProps`\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### SmallAchievementCard

▸ **SmallAchievementCard**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<`SmallAchievementCardProps`\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### Trophy

▸ **Trophy**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<{ `className?`: `string` ; `color?`: `string`  }\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### User

▸ **User**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<{ `className?`: `string`  }\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### VCCard

▸ **VCCard**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<[`VCCardProps`](modules.md#vccardprops)\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### VCDisplayBackFace

▸ **VCDisplayBackFace**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<`VCDisplayCardProps`\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### VCDisplayCard

▸ **VCDisplayCard**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<[`VCDisplayCardPropsReal`](modules.md#vcdisplaycardpropsreal)\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### VCThumbnail

▸ **VCThumbnail**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<[`VCThumbnailProps`](modules.md#vcthumbnailprops)\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### VCVerificationCheck

▸ **VCVerificationCheck**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<[`VCVerificationCheckProps`](modules.md#vcverificationcheckprops)\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### VCVerificationCheckWithText

▸ **VCVerificationCheckWithText**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<[`VCVerificationCheckProps`](modules.md#vcverificationcheckprops)\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543

___

### ValidationStateIndicator

▸ **ValidationStateIndicator**(`props`, `context?`): ``null`` \| `ReactElement`<`any`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `PropsWithChildren`<`VerifiableStateIndicatorProps`\> |
| `context?` | `any` |

#### Returns

``null`` \| `ReactElement`<`any`, `any`\>

#### Defined in

node_modules/.pnpm/@types+react@17.0.47/node_modules/@types/react/index.d.ts:543
