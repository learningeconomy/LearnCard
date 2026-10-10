# @learncard/ai-agent-service

## 0.0.7

### Patch Changes

- [#1649](https://github.com/learningeconomy/LearnCard/pull/1649) [`f08cf44e859c202f8e8b11329da58a2171fc6b0f`](https://github.com/learningeconomy/LearnCard/commit/f08cf44e859c202f8e8b11329da58a2171fc6b0f) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Resolve the AI Agent Docker smoke's DIDKit WASM beside the service bundle and disable runtime package auto-install to keep the bundled glue paired with the copied artifact.

- [#1629](https://github.com/learningeconomy/LearnCard/pull/1629) [`e81e098a6d923d77e2df4f3394d0141e7a5a7478`](https://github.com/learningeconomy/LearnCard/commit/e81e098a6d923d77e2df4f3394d0141e7a5a7478) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - Persist assistant feedback timestamps as ISO strings before DAG-JWE encryption and validate them when reading. Missing or corrupted legacy feedback times are represented as `null` in the API instead of breaking the entire assistant feed; the frontend contract now matches. No historical timestamp is fabricated and no data backfill is added.

    Emit unsampled privacy-safe run, model, tool, and post-run Sentry events independently of trace sampling. Preserve sanitized original error types, diagnostic messages, bounded causes, and stack frames with safe lifecycle, budget, usage, and outcome metadata. Hash external correlation/provider IDs and custom error-class log metadata; register raw provider content before parsing can fail; keep approved snapshots private from SDK processors and reject unapproved events.

    Forward every existing sanitized per-run application log record to Sentry as a bounded structured event alongside lifecycle/errors, even at trace sample rate zero. Retain contextual service/autonomy records and CloudWatch logfmt, without global console/stdout capture or added HTTP run-ID propagation. Index only approved bounded run metadata in log-event tags; retain all sanitized fields in the structured record. Register configured LaunchDarkly/Mongo credentials and decoded URI userinfo explicitly. Preserve conservative common-word masking when private fragments overlap external diagnostics. Document exact destinations and unsampled event volume: a basic completed run adds four log events to five lifecycle events, for both HTTP and direct invocation.

    Keep ordinary conversations' diagnostics beyond 256 distinct words while retaining bounded, fail-closed content registration. Hash custom error types and frame identifiers independently, replace model argument parse failures with a fixed preview-free error, and withhold oversized diagnostics before regex processing. Avoid duplicate scheduler captures for already-reported run/post-run failures while retaining scheduler-only and heartbeat failures. Restore workflow/runtime pin audits with only the final monorepo Bun 1.3.14 execution-stage exception.

    Sanitize malformed retrospective JSON at its parsing boundary with a fixed cause-free error. Prevent wallet wrappers from flattening arbitrary backend properties and raw stack previews into approved diagnostics while retaining sanitized cause/frame evidence. Register own string dictionary keys alongside values within the existing getter-free traversal and fail-closed character budgets; cover real agent recovery and final in-memory Sentry envelopes with synthetic regressions.

    Pin the AI Agent's local and CI Node runtime to 24.18.0, select Trigger's stable `node-24` runtime using SDK/build/CLI 4.5.7, and align repository CI and Docker dependency installation to Bun 1.4.2 so every lockfile consumer reads format version 3. Run the shared local services on Bun 1.3.14 separately to preserve localhost host-gateway DID resolution and notification delivery, with a real Cloud DID-fetch smoke in both E2E runners. Add offline real-WASM feed and actual-Sentry-SDK regression commands to CI and document the nullable feedback timestamp and telemetry privacy contracts.

- Updated dependencies [[`6209da80c52ac056a7644dab14669192740c9dad`](https://github.com/learningeconomy/LearnCard/commit/6209da80c52ac056a7644dab14669192740c9dad), [`5890451789b18afee45dc5ecbab3fa30aa90f085`](https://github.com/learningeconomy/LearnCard/commit/5890451789b18afee45dc5ecbab3fa30aa90f085), [`590adf48867d6c6fd504e66a11c9827d5102122d`](https://github.com/learningeconomy/LearnCard/commit/590adf48867d6c6fd504e66a11c9827d5102122d)]:
    - @learncard/network-brain-client@2.5.59
    - @learncard/didkit-plugin@1.10.3
    - @learncard/init@2.5.2
    - @learncard/didkit-plugin-node@0.3.3

## 0.0.6

### Patch Changes

- Updated dependencies []:
    - @learncard/init@2.5.1
    - @learncard/network-brain-client@2.5.58
    - @learncard/didkit-plugin@1.10.2
    - @learncard/didkit-plugin-node@0.3.2

## 0.0.5

### Patch Changes

- Updated dependencies [[`2991bd32b03e26736239dd8e586e2f720d9bcd45`](https://github.com/learningeconomy/LearnCard/commit/2991bd32b03e26736239dd8e586e2f720d9bcd45)]:
    - @learncard/init@2.5.0
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
