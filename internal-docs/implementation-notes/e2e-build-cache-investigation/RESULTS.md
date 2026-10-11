# Hosted E2E cache experiments — October 9, 2026

Building the browser app once on the host reduced the two measured workflow times from 18m20s / 20m46s to 12m29s / 12m14s. Exact SDK and SPA output caches also worked: both warm repeats restored verified outputs and passed every suite. Their build preparation took 1m29s / 2m10s, but whole workflows took 12m41s / 14m20s. Adopt the host-build change first; evaluate the cache layer separately with a trusted main-branch producer before expecting reuse on future merge-queue refs.

Draft implementations: [host build #1680](https://github.com/learningeconomy/LearnCard/pull/1680), [stacked output cache #1681](https://github.com/learningeconomy/LearnCard/pull/1681). The host-build PR #1680 merged on October 9; #1681 remains an open cache experiment. [hosted-results.json](./hosted-results.json) contains collected job, phase, key, and test metrics; [invalidation-experiment.json](./invalidation-experiment.json) records local input-mutation probes.

## Hosted measurements

All samples used GitHub-hosted Linux x86_64 runners reporting four vCPUs and 16 GB RAM. Whole workflow time is creation through completion of the final E2E gate, including scheduling and setup. Browser preparation includes Docker preparation plus the later duplicate host SDK build for the baseline; experimental preparation includes overlapping backend/host builds and the small Nginx image. Cache key/download time precedes that experimental preparation and is listed separately below.

| Variant and run                                                                                                      | Browser preparation | Browser job | Whole workflow |
| -------------------------------------------------------------------------------------------------------------------- | ------------------: | ----------: | -------------: |
| [Production baseline, first](https://github.com/learningeconomy/LearnCard/actions/runs/37919834437)                  |               8m28s |      18m05s |         18m20s |
| [Production baseline, cache-available repeat](https://github.com/learningeconomy/LearnCard/actions/runs/37921317388) |               9m46s |      20m28s |         20m46s |
| [Host build, first](https://github.com/learningeconomy/LearnCard/actions/runs/37920743428)                           |               2m53s |      11m55s |         12m29s |
| [Host build, repeat](https://github.com/learningeconomy/LearnCard/actions/runs/37921536939)                          |               3m00s |      11m58s |         12m14s |
| [Output-cache prototype, cold](https://github.com/learningeconomy/LearnCard/actions/runs/37921426246)                |               4m38s |      16m31s |         16m48s |
| [Final output cache, cold](https://github.com/learningeconomy/LearnCard/actions/runs/37922619023)                    |               4m37s |      15m56s |         16m13s |
| [Final output cache, warm 1](https://github.com/learningeconomy/LearnCard/actions/runs/37924365708)                  |               1m29s |      12m25s |         12m41s |
| [Final output cache, warm 2](https://github.com/learningeconomy/LearnCard/actions/runs/37924369806)                  |               2m10s |      14m02s |         14m20s |

Baseline SHA: `77e5b0681f5567caa446da57a1746d148ffde27a`. Host-only SHA: `edbbb348d948ad7559abdebeacce60dbbdfde62f`. The final cold run and both warm runs tested exactly `2393af5623b1f2f5642fd081b2bcf078624cc84f`, with matching workflow and checkout revisions. The prototype cold sample at `935ce4d739641b81c324af3ae45981b4ef30b18b` predates the canonical SDK Sentry-release and OS/libc key corrections; it is supporting cold-path evidence, not a second identical final-revision cold sample.

Every successful sample passed 727 service tests, with 13 existing skips, plus seven functional browser tests and three accessibility tests. Both browser reports had zero retries, unexpected failures, or flaky outcomes. Readiness and DID-resolution preflights remained enabled. Failed preliminary dispatch/context/key attempts are excluded from performance comparisons.

## What the timings establish

The host-only path eliminates the full app Docker dependency install/build and the later duplicate SDK compilation. Backend images build concurrently with the host app; a small staged context packages the compiled SPA into Nginx. Its preparation fell by 5m35s to 6m46s relative to the baseline samples. The baseline repeat imported an available BuildKit cache index yet still performed a full dependency install (177 seconds). Cache availability therefore did not establish a usable install-layer hit; the exact hosted miss remains unresolved.

In the final cache cold browser run, SDK compilation took 160 seconds, SPA compilation 110 seconds, and snapshotting one second. Backend preparation took 122 seconds concurrently; Nginx packaging took six seconds. Both warm runs skipped SDK and SPA compilation entirely. Restoring SDK files took one second in the browser and one to two seconds in service shards; restoring SPA files rounded to zero seconds. Backend preparation became the build-stage limit at 84 / 121 seconds.

| Cache cost                                               | Final cold |       Warm 1 |       Warm 2 |
| -------------------------------------------------------- | ---------: | -----------: | -----------: |
| Browser key calculation and cache lookup/download/unpack |         6s |           8s |          10s |
| SDK manifest verification and workspace copy             |      Built |           1s |           1s |
| SPA manifest verification and workspace copy             |      Built |          <1s |          <1s |
| Browser SDK + SPA cache save                             |    4s + 1s | Existing key | Existing key |

The 6 / 8 / 10 seconds above are the complete `Prepare exact build caches` composite-step durations from GitHub's jobs API, stored in `hosted-results.json` as `cache_steps_seconds`. They include key calculation and cache lookup/download/unpack. The separate `build-cache-key-timing.txt` artifact measures only key calculation; it is not the source of this table.

The SDK snapshot contained 2,852 files in 45 output directories for 44 projects: 507,431,567 raw bytes and 95,414,938 compressed bytes. The SPA contained 742 files: 64,723,144 raw bytes and 25,081,199 compressed bytes. Together the compressed outputs occupy about 120.5 MB, versus 1.264 GB for the earlier full app Docker dependency cache. All four jobs derived the same SDK key in each final sample; both browser repeats restored exact SDK and SPA keys.

Warm preparation saved 147–188 seconds relative to the same-revision cold run, before the extra two to four seconds of key/restore setup. This does not imply the same wall-time gain on every runner. The second warm browser dependency setup took 99 seconds versus 46 in the first; backend preparation, Playwright-image preparation, and tests also varied. Host-only functional/accessibility phases totaled 347–350 seconds, compared with 397–451 seconds in the warm cache runs. The cache layer's cold path also builds the complete SDK union and cleans outputs. These samples demonstrate useful restoration, but do not show a whole-workflow advantage over host-only builds.

## Correctness and invalidation

Output restoration requires an exact key and verifies all declared paths, file contents, sizes, modes, and directory membership before replacement. Stale output directories are removed; missing, mismatched, corrupt, extra, or linked entries cause a build fallback. Tests always run, and failed compilation prevents subsequent runtime-image construction. No Nx SQLite metadata or installed dependencies are included in these output snapshots.

These manifest checks detect corruption and incomplete extraction. They do not authenticate cache writers: a writer can replace both payload and manifest. GitHub's cache branch restrictions and a trusted producer are the trust boundary. Only the browser job writes snapshots, and only after its full test suite succeeds; failed test runs intentionally do not publish snapshots.

Keys cover conservative source/configuration/lockfile/workspace inputs, exact Node/Bun/Nx versions, OS distribution/libc, architecture, Node ABI, and build environment. The SDK build uses its input key as `SENTRY_RELEASE`: Sentry otherwise injects the tested Git SHA even without an upload token, which would make frontend-only reuse carry stale metadata. The SPA key includes its tested SHA and Vite/dotenv inputs, intentionally missing on new commits. Full tracked-file hashing remains intentional: it also distinguishes different local edits with the same Git status. The SDK environment allowlist must be audited whenever a build begins reading another variable; add that variable and bump the key schema before reuse. The complete Sentry token remains a conservative key input until token-independent build behavior is audited.

Key-generation errors, unsupported native DIDKit caching, unaudited output paths, and non-`build` dependency tasks disable the cache experiment and use the ordinary host build with Nx dependencies enabled. Both SDK and SPA specs must be ready before browser caching is enabled; restores and saves are skipped when preparation fails. After review, the key schema/prefix advanced to v2 with length-prefixed input hashing. The timings above describe the measured v1 revision; v2 starts with a cold cache.

Local probes changed real dependency source, TypeScript configuration, lockfile, Vite configuration, `VITE_APP_VERSION`, and `NODE_ENV`, then restored the original inputs. Dependency/compiler/lock/environment changes invalidated both keys; frontend configuration/environment changed only the SPA key. All hosted E2E shell checks and five Node integrity/key tests passed, including submodule revisions, executable modes, build failure propagation, and invalid-cache fallback. Restored local SDK outputs issued and verified a credential through DIDKit WASM and launched the CLI. Frontend-only and transitive-change invalidation were probed locally; separate hosted changed-source runs were not performed.

Repository-contract CI now runs `.github/tests/*.test.mjs` via `node --test`. The current seven Node cases also cover binary-input framing and rejection of unrepresented graph dependencies/output paths. The cache-action shell contract executes the actual composite-action commands for browser/service success, SDK/SPA key failures, malformed stdout, and failed diagnostic copies, and checks restore/save gating.

## Adoption boundaries

1. Review #1680 independently: its two full hosted runs show a large preparation and workflow improvement without persistent output reuse.
2. Keep #1681 experimental until the team chooses a trusted main-branch producer. [GitHub cache branch restrictions](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching#restrictions-for-accessing-a-cache) mean these same-branch warm repeats do not prove that future PR or merge-queue refs can reuse their caches. No main warmer is included.
3. Measure main-produced SDK reuse on a frontend-only PR and a merge-queue ref before claiming cross-branch savings. Expect a fresh SPA build on a new SHA. The conservative SDK key can also miss on unrelated package/service changes; narrowing it requires a transitive-input audit.
4. Retain both cold fallback and full-suite gates. The reported performance samples are small and runner timings vary; they support the measured build-stage improvement, not a guarantee that every E2E workflow will finish in twelve minutes.

## Nx Test Runner extension — October 11, 2026

The cache experiment now also covers the Test Runner job in `test.yml`. It derives compiled prerequisites from the affected-test task graph, snapshots before tests execute, and reruns affected tests plus the existing independent AI runtime DID-auth preflight on every attempt. Native/configured/unaudited prerequisites or invalid snapshots retain the ordinary Nx dependency graph. Successful build snapshots can serve retry attempts; only a green full test step permits GitHub publication.

The real Nx 23.2.1 full affected graph used for local planning validation contained 43 builds, 44 output directories, 56 test targets, and the AI runtime preflight. Sixteen Node cache/runner contracts and the repository shell/CJS contracts pass locally. Real key probes confirm repeat stability, invalidation after SDK-source or `NODE_ENV` changes, and reuse after a frontend-only source change. These are correctness checks, not hosted wall-time measurements. Existing E2E samples above do not establish a Test Runner speedup.

The manual Test Runner inputs permit a fixed comparison `base` and `run_ec2_fallback=false` for hosted cache measurements. Keep the same workflow revision, tested revision, base, and affected-test set for cold/warm comparisons. A trusted main cache producer remains a separate adoption decision; this extension does not remove GitHub's branch-scoping limits.

## Hosted Nx Test Runner measurements — October 11, 2026

All five matched samples passed on the first attempt. Both warm samples hit the exact published key, verified and restored all 44 output directories, and skipped the 43-project prerequisite build graph. Tests and the independent real AI runtime DID-auth preflight still executed. [nx-test-cache-results.json](./nx-test-cache-results.json) contains per-sample timings, counts, graph/restore evidence, and excluded diagnostics.

Workflow ref: `codex/e2e-build-cache-investigation`; workflow/tested SHA: `b752b7f1ad9c285864a8fe53decc7d7960e39a5e`; fixed comparison base: `8d2fc4ab8826604730023ce8e7ae3356f36554eb`. Every manual run used twenty minutes, one attempt, and `run_ec2_fallback=false`. Only the baselines set `use_build_cache=false`. Normal PR/merge-group budgets remain ten minutes and three attempts. All samples had ordinary dependency download cache hits; “baseline” disables this compiled-output snapshot, not dependency caching.

Dependency setup below is the complete composite setup step. Cache preparation includes key calculation, lookup and, for warm hits, download/unpack. The `Run tests` step includes prerequisite build/restore, preflight and tests. Test-job wall time includes checkout/setup/cache handling and cleanup, but excludes queue time and parallel jobs. It is not an end-to-end deployment or E2E workflow measurement.

| Sample                                                                              | Dependency setup | Key/lookup/download | Run tests step | Whole Test job |
| ----------------------------------------------------------------------------------- | ---------------: | ------------------: | -------------: | -------------: |
| [Baseline 1](https://github.com/learningeconomy/LearnCard/actions/runs/38166370345) |              41s |                  0s |         12m27s |         13m37s |
| [Cold](https://github.com/learningeconomy/LearnCard/actions/runs/38166372866)       |              55s |                  3s |          8m15s |          9m44s |
| [Baseline 2](https://github.com/learningeconomy/LearnCard/actions/runs/38166448401) |              47s |                  0s |         12m26s |         13m53s |
| [Warm 1](https://github.com/learningeconomy/LearnCard/actions/runs/38167373453)     |              45s |                  6s |         10m43s |         12m09s |
| [Warm 2](https://github.com/learningeconomy/LearnCard/actions/runs/38167375500)     |              40s |                  5s |         10m31s |         11m44s |

Mean Test-job duration was **13m45s baseline versus 11m56.5s warm**, an observed reduction of **1m48.5s (13.2%)**. Mean `Run tests` duration was 12m26.5s versus 10m37s, a reduction of 1m49.5s. These are two passing samples per group, not a guaranteed or statistically established improvement. The cold run was faster than both warm runs, so these measurements do not establish a cache-reuse-only wall-time saving.

The cold prerequisite graph took 83.828 seconds; snapshotting took about one second. Its affected-test graph took 406.214 seconds. Warm runner startup through manifest verification/copy took 1.041 / 1.080 seconds, after the 6 / 5-second cache preparation steps; no prerequisite build graph ran. Warm affected-test graphs took 637.260 / 625.527 seconds. Baseline graph times were 743.716 / 744.444 seconds **including prerequisite builds** and cannot be compared directly with the cache-enabled test-only graph phases. Cold cache publication took three seconds.

The snapshot contained **2,930 files, 511,287,000 raw bytes, and 96,463,136 compressed bytes** (96.5 MB / 92.0 MiB), under exact key `nx-test-builds-v1-12133b9f5552802e8b5f54b01e63d459dd679e4ae5cd5405dad9ed9ceb8ee3fb`. Both warm logs show the same exact key and successful verification of 44 directories. No test-result or Nx database cache is restored; the Nx footer can still report zero hits.

All five samples selected the identical 56 affected test targets and produced identical per-project counts: 8,863 Vitest passes with 44 skips, plus 138 Rust passes with one ignored test. Other command/smoke targets also completed successfully. The runtime preflight independently returned `{"ok":true,"check":"did-auth-vp"}` every time. There were no retries, failed tests, or timeout truncation in this cohort. The separate inbox-security job also passed; AI Agent CI and EC2 fallback were skipped.

### Interpretation and adoption limits

This is a comparison of the proposed implementation with the ordinary Nx graph, not a controlled isolation of cache reuse. The cache-enabled path builds all prerequisites separately before tests and can lose Nx build/test overlap. It also normalizes SDK Sentry release identity and disables optional build telemetry; baselines retain the ordinary environment policy. The cold result demonstrates that scheduling/environment differences and runner variation already matter before reuse occurs.

Tests dominated the warm runs: LearnCard app's reported Vitest duration was 370.57 / 366.00 seconds, versus 247.44 seconds cold and 174.30 / 172.15 seconds baseline. This is a test-phase timing difference, not evidence of a cache-integrity failure: project sets, counts, manifest verification and preflight all matched. Its cause was not isolated by this small cohort; do not attribute the whole difference to caching or claim that warming must beat cold. Rust compilation inside test commands and other test work remain uncached.

The earlier hosted E2E experiment above likewise improved warm build preparation but did not prove a whole-workflow advantage over host-only builds because backend, setup and test timings varied. The new Test Runner samples support useful, correct prerequisite restoration and a modest observed warm-versus-baseline reduction. A trusted main producer and frontend-only PR/merge-queue measurements remain necessary before expecting cross-branch savings; this PR does not add that producer or enable Nx Cloud.

### Superseded ten-minute diagnostics

Runs [38164582419](https://github.com/learningeconomy/LearnCard/actions/runs/38164582419), [38165027593](https://github.com/learningeconomy/LearnCard/actions/runs/38165027593), [38165029588](https://github.com/learningeconomy/LearnCard/actions/runs/38165029588), and [38165590322](https://github.com/learningeconomy/LearnCard/actions/runs/38165590322) were deliberately cancelled when replaced with this twenty-minute, one-attempt cohort. They used earlier revisions and are excluded from all means above. The pilot built prerequisites in about 2m02s and snapshotted the same file/raw-byte totals, hit the ten-minute cap, then verified 44 directories on retry. The earlier baseline also logged an individual five-second test timeout. These establish diagnostic evidence and the need for a complete measurement window, not performance gains or completed test counts.
