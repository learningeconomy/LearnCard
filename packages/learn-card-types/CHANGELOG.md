# learn-card-types

## 5.2.7

### Patch Changes

-   No change, just forcible version bump

## 5.2.6

### Patch Changes

-   [#263](https://github.com/learningeconomy/LearnCard/pull/263) [`82289ba`](https://github.com/learningeconomy/LearnCard/commit/82289bacb997880ae25eaf833afe5c9e4ad68c37) Thanks [@Custard7](https://github.com/Custard7)! - ### Feat: Add Draft / Live state to Boosts

    This introduces a new `status` field on boosts, currently supporting:

    ```
    LIVE
    DRAFT
    ```

    `LIVE` status indicates the boost is published and can be sent to others. Live Boosts can not be updated or deleted.
    `DRAFT` status indicates the boost is in draft state. It can not be sent to others. Draft boosts can be updated and deleted.

    #### Major Changes:

    -   updateBoost (in the LCN plugin) now supports an additional `credential` field that allows you to pass through a new base credential template for the boost
    -   updateBoost allows you to pass a status field in, that can flip the status of a boost from DRAFT to LIVE.
    -   adds support for deleting draft boosts (and preventing deleting live boosts)
    -   adds support for updating draft boosts (and preventing updating live boosts)
    -   prevents sending draft boosts, or creating claim links for draft boosts

## 5.2.5

### Patch Changes

-   [#262](https://github.com/learningeconomy/LearnCard/pull/262) [`37133bf`](https://github.com/learningeconomy/LearnCard/commit/37133bf375a883c8086ba837c2155a609dea1912) Thanks [@Custard7](https://github.com/Custard7)! - Add Signing Authorities and Claim Links

    Adds the following plugin Methods to the LearnCard Network:

    -   registerSigningAuthority: (endpoint: string, name: string, did: string) => Promise<boolean>;
    -   getRegisteredSigningAuthorities: (endpoint: string, name: string, did: string) => Promise<LCNSigningAuthorityForUserType[]>;
    -   getRegisteredSigningAuthority: (endpoint: string, name: string) => Promise<LCNSigningAuthorityForUserType>;

    -   generateClaimLink: (boostUri: string, claimLinkSA: LCNBoostClaimLinkSigningAuthorityType, challenge?: string) => Promise<{ boostUri: string, challenge: string}>;
    -   claimBoostWithLink: (boostUri: string, challenge: string) => Promise<string>;

## 5.2.4

### Patch Changes

-   [#252](https://github.com/learningeconomy/LearnCard/pull/252) [`f6abbd4`](https://github.com/learningeconomy/LearnCard/commit/f6abbd490e02f65d56465ec5853aa31cfd2ae40c) Thanks [@Custard7](https://github.com/Custard7)! - Update to prepare for LCA Notifications Webhook

    Adds LCNNotification types for notification webhook payload
    Updates learn card core getDidAuthVp() to use learnCard.id.did() instead of 'key' did method.
    Removes previous notification microservice functions.
    Adds SendNotification for sending notifications to external webhook service

## 5.2.3

### Patch Changes

-   [#249](https://github.com/learningeconomy/LearnCard/pull/249) [`6a1a143`](https://github.com/learningeconomy/LearnCard/commit/6a1a1431a3bfdec261e1c9386a774cadbca6a5a1) Thanks [@goblincore](https://github.com/goblincore)! - Republish

## 5.2.2

### Patch Changes

-   [#231](https://github.com/learningeconomy/LearnCard/pull/231) [`e69af5a`](https://github.com/learningeconomy/LearnCard/commit/e69af5ab09b88d111ddf207f413552aa0bac991a) Thanks [@Custard7](https://github.com/Custard7)! - Feat: Add includeConnectionStatus option to searchProfiles, in brain-service and LCN Plugin

## 5.2.1

### Patch Changes

-   [#216](https://github.com/learningeconomy/LearnCard/pull/216) [`13d0393`](https://github.com/learningeconomy/LearnCard/commit/13d0393725d9d5e17b02de7a8088f46bda688d92) Thanks [@Custard7](https://github.com/Custard7)! - - Updates LCN Brain to wrap VCs in a `CertifiedBoost` VC when using `sendBoost`, and verifying that the VCs use the boostId, and verify that the sender is authorized to issue the boost + that the credential matches the boost credential.

    -   Updates LCN Plugin to append boostId to a boost VC when calling `sendBoost()`
    -   Adds `getBoostRecipients` function to LCN Brain + LCN Plugin so you can retrieve a list of boost recipients
    -   Adds new `boost` type to `learnCard.invoke.newCredential({ type: 'boost' })` to VC Templates Plugin
    -   Adds new VC Verification plugin, extending `learnCard.invoke.verifyCredential()` so it will verify a CertifiedBoost VC with a registry of trusted CertifiedBoost verifiers
    -   Add tests for LCN Plugin + VerifyBoost Plugin
    -   Add tests for `sendBoost` for LCN Brain
    -   Add tests for `getBoostRecipients` for LCN Brain

-   [#229](https://github.com/learningeconomy/LearnCard/pull/229) [`ed3c460`](https://github.com/learningeconomy/LearnCard/commit/ed3c460fadae88702c1244795ab3b7483d97bab7) Thanks [@Custard7](https://github.com/Custard7)! - - Updates LCN Brain to wrap VCs in a `CertifiedBoost` VC when using `sendBoost`, and verifying that the VCs use the boostId, and verify that the sender is authorized to issue the boost + that the credential matches the boost credential.
    -   Updates LCN Plugin to append boostId to a boost VC when calling `sendBoost()`
    -   Adds `getBoostRecipients` function to LCN Brain + LCN Plugin so you can retrieve a list of boost recipients
    -   Adds new `boost` type to `learnCard.invoke.newCredential({ type: 'boost' })` to VC Templates Plugin
    -   Adds new VC Verification plugin, extending `learnCard.invoke.verifyCredential()` so it will verify a CertifiedBoost VC with a registry of trusted CertifiedBoost verifiers
    -   Add tests for LCN Plugin + VerifyBoost Plugin
    -   Add tests for `sendBoost` for LCN Brain
    -   Add tests for `getBoostRecipients` for LCN Brain

## 5.2.0

### Minor Changes

-   [#213](https://github.com/learningeconomy/LearnCard/pull/213) [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add LCN Types

## 5.1.1

### Patch Changes

-   [#196](https://github.com/learningeconomy/LearnCard/pull/196) [`9aeb9f1`](https://github.com/learningeconomy/LearnCard/commit/9aeb9f1c175fd5ab7f2b94addaa9132bcc9cb4cf) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Allow embedded contexts

## 5.1.0

### Minor Changes

-   [#160](https://github.com/learningeconomy/LearnCard/pull/160) [`982bd41`](https://github.com/learningeconomy/LearnCard/commit/982bd4151d485ec6977c0bf774fe1cf243b8db74) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Make credential optional in VP type

## 5.0.1

### Patch Changes

-   [#162](https://github.com/learningeconomy/LearnCard/pull/162) [`8ba3a12`](https://github.com/learningeconomy/LearnCard/commit/8ba3a128602a1dee4ce1d3a73652cb6f96efc2d3) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Eject from aqu

## 5.0.0

### Major Changes

-   [#130](https://github.com/learningeconomy/LearnCard/pull/130) [`e7cfb63`](https://github.com/learningeconomy/LearnCard/commit/e7cfb636b21cfdd834e3b0cb028036819326a2f9) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Rename IDXCredential to CredentialRecord

## 4.0.1

### Patch Changes

-   [#115](https://github.com/learningeconomy/LearnCard/pull/115) [`efab28a`](https://github.com/learningeconomy/LearnCard/commit/efab28ae5c9487239537d220316f5a216d64fe58) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix VC schema throwing if issuer.type is not an array

## 4.0.0

### Major Changes

-   [#113](https://github.com/learningeconomy/LearnCard/pull/113) [`25349fe`](https://github.com/learningeconomy/LearnCard/commit/25349fe064c751a004092bcab24e1674fadfd5fe) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - BREAKING CHANGE: IDX Schema now uses ID and URI rather than streamID and Title

## 3.1.0

### Minor Changes

-   [#111](https://github.com/learningeconomy/LearnCard/pull/111) [`27e4ecd`](https://github.com/learningeconomy/LearnCard/commit/27e4ecd6641cf16b97d198434250f55135d09e97) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix incorrect IDXCredential type, making it also correctly generic

## 3.0.2

### Patch Changes

-   [#107](https://github.com/learningeconomy/LearnCard/pull/107) [`d3e542d`](https://github.com/learningeconomy/LearnCard/commit/d3e542d412eb20644b2d14efa3d728cecdf53adc) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Expose KnownAchievementType

## 3.0.1

### Patch Changes

-   [#100](https://github.com/learningeconomy/LearnCard/pull/100) [`f6734b2`](https://github.com/learningeconomy/LearnCard/commit/f6734b2dff7eade58dca5a03b8f46f058773c3b0) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add JWK type

## 3.0.0

### Major Changes

-   [#79](https://github.com/learningeconomy/LearnCard/pull/79) [`c1befdc`](https://github.com/learningeconomy/LearnCard/commit/c1befdc8a30d3cc111d938c530493b1a5b87aa00) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Fix types that don't follow spec

## 2.2.1

### Patch Changes

-   [#82](https://github.com/learningeconomy/LearnCard/pull/82) [`7d6f1a4`](https://github.com/learningeconomy/LearnCard/commit/7d6f1a41656329f99c4acf560da3ec59d9e29104) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Update ReadMe

## 2.2.0

### Minor Changes

-   [#40](https://github.com/learningeconomy/LearnCard/pull/40) [`8a10504`](https://github.com/learningeconomy/LearnCard/commit/8a105049df0d1f4f8ede062ca72fecbf55896562) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Move IDXCredential and StorageType types to @learncard/types

## 2.1.2

### Patch Changes

-   Move didkit into its own plugin

## 2.1.1

### Patch Changes

-   Fix botched release

## 2.1.0

### Minor Changes

-   Upgrade @learncard/types to use zod and implement types for VCs/OBv3

## 2.0.1

### Patch Changes

-   Update ReadMe

## 2.0.0

### Major Changes

-   Rename to @learncard/types

## 1.2.1

### Patch Changes

-   Add minimum time for verification loader animation

## 1.2.0

### Minor Changes

-   Update Update VCDisplayCard to accept a credential

## 1.1.0

### Minor Changes

-   0a650d4: Move VC types to learn-card-types

## 1.0.0

### Major Changes

-   Release Learn Card Types, add stuff to react-learn-card
