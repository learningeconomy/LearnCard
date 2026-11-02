---
'@learncard/cli': minor
---

Make the CLI safer and more predictable for scripts and AI agents.

- `revoke`, `token --list` and `token --revoke` no longer create a seed, `.env` or profile in an empty folder. All commands that only read or act on an existing identity (`whoami`, `status`, `inbox list`, `refresh history`, `doctor`, `revoke`, `token --list`, `token --revoke`, `open`, `clr validate --dry-run-sign`) now fail in such a folder with `code: "NO_IDENTITY"` and the same hint to run `init`, and no longer write `NETWORK_URL` to `.env`. When `init`, `send`, `org apply` or another setup command creates a new identity, it says so on stderr and adds `identityCreated: { profileId, did, network }` to the `--json` result.
- `--profile-id`, `send --guardian-email` and `send --webhook-url` are checked before an identity is created, so a malformed value no longer leaves a broken `.env` behind.
- Flags and arguments are checked before anything is written or sent: an invalid recipient, `--network`, `--expires`, `--scope`, `status --limit`/`--event`, `inbox list --status`/`--limit`, or `setup-signing --endpoint`/`--did`.
- `--network` accepts `production`, `prod`, `staging`, `local` or a tRPC URL on every command (`--network production` used to fail with "Invalid URL" everywhere except `promote`).
- Every command except `repl` accepts `-y`, `--json` and `--network`. Commands that don't use a flag accept and ignore it.
- `--json` errors are now `{ ok: false, command, error, code, hint?, detail? }`. `detail` holds the full message when it spans several lines. With `--json`, usage errors (unknown command or option, missing argument, `--json` placed before the command) also print one JSON line with `code: "USAGE"`.
- `--json` errors are `code: "USAGE"` when a required value is missing in a non-interactive run or a flag value is invalid. If a command created a new identity before it failed, the error envelope also carries `identityCreated`. `--json` never prompts, so stdout holds only the JSON line even at a terminal without `-y`.
- **Breaking for scripts:** `verify --json` now prints one line, `{ ok: true, command: "verify", verified, result }`, instead of the raw result spread over several lines. It still exits 1 when the credential does not verify.
- **Breaking for scripts:** `token --json` no longer includes the raw `token` unless you pass `--show-secret`. It adds `tokenSavedTo`, the `.env` path where the token is saved as `API_TOKEN`.
- **Breaking for scripts:** `open --json --url-fragment` returns the URL without the `#seed=` fragment, plus `seedInFragment: true`, unless you pass `--show-secret`. `open` only copies the seed to the clipboard when stdout is a terminal; piped or `--json` runs (e.g. `$(cli open | tail -1)`) no longer copy it and no longer wait 60 seconds to clear the clipboard.
- Human-mode `webhook` now stops after `--timeout` (default 60 seconds) when stdin is not a terminal, as `--json` already did.
- Stricter flag validation rejects values that used to be accepted: `webhook --timeout`, `token --expires` (a positive number of days) and `status --limit` (a whole number from 1 to 100).
- The package installs a `learncard` binary as well as the existing `cli`. It now declares `engines.node >= 20` and publishes only `dist`, `examples` and the docs.
