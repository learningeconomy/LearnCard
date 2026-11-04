---
name: learncard
description: Issue, send, track, verify and revoke verifiable credentials (digital badges) with LearnCard, and call the LearnCard Network SDK or REST API, using the LearnCard CLI (npx @learncard/cli). Use when a task mentions LearnCard, the LearnCard Network, verifiable credentials, Open Badges, ConsentFlow contracts, signing authorities or LearnCard API tokens.
---

# LearnCard

The LearnCard CLI (`npx @learncard/cli`, also installed as `learncard`) sets up an issuer identity, sends credentials, tracks and verifies them, and bridges to the full SDK (`call`) and REST API (`api`). Everything below is non-interactive and machine-readable.

## Ground rules

1. **Staging first.** Pass `--network staging` to every command until the user decides to go to production. Production profiles are public, profile IDs are globally unique, and production sends reach real people.
2. **One folder per network.** The identity (seed, profile ID, network) lives in the `.env` of the current folder. Use a dedicated empty folder such as `learncard-staging/`. Never run the CLI inside an application's source folder: it would read and write that app's `.env`.
3. **Never prompt.** Pass `-y` and `--json` on every command (or set `LC_YES=1`). Give every value as an argument or flag.
4. **Parse stdout only.** With `--json`, stdout is exactly one JSON line; progress text goes to stderr.
5. **Ask the user before anything irreversible** (see below) and before any production command.
6. **Never print secrets.** Do not read, echo or log `.env`, `secrets.env`, `SECURE_SEED` or `API_TOKEN`.
7. The first `npx` run downloads the package and can take a minute or more. Use a long timeout for it.

## Discover before you act

```bash
npx @learncard/cli commands --json          # every command: arguments, options, effect, examples
npx @learncard/cli commands send --json     # one command
npx @learncard/cli capabilities --json      # what LearnCard can do -> CLI commands, SDK methods, REST paths, docs
npx @learncard/cli status --help
```

In `commands --json`, `effect` is `read`, `write`, `local` or `varies` (`call`/`api`: depends on the method), and `createsIdentity: true` marks commands that create an identity in an empty folder. Both are upper bounds over a command's flags. `network: false` means the command never connects; `verify` (DID resolution) and `clr validate` (with `--dry-run-sign`) do connect. Prefer a built-in command when one exists; use `call` or `api` for the rest.

## Recipes

### First credential on staging

```bash
mkdir learncard-staging && cd learncard-staging
npx @learncard/cli init --network staging --name "Acme Test Issuer" -y --json
npx @learncard/cli send person@their-domain.org --network staging -y --json --suppress-delivery
npx @learncard/cli status <activityId> --network staging --json
```

- `init` creates the identity and a staging profile; it sends nothing. Its result has `profileId`, `did`, `created`.
- `send` (confirm first) returns `activityId`, `status` (`PENDING` or `ISSUED`), `claimUrl` for email/phone recipients, and `templateUri`. `--suppress-delivery` skips the claim email; the credential still waits for the recipient. Use an address a real person controls; placeholder domains are rejected.
- `status <activityId>` reports the latest event in `state` (`CREATED`, `DELIVERED`, `CLAIMED`, ...). Without an ID it lists recent sends.
- `npx @learncard/cli whoami --network staging --json` shows the folder's identity and any managed profiles.

### Issuer organization from a spec

```bash
npx @learncard/cli org apply org.yaml --network staging --dry-run -y --json
npx @learncard/cli org apply org.yaml --network staging --secrets-out ./secrets.env -y --json
```

Show the user the `--dry-run` plan (`changes`) before applying. Service-account tokens go only to the `--secrets-out` file. Send as a managed profile with `send ... --as <profileId>`. To move an org to production later (after the user agrees):

```bash
npx @learncard/cli promote --from staging --to production --org org.yaml --dry-run -y --json
```

### API token for a backend

```bash
npx @learncard/cli token --scope "boosts:write" --network staging -y --json
npx @learncard/cli token --list --network staging --json
npx @learncard/cli token --revoke <grantId> --network staging -y --json
```

