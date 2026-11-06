# Integration test selection

`Test Runner` repurposes the former recovery-tools runner as `Select integration tests`
to select integration jobs before allocating their runners. Recovery-tool regressions
move into the existing required `Test` job and run alongside the integration jobs.
The total runner count does not increase. AI Agent CI keeps its existing behavior.

| Output      | Jobs                                       | Inputs                                                                      |
| ----------- | ------------------------------------------ | --------------------------------------------------------------------------- |
| `brain`     | Graph group; inbox suite in delivery group | Brain service, its Nx dependency closure and integration task prerequisites |
| `campaigns` | Campaign suites in delivery group          | Brain inputs plus LCA API, including its notification integration tests     |
| `escrow`    | Escrow integration (lca-api)               | LCA API and dependencies, plus the existing explicit SSS and enclave inputs |

PR selection compares the frozen base and head using their merge base. Queue
selection compares the event's exact base/head, including changes from preceding
queue entries. The checkout must match that head. Manual dispatch always runs all
integration suites.

Known prose and three reviewed files belonging only to full E2E can skip without
graph setup. Other project changes use the same isolated, locked Nx/TypeScript
preflight as Mock E2E. The graph includes transitive, implicit and dynamic project
dependencies, task prerequisites, and explicit workspace inputs. It plans tasks;
it does not build projects or install the Bun workspace.

Dependency metadata, lockfiles, shared configuration, source deletions, unknown
paths, unavailable Git comparisons and incomplete graphs request all suites.
Missing selector outputs or a failed selector job also request execution. Only an
explicit `false` decision from a successful job skips an integration runner. The
job summary labels these decisions as “not applicable,” not test passes.

The graph group runs share-link security, profile search and boost recipients.
The delivery group runs inbox security, campaign permissions and campaign
notifications. Delivery retains per-suite selection: an LCA-only change can run
campaigns without running inbox. Escrow remains a separate runner.

Each group checks out and installs once, then runs separate test processes in
sequence. Container reuse is disabled, so suites get fresh databases. An ordinary
test failure still allows later selected suites to run, and fails the group;
setup failures and cancellation stop execution. Each group has a 20-minute timeout.
There are no required-check setting changes. On a relevant change, integration
jobs wait only for checkout and selection, not the recovery regressions. Measure
that preflight overhead alongside runners avoided when evaluating the rollout.

## Validate

```sh
node --test .github/tests/test-integration-groups.test.cjs .github/tests/test-integration-selection.test.cjs scripts/mock-e2e-ci.test.cjs
```

Inspect the workflow's `Select integration tests` job for each decision and reason. Shared dependency changes should run affected
suites; unrelated project changes should skip them. If the graph cannot be built,
`graph-unavailable` intentionally runs all suites. A skip is never inferred from
an empty or missing output.

## Benchmark runner consolidation

Apply the `benchmark-integrations` label to a PR to run `Integration runner
benchmark` on its exact head. Remove and reapply the label for another sample.
After the workflow is on the default branch, it also supports manual dispatch.
Wait for ordinary PR CI to finish first to reduce competition from that PR.

The benchmark uses the same reusable workflow and commands as production, in
four sequential phases: five separate runners, two grouped runners, two grouped
runners again, then five separate runners. That is 14 runner jobs, with at most
five running at once. Both layouts run every suite exactly once per phase. The
order provides two samples per layout and helps expose host/cache variation;
it is not a long-term performance estimate. Failed phases invalidate the comparison.

Report these metrics from the Actions job/step timestamps:

- Setup: summed checkout, workspace setup and Docker authentication step time.
- Runner usage: summed job start-to-completion time, including cleanup.
- Execution span: first job start to last job completion within a phase.
- Scheduling-inclusive elapsed time: phase eligibility to last job completion.

Report individual phases as well as layout averages, cache observations, the
tested commit and the run link. Fewer runner-seconds may come with a longer
critical path because suites execute sequentially. This comparison uses a common
setup harness for both layouts; it measures grouping, not every historical setup
difference. Hosted suite results validate CI orchestration, not the full
application verification catalog.

## Integration dependency cache

The integration groups can opt out of the shared Bun package archive through
`dependency_cache`. With caching disabled, setup installs into the runner's
fresh temporary package store and skips both restoring and saving the dependency
archive. The full `bun install --frozen-lockfile` command and all dependencies
remain unchanged. Bun's binary cache is independent and remains enabled.

Other setup consumers retain dependency caching by default, including the
existing reader/writer behavior selected by `save-cache`. No new cache producer
is needed when integration jobs install directly.

Apply `benchmark-integration-cache` to compare the existing warm dependency
archive against fresh installs on one commit. Two rounds each run graph and
delivery in both modes: eight jobs total, at most four in parallel. Verify the
cached jobs restored the expected archive, uncached jobs skipped restore/save,
and all modes installed the same package count and passed the same tests. Compare
workspace setup, total runner time and elapsed span; include observed variance.
Manual dispatch becomes available once the workflow reaches the default branch.
