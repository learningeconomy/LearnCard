# Oxlint fast path

## Why

`WorkspaceLint` (ESLint via `bun run lint:workspace`) is the full monorepo lint gate. On a representative hosted run the **Run workspace lint** step alone took ~12.7 minutes (job wall ~13.6 minutes; Actions run `41160615148` on `main`-line PR lint).

Oxlint is a native Rust linter. Locally on this branch, `bun run lint:ox` completes in ~0.2s on the same tree. The CI job intentionally skips the composite setup / full `bun install` and runs `bunx oxlint@1.90.0`, so wall time is dominated by checkout + Bun setup, not the lint itself.

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
4. **Ignores mirror ESLint’s bulk ignores** (swagger-ui, dist, didkit, etc.) plus a few vendor/script paths that only tripped rules we are not fixing in this spike.

## Local

```bash
bun run lint:ox
```

## Expanding coverage

Prefer enabling one rule (or category) at a time after clearing or baselining findings. `@oxlint/migrate` can generate a fuller config from `eslint.config.mjs` when we are ready to overlap rules and eventually disable duplicates in ESLint.
