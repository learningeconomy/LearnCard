# LC-2098: `.nx-cache` Docker Context Retest

-   **Date:** 2026-08-11
-   **Status:** Approved for implementation planning
-   **Ticket:** [LC-2098](https://welibrary.atlassian.net/browse/LC-2098)
-   **Predecessor:** [LC-2073 Phase 2B results](./2026-08-10-lc-2073-phase-2b-cache-experiment-results.md)

## Context

The first LC-2073 cache experiment was correct and disk-safe, but warm execution was
slower than cold execution. Warm 2 took 22m22s, including 16m24s of fixed overhead.
The retained host Nx cache did not prevent the expensive Docker base or application
layers from rebuilding.

The root `.dockerignore` excludes `**/.nx`, while this repository writes its native Nx
cache to `.nx-cache`. The shared Docker base uses a whole-repository `COPY . .`, so the
retained and changing `.nx-cache` directory remains part of the Docker build context.
That boundary is a likely cause of the warm `COPY` and downstream dependency layers
missing their cache keys.

Two prerequisite changes are now merged:

-   [LearnCard PR #1453](https://github.com/learningeconomy/LearnCard/pull/1453)
    removed unused projects, changing the current-main build graph and absolute
    baseline.
-   [runner PR #15](https://github.com/WeLibraryOS/learncard-e2e-runner/pull/15)
    merged the controlled cache lifecycle and makes an omitted cache mode resolve to
    cold. [LearnCard PR #1475](https://github.com/learningeconomy/LearnCard/pull/1475)
    separately prevents release E2E jobs from inheriting an experimental runner branch.

The fetched starting revisions for this retest are LearnCard main
`6d5e80da7e9e4dfccebeae7ea9df2ed74a47e672` and runner main
`56466ae3de804ad746f636753b52d5e232d6a375`.

## Goal

Determine whether excluding the native host Nx cache from the Docker context allows
BuildKit to reuse the expensive base and application layers on two consecutive warm
runs against current LearnCard main.

This is an outcome retest on the smaller post-PR-1453 workspace. Absolute timing must
not be compared as though project removal were held constant. Cache-marker behavior
within the new cold/warm/warm sequence is the primary evidence for the `.nx-cache`
boundary; wall-clock change is the operational outcome.

## Selected Change

Merge current `origin/main` into the existing LC-2073 Phase 2B LearnCard branch, resolve
any conflicts without dropping either side, and add the root `.nx-cache` directory to
`.dockerignore`.

No Dockerfile layer reordering, package-manager change, Nx configuration change,
Playwright concurrency change, test-suite change, runner cache-policy change, or
workflow-trigger expansion is in scope. Keeping the patch to the context boundary makes
the cache evidence interpretable.

## Contract and Local Verification

Add a small automated contract that fails before the `.dockerignore` change and proves
that the repository-root `.nx-cache` directory and files beneath it are excluded from
the Docker context. The contract must also reject an accidental broad ignore that would
exclude the root lockfile or normal source files.

Run the focused contract first in red and green states, then run the existing workflow
contract, YAML parsing, formatting, and diff checks that cover the touched area. Local
verification must not invoke a real Docker prune or mutate the shared EC2 runner.

## Pinned Experiment Boundary

All three comparable legs use:

-   runner input `runner_ref=56466ae3de804ad746f636753b52d5e232d6a375`, not the
    movable `main` name;
-   the pushed `codex/lc-2073-phase-2b` LearnCard experiment branch, frozen with no
    additional pushes during the three-leg sequence; every artifact must resolve it to
    the same full experiment commit SHA;
-   the same seven Firefox E2E tests used by Phase 2B;
-   explicit cache modes (`cold`, then `warm`, then `warm`);
-   the same EC2 instance and runner workflow;
-   no overlapping release or manual E2E execution.

The runner and LearnCard SHAs recorded in each artifact must match exactly. A leg with
different revisions, an emergency prune, missing artifacts, or overlapping shared-runner
activity is non-comparable and restarts the sequence from cold.

## Run Sequence

1. **Cold:** clear native Docker/BuildKit and host Nx caches, execute every build and all
   seven tests, and retain the resulting caches.
2. **Warm 1:** reuse the cold caches with identical revisions and execute every real
   build command and all tests.
3. **Warm 2:** repeat warm mode with identical revisions to test stability rather than a
   one-off hit.

The run commands and GitHub run links are recorded before artifact interpretation. The
production default remains cold throughout the experiment.

## Evidence to Collect

For each leg, record:

-   GitHub job wall-clock and each measured stage;
-   Playwright duration and fixed overhead (`job wall - Playwright`);
-   seven expected tests, unexpected/flaky/skipped/error counts, and comparable status;
-   runner and LearnCard revisions;
-   base-build, Compose-build, and host-Nx logs;
-   explicit BuildKit `CACHED` markers for `COPY . .`, `bun install`, and the application
    Nx build, or the exact evidence that they reran;
-   pre/post free disk, Docker image size, BuildKit usage, and `.nx-cache` size;
-   emergency-prune or artifact-transfer status.

The result must distinguish direct observations from causal inference. In particular,
post-PR-1453 absolute time changes are not attributed solely to `.dockerignore`.

## Decision Gates

Correctness and safety gates remain unchanged from Phase 2B:

-   all three legs pass 7/7 with zero unexpected, flaky, skipped, or error results;
-   all artifact bundles are comparable and show identical revisions;
-   free disk remains at or above 25 GB without emergency pruning.

Performance targets also remain unchanged:

-   warm 2 job wall-clock is 12 minutes or less;
-   warm 2 fixed non-Playwright overhead is 6 minutes or less.

The context-boundary hypothesis is supported only if warm logs show the previously
missed Docker context/dependency work being reused. A faster wall-clock without those
markers is recorded as an improvement but not attributed to `.nx-cache` exclusion.

### Outcomes

-   **Cache hits and timing gates pass:** propose a separate production-policy change;
    do not silently switch the default in this retest.
-   **Cache hits improve but timing gates fail:** keep cold as default and rank the next
    remaining Docker/host bottleneck from the measured logs.
-   **Context/dependency layers still miss:** reject the `.nx-cache` hypothesis as the
    primary cause and investigate other Docker context inputs or layer boundaries.
-   **Correctness, comparability, or disk safety fails:** keep cold as default, preserve
    the failure artifacts, and do not use the run for performance conclusions.

## Deliverables

-   The minimal `.dockerignore` change and its focused contract.
-   A cold/warm/warm revision and timing matrix with linked GitHub runs.
-   A cache-marker and disk-growth comparison against the Phase 2B findings.
-   An updated LearnCard results record and a human-readable Obsidian note for later
    manual review.

The Obsidian update is written only after all three runs have been analyzed, and it is
appended to the existing LC-2073 experiment note rather than overwriting prior results.
