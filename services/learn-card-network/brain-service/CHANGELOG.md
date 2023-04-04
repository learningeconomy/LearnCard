# @learncard/network-brain-service

## 1.4.0

### Minor Changes

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

### Patch Changes

-   Updated dependencies [[`82289ba`](https://github.com/learningeconomy/LearnCard/commit/82289bacb997880ae25eaf833afe5c9e4ad68c37)]:
    -   @learncard/types@5.2.6
    -   @learncard/core@8.5.4
    -   @learncard/did-web-plugin@1.0.1

## 1.3.3

### Patch Changes

-   [#259](https://github.com/learningeconomy/LearnCard/pull/259) [`8366a2c`](https://github.com/learningeconomy/LearnCard/commit/8366a2caeeda82febe373d4028f47970d94134f0) Thanks [@Custard7](https://github.com/Custard7)! - Fix: Boost Notification / Receive Presentation Notification

-   [#261](https://github.com/learningeconomy/LearnCard/pull/261) [`de46ebb`](https://github.com/learningeconomy/LearnCard/commit/de46ebb3d5f41677dacdce2bc50ea2fdd1450602) Thanks [@Custard7](https://github.com/Custard7)! - Fix: Increase memory size & timeouts and adds logs for LCN sendBoost()

-   [#262](https://github.com/learningeconomy/LearnCard/pull/262) [`37133bf`](https://github.com/learningeconomy/LearnCard/commit/37133bf375a883c8086ba837c2155a609dea1912) Thanks [@Custard7](https://github.com/Custard7)! - Add Signing Authorities and Claim Links

    Adds the following plugin Methods to the LearnCard Network:

    -   registerSigningAuthority: (endpoint: string, name: string, did: string) => Promise<boolean>;
    -   getRegisteredSigningAuthorities: (endpoint: string, name: string, did: string) => Promise<LCNSigningAuthorityForUserType[]>;
    -   getRegisteredSigningAuthority: (endpoint: string, name: string) => Promise<LCNSigningAuthorityForUserType>;

    -   generateClaimLink: (boostUri: string, claimLinkSA: LCNBoostClaimLinkSigningAuthorityType, challenge?: string) => Promise<{ boostUri: string, challenge: string}>;
    -   claimBoostWithLink: (boostUri: string, challenge: string) => Promise<string>;

-   Updated dependencies [[`37133bf`](https://github.com/learningeconomy/LearnCard/commit/37133bf375a883c8086ba837c2155a609dea1912)]:
    -   @learncard/types@5.2.5
    -   @learncard/core@8.5.4
    -   @learncard/did-web-plugin@1.0.1

## 1.3.2

### Patch Changes

-   [#257](https://github.com/learningeconomy/LearnCard/pull/257) [`d0d4a33`](https://github.com/learningeconomy/LearnCard/commit/d0d4a333c7a53a5fa2d14dafbb1c14c8d54c1cda) Thanks [@Custard7](https://github.com/Custard7)! - Fix: CORS for did routes

## 1.3.1

### Patch Changes

-   [#252](https://github.com/learningeconomy/LearnCard/pull/252) [`f6abbd4`](https://github.com/learningeconomy/LearnCard/commit/f6abbd490e02f65d56465ec5853aa31cfd2ae40c) Thanks [@Custard7](https://github.com/Custard7)! - Update to prepare for LCA Notifications Webhook

    Adds LCNNotification types for notification webhook payload
    Updates learn card core getDidAuthVp() to use learnCard.id.did() instead of 'key' did method.
    Removes previous notification microservice functions.
    Adds SendNotification for sending notifications to external webhook service

-   Updated dependencies [[`f6abbd4`](https://github.com/learningeconomy/LearnCard/commit/f6abbd490e02f65d56465ec5853aa31cfd2ae40c)]:
    -   @learncard/core@8.5.4
    -   @learncard/types@5.2.4
    -   @learncard/did-web-plugin@1.0.1

## 1.3.0

### Minor Changes

-   [#232](https://github.com/learningeconomy/LearnCard/pull/232) [`3606fec`](https://github.com/learningeconomy/LearnCard/commit/3606fec4c226828e51a3df6eb780e420935ebc94) Thanks [@wthomasmiii](https://github.com/wthomasmiii)! - Addition of push notification configs for hitting an http webhook

    ## What is being done

    On the backend learn-card-network we have done the following

    1. Added 2 new endpoints to the lambda service, one for registering, and one for unregistering
    2. Added both functions to the learncard Network plugin, hitting the tRPC client
    3. Triggerable push notifications are included with functions now, initalizing a class, then using its subfunctionality.

    ## Why this was done

    Was made to include hitting webhooks, that process notification sending.

## 1.2.2

### Patch Changes

-   [#249](https://github.com/learningeconomy/LearnCard/pull/249) [`6a1a143`](https://github.com/learningeconomy/LearnCard/commit/6a1a1431a3bfdec261e1c9386a774cadbca6a5a1) Thanks [@goblincore](https://github.com/goblincore)! - Republish

-   Updated dependencies [[`6a1a143`](https://github.com/learningeconomy/LearnCard/commit/6a1a1431a3bfdec261e1c9386a774cadbca6a5a1)]:
    -   @learncard/core@8.5.3
    -   @learncard/types@5.2.3

## 1.2.1

### Patch Changes

-   Updated dependencies [[`f1a8679`](https://github.com/learningeconomy/LearnCard/commit/f1a86796817fa20a0667a6b717b56d22038028c1)]:
    -   @learncard/core@8.5.2

## 1.2.0

### Minor Changes

-   [#231](https://github.com/learningeconomy/LearnCard/pull/231) [`e69af5a`](https://github.com/learningeconomy/LearnCard/commit/e69af5ab09b88d111ddf207f413552aa0bac991a) Thanks [@Custard7](https://github.com/Custard7)! - Feat: Add includeConnectionStatus option to searchProfiles, in brain-service and LCN Plugin

### Patch Changes

-   Updated dependencies [[`e69af5a`](https://github.com/learningeconomy/LearnCard/commit/e69af5ab09b88d111ddf207f413552aa0bac991a)]:
    -   @learncard/types@5.2.2
    -   @learncard/core@8.5.1

## 1.1.0

### Minor Changes

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

### Patch Changes

-   Updated dependencies [[`13d0393`](https://github.com/learningeconomy/LearnCard/commit/13d0393725d9d5e17b02de7a8088f46bda688d92), [`ed3c460`](https://github.com/learningeconomy/LearnCard/commit/ed3c460fadae88702c1244795ab3b7483d97bab7)]:
    -   @learncard/core@8.5.1
    -   @learncard/types@5.2.1

## 1.0.0

### Major Changes

-   [#213](https://github.com/learningeconomy/LearnCard/pull/213) [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Initial Release

### Patch Changes

-   Updated dependencies [[`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe), [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe), [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe), [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe), [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe), [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe), [`2508bba`](https://github.com/learningeconomy/LearnCard/commit/2508bba1950faed5ebe4c92f6a5e3bf82114b9fe)]:
    -   @learncard/core@8.5.0
    -   @learncard/types@5.2.0
