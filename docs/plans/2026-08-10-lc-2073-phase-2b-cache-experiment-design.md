# LC-2073 Phase 2B: Controlled E2E Cache Experiment

-   **Date:** 2026-08-10
-   **Status:** Approved for implementation planning
-   **Ticket:** [LC-2073](https://welibrary.atlassian.net/browse/LC-2073)
-   **Predecessor:** [LearnCard PR #1464](https://github.com/learningeconomy/LearnCard/pull/1464) and [runner PR #14](https://github.com/WeLibraryOS/learncard-e2e-runner/pull/14)

## Context

Phase 1 restored the Docker build and returned the suite to green. Phase 2A made the shared EC2 path observable, preserved failure artifacts, and serialized the LearnCard repository's E2E job. Its clean acceptance run completed in 20m45s with seven Firefox tests passing.

Phase 2A measured the dominant cold-run costs:

| Stage                       | Duration |
| --------------------------- | -------: |
| EC2 start and SSH readiness |      17s |
| Repository sync             |       4s |
| Docker shared-base build    |    3m07s |
| Docker Compose image build  |    7m18s |
| Compose start               |      42s |
| Host test dependencies      |    2m27s |
| Explicit readiness wait     |       0s |
| Playwright, seven tests     |    6m05s |
| Compose teardown            |      41s |
| Docker prune                |    1m21s |

The current runner deletes its host Nx state before each run and performs a full Docker system and builder prune afterward. It therefore cannot demonstrate a real warm-cache benefit. The existing whole-commit marker can also skip builds entirely, which would produce an optimistic number without proving native cache correctness.

## Goal

Determine whether correct, bounded reuse of native Docker BuildKit and host Nx caches can reduce the current seven-test suite to a stable warm wall-clock time of 12 minutes or less.

The 12-minute target applies to the current fixed suite. Future suite growth is tracked separately through Playwright duration and fixed non-Playwright overhead so additional coverage is not misclassified as a pipeline regression.

## Success Criteria

-   Two consecutive warm runs pass all seven existing Firefox tests.
-   The second warm run completes in 12 minutes or less.
-   Fixed non-Playwright overhead completes in 6 minutes or less. This is the workflow
    job wall-clock time minus the measured Playwright stage, including EC2 readiness,
    synchronization, builds, service startup, cleanup, diagnostics transfer, and shutdown.
-   Every run invokes the real Docker base, Docker Compose, and host Nx build commands.
-   A representative workspace-dependency change invalidates the correct work without stale output.
-   Free disk remains at or above 25 GB without emergency pruning during comparable warm runs.
-   Docker and Nx cache effects are reported separately and are auditable from retained logs.

## Non-Goals

-   Increasing Playwright workers in the cache experiment.
-   Changing the seven-test suite or rewriting assertions.
-   Changing the LearnCard release workflow before the experiment produces evidence.
-   Moving off EC2 during the cache experiment.
-   Treating a whole-build commit-marker skip as a cache hit.

## Considered Approaches

### 1. Controlled native-cache experiment — selected

Always execute the build commands and let Docker BuildKit and Nx decide which work is reusable. Compare one cold run, two warm runs, and an invalidation run. This is the only approach that attributes the speedup while testing correctness and disk growth.

### 2. Whole-build commit-marker skips

Skipping all Docker work when the commit matches would produce the fastest headline number, but it would not exercise cache keys or dependency invalidation. It is unsuitable as evidence and will not be used in the experiment.

### 3. Immediate migration to a managed runner

Changing compute, architecture, storage, and cache transport simultaneously would make the result difficult to attribute. Runner placement remains a recommendation informed by this experiment rather than an experiment variable.

## Experiment Boundary

Phase 2B is implemented on a branch of `WeLibraryOS/learncard-e2e-runner` and exercised through the runner repository's existing `runner_ref` workflow input. The production LearnCard workflow remains unchanged until the experiment passes its gates.

The runner workflow adds an explicit cache-mode input and passes it into the EC2 SSH
session. The experimental branch requires that input. If the experiment passes, the
final adoption patch assigns warm mode as the normal runner default while retaining
cold mode as an explicit escape hatch.

The manual sequence must run while the LearnCard release E2E workflow is idle. GitHub concurrency groups are repository-scoped and cannot prevent a LearnCard workflow run from overlapping a manual runner-repository workflow on the same EC2 instance.

The runner and LearnCard revisions are pinned and recorded for every comparable run.

## Cache Policy

The runner exposes two explicit modes:

### Cold mode

-   Stop and remove any prior Compose resources.
-   Remove host Nx cache state.
-   Run the existing full Docker system and builder prune before measurement.
-   Execute all build and test stages.
-   Retain the new native caches after the run so they seed warm run 1.

### Warm mode

-   Preserve the repository's `.nx-cache` across checkout synchronization and execution.
-   Preserve Docker images and BuildKit layers.
-   Always remove containers, Compose networks, and volumes between runs.
-   Execute all build and test stages, allowing only native cache keys to skip work.

The mode is validated before cache mutation. Unknown or missing values on the
experimental branch fail closed.

## Runner Components

Cache behavior belongs in one focused shell module rather than duplicated conditions in runner scripts.

### Cache-policy module

-   Validates `cold` and `warm` modes.
-   Prepares the selected cache state before measurement.
-   Captures disk and cache state before and after execution.
-   Applies the low-disk boundary and records why an emergency prune occurred.

### `sync-repo.sh`

-   Preserves `.nx-cache` only in warm mode.
-   Continues to remove unrelated ignored residue and reset to the requested revision.
-   Records the resolved revision after synchronization.

### `run-tests.sh`

-   Stops unconditionally deleting Nx cache state.
-   Removes the whole-commit build-skip path from experiment runs.
-   Always invokes the shared-base, Compose, and host Nx builds.
-   Captures separate plain-text logs for each cache-bearing build stage.

### `cleanup.sh`

-   Always removes containers, networks, and volumes.
-   Retains images and BuildKit layers in warm mode.
-   Retains newly generated images and BuildKit layers after a cold run so the next leg
    can measure them.
-   Performs full pruning only during cold preflight or when the disk guard requires
    recovery.
-   Preserves the original build or test exit status.

### Diagnostics

Each artifact bundle adds:

-   cache mode and comparable/non-comparable status;
-   exact runner and LearnCard revisions;
-   pre-run and post-run free disk;
-   `docker system df` and available BuildKit usage details;
-   `.nx-cache` size;
-   shared-base, Compose-build, and host-Nx build logs;
-   an explicit emergency-prune reason when disk pressure invalidates a warm result.

## Mutable Test-State Isolation

MongoDB, Neo4j, Redis, ElasticMQ, and application container state are not caches. Compose volumes are deleted after every run in both modes. A warm run may reuse build outputs and dependency caches, but it must never reuse test data.

## Disk Safety

The retained-cache boundary is 25 GB free on the root filesystem.

-   Capture cache and disk state before mutation and after the test run.
-   If a warm run crosses below 25 GB, capture its pre-prune state, perform the emergency full prune, and mark the result `cache-invalidated-by-disk-pressure`.
-   A result marked this way is not included as warm-run evidence.
-   The next comparison sequence must restart from a recorded cold run.

## Controlled Run Sequence

1. **Cold baseline:** clear native caches, then run the fixed suite.
2. **Warm run 1:** reuse caches from the cold baseline using identical revisions.
3. **Warm run 2:** repeat identical revisions to prove stability.
4. **Invalidation run:** use warm mode against a disposable LearnCard branch created from the pinned revision with a harmless source change in `@learncard/types`.

`@learncard/types` is used by the host-side build and multiple service images. The invalidation run must show the relevant Nx tasks and Docker layers re-executing and all seven tests passing. Any unaffected layers that remain cached are recorded; coarse invalidation caused by the current whole-repository Docker context is a performance finding rather than a correctness failure.

The disposable invalidation branch is not merged into LearnCard.

## Verification

### Local runner verification

-   Cache-mode validation and fail-closed behavior.
-   Cold and warm command selection using fake Docker and Nx commands.
-   Safe cache-path handling.
-   Disk-threshold and emergency-prune classification.
-   Comparable/non-comparable artifact rendering.
-   Original exit-status preservation when cleanup or artifact collection fails.
-   Bash syntax checks and workflow YAML parsing.

Local tests must never invoke a real Docker prune.

### Live EC2 verification

-   Run the four-leg sequence without overlapping any LearnCard release E2E run.
-   Confirm runner/LearnCard revisions in every artifact.
-   Confirm seven expected Playwright tests with zero unexpected, flaky, or skipped results.
-   Compare stage timings, fixed overhead, cache logs, and disk deltas.
-   Confirm invalidation behavior from the build logs rather than only from wall-clock time.

## Decision Rules

### All gates pass

Make retained caching the runner default, retain `cold` as an operational escape hatch, and perform one final acceptance run using the proposed default.

### Cache correctness passes but warm run 2 exceeds 12 minutes

Retain the validated cache policy and open an isolated Playwright-worker experiment. Do not mix worker-count results into the cache comparison.

### Invalidation is incorrect or disk growth is unsafe

Keep cold cleanup as the default. Recommend Docker layer-boundary or cache-architecture work before enabling retained caches.

## LC-2073 Deliverables

The final ticket update will include:

-   cold, warm 1, warm 2, and invalidation timing tables;
-   fixed overhead and Playwright duration reported separately;
-   disk and cache-size deltas;
-   a keep-EC2 or move-off-EC2 recommendation with reasoning;
-   a ranked effort-versus-impact list split into do-now and do-later work;
-   the agreed wall-clock target and its suite-growth interpretation;
-   links to the runner PR, live runs, and diagnostic artifacts;
-   one to three follow-up Jira tickets covering the selected production cache policy, Playwright concurrency if required, and runner-placement/trigger policy.

## Expected Follow-Up Boundaries

1. **Production cache policy:** enable the proven retained-cache default or improve Docker layer boundaries if invalidation/disk gates fail.
2. **Playwright scaling:** test worker safety only if caching does not meet the target or suite growth requires concurrency.
3. **Runner placement and trigger policy:** decide EC2 versus managed compute and release-only versus broader execution using the measured cost profile.
