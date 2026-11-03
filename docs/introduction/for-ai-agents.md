---
description: How an AI coding agent, script, or CI job should read the LearnCard docs and drive the LearnCard CLI safely and non-interactively.
---

# Use LearnCard from an AI Agent

This page is for AI coding agents (and the people who set them up) that read LearnCard documentation and run the [LearnCard CLI](../sdks/learncard-cli.md) on a developer's behalf. The same rules apply to shell scripts and CI jobs.

{% hint style="info" %}
Looking to connect **your own** LearnCard wallet to Claude or ChatGPT as a learner? That is a different product: see [Use LearnCard with Claude or ChatGPT](../how-to-guides/connect-systems/connect-ai-agent.md). This page is about building and issuing with LearnCard.
{% endhint %}

## Machine-readable sources

Prefer these over scraping rendered HTML:

| Source                      | URL                                                                                                  | Use it for                                         |
| :-------------------------- | :--------------------------------------------------------------------------------------------------- | :------------------------------------------------- |
| Docs index                  | [`https://docs.learncard.com/llms.txt`](https://docs.learncard.com/llms.txt)                         | A list of every docs page with its URL.            |
| Full docs                   | [`https://docs.learncard.com/llms-full.txt`](https://docs.learncard.com/llms-full.txt)               | All pages in one text file.                        |
| Any single page as Markdown | Append `.md` to the page URL, e.g. `https://docs.learncard.com/start-here/your-first-integration.md` | One page without navigation chrome.                |
| Network REST API (OpenAPI)  | [`https://network.learncard.com/docs/openapi.json`](https://network.learncard.com/docs/openapi.json) | Every REST route, its parameters, and its summary. |
| Network REST API (browser)  | [`https://network.learncard.com/docs`](https://network.learncard.com/docs)                           | The same spec rendered for people.                 |
| CLI help                    | `npx @learncard/cli --help`, `npx @learncard/cli <command> --help`                                   | Every command and option of the installed version. |

## Rules for agents

1. **Start on staging.** Pass `--network staging` to every command until a person decides to go to production. Production profiles are public and their profile IDs are globally unique; production sends reach real people. See [Test Safely](../how-to-guides/deploy-infrastructure/test-safely.md).
2. **One folder per network.** The CLI keeps its identity in the `.env` of the current folder, and the folder stays on the network it was created on. Create a fresh, empty folder for staging and a different one for production — or use [`promote`](../sdks/learncard-cli.md#commands) to create the production folder from an org spec. Never run the CLI from inside an application's own source folder, where it would read and write that app's `.env`.
3. **Never prompt.** Pass `-y` (or set `LC_YES=1`) and `--json` on every command. Without a TTY the CLI never prompts; any value it would have asked for must be given as an argument or flag.
4. **Ask before anything irreversible**, and before anything on production (see [below](#commands-that-change-state)).
5. **Don't print secrets.** Never echo `.env`, `secrets.env`, or `SECURE_SEED` into a transcript or log. Whoever holds the seed controls the issuer.

## Headless recipe

```bash
mkdir learncard-staging && cd learncard-staging

npx @learncard/cli init --network staging --name "Acme Test Issuer" -y --json
npx @learncard/cli send you@yourdomain.com --network staging -y --json --suppress-delivery
npx @learncard/cli status <activityId> --network staging --json
```

- `init` creates the folder's identity (a seed in `.env`) and a staging issuer profile, and sends nothing.
- `send` issues a "Quickstart Complete" badge. `--suppress-delivery` skips the claim email: the credential is still real and waits in the recipient's inbox on staging, and the result's `claimUrl` is the link to claim it. Use an address someone controls; placeholder domains such as `example.com` are rejected.
- `status` takes the `activityId` from the `send` result. Its `state` field is the latest event (for example `CREATED`, `DELIVERED`, `CLAIMED`).

The `send` result includes `activityId`, `templateUri`, `status` (`PENDING` until claimed, or `ISSUED` when delivered straight to an existing account), and `claimUrl` for email and phone recipients.

## JSON contract

With `--json`, each command prints exactly one line of JSON on stdout. Human-readable progress goes to stderr, so parse stdout only.

- **Success:** `{"ok":true,"command":"send",...}` and exit code 0.
- **Failure:** `{"ok":false,"command":"send","error":"...","code":"...","hint":"...","detail":"..."}` and exit code 1. `hint` and `detail` appear only when there is something to say.

| `code`        | Means                                                                                        | What to do                                                                             |
| :------------ | :------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| `USAGE`       | Unknown command or option, or a missing or invalid argument or flag value. Nothing was done. | Fix the command; check `--help`.                                                       |
| `NO_IDENTITY` | The folder has no LearnCard identity, and this command does not create one.                  | Run `init --network staging` in this folder (after confirming it is the right folder). |
| `ERROR`       | Anything else, such as a network or permission failure.                                      | Read `error`, `hint` and `detail`; don't retry a `send` blindly (see below).           |

A few commands report a checked outcome rather than just "it ran": `verify` adds `verified: true|false`, and `doctor` and `clr validate` set `ok` to whether their checks passed. All three exit 1 when the check fails. The full reference is on the [CLI page](../sdks/learncard-cli.md#json-output).

## Commands that change state

**Read-only — safe to run any time:** `whoami`, `status`, `inbox list`, `refresh history`, `doctor`, `verify`, `clr validate` (without `--dry-run-sign`), `token --list`, `org apply --dry-run`, `promote --dry-run`. These never create an identity and never write `.env`. Those that need an identity (`whoami`, `status`, `inbox list`, `refresh history`, `doctor`, `token --list`, `promote --dry-run`) fail with `NO_IDENTITY` in a folder without one. `verify` and `clr validate` don't need an identity. `org apply --dry-run` in a folder without one previews the plan with a throwaway seed (it still contacts the network) and writes nothing. `open` also fails with `NO_IDENTITY` without one and writes nothing, but it hands the folder's seed to the LearnCard app (see [Secrets](#secrets)).

**Create an identity if the folder has none:** `init`, `send`, `org apply`, `token` (when creating a token), `setup-signing`, `embed`, `webhook`, `consent-contract`. When one of these creates a new identity, its JSON result includes `identityCreated: { profileId, did, network }`, even when the command fails afterwards (the error envelope carries it too, without `did` if the command failed before connecting; check for it before retrying). On production that is a new public profile. `promote` (without `--dry-run`) also writes a new folder: it copies this folder's seed and profile ID into `.learncard/<network>/` and creates the profile on the target network. It does not report `identityCreated`; its JSON result names the folder in `targetDir`.

**Hard or impossible to undo — confirm with a person first:**

| Command           | Effect                                                                                                                                        |
| :---------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| `send`, `webhook` | Issue a real credential and email or text the recipient (`send --suppress-delivery` skips the message). A sent message can't be recalled.     |
| `revoke`          | Permanently revokes a credential. `revoke --suspend` suspends it instead.                                                                     |
| `token`           | Creates a live bearer token. Revoke it with `token --revoke <grantId>` when it is no longer needed.                                           |
| `setup-signing`   | Registers a signing authority on the network and makes it your primary signer. `embed` and `send` (when signing from a template) do this too. |
| `org apply`       | Creates or updates profiles, managed profiles, signing authorities and API tokens. Run `--dry-run` first and show the plan.                   |
| `init`            | Claims a public profile ID on the network.                                                                                                    |

**If a `send` fails ambiguously** (timeout, network error), check whether it went through before retrying: `npx @learncard/cli status --json` lists recent sends. See [When a send fails ambiguously](../how-to-guides/go-to-production.md#when-a-send-fails-ambiguously).

## Secrets

- The seed lives only in `.env` (mode 0600, added to `.gitignore`). Don't read it, print it, or pass it on the command line.
- `token --json` does not include the API token; it saves it to `.env` as `API_TOKEN` and reports the file in `tokenSavedTo`. Only `--show-secret` puts the token on stdout.
- `org apply` and `promote` write service-account tokens only to the `--secrets-out` file.
- `open --json --url-fragment` returns the app URL without its `#seed=` fragment unless you pass `--show-secret`. `open` copies the seed to the clipboard only when run in a terminal.
- The [REPL](../sdks/learncard-cli.md#interactive-repl) is not suitable for agents: it ignores the folder's `.env`, always uses production, and prints its seed.

## Beyond the CLI

The CLI covers the quickstart journey: sending, tracking, signing, tokens, webhooks, ConsentFlow contracts, organizations, verification and revocation. For anything else (templates with custom content, claim links, skills, connections and more), write code against the [LearnCard Wallet SDK](../sdks/learncard-core/README.md) or call the [Network REST API](../sdks/learncard-network/README.md) with an API token from `token`. Reuse the folder's `.env` values (`SECURE_SEED`, `NETWORK_URL`, `API_TOKEN`) so the code acts as the same identity on the same network.
