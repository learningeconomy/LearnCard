# @learncard/ai-agent-service

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