The token is saved to `.env` as `API_TOKEN` and is not printed (`tokenSavedTo` names the file). Tell the user where it is; don't copy it into code or chat.

### Connect users' LearnCards (ConsentFlow)

```bash
npx @learncard/cli consent-contract --name "Acme" --redirect-url http://localhost:3000/consent-callback --network staging -y --json
```

Returns `contractUri` and `consentUrl` and writes starter files listed in `files`.

### Verify, check setup, revoke

```bash
npx @learncard/cli verify credential.json --json        # verified: true|false; exit 1 when not verified
npx @learncard/cli doctor --network staging --json      # preflight; ok reflects the checks
npx @learncard/cli revoke <credentialUri> --network staging -y --json   # irreversible: confirm first
```

## Beyond the built-in commands

### `call`: any SDK method as the folder identity

```bash
npx @learncard/cli call --list --json
npx @learncard/cli call createBoost --describe --json
npx @learncard/cli call getProfile --network staging --json
npx @learncard/cli call countBoosts --network staging --json
npx @learncard/cli call getPaginatedBoosts --args '[{"limit":10}]' --network staging --json
npx @learncard/cli call createBoost --args @args.json --dry-run --network staging --json
npx @learncard/cli call createBoost --args @args.json --write --network staging -y --json
```

- Run `call <method> --describe` first: it prints the signature, parameters, the flags a real call needs and an example, offline.
- `--args` takes JSON: an array is the positional arguments, any other value is a single argument; a bare non-JSON value such as an `lc:` URI is one string (`--args lc:network:…`); `@file` reads a file and `-` reads stdin.
- Methods whose names start with `get`, `list`, `count`, `resolve`, `verify`, `search` and similar are reads. Everything else is a write and needs `--write`; `-y` does not imply it. Run `--dry-run` first and confirm writes with the user.
- On-chain methods (`transferTokens`, marked `(on-chain)` in `--list`) also need `--chain <name>`. The Ethereum plugin defaults to mainnet (real funds) whatever `--network` says. Use a testnet such as `--chain sepolia` unless the user explicitly wants mainnet; the CLI refuses if the wallet reports a different chain.
- `--as <profileId>` acts as a managed profile (see `whoami`). `call` never creates an identity.
- Result: `{ok, command:"call", method, effect, result}`.

### `api`: the LearnCard Network REST API

```bash
npx @learncard/cli api --spec --json
npx @learncard/cli api GET /profile --network staging --json
npx @learncard/cli api POST /boost/paginated --data @body.json --write --network staging --json
```

- Auth uses `LEARNCARD_API_KEY` or the folder's `API_TOKEN` (from `token`). The token is never printed, including in `--dry-run`.
- `GET` and `HEAD` are reads. Every other method needs `--write`, even routes that only read (several list routes are `POST`). The GET routes that change state (`/challenges`, `/inbox/guardian-approval/{token}`) need `--write` too. Use `--dry-run` to see the request first.
- A `#` in the path is rejected (fragments are never sent).
- `--query k=v` adds query parameters; `--timeout` changes the 30 s default.
- Result: `{ok, command:"api", status, method, path, data}`. Find routes in the OpenAPI spec (`api --spec --fetch --json` lists operations).

## JSON contract

- Success: `{"ok":true,"command":"<name>",...}`, exit 0.
- Failure: `{"ok":false,"command":"<name>","error":"...","code":"...","hint":"...","detail":"..."}`, exit 1. `hint` and `detail` are optional.
- `verify` adds `verified`; `doctor` and `clr validate` set `ok` to whether their checks passed.
- If a result or error envelope contains `identityCreated` (`{ profileId, did, keyDid, network }`), the folder now has a new identity (and a new public profile on that network). Tell the user.
- `--json`, `-y` and `--network` may come before or after the command.

