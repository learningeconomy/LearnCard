# CI test retries (LC-2312 / CI-08)

A single intermittent test used to restart the entire affected Nx test command,
up to three attempts. The PR test gate, automatic deployment test gate, and
Maid-Service housekeeping job now run Nx once, with a default of one retry for
each failing Vitest case. Recovered cases are labeled **flaky** in the job summary
and with `[CI flaky]` in console output.

For example, if 899 cases pass and one fails once, only that case runs a second
attempt. The summary names the recovered case. A case that fails both attempts
still fails the gate. A build or non-Vitest target failure also fails the gate;
there is no automatic whole-command recovery for infrastructure failures.

## Scope

Only the `Run tests` steps in `test.yml`, `deploy.yml`, and `maids.yml` set
`LC_CI_TEST_RETRY=1` and an absolute `LC_CI_TEST_REPORT_DIR`. Maid-Service runs
on pushes to main; other commands keep their existing configuration. Missing the
report directory while opting in fails configuration rather than enabling
unreported retries.

`createVitestConfig` applies the retry default only when the project hasn't set
one, and appends the CI reporter to the project's existing reporters. It adds the
default console reporter only when none are configured. Individual tests can also
explicitly configure their retry count. Vitest reruns per-case hooks with a retried case;
module imports, setup files, `beforeAll` and `afterAll` do not gain a suite retry.
No Nx dependency build, Rust test or other non-Vitest command is retried here.
Each Nx step has one 20-minute timeout. Maid-Service previously allowed three
10-minute attempts; unrelated deployment-operation retry steps are unchanged.

## Reporting and limits

Each initialized Vitest process creates a unique private directory, then atomically
writes case identities and counters. Concurrent projects cannot overwrite each
other's reports. Reports exclude error bodies, stack traces and test console
output. Case titles and source paths appear in summaries, as they do in normal
test logs; do not put credentials or personal data in test names.

The summary runs even after a failed Nx step and shows its actual outcome. It
lists recovered/permanently failing cases, failed modules and unhandled-error
counts. An incomplete or corrupt report fails the summary step; a report with
failed/interrupted execution also cannot accompany a successful Nx outcome.
A failure in the Nx step remains a job failure without `continue-on-error`.

Counts cover **executed Vitest processes**, not every selected Nx task. Nx cache
hits do not restore these temporary report files; their original `[CI flaky]`
warning remains in cached terminal output. No reports can also mean there were
no affected Vitest projects, a build failed before testing, or execution stopped
early. The summary explicitly avoids claiming complete passing coverage from an
absent report. Cache-input/output design is part of the separate CI-15 audit.
Vitest retry reports are not uploaded as artifacts.

All workspace packages whose test script invokes Vitest use the factory, including
the AI agent and credential viewer's `vite.config.ts` files. Their existing test
options and Vite plugins/aliases are preserved. Runtime regressions exercise the
AI agent's Node globals and built-output exclusions, the viewer's source alias,
and custom reporters alongside retry reporting; they do not count plugin objects.

## Nx inputs

The shared `ciTestConfig` named input covers the shared config, retry tools,
local Vite/Vitest config and package scripts, plus the `LC_CI_TEST_RETRY` value.
Test and coverage defaults include it alongside `default` and `^default`.
Explicit Vitest test input lists append it while retaining existing inputs;
project-level lists replace defaults rather than extending them automatically.
See [Nx input configuration](https://nx.dev/docs/kb/configure-inputs).

Shared config/report changes now select real affected test targets and invalidate
cached tests. The report directory is deliberately not hashed: a different private
temporary destination does not change test behavior. This does not promise report
replay from cache. The wider dependency-input/cache-output audit remains CI-15.
Non-Vitest targets inheriting the defaults can also be conservatively selected.

## Infrastructure rollout

For the first week after merge, inspect failed PR/automatic-deploy Test jobs and
record whether the cause is a case assertion, setup/container start, Mongo binary
download, registry pull, build or another command. Check recovered cases in the
summary separately; a recovered assertion is not an infrastructure recovery.
Include the run link and failure category in LC-2312 before manually rerunning.
There is no automatic monitor or claim of measured post-merge reliability here.

If container/registry/download failures dominate, address those operations with
bounded retries or prewarming in the separate CI-11 infrastructure workstream.
This PR deliberately does not repeat a whole successful build/test graph for an
infrastructure failure. The ticket's first-attempt success target is still open.

## Verify and maintain

After the repository's frozen dependency install, run:

```sh
node --test scripts/ci-test-retries/retry.test.cjs
```

The regression suite starts real Vitest processes with this shared configuration,
both standalone Vite configs and real Nx build/test fixtures. It checks healthy/flaky/permanent cases,
concurrent writers and summary rows, recovered-case warnings, opt-out/misconfiguration,
import/setup/teardown failures, non-Vitest/build failures and incomplete/corrupt evidence.
Corrupt evidence cannot append a partial passing summary, and the summary retains
each supplied test-step outcome without depending on its surrounding wording.
Every workspace manifest whose test script invokes Vitest also runs a controlled
case through its actual resolved CI test options and must emit a valid report.
Those reporting-only fixtures isolate app plugins and service setup; the standalone
preservation cases above exercise their normal config pipeline separately.
This detects a new package bypassing reporting without matching factory source text
or imposing an arbitrary minimum workspace count.
It also queries the real workspace Nx graph: shared config/reporter/summary changes
must select every workspace Vitest project, and each project's resolved `test`
target inputs must include `ciTestConfig`. A coverage/build target selecting the
same project cannot substitute for the test target's cache dependency.
Isolated fixtures prove actual cache hits/misses for inherited and explicit inputs,
shared/config edits, and the retry flag (not report location). The non-Vitest fixture is a failing Node command,
not the production Rust graph. Source-pattern inventories and exact YAML-step
snapshots are not substitutes for these execution checks.

The reporter uses the pinned Vitest 4 reporter API, specifically
[TestCase diagnostics](https://vitest.dev/api/advanced/test-case) and
[Reporter lifecycle hooks](https://vitest.dev/guide/advanced/reporters).
Run these contracts when upgrading Vitest; these APIs can change between versions.
