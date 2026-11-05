# Native Nx task-cache pilot

Run **Nx cache experiment** manually on the experiment branch. This pilot does
not change the normal Test/E2E jobs or enable a production cache service.

The normal Nx scheduler runs four test targets (`core`, `types`, `helpers`,
`vc-plugin`) and their five build dependencies. All non-build targets have caching
disabled in the disposable workspace. Build inputs include project/dependency
files, root configuration, lockfile and toolchain. The same overrides apply in
every timing arm. The checked-out source files are restored in `finally`.

Nx uses its supported HTTP remote-cache client against an authenticated,
runner-local endpoint. The endpoint transfers native per-task payloads, not a
runner's local Nx database. A main-source producer exports five build archives;
consumers verify their identity/digests and never export writes. Missing individual
hashes rebuild normally. An incompatible or corrupt artifact invalidates the
experiment instead of being reported as a successful warm sample.

## Running

```sh
gh workflow run nx-cache-experiment.yml --ref <experiment-branch> \
  -f consumer_ref=refs/pull/NUMBER/head \
  -f second_pr_ref=refs/pull/OTHER_NUMBER/head \
  -f merge_group_run_id=SUCCESSFUL_TEST_RUNNER_MERGE_GROUP_RUN_ID
```

`consumer_ref` defaults to the workflow revision. The optional second PR and queue
run are resolved to immutable SHAs before any samples start. An ordinary run makes
two repetitions of each cache-disabled/cold/warm arm on identical consumer source,
plus a source-invalidation probe that appends a harmless comment to the types
source before executing the same tasks. Optional additional refs replay their
own source with the same main payloads.

To test reuse between independent workflow runs, repeat with
`-f producer_run_id=PREVIOUS_SUCCESSFUL_EXPERIMENT_RUN_ID`. That run's immutable
`nx-main-task-payloads` artifact is reused; the new run does not produce a cache.
This is an operator-selected experiment artifact from the same repository, not
an independently authenticated production-main cache. The main source SHA and
toolchain identity are retained in its manifest.

## Reading results

Each `nx-result-*` artifact contains only a structured result: source, graph,
per-task hashes/statuses/durations, fresh test counters and numeric phase timings.
The summary rejects missing/failed samples, different paired test counts/graphs,
cached tests, local rerun hits and paired warm arms without five remote build
hits. Invalidation must change the types build hash and execute it freshly.
Cross-source samples may legitimately miss; their actual per-task hits must be
read before claiming cross-PR reuse.

Compare **complete job times** from the Actions jobs API, including checkout,
installation, artifact download, verification and upload. The reported Nx command
time is a component, not the whole job. Report producer cost separately and do not
amortize it without an explicit reuse count. Workflow elapsed time also includes
producer dependency and the matrix's three-job concurrency limit.

These are five-build pilot timings, not whole-Test/E2E performance. A historical
merge-group SHA replay proves behavior on that source; it is not a live
`merge_group` event or a completed default-branch cache rollout. Artifact transport
does not prove production Actions-cache branch visibility. The Jira shared-cache
item remains open until a production backend/producer policy and live subsequent
PR/merge-queue acceptance have been adopted and verified.

Offline checks: `node .github/tests/test-nx-cache-experiment.test.cjs`.
