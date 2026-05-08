# @learncard/app-store-demo-request-learner-context

## 1.0.3

### Patch Changes

-   Updated dependencies [[`da8b402d78db16c52dfc651275df31a22d634b02`](https://github.com/learningeconomy/LearnCard/commit/da8b402d78db16c52dfc651275df31a22d634b02), [`66979075bf3a39fe76435f31bdc582f7f25009c0`](https://github.com/learningeconomy/LearnCard/commit/66979075bf3a39fe76435f31bdc582f7f25009c0), [`60ab5bd6cf6fa508bf742bcd44c186c7ee3cd9c7`](https://github.com/learningeconomy/LearnCard/commit/60ab5bd6cf6fa508bf742bcd44c186c7ee3cd9c7), [`da8b402d78db16c52dfc651275df31a22d634b02`](https://github.com/learningeconomy/LearnCard/commit/da8b402d78db16c52dfc651275df31a22d634b02), [`60ab5bd6cf6fa508bf742bcd44c186c7ee3cd9c7`](https://github.com/learningeconomy/LearnCard/commit/60ab5bd6cf6fa508bf742bcd44c186c7ee3cd9c7)]:
    -   @learncard/partner-connect@0.3.0

## 1.0.2

### Patch Changes

-   [#1161](https://github.com/learningeconomy/LearnCard/pull/1161) [`70ced8498dae6384f0f82a619fa1a02b878c972f`](https://github.com/learningeconomy/LearnCard/commit/70ced8498dae6384f0f82a619fa1a02b878c972f) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add `sendAiSessionCredential` to Partner Connect SDK for recording AI tutoring sessions.

    This enables App Store embedded apps to send AI Session credentials that are automatically organized under AI Topics. The feature includes:

    -   **Partner Connect SDK**: New `sendAiSessionCredential()` method with structured summary data support
    -   **Backend Support**: App event handler for `send-ai-session-credential` with listing-owned boost creation
    -   **AI Topic Hierarchy**: Sessions are automatically organized under a parent AI Topic per app
    -   **Client-Side Storage**: Credentials are immediately stored in the user's LearnCloud wallet
    -   **Example App**: Updated with working AI Session creation flow

    Apps can now record structured learning sessions with key takeaways, skills demonstrated, learning outcomes, and recommended next steps that appear in the user's AI Topics page.

-   Updated dependencies [[`70ced8498dae6384f0f82a619fa1a02b878c972f`](https://github.com/learningeconomy/LearnCard/commit/70ced8498dae6384f0f82a619fa1a02b878c972f)]:
    -   @learncard/partner-connect@0.2.16

## 1.0.1

### Patch Changes

-   [#1149](https://github.com/learningeconomy/LearnCard/pull/1149) [`68f8cfec63fa16f654a451efa120faa95dd5f362`](https://github.com/learningeconomy/LearnCard/commit/68f8cfec63fa16f654a451efa120faa95dd5f362) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add `requestLearnerContext` support across Partner Connect, the LearnCard host, and the network stack so embedded App Store apps can request learner context for AI flows.

    This also allows `requestConsent()` to resolve the configured contract from the app listing's integration when a contract URI is not passed explicitly, and adds a request-learner-context demo app to exercise the full flow.

-   Updated dependencies [[`80943eba1b9451406f9e465e405fb7d785f5a43d`](https://github.com/learningeconomy/LearnCard/commit/80943eba1b9451406f9e465e405fb7d785f5a43d), [`68f8cfec63fa16f654a451efa120faa95dd5f362`](https://github.com/learningeconomy/LearnCard/commit/68f8cfec63fa16f654a451efa120faa95dd5f362)]:
    -   @learncard/partner-connect@0.2.15
