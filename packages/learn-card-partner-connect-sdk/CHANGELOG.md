# @learncard/partner-connect

## 0.2.16

### Patch Changes

-   [#1161](https://github.com/learningeconomy/LearnCard/pull/1161) [`70ced8498dae6384f0f82a619fa1a02b878c972f`](https://github.com/learningeconomy/LearnCard/commit/70ced8498dae6384f0f82a619fa1a02b878c972f) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add `sendAiSessionCredential` to Partner Connect SDK for recording AI tutoring sessions.

    This enables App Store embedded apps to send AI Session credentials that are automatically organized under AI Topics. The feature includes:

    -   **Partner Connect SDK**: New `sendAiSessionCredential()` method with structured summary data support
    -   **Backend Support**: App event handler for `send-ai-session-credential` with listing-owned boost creation
    -   **AI Topic Hierarchy**: Sessions are automatically organized under a parent AI Topic per app
    -   **Client-Side Storage**: Credentials are immediately stored in the user's LearnCloud wallet
    -   **Example App**: Updated with working AI Session creation flow

    Apps can now record structured learning sessions with key takeaways, skills demonstrated, learning outcomes, and recommended next steps that appear in the user's AI Topics page.

-   Updated dependencies [[`70ced8498dae6384f0f82a619fa1a02b878c972f`](https://github.com/learningeconomy/LearnCard/commit/70ced8498dae6384f0f82a619fa1a02b878c972f), [`8e408e48f89db234bcb7d357787a0faf3a605488`](https://github.com/learningeconomy/LearnCard/commit/8e408e48f89db234bcb7d357787a0faf3a605488)]:
    -   @learncard/types@5.13.6

## 0.2.15

### Patch Changes

-   [#1116](https://github.com/learningeconomy/LearnCard/pull/1116) [`80943eba1b9451406f9e465e405fb7d785f5a43d`](https://github.com/learningeconomy/LearnCard/commit/80943eba1b9451406f9e465e405fb7d785f5a43d) Thanks [@Custard7](https://github.com/Custard7)! - [LC-1742] feat: App-Scoped Counters + In-App Notifications

-   [#1149](https://github.com/learningeconomy/LearnCard/pull/1149) [`68f8cfec63fa16f654a451efa120faa95dd5f362`](https://github.com/learningeconomy/LearnCard/commit/68f8cfec63fa16f654a451efa120faa95dd5f362) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add `requestLearnerContext` support across Partner Connect, the LearnCard host, and the network stack so embedded App Store apps can request learner context for AI flows.

    This also allows `requestConsent()` to resolve the configured contract from the app listing's integration when a contract URI is not passed explicitly, and adds a request-learner-context demo app to exercise the full flow.

-   Updated dependencies [[`80943eba1b9451406f9e465e405fb7d785f5a43d`](https://github.com/learningeconomy/LearnCard/commit/80943eba1b9451406f9e465e405fb7d785f5a43d), [`4250d4814b6f38fc9ed9982a94bcfb830ea36edc`](https://github.com/learningeconomy/LearnCard/commit/4250d4814b6f38fc9ed9982a94bcfb830ea36edc), [`68f8cfec63fa16f654a451efa120faa95dd5f362`](https://github.com/learningeconomy/LearnCard/commit/68f8cfec63fa16f654a451efa120faa95dd5f362)]:
    -   @learncard/types@5.13.5

## 0.2.14

### Patch Changes

-   Updated dependencies [[`c68bed993c5304a667dc75d422a118858848737a`](https://github.com/learningeconomy/LearnCard/commit/c68bed993c5304a667dc75d422a118858848737a)]:
    -   @learncard/types@5.13.4

## 0.2.13

### Patch Changes

-   Updated dependencies [[`fb6627b7fa3c4a07c83d4186619a937e6a83f369`](https://github.com/learningeconomy/LearnCard/commit/fb6627b7fa3c4a07c83d4186619a937e6a83f369)]:
    -   @learncard/types@5.13.3

## 0.2.12

### Patch Changes

-   Updated dependencies [[`bba1f735e107d9cc86880e9f869413bc7072bff8`](https://github.com/learningeconomy/LearnCard/commit/bba1f735e107d9cc86880e9f869413bc7072bff8), [`fce9d2fd32898cfc64c59b88ca644dea3b53d1a5`](https://github.com/learningeconomy/LearnCard/commit/fce9d2fd32898cfc64c59b88ca644dea3b53d1a5)]:
    -   @learncard/types@5.13.2

## 0.2.11

### Patch Changes

-   [#1056](https://github.com/learningeconomy/LearnCard/pull/1056) [`c83e3de987c11a6d95deec31c1fdb2401a990db2`](https://github.com/learningeconomy/LearnCard/commit/c83e3de987c11a6d95deec31c1fdb2401a990db2) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - [LC-1632] [LC-1633] Add checkUserHasCredential app event and PartnerConnect SDK helper (with duplicate-claim prevention)

-   Updated dependencies [[`c83e3de987c11a6d95deec31c1fdb2401a990db2`](https://github.com/learningeconomy/LearnCard/commit/c83e3de987c11a6d95deec31c1fdb2401a990db2), [`fe4a1a265132271860460b8121e28ec0eacf4cb0`](https://github.com/learningeconomy/LearnCard/commit/fe4a1a265132271860460b8121e28ec0eacf4cb0)]:
    -   @learncard/types@5.13.1

## 0.2.10

### Patch Changes

-   Updated dependencies [[`34ced8d1c933ca7015dd1d3bd37b6b2ff847de3c`](https://github.com/learningeconomy/LearnCard/commit/34ced8d1c933ca7015dd1d3bd37b6b2ff847de3c)]:
    -   @learncard/types@5.13.0

## 0.2.9

### Patch Changes

-   [#1050](https://github.com/learningeconomy/LearnCard/pull/1050) [`53af27e4505eea081d60464a4e6b4fd9392ce897`](https://github.com/learningeconomy/LearnCard/commit/53af27e4505eea081d60464a4e6b4fd9392ce897) Thanks [@Custard7](https://github.com/Custard7)! - chore: Update @partner-connect docs

## 0.2.8

### Patch Changes

-   Updated dependencies [[`bf4f00306f64e701f3c9acee4c5f7438d3f3b6ee`](https://github.com/learningeconomy/LearnCard/commit/bf4f00306f64e701f3c9acee4c5f7438d3f3b6ee)]:
    -   @learncard/types@5.12.3

## 0.2.7

### Patch Changes

-   Updated dependencies [[`495f2939cb6e4271cab0a88abea5105fb7e4f9b6`](https://github.com/learningeconomy/LearnCard/commit/495f2939cb6e4271cab0a88abea5105fb7e4f9b6), [`08a1c8a07501c2f426d16239c4b0551e518a7ed5`](https://github.com/learningeconomy/LearnCard/commit/08a1c8a07501c2f426d16239c4b0551e518a7ed5)]:
    -   @learncard/types@5.12.2

## 0.2.6

### Patch Changes

-   Updated dependencies [[`caf231b53707174ea49f0eb2b65885a36b3e7228`](https://github.com/learningeconomy/LearnCard/commit/caf231b53707174ea49f0eb2b65885a36b3e7228)]:
    -   @learncard/types@5.12.1

## 0.2.5

### Patch Changes

-   Updated dependencies [[`32e5cfacf499e9a68700170298040f3d313b38da`](https://github.com/learningeconomy/LearnCard/commit/32e5cfacf499e9a68700170298040f3d313b38da)]:
    -   @learncard/types@5.12.0

## 0.2.4

### Patch Changes

-   Updated dependencies [[`d2bbcd71ac1af95da8328c6c0d9d7a84f69675b9`](https://github.com/learningeconomy/LearnCard/commit/d2bbcd71ac1af95da8328c6c0d9d7a84f69675b9)]:
    -   @learncard/types@5.11.4

## 0.2.3

### Patch Changes

-   [#949](https://github.com/learningeconomy/LearnCard/pull/949) [`f797ad95a9324dd56bc3d22e4e2b07caa0c53d94`](https://github.com/learningeconomy/LearnCard/commit/f797ad95a9324dd56bc3d22e4e2b07caa0c53d94) Thanks [@Custard7](https://github.com/Custard7)! - feat: Enhance Partner Connect

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
