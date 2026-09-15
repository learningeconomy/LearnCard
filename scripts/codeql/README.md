# Full CodeQL comparison

After the workflow is merged into the default branch, open **Actions → CodeQL full comparison → Run workflow**.

- **Target ref:** a branch, commit SHA, or `refs/pull/1549/head` (substitute the PR number).
- **Baseline ref:** `main` by default, or a commit SHA for a reproducible baseline.

The workflow scans both refs with the same pinned CodeQL bundle, disables PR diff filtering, and respects each ref's CodeQL configuration. JavaScript analysis covers both JavaScript and TypeScript. It does not upload alerts to the Security dashboard or modify dismissal state.

The run summary lists remaining, new, and no-longer-detected findings. Download `codeql-full-comparison` for the Markdown report, or the baseline/target artifacts for SARIF, exact commit SHAs, and scan configurations. Counts include dismissed findings; they are not GitHub's open-alert count. A moved location may appear as an absent/new pair. The report warns if scan configurations differ because exclusions can reduce findings without fixing vulnerable code.

For a PR introducing this workflow, GitHub's manual-dispatch UI becomes available after it reaches the default branch. The workflow can then scan any selected PR without adding audit commits to that PR.

Maintain the pinned bundle in `.github/workflows/codeql-full.yml`; both sides must use the same version. The comparison refuses mismatched query packs/rules or diff-informed SARIF.

Local regression tests:

```sh
python3 -m unittest discover -s scripts/codeql -p 'test_*.py'
```
