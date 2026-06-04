## PR Review & Auto-Approval

When asked to review a PR (e.g. "@claude review", "@claude review this", "@claude deep-review"),
perform a thorough code review AND evaluate whether the PR qualifies for Auto-Approval.

### Review Mode

You may be invoked in one of two modes, determined by the trigger phrase:

-   `@claude review` — standard mode (Claude Sonnet). Apply lane logic and
    hard-stop rules, comment on issues, auto-approve when criteria match.

-   `@claude deep-review` — extended mode (Claude Opus 4.1). Same decision
    framework as standard review, but invest more analysis effort:
    • Read source files referenced by the diff, not just the diff itself,
    to reason about cross-file implications.
    • Look for subtle issues: race conditions, off-by-one, type unsoundness,
    boundary edge cases (empty inputs, null/undefined, unicode, very
    large inputs), error-handling cascades, async timing.
    • Trace how changes interact with auth flows, state propagation, and
    the public API surface of modified packages.
    • Flag anything that "looks fine but might be wrong" with explicit
    reasoning, even if you ultimately approve.

    Begin your review with the line "**Deep Review Mode** — extended
    analysis enabled" so readers know which depth was used. All
    auto-approval rules, hard-stop rules, and lane limits apply
    normally — the deeper analysis informs the decision, it does not
    bypass any safeguard.

### Monorepo Context

This is a pnpm + Nx monorepo. Key areas:

**High risk (never auto-approve):**

-   `services/` route definitions, auth/signing helpers, models, lambda entry points — Production backend services (brain-service, lca-api, learn-cloud-service, simple-signing-service). Auth, credentials, signing, Neo4j/MongoDB, serverless deployment.
-   `packages/learn-card-types/` — Shared Zod validators and types used across the entire stack.
-   `packages/learn-card-core/` — Core wallet/plugin system.
-   `packages/learn-card-init/` — Assembles the plugin stack.
-   `packages/plugins/crypto/`, `packages/plugins/encryption/`, `packages/plugins/didkey/`, `packages/plugins/didkit/` — Cryptographic and DID operations.
-   `packages/plugins/learn-card-network/` — Network plugin bridging to brain-service.

**Medium risk (auto-approvable in Lane 3 only):**

-   `apps/` — Frontend apps (learn-card-app, scouts). User-facing but no server-side auth.
-   `packages/learn-card-base/` — React hooks, queries, UI components.
-   `packages/react-learn-card/` — React component library.

**Medium-low risk (auto-approvable in Lane 5):**

-   `services/` non-critical files — logging, error messages, comments, non-auth utilities, type imports, minor refactors.

**Low risk (auto-approvable in Lanes 1, 2, 4):**

-   `docs/` — GitBook documentation.
-   `examples/` — Example/demo apps.
-   `reference/` — Docusaurus reference docs.
-   `.changeset/` — Version changeset files.
-   `tools/`, `scripts/` — Build tooling and dev scripts.

### Review Process

1. **Fetch the diff** using `gh pr diff $PR_NUMBER` and the file list with `gh pr view $PR_NUMBER --json files,labels`.
2. **Review the code** for correctness, style, and potential issues. Leave inline comments only for actual issues or important observations. Follow the project style: strict TypeScript, arrow functions, named imports, 4-space JSX indentation.
3. **Check for hard-stop rules** (see below). If any are triggered, the PR cannot be auto-approved regardless of lane.
4. **Determine which approval lane the PR falls into** (if any).
5. **Post a summary** with your review findings and your auto-approval decision.

### Hard-Stop Rules (never auto-approve if ANY of these are true)

**Blocked labels:**

-   `do-not-merge`, `needs-manual-review`

**Blocked authors:**

-   Commits authored by `claude`, `github-actions`, or any bot account

**Blocked labels opt-in override:**

-   If the PR has the label `auto-approve/docs`, `auto-approve/tests`, `auto-approve/ui`, `auto-approve/tooling`, or `auto-approve/backend`, the lane check is still performed — the label is a signal, not a bypass. If files don't match the claimed lane, do NOT approve.

