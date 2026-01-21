# @learncard/partner-connect

## 0.2.2

### Patch Changes

-   [#931](https://github.com/learningeconomy/LearnCard/pull/931) [`016b7edc231273aab962b89b4351a3e229fca025`](https://github.com/learningeconomy/LearnCard/commit/016b7edc231273aab962b89b4351a3e229fca025) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - ## App Store Credential Issuance

    Embedded apps in the LearnCard App Store can now issue credentials directly to users via the `sendAppEvent` postMessage API.

    ### Features

    -   **New `send-credential` app event**: Embedded apps can call `sendAppEvent({ type: 'send-credential', boostId, templateData })` to issue credentials from pre-configured boost templates
    -   **Credential Claim Modal**: When a credential is issued, users see a claim modal with a preview of the credential and can accept it into their wallet
    -   **Notification Integration**: Credentials create notifications that can be claimed later if dismissed, and are marked as completed when claimed
    -   **Auto Signing Authority Setup**: When adding a boost to an app listing, the backend automatically configures the signing authority using the developer's primary SA
    -   **Credentials Step in App Submission**: Developers can now add credential templates (boosts) to their app listings during the submission wizard

    ### API

    ```typescript
    // From an embedded app
    const result = await learnCard.sendAppEvent({
        type: 'send-credential',
        boostId: 'course-completion', // Boost ID configured in app listing
        templateData: {
            /* optional dynamic data */
        },
    });
    // Returns: { credentialUri, boostUri }
    ```

    ### Documentation

    Added new guide: "Connect an Embedded App" in How-To Guides > Connect Systems

## 0.2.1

### Patch Changes

-   [#847](https://github.com/learningeconomy/LearnCard/pull/847) [`69418464bb357d05e7d1cd76828222c7ed96745f`](https://github.com/learningeconomy/LearnCard/commit/69418464bb357d05e7d1cd76828222c7ed96745f) Thanks [@Custard7](https://github.com/Custard7)! - feat [LC-1451]: Add partner connect SDK and example app

-   [#847](https://github.com/learningeconomy/LearnCard/pull/847) [`69418464bb357d05e7d1cd76828222c7ed96745f`](https://github.com/learningeconomy/LearnCard/commit/69418464bb357d05e7d1cd76828222c7ed96745f) Thanks [@Custard7](https://github.com/Custard7)! - feat [LC-1451]: Add partner connect SDK and example app
