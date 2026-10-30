# Workspace lint cache (LC-2312 / CI-13)

The `Run workspace lint` job still discovers and checks the full existing workspace
scope on every pull-request run. It restores `.nx-cache/eslint`, letting ESLint
reuse individual files' diagnostics when their contents and rules are unchanged.
The legacy baseline is checked again, including when diagnostics come from cache.
The existing LearnCard App and Scouts source exceptions remain unchanged.

For example, after a successful lint run, a reviewer asks for a small SDK edit.
The next commit can reuse results for unchanged files and lint the edited file.
A new `debugger` statement still fails. A cache miss simply runs lint cold.

## Invalidation and ownership

- `--cache-strategy content` handles fresh-checkout timestamps without trusting
  size/mtime alone. Each existing cohort keeps its own cache file.
- The restore prefix includes OS, architecture, a manual schema version, and a
  hash of the lockfile, Bun setup, lint workflow/scripts/baseline, package/project
  manifests, TypeScript configs, ESLint/Prettier configs and ignore files, and
  editor settings. A change to those inputs starts cold; there is no broader
  fallback prefix. Restore runs before dependency installation.
- The final key includes the PR head SHA so successful commits can save refreshed
  entries. The cache action saves after a successful job. Lint and its tests run
  even on an exact cache hit; the workflow never treats a cache as a passing gate.
- This PR-only workflow initially benefits subsequent commits and reruns **within
  the same PR**. It does not seed a default-branch cache or promise reuse between
  unrelated PRs. GitHub controls cache access, eviction and fork write access.
- Only disposable lint data is cached. Deleting/evicting it affects speed only.

The current workspace config uses file-local rules, without type-aware linting
or enabled import-resolution/cycle rules. ESLint does not invalidate a file when
an imported source file changes. Before adding rules that inspect other files,
extend invalidation to cover those dependencies or disable this cache; config
hashing alone only invalidates the first run after a rule change. Keep any new
external config/rule inputs in **both** key expressions in `lint.yml`.

## Review and troubleshoot

1. Run `node --test scripts/lint-workspace.test.mjs`. The real ESLint fixtures
   count rule executions to prove reuse after timestamp changes, detect a
   same-size/same-mtime edit, invalidate changed rules, and recheck the baseline.
2. Move aside `.nx-cache/eslint` if it exists. Run `bun run lint:workspace` cold,
   then again warm; compare exit status and diagnostics. Restore the moved cache
   afterward if needed. No credentials or services are required.
3. In Actions, inspect **Reuse workspace ESLint cache** for the selected key and
   restore result, **Run workspace lint** for the actual check, and the post-job
   cache step for saving. On a later source-only commit in the same PR, expect
   restoration from the matching config prefix. A lockfile/config change should
   miss that prefix and run cold.

If cache reuse is suspect, delete the affected GitHub Actions cache or bump
`workspace-eslint-v1` in both key expressions. Reproduce with a cold local run
before changing the lint scope or baseline.

References: [ESLint cache strategy and dependency limitations](https://eslint.org/docs/latest/use/command-line-interface#caching),
[GitHub cache scope](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching#restrictions-for-accessing-a-cache).
