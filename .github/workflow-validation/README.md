# GitHub workflow validation (LC-2312 / CI-04)

The **Workflow validation** check runs on every pull request, merge-group entry
and main push. It checks the integrated checkout, without a full monorepo install
or service credentials. Running on all PRs prevents a future required check from
remaining pending when a PR changes no GitHub files.

For example, a second `jobs:` key can replace a deployment block in a permissive
YAML parser. This check rejects that PR with the file and line of the duplicate.

## Run locally

Install actionlint 1.7.12 using its official release binary or Go 1.25+:

```sh
go install github.com/rhysd/actionlint/cmd/actionlint@v1.7.12
npm ci --prefix .github/workflow-validation --ignore-scripts --no-audit --no-fund
npm test --prefix .github/workflow-validation
npm run check --prefix .github/workflow-validation
```

Put actionlint on PATH, or set `ACTIONLINT` to its executable. The checker rejects
another version. CI downloads the Linux x64 release and verifies its SHA-256
against the checksum pinned in the workflow before extracting it. The npm lockfile
pins the small YAML parser dependency graph separately from application packages.

## Coverage and exceptions

- Strictly parse every `.yml`/`.yaml` under `.github`, including composite action
  metadata and validator configuration. Duplicate keys fail; no last-key-wins mode.
- Use actionlint for all top-level workflow files, including expression, action
  input, reusable-workflow and matrix validation.
- Remote action input checks depend on actionlint's bundled signatures. Newer or
  unknown action refs may not have an input signature; actionlint does not fetch
  live metadata. This gate is not proof that actions or deployments execute.
- ShellCheck and Pyflakes integrations are disabled explicitly. This is a workflow
  structure gate, not a new shell/Python lint rollout. Composite action YAML gets
  strict parsing; actionlint does not fully validate composite action semantics.
- actionlint 1.7.12 has stale metadata for `create-github-app-token@v3`:
  [the actual action accepts client-id](https://github.com/actions/create-github-app-token/blob/v3/action.yml).
  `.github/actionlint.yaml` exempts only its missing-app-id and unknown-client-id
  diagnostics in `claude.yml`. The checker independently requires a nonempty app
  identifier and private key. Regression fixtures prove missing credentials,
  unrelated unknown inputs and other workflow files still fail. Update/remove the
  exceptions when actionlint's bundled metadata catches up; do not broaden them.

## Required-check rollout

After merge, confirm this exact **Workflow validation** context succeeds for a
normal PR and a real merge-group entry, including an unrelated-file PR. Then add
that context to the repository's required checks as the separate LC-2312 R1
rollout. This PR does not change branch protection or merge-queue settings.

The negative fixtures deliberately break temporary repositories and run the real
validator, so a successful test run proves failures are detected without leaving
an intentionally broken workflow in the live repository.
