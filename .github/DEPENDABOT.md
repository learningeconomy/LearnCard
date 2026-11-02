# Bun dependency updates (LC-2312 / CI-12)

The root `.github/dependabot.yml` has one native `bun` version-update job at `/`.
Dependabot follows the root `package.json` workspace patterns and updates the
shared text `bun.lock`; do not add a separate job for every workspace or an
additional npm job over the same manifests.

GitHub supports [text Bun lockfiles](https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories#bun)
and [Bun 1.4](https://github.blog/changelog/2026-10-20-dependabot-now-supports-npm-12-pnpm-11-and-12-and-bun-1-4/).
This repository pins Bun in `package.json#packageManager` and installs with
`bun install --frozen-lockfile` in CI. A manifest update must be accompanied by
any corresponding root lockfile changes; do not relax the frozen install to
accept a bot PR.

## Update policy

- Weekly checks, with at most **three open Bun version-update PRs**.
- Patch releases are grouped as `bun-patch-updates`. This can still be a large
  batch across the monorepo and needs normal human review and CI.
- Minor and major releases are ungrouped, so each dependency has a separate PR
  subject to the version-update limit. A patch group is not a compatibility promise.
- No automatic merge or approval. Existing Docker and Terraform jobs are preserved.
- The root Bun job covers its workspaces, not independent npm projects such as
  `.github/workflow-validation`, which has its own `package-lock.json`.

## Security updates are a separate limitation

GitHub's [current support matrix](https://github.com/github/docs/blob/main/data/reusables/dependabot/supported-package-managers.md)
marks native Bun **version updates supported** and **security updates unsupported**.
This configuration does not enable native Bun security updates, replace alerts,
rewrite existing npm security PRs, or cap all dependency/security PRs at three.
Repository security alerts and automatic security-update settings remain unchanged.

For example, [legacy PR #1747](https://github.com/learningeconomy/LearnCard/pull/1747)
changed workspace manifests without `bun.lock`; its Test job failed the frozen
install. A new scheduled Bun version update should maintain both together, but
that does not repair or supersede the old security PR automatically.

For a security alert requiring an immediate fix:

1. Keep the alert and existing security PR visible while preparing the fix.
2. In a separate branch, review and update all affected workspace manifest
   constraints to the required patched version, including any overrides.
3. With the repo-pinned Bun, regenerate the root lockfile using
   `bun install --lockfile-only --ignore-scripts`, inspect the complete diff,
   then run the normal frozen install and relevant tests/CI.
4. Merge the verified fix or link an appropriate replacement PR before closing
   an obsolete manifest-only bot PR. Do not dismiss an unresolved alert merely
   because native Bun version updates are enabled.

## First hosted rollout check

Dependabot reads this configuration from the default branch. A configuration PR
cannot prove the hosted schedule or produce its first native update before merge.
After merge, use **Insights → Dependency graph → Dependabot → Recent update jobs**
to inspect the Bun job or request a check, then verify its first generated PR:

1. The job identifies the native Bun ecosystem at `/` and discovers the intended
   root workspaces, including nested package/service directories.
2. The diff updates the affected manifest constraints and root `bun.lock` as
   required. No alternate package-manager lockfile or unrelated dependency change
   should be accepted without review. A lockfile-only update can be legitimate
   when the existing manifest range already permits the new version.
3. CI's unchanged `bun install --frozen-lockfile` passes with the pinned Bun,
   followed by the relevant checks. The dependency's API/runtime compatibility
   still needs review; lockfile consistency alone is not that proof.
4. Check the weekly cadence, patch-only grouping and version-PR limit. Inspect
   private dependency/registry failures separately if the repository later adds them.

A local run of the [official Dependabot CLI](https://github.com/dependabot/cli)
can exercise the updater and return proposed file changes without creating a PR.
That is useful pre-merge evidence, but does not prove hosted scheduling, grouping,
PR creation, or GitHub's restrictions on secrets in bot-triggered workflows.
