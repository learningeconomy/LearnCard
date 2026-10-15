# Native experiment fork workflow

Development moved to [goblincore/LearnCard2](https://github.com/goblincore/LearnCard2) on October 15, 2026. Continue on `codex/vesper-73`. The fork's `main` was fast-forwarded to upstream `main` at `279cdb4daab767038f44bfef0088bece16741b43`; no fork-only commits were replaced.

## Remotes and checkout

Reuse `/Users/donny/.codex/worktrees/vesper-73/LearnCard`. This preserves the existing dependencies, ignored local configuration, build products and simulator installation. It is still a worktree of the original monorepo; other worktrees keep their original remote configuration.

| Remote   | Repository                  | Purpose                                                     |
| -------- | --------------------------- | ----------------------------------------------------------- |
| `origin` | `learningeconomy/LearnCard` | Upstream SDK, source and backend development; fetch updates |
| `fork`   | `goblincore/LearnCard2`     | Publish native experiment work                              |

The local native branch tracks `fork/codex/vesper-73` and has `branch.codex/vesper-73.pushRemote=fork`. Plain `git push` from this branch goes to the fork. Do not rename `origin`, change its shared push URL, or set a repository-wide push default: those changes would affect unrelated worktrees.

```bash
git push
# Explicit equivalent:
git push fork codex/vesper-73
```

GitHub CLI commands need an explicit repository because `origin` still names upstream:

```bash
gh run list --repo goblincore/LearnCard2 --branch codex/vesper-73
gh run view RUN_ID --repo goblincore/LearnCard2
```

The upstream experiment branch is retained as the existing snapshot. Future native pushes go to the fork; this move does not delete or update upstream branches.

## Keeping the fork current

```bash
gh repo sync goblincore/LearnCard2 --source learningeconomy/LearnCard --branch main
git fetch --no-tags origin main
git fetch --no-tags fork main
```

Use normal fast-forward sync, never `--force`. If fork `main` diverges, inspect and preserve its commits before reconciling it.

Syncing fork `main` and integrating new SDK/backend contracts into the experiment are separate operations. The migration preserves the current feature history, including its inherited monorepo/consent work. At migration it was 64 commits behind and 61 ahead of current upstream `main`; no rebase or merge is silently included. Schedule integration as an explicit change, review conflicts and run the [native regression suite](TESTING.md) before treating new upstream contracts as compatible. There is no recurring sync job.

Keep the whole monorepo fork for now: the native adapter imports shared SDK, types and selected web protocol helpers. Copying only `apps/learncard-native` into an empty repository would lose those build dependencies.

## Backend and local configuration

Git hosting does not select the backend. The app continues using its existing explicit staging network/LearnCloud/recovery endpoints and approved shared Firebase project. No backend is deployed from this migration and no backend environment or secret is copied into the fork.

`scripts/prepare-account.ts` uses tracked public tenant client configuration and an ignored local test email configuration. Native CI uses disposable fixtures and the non-deliverable test address; it does not need production/backend secrets. Keep `.env` files, generated account configuration/SDK resources, device/recovery material and staging identities ignored. The existing local configuration and Keychain are left in place. New checkouts must configure their own approved test login as described in [README](README.md).

The fork has no repository secrets or environments configured at migration. Do not copy deployment credentials or enable a backend publishing path merely to run the native tests. The [Vesper checks workflow](../../.github/workflows/vesper-checks.yml) is portable and runs the same native test script on branch pushes. Inspect the fork's actual run; the last upstream creator run was cancelled and is not a green baseline.
