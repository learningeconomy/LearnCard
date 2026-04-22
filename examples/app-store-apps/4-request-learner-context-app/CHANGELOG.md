# @learncard/app-store-demo-request-learner-context

## 1.0.1

### Patch Changes

-   [#1149](https://github.com/learningeconomy/LearnCard/pull/1149) [`68f8cfec63fa16f654a451efa120faa95dd5f362`](https://github.com/learningeconomy/LearnCard/commit/68f8cfec63fa16f654a451efa120faa95dd5f362) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Add `requestLearnerContext` support across Partner Connect, the LearnCard host, and the network stack so embedded App Store apps can request learner context for AI flows.

    This also allows `requestConsent()` to resolve the configured contract from the app listing's integration when a contract URI is not passed explicitly, and adds a request-learner-context demo app to exercise the full flow.

-   Updated dependencies [[`80943eba1b9451406f9e465e405fb7d785f5a43d`](https://github.com/learningeconomy/LearnCard/commit/80943eba1b9451406f9e465e405fb7d785f5a43d), [`68f8cfec63fa16f654a451efa120faa95dd5f362`](https://github.com/learningeconomy/LearnCard/commit/68f8cfec63fa16f654a451efa120faa95dd5f362)]:
    -   @learncard/partner-connect@0.2.15