**Hard-stop content patterns (if found in the diff, never auto-approve):**

-   `eval(` usage
-   `dangerouslySetInnerHTML` or `innerHTML =` usage
-   Hardcoded secrets, API keys, seeds, or private keys
-   New tRPC procedures or HTTP endpoint definitions being added
-   Auth, permission, or role enforcement code being changed
-   `Dockerfile*`, `serverless*.yml`, `compose*.yaml`, `lambda.ts` changes
-   `.github/workflows/` changes
-   Root monorepo config changes: `nx.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, root `package.json`
-   `heroku.yml`, `Procfile` changes
-   Removal or weakening of existing tests (deleting assertions, `.skip`, commenting out tests)

**Always-blocked paths (never auto-approve if touched):**

-   `services/*/src/routes/` — route / tRPC procedure definitions
-   `services/*/src/helpers/auth*`, `services/*/src/helpers/signing*` — auth and signing helpers
-   `services/*/src/models/` — database models
-   `services/*/src/constants/auth*` — auth constants
-   `services/**/lambda.ts`, `services/**/didWeb*.ts`, `services/**/oidc*.ts`, `services/**/xApi*.ts` — Lambda entry points
-   `services/**/app.ts`, `services/**/server.ts` — service bootstrap files
-   `packages/learn-card-types/` — any file
-   `packages/learn-card-core/` — any file
-   `packages/learn-card-init/` — any file
-   `packages/plugins/crypto/`, `packages/plugins/encryption/`, `packages/plugins/didkey/`, `packages/plugins/didkit/`
-   `packages/plugins/learn-card-network/src/plugin.ts` or `types.ts`

### Auto-Approval Lanes

A PR may be auto-approved if it matches **one** of these lanes and triggers **no** hard-stop rules.

**Lane 1 — Docs / reference / metadata**

-   All changed files are in `docs/`, `reference/`, `.changeset/`, or are `*.md` / `*.mdx` files anywhere in the repo.
-   No code, workflow, infrastructure, or dependency lockfile changes.
-   LOC limit: ≤ 1000 lines changed (additions + deletions).
-   Label hint: `auto-approve/docs`

**Lane 2 — Tests only**

-   All changed files are test files (`*.test.ts`, `*.spec.ts`, `*.test.tsx`, `*.spec.tsx`) or test fixtures/helpers under `test/`, `tests/`, or `__tests__/` directories.
-   No production code changed (exception: test-support utilities under test directories are fine).
-   No tests are skipped, deleted, or weakened.
-   LOC limit: ≤ 750 lines changed.
-   Label hint: `auto-approve/tests`

**Lane 3 — Low-risk UI / frontend**

-   All changed files are in `apps/`, `packages/react-learn-card/`, or `packages/learn-card-base/`.
-   None of the changed files match these risky filename patterns: `*authentication*`, `*authorization*`, `*permission*`, `*access*`, `*provider*` (auth providers), `*client*` (API clients), `*query*` (react-query definitions), `*api*`, `*network*`, `*env*`, `*secret*`, `*credentials*` (credential issuance/verification logic — display-only is fine).
-   Changes are presentational: JSX/TSX component markup, CSS/SCSS/Tailwind styles, copy/text, layout, stories (`*.stories.tsx`), or additive UI behavior.
-   No dangerous content patterns.
-   LOC limit: ≤ 750 lines changed.
-   Label hint: `auto-approve/ui`

**Lane 4 — Low-risk tooling / examples / config**

-   All changed files are in `examples/`, `tools/`, `scripts/`, or are package-local config files (non-root `package.json`, `tsconfig.json`, `.eslintrc*`, `.prettierrc*`, `project.json`, `vite.config.*`, `jest.config.*`).
-   No deploy, infra, workflow, root workspace, or secret-related changes.
-   Dependency bumps in package-local `package.json` are OK if patch/minor only (no major version bumps).
-   LOC limit: ≤ 750 lines changed.
-   Label hint: `auto-approve/tooling`

**Lane 5 — Low-risk backend (services/)**

-   All changed files are in `services/`.
-   **None** of the changed files are in an always-blocked path (routes, auth/signing helpers, models, auth constants, lambda/app entry points — see list above).
-   No new tRPC procedures, HTTP endpoints, or middleware being added.
-   No auth, permission, role, or signing logic being changed.
-   No database queries being added or modified (e.g., Neo4j Cypher, MongoDB operations).
-   Acceptable changes: logging, error messages, JSDoc/comments, non-auth utility functions, type imports, test helpers co-located with source, renaming, and minor refactors.
-   LOC limit: ≤ 500 lines changed.
-   Label hint: `auto-approve/backend`

### Manual-Review Markers (do not auto-approve, but not alarming)

These indicate the PR needs human review but is not inherently suspicious:

-   Shared Zod validator changes (`packages/learn-card-types/`)
-   Network client or query layer changes
-   Major dependency version bumps
-   Package exports or public API surface changes
-   Cross-cutting changes spanning more than one risk tier
-   Changes that don't fit neatly into any lane

When you encounter these, say so clearly: "This PR needs manual review because [reason], but nothing concerning was found."

### Decision (3-state model)

You do **not** approve PRs yourself. The GitHub App / action runtime forbids
the assistant from submitting formal PR reviews, and attempting it wastes a
turn. Instead, you record your verdict as a **hidden marker** inside your
GitHub comment. A separate, deterministic workflow step reads that marker
after you finish and casts the actual approval with `gh pr review --approve`.
Your job is to **decide and report**; the workflow **executes**.

Communicate every decision by updating your single Claude comment (via
`mcp__github_comment__update_claude_comment`). Put your human-readable review
summary in the comment body as usual, and include **exactly one** of the
hidden markers below — on its own line — to encode the machine-readable verdict.

The marker uses the PR number and workflow run id supplied to you in the
prompt context. Substitute the real values for `<PR_NUMBER>` and `<RUN_ID>`
(they appear in your prompt as the PR number and the GitHub Actions run id).

**Approve** — PR matches a lane, passes all hard-stop checks, and is within LOC limits.
Include this marker and a one-line reason in the visible body:

```
<!-- CLAUDE_AUTO_APPROVE v1 pr=<PR_NUMBER> run=<RUN_ID> verdict=approve -->
```

Visible line, e.g.: `✅ Auto-approved (Lane N — <lane name>): <one-line reason>`

**Comment-only / manual review required** — PR is outside auto-approval scope but nothing is wrong.
Include this marker:

```
<!-- CLAUDE_AUTO_APPROVE v1 pr=<PR_NUMBER> run=<RUN_ID> verdict=reject -->
```

Visible line, e.g.: `💬 Manual review needed: <concise reason>`

**Flag concern** — PR contains something that looks risky, suspicious, or incorrect.
Use the same `verdict=reject` marker, and lead the visible body with `⚠️ <description of concern>`.

> The marker is HTML-comment syntax, so it stays invisible in the rendered
> comment. Emit it **once** and never emit both an `approve` and a `reject`
> marker in the same comment. If you are unsure, emit `verdict=reject`.

### Important Rules

-   You NEVER run `gh pr review` or any approval command yourself — only emit the marker. The workflow approves.
-   NEVER emit `verdict=approve` for your own changes (commits authored by `claude` or `github-actions`).
-   NEVER emit `verdict=approve` if any hard-stop rule is triggered, even if a label suggests otherwise.
-   A label like `auto-approve/docs` is a hint, not an override. Always verify the files actually match the lane.
-   When in doubt, emit `verdict=reject`. It is always safe to leave a thorough review without approving.
-   Keep summaries concise. Only leave inline comments for actual issues, not routine observations.
-   Always be transparent about which lane matched (or why none did) and your decision rationale.
