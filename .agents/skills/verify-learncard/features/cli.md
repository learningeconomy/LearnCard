# `learncard` CLI

Developers run `npx @learncard/cli` to send their first credential, check whether it was claimed, and verify credential files. The journey runs `packages/learn-card-cli/src` from the checkout against the owned network.

## Sub-features

- `cli-send`: `send <profileId> --yes --json --name … --badge …` creates an issuer identity in its workdir (`.env`) and returns `{ ok: true, status: 'ISSUED', credentialUri: … }` with a URI on this stack's allocated Brain endpoint.
- `cli-recipient-claims`: the recipient's wallet finds the URI in `getIncomingCredentials`, accepts it, and reads a credential containing the badge name.
- `cli-status`: `status <activityId> --json` reports `state: 'CLAIMED'` for that credential.
- `cli-verify`: `verify <file> --json` cryptographically verifies the actual received credential, requiring `errors: []` and a `proof` check. Its verify-only child fetch policy confines the known DIDKit WASM/dynamic-loader resolution path to owned HTTP service origins; it refuses redirects and forces nonzero failure on policy violations.

## How to get to it (user POV)

- `npx @learncard/cli send you@yourdomain.com` (docs: `docs/quick-start/your-first-integration.md`), then `status`, `verify`, `open`, `token`, `consent-contract`, `embed`, and the rest of `learncard --help`.

## Driving it with lc verify

Preconditions:

- Doctor ok.

- **Run.** `$LCV run cli --dir /tmp/lcv` → `cli: passed`; `cli/cli-0N-*.json` hold args, stdout, stderr and exit codes.
- **Supported local subcommands.** `$LCV learncard --dir /tmp/lcv --workdir acme -- <subcommand> … --json`. Brain, LearnCloud, and LCA API are pinned to the owned stack. `--network` is appended for supported network commands; duplicate overrides and any endpoint other than the owned one are refused. Ordinary values such as `--name help` do not bypass pinning. The transcript path is printed on stderr.
- **Same identity across commands.** Reuse `--workdir acme`; its `.env` holds `SECURE_SEED`, `PROFILE_ID`, `NETWORK_URL`.
- **From a script.** `await v.cli(['send', handle, '--yes', '--json'], 'acme')` → `{ exitCode, stdout, stderr, json, timedOut }`. A driver timeout sets `timedOut: true` and exit code 124, even if the terminated child exits cleanly.

## Gotchas

- Without `--yes`, a recipient argument is required; non-interactive runs fail with `A recipient is required…`.
- Sending to a handle that doesn't exist fails with `Profile not found`. Create the recipient first (`v.sdk(actor)`).
- `verify --json` prints the raw verification result, not the `{ ok, command }` envelope. The wrapper's fetch policy is scoped confinement, **not** networkless verification or a general OS sandbox; arbitrary remote DID/context resolution is rejected. Ordinary CLI execution outside the wrapper is unchanged.
- The CLI's `start` script and verifier preparation regenerate `src/generated/snippets.ts` from `docs/snippets` with deterministic content and atomic replacement. Keep the checkout stable and CLI workdirs distinct across workers.
- Email recipients go through the Universal Inbox (claim email); this stack has no mail delivery. Use profile IDs.
- `repl` hard-codes production; `demo` initializes an incompletely pinned SDK; `promote` needs another network. They are unavailable through this wrapper. Webhook callbacks/receivers and custom signer endpoints are also unprovisioned and rejected. `org apply FILE …` supports only the local hosted signer with no webhooks.
- `open` points to the allocated app URL; an explicit `--app-url` must match the owned endpoint. Run `lc verify script` with the owned-stack SDK for additional local checks, not to bypass these boundaries.
