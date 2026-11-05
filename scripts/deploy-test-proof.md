# Deploy test reuse

Staging Deploy can reuse a successful merge-queue `Test` verdict instead of installing dependencies and repeating the same affected tests. The `test-affected` job still reports success so its downstream deployment gates retain their existing behavior. It keeps a runner for a short summary step. Native binary compilation and all other deployment checks remain independent.

The producer in `test.yml` freezes the actual comparison base and head before testing. After the tests and retry reporting succeed, it may publish one immutable `queue-test-proof-<run ID>-<attempt>` artifact containing a small JSON record. This contains commit IDs, task IDs, runtime versions and run metadata only. It contains no secrets, test logs or executable build outputs.

The consumer in `deploy.yml` uses read-only Actions APIs. Reuse requires all of these:

- A staging push with the exact same base and head as the successful queue test run. A previous Deploy that failed or was displaced can widen the Deploy range, in which case tests run again.
- The latest matching `test.yml` run is a successful `merge_group` run from this repository's `main` queue. Its current attempt, `Test` job, test/retry steps and proof publication all succeeded.
- Exactly one unexpired artifact is bound to that run, attempt, repository and head. The parsed JSON must exactly match the current range, task selection, protocol and pinned Linux x64 Node/Bun versions. A final run lookup detects an attempt changing during download.
- Every test project, workspace dependency and task prerequisite stays within the audited boundary below. Test caching must be disabled.

## Audited boundary

The current test roots are `types`, `helpers`, `core`, `sss-key-manager` and `escrow-enclave-app`. Their prerequisites may also include `nx-run-command`. These tests do not load the native Node DIDKit addon that Deploy compiles and downloads separately. Both jobs use the `ci-tests` environment and the same seed fixture fallbacks. Escrow tests install the same checked-in Rust toolchain.

Other projects, dynamic loaders, native-dependent tests and mixed selections run the full existing Deploy tests. Do not expand the boundary based only on a green queue check: audit dynamic imports, native artifact use, task prerequisites and environment differences first. Changing the proof protocol requires changing both producer and consumer together.

## Fallback and rollout

An unsupported selection, different range/runtime, missing or expired artifact, failed or rerun queue verdict, corrupt metadata or API error keeps the existing Deploy test path. Proof production is optional and cannot turn successful queue tests red. Release and manual Deploy runs retain their existing behavior.

Older queue runs have no proof artifact and cannot be reused. The first live reuse needs a subsequent eligible queue run containing the producer, followed by a staging push with the same range. Inspect the `Deploy test reuse` summary in `Determine Affected Projects` for a reason code and, on reuse, the source run ID and attempt. Confirm that `Test Affected Projects` shows only `Record reused queue tests`, while native compilation and downstream gates still run as selected.

For example, an escrow-only queue run tests `A → B`. If the last successful staging Deploy is `A` and the new head is `B`, Deploy can reuse that verdict. If the last successful Deploy is an earlier commit `Z`, Deploy tests `Z → B` again even though `A → B` passed.

Run the local contracts with:

```sh
node --test .github/tests/test-deploy-test-proof.test.cjs .github/tests/test-deploy-test-proof-workflow.test.cjs .github/tests/test-deploy-range.test.cjs
```

The contracts exercise real bounded ZIP parsing and stub the read-only Actions API. They do not prove a live post-merge artifact handoff or measure deployed time savings.
