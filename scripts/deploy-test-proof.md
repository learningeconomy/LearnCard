# Deploy test reuse

Staging Deploy can reuse successful merge-queue `Test` results for audited projects. When all selected tests are covered, it skips dependency installation and the repeated test command. For a mixed selection, it installs dependencies normally and excludes only the verified audited projects from `nx affected --target=test`; all remaining tests and their build prerequisites still run. The `test-affected` job still reports success so its downstream deployment gates retain their existing behavior. It keeps a runner for a short summary step. Native binary compilation and all other deployment checks remain independent.

The producer in `test.yml` freezes the actual comparison base and head before testing. After the tests and retry reporting succeed, it may publish one immutable `queue-test-proof-<run ID>-<attempt>` artifact containing a small version-2 JSON record. This contains commit IDs, task IDs, runtime versions and run metadata only. It contains no secrets, test logs or executable build outputs.

The consumer in `deploy.yml` uses read-only Actions APIs. Reuse requires all of these:

- A staging push with the exact same base and head as the successful queue test run. A previous Deploy that failed or was displaced can widen the Deploy range, in which case tests run again.
- The latest matching `test.yml` run is a successful `merge_group` run from this repository's `main` queue. Its current attempt, `Test` job, test/retry steps and proof publication all succeeded.
- Exactly one unexpired artifact is bound to that run, attempt, repository and head. The parsed JSON must exactly match the current range, task selection, protocol and pinned Linux x64 Node/Bun versions. A final run lookup detects an attempt changing during download.
- Every reused test project, workspace dependency and task prerequisite stays within the audited boundary below. Test caching must be disabled for reused tests. The proof also binds the complete list of selected test projects, including those that must run again in Deploy.

## Audited boundary

The current test roots are `types`, `helpers`, `core`, `sss-key-manager` and `escrow-enclave-app`. Their prerequisites may also include `nx-run-command`. These tests do not load the native Node DIDKit addon that Deploy compiles and downloads separately. Both jobs use the `ci-tests` environment and the same seed fixture fallbacks. Escrow tests install the same checked-in Rust toolchain.

Other projects, dynamic loaders and native-dependent tests always run fresh in Deploy. A mixed selection can reuse the audited portion only: for example, a verified `sss-key-manager` test may be excluded while `network-brain-service` still runs. Each candidate is audited independently, including its full task-prerequisite closure; an unsafe candidate stays fresh without invalidating a separately safe candidate. Duplicate test configurations for one project reject reuse because exclusion operates by project name. This extends selection coverage, not the list of audited project roots. Do not expand the boundary based only on a green queue check: audit dynamic imports, native artifact use, task prerequisites and environment differences first. Changing the proof protocol requires changing both producer and consumer together.

## Fallback and rollout

An unsupported selection, different range/runtime, missing or expired artifact, failed or rerun queue verdict, corrupt metadata or API error keeps the existing Deploy test path. Proof production is optional and cannot turn successful queue tests red. Release and manual Deploy runs retain their existing behavior.

Older queue runs have no proof artifact and cannot be reused. Version-1 proof artifacts are rejected by the version-2 consumer. The first live reuse needs a subsequent eligible queue run containing the version-2 producer, followed by a staging push with the same range. Inspect the `Deploy test reuse` summary in `Determine Affected Projects` for a reason code and, on reuse, the source run ID and attempt. For full reuse, confirm that `Test Affected Projects` shows only `Record reused queue tests`. For partial reuse, the reason is `partial-matching-queue-proof`, `reused` remains false, and the summary lists covered `projects` and fresh `remainingProjects`. Confirm that the test command excludes only the covered projects and that every remaining test executes. Native compilation and downstream gates remain unchanged in both cases.

Queue depth alone does not determine whether the bases match. For example, B's queue tests can freeze `M → A+B`, then A's Deploy succeeds before B's Deploy selects its range. Deploy now compares `A → A+B`, so the proof is rejected. If A has not successfully deployed yet, both can still start from `M`; if B fetches main after A merges, both can start from `A`. A single-entry queue can also miss when Deploy is behind main.

Rollout samples should distinguish full and partial reuse, report covered versus fresh projects and measured test time saved, and report the hit rate and fallback reasons alongside per-hit time savings, grouped by observed queue depth and Deploy lag. `comparison-base-mismatch` means the base is the only differing proof field; combined range/target/runtime mismatches remain `proof-mismatch`. Record lookup overhead on misses too. The historical 5m44s duplicate job is a per-hit opportunity, not a typical saving across all Deploy runs. Low eligibility may justify a separately reviewed exact-head/task-coverage extension; it does not justify loosening this equality gate without that review.

For example, an escrow-only queue run tests `A → B`. If the last successful staging Deploy is `A` and the new head is `B`, Deploy can reuse that verdict. If the last successful Deploy is an earlier commit `Z`, Deploy tests `Z → B` again even though `A → B` passed.

Run the local contracts with:

```sh
node --test .github/tests/test-deploy-test-proof.test.cjs .github/tests/test-deploy-test-proof-workflow.test.cjs .github/tests/test-deploy-range.test.cjs
```

The contracts exercise real bounded ZIP parsing, mixed-selection dependency checks and the generated shell command, and stub the read-only Actions API. They do not prove a live post-merge artifact handoff or measure deployed time savings.