| `code`                     | Meaning                                                                       | What to do                                                                                        |
| :------------------------- | :---------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------ |
| `USAGE`                    | Bad command, flag or argument. Nothing was done.                              | Fix it using `commands <name> --json` or `--help`.                                                |
| `NO_IDENTITY`              | The folder has no identity and the command won't make one.                    | Check you're in the right folder; then, with the user's agreement, `init --network staging`.      |
| `WRITE_REQUIRES_FLAG`      | `call`/`api` would change state.                                              | Confirm with the user, then re-run with `--write` (try `--dry-run` first).                        |
| `UNKNOWN_METHOD`           | `call` method does not exist.                                                 | Use the suggestions in `hint`, or `call --list --json`.                                           |
| `NOT_FOUND`                | An ID you passed (e.g. a `status` activity ID) doesn't exist on this network. | List IDs first (`status --json`); check `--network`.                                              |
| `NO_API_TOKEN`             | `api` has no bearer token.                                                    | Ask the user to set `LEARNCARD_API_KEY`, or create one with `token` (staging first).              |
| `SECRET_REQUIRES_FLAG`     | `call` method returns a secret (key, token, signed VP).                       | Don't. Only re-run with `--show-secret` if the user explicitly asks.                              |
| `CALL_FAILED`              | The SDK method threw.                                                         | Read `detail`; check `--args` against the method's parameters.                                    |
| `CHAIN_REQUIRED`           | `call` on an on-chain method without `--chain`.                               | Ask the user which chain. Any mainnet moves real funds.                                           |
| `CHAIN_MISMATCH`           | The wallet's chain differs from `--chain`. Nothing was sent.                  | Don't switch `--chain` to match; ask the user.                                                    |
| `NETWORK_ERROR`, `TIMEOUT` | `api` could not reach the network in time.                                    | Check `--network`; retry reads; for writes check state before retrying.                           |
| `NETWORK_MISMATCH`         | The folder (or its `API_TOKEN`) is set up for another network.                | Drop `--network`, or use a folder per network (`promote` copies an org spec).                     |
| `HTTP_<status>`            | The REST API returned a non-2xx status.                                       | Read `detail` (response body). 401/403: token or scope; 404: path or ID; 429: wait, then retry.   |
| `EXISTS`                   | `skill install` found a different file at the target.                         | Show the user the diff; re-run with `--force` only if they agree.                                 |
| `UNSAFE_PATH`              | `skill install` met a symlink on the target path.                             | Nothing was written. Ask the user; `--force` does not override it.                                |
| `ERROR`                    | Anything else (network, permission, server).                                  | Read `error`, `hint`, `detail`. Don't retry a `send` blindly: check `status --json` for it first. |

## Confirm with the user first

- `send`, `webhook`: issue a real credential and may email or text a person. Messages can't be recalled.
- `revoke`: permanent (`--suspend` is reversible).
- `token`: creates a live bearer token. `org apply`: creates profiles, signing authorities and tokens.
- `setup-signing`, `embed`, `consent-contract`: register resources on the network.
- `init` and anything with `createsIdentity: true`: claim a public profile ID.
- `promote` and any command with `--network production`.
- `call ... --write` and `api` with a write method. `call transferTokens`: an on-chain transfer cannot be undone, and on any mainnet it moves real funds.

## Secrets

- The seed in `.env` controls the issuer. Never print it, pass it on a command line, or commit it (the CLI adds `.env` to `.gitignore`).
- `token --json` omits the token unless `--show-secret`. Don't pass `--show-secret` (to `token`, `call` or `open`) unless the user asks for it.
- Don't use `repl`: it ignores the folder's `.env`, uses production, and prints its seed.
- To use the identity from code, read `.env` values (`SECURE_SEED`, `NETWORK_URL`, `API_TOKEN`) at runtime; never inline them.

## Keep this skill current

`npx @learncard/cli skill install --force` rewrites this file from the installed CLI version.

## Links

- Docs index for agents: https://docs.learncard.com/llms.txt (full text: https://docs.learncard.com/llms-full.txt; append `.md` to any docs URL for Markdown)
- Agent guide: https://docs.learncard.com/start-here/for-ai-agents
- CLI reference: https://docs.learncard.com/reference/learncard-cli
- Test safely on staging: https://docs.learncard.com/build/go-to-production/test-safely
- Network REST API (OpenAPI): https://network.learncard.com/docs/openapi.json
