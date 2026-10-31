# Oxlint fast path

## Why

`WorkspaceLint` (ESLint via `bun run lint:workspace`) remains the full monorepo lint gate. Oxlint is a native Rust linter that runs a curated correctness subset in well under a second locally, so obvious correctness breaks fail closed without waiting on the ESLint wall.

## Coexistence with ESLint

| Path                | Tool                                   | Role                                                  |
| ------------------- | -------------------------------------- | ----------------------------------------------------- |
| `WorkspaceLint` job | ESLint (`lint:workspace`)              | Source of truth / ratchet / baseline                  |
| `OxLint` job        | oxlint (`lint:ox`)                     | Fast correctness subset; fail closed on enabled rules |
| `#1867` (CI-13)     | ESLint result cache on `WorkspaceLint` | Speeds **repeat** PR lint; does not touch `OxLint`    |

Rules of engagement:

1. **Do not fold oxlint into the WorkspaceLint job.** That would thrash the same job #1867 is optimizing and couple two different tools’ caches.
2. **ESLint remains required.** Passing oxlint does not waive WorkspaceLint.
3. **Phase-1 rule set is intentionally small.** `.oxlintrc.json` enables a curated correctness subset that is currently clean on `main`. Broader categories (React compiler rules, unused-vars, unicorn defaults) still fire thousands of findings and stay off until a dedicated cleanup / migrate pass.
4. **Ignores mirror ESLint’s bulk ignores** (node_modules, dist/build, swagger-ui, didkit, coverage, and similar build/vendor artifacts). Do not add path ignores to hide live source — fix or ratchet the rule instead.

## Local

```bash
bun run lint:ox
```

`package.json` `scripts.lint:ox` and `devDependencies.oxlint` are the single source of truth for flags and version. The `OxLint` CI job runs `bun run lint:ox` after the shared composite setup (`bun install --frozen-lockfile`, cache consumer) so CI matches local with no duplicated CLI. An earlier bunx pin skipped install for wall clock; frozen-lockfile + the script is preferred so the lockfile stays the version pin and flags cannot drift.

## Expanding coverage

Prefer enabling one rule (or category) at a time after clearing or baselining findings. `@oxlint/migrate` can generate a fuller config from `eslint.config.mjs` when we are ready to overlap rules and eventually disable duplicates in ESLint.
