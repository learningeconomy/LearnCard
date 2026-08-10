# LC-2073 Phase 2B Cache Experiment Results

## Decision

Keep **cold** as the production E2E-cache default. Keep **warm** only as an explicit diagnostic mode; do not adopt retained caches as the default and do not broaden runner triggers yet.

The approved gate classifies the measured outcome as **PASS_SLOW**: correctness and the 25 GB disk boundary passed, while the timing targets failed. The plan's default action for PASS_SLOW was warm adoption. After final evidence review, the owner approved an explicit override to keep cold because retained caches produced no measured speedup and consumed about 5.35 GB per run.

Reasons:

1. Warm 2 missed both targets: 22m22s wall-clock (target <=12m) and 16m24s fixed overhead (target <=6m).
2. Retained Docker/Nx data did not avoid the expensive host/app work and added roughly 5.35 GB of Docker data per warm leg.
3. The experiment remained correct and disk-safe, but selective invalidation is not demonstrated.

## Run and Revision Matrix

| Leg              | Run                                                                                         | Mode                 | Runner revision | LearnCard revision | Tests | Comparable |
| ---------------- | ------------------------------------------------------------------------------------------- | -------------------- | --------------- | ------------------ | ----- | ---------- |
| Cold             | [31422576357](https://github.com/WeLibraryOS/learncard-e2e-runner/actions/runs/31422576357) | cold                 | `431c932`       | `5857dff`          | 7/7   | true       |
| Warm 1           | [31424291356](https://github.com/WeLibraryOS/learncard-e2e-runner/actions/runs/31424291356) | warm                 | `431c932`       | `5857dff`          | 7/7   | true       |
| Warm 2           | [31426153409](https://github.com/WeLibraryOS/learncard-e2e-runner/actions/runs/31426153409) | warm                 | `431c932`       | `5857dff`          | 7/7   | true       |
| Invalidation     | [31428407142](https://github.com/WeLibraryOS/learncard-e2e-runner/actions/runs/31428407142) | warm                 | `431c932`       | `070846293`        | 7/7   | true       |
| Final acceptance | [31432244856](https://github.com/WeLibraryOS/learncard-e2e-runner/actions/runs/31432244856) | cold (input omitted) | `680b87a`       | `5857dff`          | 7/7   | true       |

All measured artifacts report `reason=retained-within-disk-boundary`.

## Stage Timing Comparison

| Stage                  |   Cold | Warm 1 | Warm 2 | Invalidation | Final acceptance |
| ---------------------- | -----: | -----: | -----: | -----------: | ---------------: |
| cache_prepare          |     1s |     0s |     1s |           1s |             215s |
| docker_base_build      |   188s |   354s |   354s |         354s |             192s |
| docker_compose_build   |   370s |   358s |   364s |         360s |             369s |
| host_test_dependencies |   145s |   144s |   145s |         146s |             137s |
| Playwright             |   361s |   337s |   358s |         366s |             337s |
| Recorded-stage total   |  1162s |  1262s |  1290s |        1295s |            1344s |
| GitHub job wall clock  | 20m01s | 21m41s | 22m22s |       22m20s |           23m07s |

## Fixed Overhead and Suite-Growth Interpretation

Fixed overhead is job wall-clock minus measured Playwright time: cold 14m00s, warm 1 16m04s, warm 2 16m24s, invalidation 16m14s, and final acceptance 17m30s. Warm 2 fails both experiment targets. The formal outcome is **PASS_SLOW**; the cold production default is the explicit owner-approved override recorded above.

The real-backend suite itself stayed near six minutes (337–366s). The growth is predominantly fixed work—Docker builds, host dependency builds, EC2/SSH/artifact lifecycle—not Playwright. Do not expand trigger scope until this overhead and its cost are reduced.

## Docker BuildKit Findings

Warm builds retained some service layers: delete-service layers and brain/app `WORKDIR` layers were explicitly `CACHED`. However, base `COPY . .`, `bun install` (about 246–255s warm), and the app Docker Nx build (about 352–359s) reran. Docker images grew 7.332 GB -> 12.68 GB -> 18.03 GB on cold/warm1/warm2.

The invalidation artifact also shows `COPY . .`, a 254s `bun install`, and a roughly 356s app build. That is an observed coarse rebuild; it is a performance finding, not a correctness failure.

## Host Nx Cache Findings

The native Nx cache was retained at about 410 MiB: 419,928 KiB (cold/warm1), 419,916 KiB (warm2), and 424,436 KiB after invalidation. Yet host dependency builds remained 144–146s, and the logs contain no explicit cache-hit marker. The artifacts do not demonstrate a material host-Nx speedup.

## Invalidation Findings

The disposable `@learncard/types` export run re-executed `nx run types:build` in both host Nx and the app Docker build. It passed 7/7 and remained comparable with 34 GB free disk.

This does **not** prove selective invalidation: the baseline warm run had already rerun the same host/app work. Conversely, unaffected service layers stayed cached. A targeted cache-boundary test is needed before attributing the repeated full app/base work to the probe alone.

## Disk Growth and Safety

| Measure        |     Cold |   Warm 1 |   Warm 2 | Invalidation post-run | Final acceptance post-run |
| -------------- | -------: | -------: | -------: | --------------------: | ------------------------: |
| Free disk      |    53 GB |    47 GB |    40 GB |                 34 GB |                     53 GB |
| Docker images  | 7.332 GB | 12.68 GB | 18.03 GB |              23.38 GB |                  7.332 GB |
| BuildKit total | 8.862 GB | 14.21 GB | 19.56 GB |              24.91 GB |                  8.862 GB |

Every leg stayed above the 25 GB boundary, so each is comparable. The observed ~5.35 GB growth per warm/invalidation leg is nevertheless unsafe as a steady-state default; continued linear growth would exhaust the 15 GB margin in roughly three similar legs.

Final acceptance omitted `cache_mode` and resolved to cold. Its preflight removed 24.91 GB of retained BuildKit data, cleared the 424,436 KiB Nx cache, and restored free disk from 34 GB to 66 GB before rebuilding. That cleanup took 215 seconds; the run then passed 7/7, transferred artifacts successfully, and finished comparable with 53 GB free.

Observed context interaction: `.dockerignore` excludes `**/.nx`, but not `.nx-cache`; the retained cache was 419,916 KiB before invalidation. Inference: because the base Dockerfile uses whole-repository `COPY . .`, this non-excluded mutable directory is a likely contributor to changing Docker cache keys. Prove that causality with a controlled `.nx-cache` exclusion experiment.

## Keep EC2 or Move Off It

Keep the EC2 runner short-term because it executes the real-backend suite correctly and remains disk-safe under cold cleanup. Centralize its ownership and locking policy now, then evaluate managed compute against cost, provisioning time, cache persistence, and concurrency. Do not broaden triggers until fixed overhead and cost improve.

## Ranked Fixes: Do Now

1. Keep the cold production default and retain warm as diagnostic-only ([runner PR #15](https://github.com/WeLibraryOS/learncard-e2e-runner/pull/15), [LearnCard PR #1469](https://github.com/learningeconomy/LearnCard/pull/1469)).
2. Centralize shared-runner ownership, locking, and release-trigger policy ([LC-2097](https://welibrary.atlassian.net/browse/LC-2097)).
3. Measure and refine Docker layer/context boundaries, beginning with a controlled `.nx-cache` exclusion test ([LC-2098](https://welibrary.atlassian.net/browse/LC-2098)).

## Ranked Fixes: Do Later

1. Evaluate safe Playwright worker scaling only after isolating shared database state, `/delete-all` cleanup, retries, and per-spec timings ([LC-2096](https://welibrary.atlassian.net/browse/LC-2096)).
2. Compare managed compute with EC2 after ownership and trigger policy are centralized.
3. Reconsider retained-cache defaults only with demonstrated targeted invalidation, bounded disk growth, and lower fixed overhead.

## Risks and Open Questions

-   Why does the base `COPY . .` miss across equivalent warm legs? `.nx-cache` in build context is a likely but unproven cause.
-   Can Docker image/cache growth be bounded without sacrificing useful layers?
-   Which host Nx inputs invalidate the dependency build, and can their cache-hit telemetry be made explicit?
-   What worker scaling is safe for the stateful real-backend suite?
-   Does managed compute improve total cost and fixed overhead enough to justify migration?

## Loom Acceptance-Test Script

1. Open [LC-2073](https://welibrary.atlassian.net/browse/LC-2073), runner PR #15, and LearnCard PR #1469; state that cold remains the production default and warm is diagnostic-only.
2. Show the cold/warm/warm matrix: every run passed 7/7 and was comparable, while warm 2 missed the 12-minute and 6-minute targets.
3. Show the timing table and call out the near-six-minute Playwright suite versus 14–16 minutes of fixed overhead.
4. Show Docker growth (7.332 GB to 23.38 GB by invalidation) and the 25 GB disk safety boundary.
5. Show the invalidation artifact: `types` re-executed, unaffected service layers were cached, and selective invalidation remains unproven.
6. Show final acceptance run 31432244856: omitted cache mode resolves to cold, 7/7 passes, artifacts transfer, cleanup completes, and the comparable classification is recorded.
7. Close with LC-2096, LC-2097, and LC-2098 as the separately owned follow-ups; do not broaden triggers until their overhead/cost gates are improved.

## Run, Artifact, PR, and Jira Links

-   Experiment artifacts: `/tmp/lc-2073-phase-2b/{cold,warm1,warm2,invalidation}`.
-   Runner PR: [#15](https://github.com/WeLibraryOS/learncard-e2e-runner/pull/15); LearnCard PR: [#1469](https://github.com/learningeconomy/LearnCard/pull/1469).
-   Jira: [LC-2073](https://welibrary.atlassian.net/browse/LC-2073), [LC-2096](https://welibrary.atlassian.net/browse/LC-2096), [LC-2097](https://welibrary.atlassian.net/browse/LC-2097), [LC-2098](https://welibrary.atlassian.net/browse/LC-2098).
-   Final acceptance: [31432244856](https://github.com/WeLibraryOS/learncard-e2e-runner/actions/runs/31432244856), 23m07s, 7/7, `cache_mode=cold`, `comparable=true`.
