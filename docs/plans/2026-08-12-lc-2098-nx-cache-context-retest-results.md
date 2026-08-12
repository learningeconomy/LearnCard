# LC-2098 `.nx-cache` Context Retest Results

## Decision

Classify the LC-2098 retest as **cache hits plus timing gates pass**: warm 2
explicitly reused the shared-base `COPY . .`, shared-base `bun install`, and
application Nx BuildKit layers, then completed in 10m26s job wall with 5m02s of fixed
overhead. Both values pass the approved 12-minute wall and 6-minute fixed-overhead
targets.

Propose a separate, reviewed production-policy change; do not silently change the
production default from cold in this retest. Warm 1 still rebuilt all three
hypothesis-bearing layers and took 22m24s, so the evidence demonstrates reuse in one
observed warm-2 leg after warm-1 repopulation, not a first-warm hit or repeated
steady-state evidence. The within-sequence cache markers support the `.nx-cache`
context-boundary hypothesis, but post-PR-1453 absolute timing changes are not
attributable solely to that exclusion.

## Run and Revision Matrix

| Leg    | Run                                                                                         | Mode | Runner revision                            | LearnCard revision                         | Host              | Tests | Comparable |
| ------ | ------------------------------------------------------------------------------------------- | ---- | ------------------------------------------ | ------------------------------------------ | ----------------- | ----: | ---------- |
| Cold   | [31643060731](https://github.com/WeLibraryOS/learncard-e2e-runner/actions/runs/31643060731) | cold | `56466ae3de804ad746f636753b52d5e232d6a375` | `b8ad55849fc3c52bf831a6276124d70f81daba53` | `ip-172-31-21-60` |   7/7 | true       |
| Warm 1 | [31644718008](https://github.com/WeLibraryOS/learncard-e2e-runner/actions/runs/31644718008) | warm | `56466ae3de804ad746f636753b52d5e232d6a375` | `b8ad55849fc3c52bf831a6276124d70f81daba53` | `ip-172-31-21-60` |   7/7 | true       |
| Warm 2 | [31646448822](https://github.com/WeLibraryOS/learncard-e2e-runner/actions/runs/31646448822) | warm | `56466ae3de804ad746f636753b52d5e232d6a375` | `b8ad55849fc3c52bf831a6276124d70f81daba53` | `ip-172-31-21-60` |   7/7 | true       |

The three immutable bundles report the same `aarch64` host, Docker `27.3.1`, Compose
`2.29.7`, frozen revisions, and explicit cold/warm/warm modes. Each records
`reason=retained-within-disk-boundary`.

## Correctness and Comparability

The Playwright `results.json` in each bundle was checked directly, rather than
inferring correctness from workflow success:

| Leg    | Expected | Unexpected | Flaky | Skipped | Top-level errors |
| ------ | -------: | ---------: | ----: | ------: | ---------------: |
| Cold   |        7 |          0 |     0 |       0 |                0 |
| Warm 1 |        7 |          0 |     0 |       0 |                0 |
| Warm 2 |        7 |          0 |     0 |       0 |                0 |

Every JSON independently records the exact Playwright argument suffix
`consent-flow-race.spec.ts app-store.spec.ts wallet-credentials.spec.ts`, one configured
project named `firefox`, and `projectName=firefox` on every reported test. Recursively
flattening each JSON's specs produces the same per-file identity in all three legs:
four tests from `app-store.spec.ts`, one from `consent-flow-race.spec.ts`, and two from
`wallet-credentials.spec.ts`. Thus the seven results are the same requested Firefox
suite in cold, warm 1, and warm 2, not merely equal totals.

All three GitHub runs completed successfully. Their bundles passed artifact transfer,
report `comparable=true`, use identical full SHAs, and show no emergency-prune reason.
The sequence is therefore valid for performance comparison.

## Stage Timing and Wall-Clock Comparison

Job wall is the authoritative GitHub `e2e-test` job interval, not workflow
creation-to-update time. Fixed overhead is exactly `job wall - Playwright`.

| Leg    | GitHub job interval (UTC) |        Job wall | Base build | Compose build | Host Nx | Playwright | Fixed overhead |
| ------ | ------------------------- | --------------: | ---------: | ------------: | ------: | ---------: | -------------: |
| Cold   | 21:33:25–21:54:10         | 1,245s (20m45s) |       171s |          367s |    144s |       332s |  913s (15m13s) |
| Warm 1 | 21:55:39–22:18:03         | 1,344s (22m24s) |       357s |          361s |    151s |       366s |  978s (16m18s) |
| Warm 2 | 22:19:25–22:29:51         |   626s (10m26s) |        49s |            1s |    139s |       324s |   302s (5m02s) |

| Delta           | Job wall | Base build | Compose build | Host Nx | Playwright | Fixed overhead |
| --------------- | -------: | ---------: | ------------: | ------: | ---------: | -------------: |
| Warm 1 − cold   |     +99s |      +186s |           −6s |     +7s |       +34s |           +65s |
| Warm 2 − cold   |    −619s |      −122s |         −366s |     −5s |        −8s |          −611s |
| Warm 2 − warm 1 |    −718s |      −308s |         −360s |    −12s |       −42s |          −676s |

Warm 2 passes the 720-second job-wall gate by 94 seconds and the 360-second
fixed-overhead gate by 58 seconds. Its Playwright duration is only 8 seconds below
cold; 611 of the 619 seconds saved versus cold is fixed overhead.

## Docker BuildKit Cache Evidence

Warm 1 did **not** hit the three hypothesis-bearing layers:

-   Shared base `docker-base-build.log`: `#9 [stage-0 3/4] COPY . .` followed by
    `#9 DONE 10.7s`; `#10 ... bun install` followed by `#10 DONE 259.4s`.
-   Application `docker-compose-build.log`: `#29 [app 3/3] RUN NX_DAEMON=false bunx nx
run learn-card-app:docker-build ...` followed by `#29 DONE 357.0s`.
-   Unaffected layers did show explicit reuse: delete-service `#13` through `#16` were
    `CACHED`, and brain-service `#9 [brain 2/2] WORKDIR /app` was `CACHED`. The API
    `WORKDIR` was only `DONE 0.5s`, so it is not classified as cached.

Warm 2 directly demonstrates the intended reuse:

-   Shared base `docker-base-build.log`: `#9 [stage-0 3/4] COPY . .` / `#9 CACHED` and
    `#10 ... bun install` / `#10 CACHED`.
-   Application `docker-compose-build.log`: `#29 [app 3/3] RUN NX_DAEMON=false bunx nx
run learn-card-app:docker-build ...` / `#29 CACHED`.
-   Unaffected layers also remained cached: API `#8 [api 2/2] WORKDIR /app`,
    delete-service `#17` through `#20`, and brain-service `#8 [brain 2/2] WORKDIR /app`
    all have explicit `CACHED` text.

The shared context transfer itself was still slow despite being small: warm 1
transferred 1.11 MB in 46.1 seconds and warm 2 transferred 1.11 MB in 44.4 seconds.
That work explains most of warm 2's 49-second base stage; `DONE` context-transfer text
is not a layer-cache hit.

## Host Nx Evidence

Host `host_test_dependencies` took 144 seconds cold, 151 seconds warm 1, and 139 seconds
warm 2. All three `host-nx-build.log` files enumerate the actual `nx run` builds and end
with `NX Successfully ran target build for 3 projects and 31 tasks they depend on`.
None contains `cache`, `cached`, or `existing outputs match the cache`, so there is no
explicit host-local Nx cache-hit evidence. The 5-second warm-2 improvement from cold is
too small, by itself, to establish host Nx reuse.

## Disk Growth and Safety

“Pre” is the accepted `preflight-after` snapshot immediately before repository/build
work; “post” is `post-run-before-recovery`.

| Leg    | Free disk pre → post | Docker images pre → post | BuildKit total pre → post | BuildKit reclaimable pre → post | `.nx-cache` pre → post |
| ------ | -------------------- | ------------------------ | ------------------------- | ------------------------------- | ---------------------- |
| Cold   | 66 → 53 GB           | 0 B → 7.197 GB           | 0 B → 8.652 GB            | 0 B → 8.652 GB                  | 0 → 420,364 KiB        |
| Warm 1 | 53 → 47 GB           | 7.197 → 12.41 GB         | 8.652 → 13.86 GB          | 8.652 → 13.86 GB                | 420,364 → 420,356 KiB  |
| Warm 2 | 47 → 47 GB           | 12.41 → 12.41 GB         | 13.86 → 13.86 GB          | 13.86 → 13.86 GB                | 420,356 → 420,360 KiB  |

The cold preflight began at 53 GB with 7.216 GB of images, 8.683 GB of total and
reclaimable BuildKit data, and 420,360 KiB of `.nx-cache`; cold cleanup reset those to
66 GB, 0 B, 0 B, and 0 KiB before measurement. Every post-run snapshot remains at
least 47 GB free, 22 GB above the 25 GB gate. Warm 1 adds 5.213 GB of reported Docker
images and 5.208 GB of BuildKit data, but warm 2 adds no further reported Docker image
or BuildKit growth. The retained host Nx cache remains approximately 410.5 MiB.

Safety classification: **pass for this controlled sequence, with no additional growth
in the one observed warm-2 leg**. This does not prove repeated steady-state behavior or
that long-term retention is bounded for changing revisions.

## Comparison With Original Phase 2B

| Measure            | Original Phase 2B cold / warm 1 / warm 2 | LC-2098 cold / warm 1 / warm 2 |
| ------------------ | ---------------------------------------- | ------------------------------ |
| Job wall           | 1,201 / 1,301 / 1,342s                   | 1,245 / 1,344 / 626s           |
| Fixed overhead     | 840 / 964 / 984s                         | 913 / 978 / 302s               |
| Base build         | 188 / 354 / 354s                         | 171 / 357 / 49s                |
| Compose build      | 370 / 358 / 364s                         | 367 / 361 / 1s                 |
| Host Nx            | 145 / 144 / 145s                         | 144 / 151 / 139s               |
| Post-run free disk | 53 / 47 / 40 GB                          | 53 / 47 / 47 GB                |
| Docker images      | 7.332 / 12.68 / 18.03 GB                 | 7.197 / 12.41 / 12.41 GB       |
| BuildKit total     | 8.862 / 14.21 / 19.56 GB                 | 8.652 / 13.86 / 13.86 GB       |

Original Phase 2B warm 2 reran shared-base `COPY . .`, a roughly 246–255-second
`bun install`, and the roughly 352–359-second application build. LC-2098 warm 2 marks
all three layers `CACHED`, which is the strongest controlled evidence for the new
context boundary. The corresponding base/Compose collapse and absent second-warm disk
growth align with those markers.

PR #1453 removed unused projects before this retest and changed the workspace/build
graph. Therefore the cross-experiment absolute deltas combine that new baseline with
the `.nx-cache` exclusion and normal run variance. Only the identical-revision
LC-2098 cold/warm/warm marker transition isolates evidence within this boundary.

## Observations Versus Inferences

Direct observations:

-   All three runs are correct, comparable, revision-identical, sequential, and safe.
-   Warm 1 explicitly reruns the shared `COPY`, shared `bun install`, and app Nx layer.
-   Warm 2 explicitly marks those three layers `CACHED` and passes both timing targets.
-   Warm 2 reports no additional Docker image or BuildKit growth, while host Nx still
    has no explicit local-cache hit marker.

Supported inference:

-   Excluding `.nx-cache` allowed one observed warm-2 execution, after warm-1
    repopulation, to reuse the previously missed Docker layers. The explicit cache
    markers, stage collapse, and flat warm-2 disk values point in the same direction;
    they are not repeated steady-state evidence.

Limits:

-   The evidence does not explain why warm 1 repopulated the shared base despite an
    identical Git revision, and it does not establish first-warm reuse.
-   The evidence does not show host Nx reuse or prove bounded cache growth across source
    revisions.
-   Cross-experiment timing improvement cannot be assigned entirely to `.nx-cache`
    exclusion because PR #1453 changed the baseline first.

## Next Recommendation

Keep cold as the production default until a separate policy review. Present this retest
as support for enabling a carefully bounded retained-cache policy, because the required
warm-2 markers and timing gates pass. Before changing production behavior, explain or
reproduce the warm-1 base repopulation, add explicit host-Nx cache telemetry, and define
a disk-retention bound for changing revisions. Retain the 25 GB emergency boundary.

## Run, Artifact, PR, and Jira Links

-   Runs: [cold 31643060731](https://github.com/WeLibraryOS/learncard-e2e-runner/actions/runs/31643060731),
    [warm 1 31644718008](https://github.com/WeLibraryOS/learncard-e2e-runner/actions/runs/31644718008),
    and [warm 2 31646448822](https://github.com/WeLibraryOS/learncard-e2e-runner/actions/runs/31646448822).
-   Immutable local artifact roots: `/tmp/lc-2098-nx-cache-retest/cold`,
    `/tmp/lc-2098-nx-cache-retest/warm1`, and
    `/tmp/lc-2098-nx-cache-retest/warm2`.
-   LearnCard experiment PR: [#1469](https://github.com/learningeconomy/LearnCard/pull/1469).
-   Prerequisites: [LearnCard PR #1453](https://github.com/learningeconomy/LearnCard/pull/1453),
    [runner PR #15](https://github.com/WeLibraryOS/learncard-e2e-runner/pull/15), and
    [LearnCard PR #1475](https://github.com/learningeconomy/LearnCard/pull/1475).
-   Records: [LC-2098 design](./2026-08-11-lc-2098-nx-cache-context-retest-design.md),
    [implementation plan](./2026-08-12-lc-2098-nx-cache-context-retest-implementation.md),
    and [original Phase 2B results](./2026-08-10-lc-2073-phase-2b-cache-experiment-results.md).
-   Jira: [LC-2098](https://welibrary.atlassian.net/browse/LC-2098) and
    [LC-2073](https://welibrary.atlassian.net/browse/LC-2073).
