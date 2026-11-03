---
'@learncard/cli': minor
---

Help coding agents discover and use the whole LearnCard surface from the CLI.

- `commands [name...] [--json]` prints a manifest of every command, built from the CLI's own command tree: arguments, options, effect (`read`, `write`, `local` or `varies`), whether it can create an identity or connect, output fields and examples, plus global flags, environment variables, error codes and docs links. Each command's `--help` now ends with examples.
- `capabilities [id] [--json]` maps what LearnCard can do to the CLI command, SDK method, Network REST route and docs page for each.
- `call <method>` calls any `learnCard.invoke` SDK method as the folder's identity (`--args <json|@file|->`, `--as`, `--list`, `--dry-run`). Methods that can change data need `--write`, and methods that return secrets need `--show-secret`. On-chain methods (`transferTokens`) also need `--chain <name>`, and the wallet's chain is checked before anything is submitted; mainnet is used only when named. It never creates an identity, read calls don't register DIDs with LearnCloud, and results are converted to plain JSON.
- `api <METHOD> <path>` calls the LearnCard Network REST API with `LEARNCARD_API_KEY` or the folder's `API_TOKEN` (`--data`, `--query`, `--timeout`, `--dry-run`, `--spec [--fetch]`). Methods other than `GET`/`HEAD` need `--write`, as do the `GET` routes that change state (`/challenges`, `/inbox/guardian-approval/{token}`) however the path is spelled. The token is never printed, and non-2xx responses fail with code `HTTP_<status>`.
- `skill install` writes the LearnCard skill for coding agents to `.claude/skills/`, `.cursor/rules/` or `.agents/skills/` (`--target`, `--dir`, `--force`, `--print`). It works offline, never touches the folder's identity, and refuses to write through symlinks (`UNSAFE_PATH`).
