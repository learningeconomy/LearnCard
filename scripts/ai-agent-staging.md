# Automatic AI Agent staging handoff

`AI Agent Staging` follows a completed successful `Deploy` push on main. Core
Deploy releases its branch lock before AI preparation and rollout begin, so the
next core deployment can run while AI waits for registry publication or smoke
checks. Manual staging and production releases still enter through `Deploy`.
Both callers use `ai-agent-rollout.yml` and the existing service/environment lock
and GitHub Environment approvals. The extracted rollout retains the image-build
optimizations from PR #1930.

Each admitted worker selects the newest eligible successful staging Deploy, even
when triggered by an older rerun. GitHub can replace a pending run with a later
event, so using only the triggering revision could strand a newer handoff.
Failed/manual/fork events use a separate concurrency group and cannot evict it.

The initial source check re-reads the selected Deploy run and attempt through the
Actions API, verifies its repository, workflow, event, branch and revision, and
checks that its commit is still on main. Production release commits and runs
whose source predates this handoff are excluded. No PR artifacts are consumed.
The selected source SHA is used explicitly for checkout and image tags:
`workflow_run`'s default `github.sha` is not the source Deploy revision.

## Pending changes and stale candidates

The comparison starts at the last confirmed AI staging rollout, not the last
successful core Deploy. A green no-op or a failed AI rollout does not acknowledge
pending AI changes. Missing or inaccessible history falls back to the full tree.
Nx selects AI against that accumulated range. Changes to the handoff workflows
or selector also force validation and rollout.

The checkpoint contract is a successful latest-attempt job named
`Roll out AI Agent / Deploy AI Agent <40-character source SHA>` in the trusted
`ai-agent-staging.yml` workflow, with a successful final
`Record successful AI Agent rollout` step. Job names carry the actual deployed
revision because the parent run's metadata SHA describes the default-branch
workflow checkout. Keep the names and reader in sync. History lookup is bounded
to 100 runs and 100 jobs per run; missing/incomplete evidence redeploys safely.
Manual deployments do not advance this automatic staging baseline.

Immediately before changing Trigger.dev or ECS, inside the shared target lock,
the source is checked again. A newer successful automatic staging Deploy makes
an older candidate obsolete. An untested push to main alone does not do this.
A newer Deploy retry also blocks older candidates conservatively: its earlier
attempt may already have deployed even if the retry is now red or in progress.
Source validation/API failures stop before mutation. A skipped stale candidate
never writes the terminal checkpoint; the successor retains its pending changes.
Active rollouts are not cancelled. Explicit manual rollbacks remain possible.

## Operational limits and verification

This first separation waits for the entire core Deploy to succeed. An unrelated
core failure can therefore delay AI until the next successful core run. AI starts
later within its own commit's lifecycle than the previous in-workflow parallel
job, while subsequent core deployments are freed from its tail. Measure both
core scheduling wait and AI merge-to-staging freshness before widening the split.

Run the contracts with:

```sh
node --test .github/tests/test-ai-agent-staging.test.cjs .github/tests/test-ai-agent-deploy.test.cjs .github/tests/test-failure-notification.test.cjs scripts/wait-for-didkit-registry.test.mjs
```

After merge, check a real core-to-AI handoff, the explicit image SHA, environment
approval and shared target lock, health/smoke results, terminal checkpoint and
failure notification. Observe another core Deploy progressing while AI runs.
Confirm a failed/skipped AI run leaves its changes in the next comparison range,
and an older source rerun cannot mutate after a newer successful core candidate.
Those live deployment behaviors and timing gains are not proven by local mocks.
