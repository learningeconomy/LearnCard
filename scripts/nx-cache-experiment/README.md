# Native Nx shared-cache experiment

Manual diagnostic for the production cache policy. This does not configure Nx Cloud,
a shared service, credentials, or production Test/E2E caching. It extends the transport
rehearsal in PR #1934 without changing that branch.

The controller checks out pinned main as producer, and a separate PR commit as consumer.
Six explicit test roots (`types`, `helpers`, `core`, `vc-plugin`, `init`, `credential-library`)
exercise their ordinary dependency graph. At the initial main revision this is 33 builds
and six tests. This is a representative SDK slice of Test, not the complete affected
monorepo or E2E. An explicit graph avoids comparing main to itself and doing zero work.

Only main's production-cacheable `types`, `helpers`, and `core` builds may cache.
Their `sdkBuild`/`^sdkBuild` inputs and target configuration are never replaced. All other
builds and all tests execute freshly. The controller rejects an unexpected cache opt-in.
Larger targets are deliberately not opted in: current project-specific inputs frequently
omit root configuration, external assets, or environment consumed by their build scripts.
They need an individual audit before any caching proposal.

## Transport and trust

Nx's [native HTTP cache protocol](https://nx.dev/docs/kb/self-hosted-caching) serves opaque
native task archives on authenticated runner-local loopback. A GitHub artifact carries
only the three producer build payloads plus a hash manifest between disposable jobs.
Consumer writes are discarded. Local Nx databases and test results never enter the cache.
No existing secret value is fetched. This is an operator-selected main-source producer,
not a production main-branch publication/authorization policy. Do not infer Nx Cloud
workspace adoption or production branch-scoped cache visibility from a successful restore.

A supported post-task hook observes hash/status/duration/cache policy. The controller adds
one stable relative hook path to `nx.json` in every arm and restores it afterward. Since
`nx.json` is itself hashed by `sdkBuild`, observed hashes include this uniform instrumentation;
they are not claimed to equal uninstrumented production hashes. Absolute runner paths are
kept in environment variables. Results record original and instrumented config digests.

## Running

Dispatch **Nx cache experiment** on the experiment branch. Set `consumer_ref` to its PR head
and `second_pr_ref` to an independent compatible PR. Optional `producer_run_id` reuses a
successful earlier experiment's payload artifact; toolchain/lockfile mismatch rejects it.
The workflow freezes refs to SHAs. Two repeats each of off/cold/warm use independent jobs;
max parallelism is three. Off explicitly sets `NX_SKIP_NX_CACHE=true`. Cold starts an empty
server. Warm downloads main's payload. Separate source, project configuration and lockfile
whitespace probes must invalidate the declared builds; the config probe preserves other hits.

`merge_group_run_id` is only a **historical source replay**, even if that queue run happened
recently. A real live cache-consumption claim requires a normally approved candidate with
the experiment actually present in its merge-group workflow. Never enqueue or merge an
unrelated PR merely to simulate that claim, and never bypass branch protection.

Node 24.12.0 and Bun 1.4.4 are pinned in measured jobs. Numeric results retain image version,
CPU/model/count, OS/architecture, lock digest, task hashes, fresh test counts, and phase times.
Run `node .github/tests/test-nx-cache-experiment.test.cjs` for offline safety contracts, and
`node --test .github/tests/test-sdk-cache-policy.cjs` for native production-policy invalidation.

## Interpreting evidence

Compare paired complete job durations, not only the Nx command. Include checkout, installation,
transfer, verification and result upload. Report producer cost separately; amortization depends
on actual compatible consumers. Include ready-to-start waits and workflow creation-to-completion.
Task durations overlap and must not be added as command wall time. Two repeats are exploratory,
not a sustained performance estimate. The six test roots must report fresh coverage in every arm;
paired coverage and dependency graphs must match. Raw test logs and sessions stay private.

Required E2E currently uses a separate SDK output snapshot and passes `--skip-nx-cache` on its
main Nx paths. Do not count those existing snapshot savings as native cache savings. Browser
build, Docker, test execution, runner waits and final aggregation can dominate merge latency.
PR #1944 independently changes PR/queue scheduling; it is not part of this experiment. Capture
queue event, source SHA, approval/entry, required-job timestamps and merge time separately.
No full-CI or live-queue speedup is established by this manual slice alone.
