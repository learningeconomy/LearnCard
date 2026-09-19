# @learncard/ai-agent-service

## 0.0.5

### Patch Changes

- Updated dependencies []:
    - @learncard/init@2.4.17
    - @learncard/network-brain-client@2.5.57
    - @learncard/didkit-plugin@1.10.1
    - @learncard/didkit-plugin-node@0.3.1

## 0.0.4

### Patch Changes

- [#1583](https://github.com/learningeconomy/LearnCard/pull/1583) [`3c3ae45d8f8bdb315d8f433f9040fdc72c9b491b`](https://github.com/learningeconomy/LearnCard/commit/3c3ae45d8f8bdb315d8f433f9040fdc72c9b491b) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Wait for the exact native DIDKit package and Linux binding to be published and loadable before deploying Trigger tasks, preventing production releases from racing the separate native-package publishing workflow. Keep workspace development exports scoped to bundling so the deployed Node worker loads compiled native-package JavaScript instead of raw TypeScript.

## 0.0.3

### Patch Changes

- [#1575](https://github.com/learningeconomy/LearnCard/pull/1575) [`d219ed437a8789d8148209113b97a820ab95a80e`](https://github.com/learningeconomy/LearnCard/commit/d219ed437a8789d8148209113b97a820ab95a80e) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Restore the compatible ohash dependency for the Trigger.dev deployment CLI and check CLI startup during PR and deployment validation, preventing dependency import failures from reaching the production deployment step.

- Updated dependencies [[`20b3844ddb7e649c9964308214ec4c395e9fc8db`](https://github.com/learningeconomy/LearnCard/commit/20b3844ddb7e649c9964308214ec4c395e9fc8db), [`19bb79b1355dd9de7f71554fdb608f38b78ed6bb`](https://github.com/learningeconomy/LearnCard/commit/19bb79b1355dd9de7f71554fdb608f38b78ed6bb)]:
    - @learncard/didkit-plugin@1.10.0
    - @learncard/didkit-plugin-node@0.3.0
    - @learncard/network-brain-client@2.5.56
    - @learncard/init@2.4.16

## 0.0.2

### Patch Changes

- [#1265](https://github.com/learningeconomy/LearnCard/pull/1265) [`693be4fef7b2850ab0f79b5161f78557d9026012`](https://github.com/learningeconomy/LearnCard/commit/693be4fef7b2850ab0f79b5161f78557d9026012) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Deploy the AI Agent through the main Deploy workflow: affected main commits deploy staging, and Changesets releases deploy production using the existing environment approval and LaunchDarkly rollout controls.

    Bind agent operations to verified request identity, expose only permitted wallet capabilities and anonymous public profile reads, recover assistant storage and schedules safely, and include retrospective work in run budgets. Fix assistant chat lifecycle, history limits, privacy gating, and local endpoint selection.

    Pre-bundle browser dependencies imported by workspace source before serving the app, preventing dependency-optimizer reloads from interrupting sign-in and mocked E2E navigation.

- Updated dependencies [[`693be4fef7b2850ab0f79b5161f78557d9026012`](https://github.com/learningeconomy/LearnCard/commit/693be4fef7b2850ab0f79b5161f78557d9026012)]:
    - @learncard/network-brain-client@2.5.55
    - @learncard/init@2.4.15
    - @learncard/didkit-plugin@1.9.14
    - @learncard/didkit-plugin-node@0.2.32
