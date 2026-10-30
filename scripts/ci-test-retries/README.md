# CI test retries (LC-2312 / CI-08)

A single intermittent test used to restart the entire affected Nx test command,
up to three attempts. The PR test gate and automatic deployment test gate now run
Nx once, with a default of one retry for each failing Vitest case. Recovered cases
are labeled **flaky** in the job summary and with `[CI flaky]` in console output.

For example, if 899 cases pass and one fails once, only that case runs a second
attempt. The summary names the recovered case. A case that fails both attempts
still fails the gate. A build or non-Vitest target failure also fails the gate;
there is no automatic whole-command recovery for infrastructure failures.

## Scope

Only the `Run tests` steps in `test.yml` and `deploy.yml` set
`LC_CI_TEST_RETRY=1` and an absolute `LC_CI_TEST_REPORT_DIR`. Other commands keep
their existing configuration. Missing the report directory while opting in fails
configuration rather than enabling unreported retries.

`createVitestConfig` applies the default retry and keeps Vitest's default console
reporter alongside the custom reporter. Individual tests can still explicitly
configure their own retry count. Vitest reruns per-case hooks with a retried case;
module imports, setup files, `beforeAll` and `afterAll` do not gain a suite retry.
No Nx dependency build, Rust test or other non-Vitest command is retried here.
The Nx step has one 20-minute timeout, replacing three 20-minute attempts.
Unrelated deployment-operation retry steps are unchanged.

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
No reports are uploaded as artifacts.

## Verify and maintain

After the repository's frozen dependency install, run:

```sh
node --test scripts/ci-test-retries/retry.test.cjs
```

The regression suite starts real Vitest processes with this shared configuration
and real Nx build/test fixtures. It checks healthy/flaky/permanent cases,
concurrent writers, opt-out/misconfiguration, import/setup/teardown failures,
non-Vitest/build failures, incomplete/corrupt evidence and workflow propagation.
The non-Vitest fixture is a failing Node command, not the production Rust graph.

The reporter uses the pinned Vitest 4 reporter API, specifically
[TestCase diagnostics](https://vitest.dev/api/advanced/test-case) and
[Reporter lifecycle hooks](https://vitest.dev/guide/advanced/reporters).
Run these contracts when upgrading Vitest; these APIs can change between versions.
