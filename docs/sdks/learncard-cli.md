# LearnCard CLI

`@learncard/cli` is two things: a set of commands for setting up and operating an issuer (below), and an interactive REPL for exploring the SDK ([further down](#interactive-repl)). It needs Node.js 20 or later.

```bash
npx @learncard/cli <command>
```

A global install (`npm install -g @learncard/cli`) exposes the same commands as `learncard <command>`. Running the CLI with no command opens the REPL in an interactive terminal; without a TTY (in a script, CI job, or agent) it prints help instead.

{% hint style="info" %}
Driving the CLI from a script or an AI agent? See [Use LearnCard from an AI Agent](../introduction/for-ai-agents.md) for the staging-first, non-interactive recipe.
{% endhint %}

## Commands

Every command reads its identity from the `.env` in the current folder — **one folder is one profile on one network**.

| Command                                        | Does                                                                                                                                                                                                                                                                                                                                                                                                              |
| :--------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init`                                         | Creates this folder's identity (seed in `.env`) and issuer profile without sending anything. `--name`, `--profile-id`.                                                                                                                                                                                                                                                                                            |
| `send <recipient>`                             | Sends a badge to an email or phone (via the Universal Inbox, with a claim link) or to a profile ID or DID (delivered directly). Signs through your registered signing authority when one exists; `--no-template` signs locally. `--as <profileId>` sends as a profile you manage. `--suppress-delivery` skips the claim email; `--badge`, `--description`, `--template-uri`, `--webhook-url`, `--guardian-email`. |
| `status [activityId]`                          | Recent sends, or the claim history of one. `--limit <n>`, `--event created\|delivered\|claimed\|expired\|failed`.                                                                                                                                                                                                                                                                                                 |
| `whoami`                                       | This folder's profile, DID, signing authority, manager DID, and every profile `--as` can target.                                                                                                                                                                                                                                                                                                                  |
| `setup-signing`                                | Registers a LearnCard-hosted signing authority and makes it primary, or your own VC-API signer with `--endpoint` and `--did`.                                                                                                                                                                                                                                                                                     |
| `token`                                        | Creates an auth grant and scoped API token (`--scope`, default `boosts:write`; `--expires <days>`), saves it to `.env` and writes `send.sh`. `--list` lists grants; `--revoke <grantId>` revokes one.                                                                                                                                                                                                             |
| `webhook [email]`                              | Starts a local receiver (`--port`, default 8787), sends a demo credential with `webhookUrl` set to `--url`, and prints events as they arrive. `--timeout <seconds>` (default 60; applies with `--json` or when stdin is not a terminal), `--wait-for-claim`.                                                                                                                                                      |
| `consent-contract`                             | Creates a ConsentFlow contract (`--name`, `--redirect-url`, `--description`, `--needs-guardian-consent`) and writes runnable ConsentFlow scripts. See [Connect a User's LearnCard to Your Platform](../tutorials/create-a-consentflow.md).                                                                                                                                                                        |
| `embed`                                        | Creates an integration for a Claim button (`--domains`, `--rotate-key`), sets up hosted signing, and writes `claim-button.html`. See [Embed a Claim Button](../how-to-guides/connect-systems/embed-a-claim-button.md).                                                                                                                                                                                            |
| `verify <file>`                                | Verifies a JSON-LD credential or presentation file (`-` for stdin). Exits 1 when verification fails.                                                                                                                                                                                                                                                                                                              |
| `revoke <credentialUri>`                       | Revokes an issued credential, or suspends it with `--suspend`. `--template-uri`, `--recipient` when they can't be read from the credential.                                                                                                                                                                                                                                                                       |
| `open [target]`                                | Opens the LearnCard app signed in as this project: `portal` (default), `wallet`, `template`, `contract`, `integration`. `--no-browser` prints the URL; `--url-fragment` passes the seed in the URL fragment instead of the clipboard.                                                                                                                                                                             |
| `org apply <file>`                             | Makes the network match an [org spec](#org-spec). Idempotent. `--dry-run` reads only; `--secrets-out <path>` is where new service-account tokens go.                                                                                                                                                                                                                                                              |
| `doctor`                                       | Network preflight: identity, signing service, token scopes, signing authority (test-sign + verify), `did:web`, credential refresh, and optional webhook POST (`--webhook-url`). Trusted Registry is a skipped manual check. Does not provision resources. `--strict` fails on warnings.                                                                                                                           |
| `promote --from <net> --to <net> --org <file>` | Applies the spec on a second network in `.learncard/<network>/`. Only the seed and profile ID carry over; tokens land in `<target>/secrets.env`; runs `doctor`. `--dry-run` writes nothing.                                                                                                                                                                                                                       |
| `inbox list`                                   | Sent inbox credentials. `--status PENDING\|ISSUED\|EXPIRED`, `--since 7d`, `--limit <n>`, `--as <profileId>`.                                                                                                                                                                                                                                                                                                     |
| `refresh history <refreshId>`                  | Versions published for a [managed credential](../how-to-guides/issue-and-refresh-a-managed-credential.md).                                                                                                                                                                                                                                                                                                        |
| `clr validate <file>`                          | Zod-validates a CLR 2.0 credential and lints it as `--profile provisional` or `official`. `--dry-run-sign` signs and verifies without delivering (`--allow-production` to do that on production).                                                                                                                                                                                                                 |
| `demo refresh`                                 | Guided demonstration of [credential refresh](../how-to-guides/issue-and-refresh-a-managed-credential.md) with throwaway demo accounts. Defaults to a local network (`http://localhost:4000/trpc`); `--inbox`, `--ui`, `--email`. Does not use the folder's `.env`. Requires 3.6.0 or later.                                                                                                                       |
| `repl [seed]`                                  | The [interactive REPL](#interactive-repl).                                                                                                                                                                                                                                                                                                                                                                        |

Run `npx @learncard/cli <command> --help` for every option.

`LEARNCARD_AS=<profileId>` is the environment fallback for `--as` on every command that accepts it.

A newly generated `send --as` script reads `MANAGED_DID`, saved in `.env`, and stays bound to that managed issuer and network. It rejects a missing or changed DID. Existing scripts are left untouched with a warning that they may use a different issuer.

### Global flags

Every command except `repl` accepts these three flags. Where one has no effect for a command, it is accepted and ignored.

| Flag                | Effect                                                                                                                                                                                                                |
| :------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-y`, `--yes`       | Accept defaults instead of prompting. `LC_YES=1` does the same for every command. Without a TTY the CLI never prompts: a value it would have asked for must be passed as an argument or flag.                         |
| `--json`            | Print exactly one JSON result on stdout; progress text goes to stderr. See [JSON output](#json-output).                                                                                                               |
| `--network <value>` | `production` (or `prod`), `staging`, `local` (`http://localhost:4000/trpc`), or any tRPC URL. Defaults to `NETWORK_URL` from the environment, then from `.env`, else production (`demo refresh` defaults to `local`). |

`--network staging` moves every service the CLI uses — the network, LearnCloud storage, and the LearnCard app API — to staging. For any other URL, set `CLOUD_URL` and `LCA_API_URL` yourself (in the environment or in `.env`) if those services should not be production. A folder is bound to its network: once it holds network resources (signing authority, token, template, contract, integration), commands refuse to use it with another network. Use a separate folder per network, or [`promote`](#commands).

### Which commands create an identity

A command that needs an identity and finds no `.env` seed either creates one or stops with a `NO_IDENTITY` error. Only these commands create one: `init`, `send`, `org apply`, `token` (when creating a token), `setup-signing`, `embed`, `webhook`, and `consent-contract`. A command that creates a new identity says so on stderr, and with `--json` adds `identityCreated: { profileId, did, network }` to its result. The error envelope carries it too if the command fails after creating the identity (without `did` if it failed before connecting). `promote` copies this folder's seed and profile ID into its target folder (`targetDir` in its JSON result) and creates the profile on the target network; it does not report `identityCreated`.

Every other command — `whoami`, `status`, `inbox list`, `refresh history`, `doctor`, `revoke`, `token --list`, `token --revoke`, `open`, `verify`, `clr validate` — never creates an identity or writes to `.env`. Arguments and flags (recipient, `--expires`, `--limit`, `--status`, `--event`, scopes) are checked before the CLI touches `.env` or the network, so a typo fails without side effects.

Run commands that create an identity with `--network staging` first; a new production profile is public, and its profile ID is globally unique.

### JSON output

With `--json`, every command prints one line of JSON on stdout and exits. `--json` never prompts, even at a terminal without `-y`: a missing required value fails with `code: "USAGE"`.

Success: `{ "ok": true, "command": "<name>", ...result }`, exit 0. Commands that check something report the outcome in their own fields and exit 1 when the check fails:

- `verify` prints `{ "ok": true, "command": "verify", "verified": <boolean>, "result": { ... } }`; `ok` means the file was read and verified, `verified` is the outcome.
- `doctor` and `clr validate` set `ok` to whether their checks passed, with the details in `checks` (doctor) or `errors` and `warnings` (clr).

Failure (exit 1):

```json
{
    "ok": false,
    "command": "status",
    "error": "No LearnCard identity in this folder.",
    "code": "NO_IDENTITY",
    "hint": "Run `npx @learncard/cli init` (add `--network staging` to test safely), or `org apply <spec>`.",
    "detail": "..."
}
```

| Field    | Meaning                                                                                                                                             |
| :------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| `error`  | First line of the error message.                                                                                                                    |
| `code`   | `USAGE` (unknown command or option, missing or invalid argument or flag value), `NO_IDENTITY` (no seed in this folder), or `ERROR` (anything else). |
| `hint`   | Optional. What to run next.                                                                                                                         |
| `detail` | Present when the full message is longer than `error`.                                                                                               |

Usage errors exit with commander's non-zero code; with `--json` anywhere in the arguments they use the same envelope, with `command` set to `null` when the command itself is unknown. Exit codes are otherwise 0 (success) or 1 (failure).

### Secrets in output

The CLI keeps secrets out of stdout by default:

- `token --json` omits the raw API token. The token is saved to `.env` as `API_TOKEN`, and the result includes `tokenSavedTo` (the file path). Pass `--show-secret` to include the token itself.
- `open --json --url-fragment` returns the URL without its `#seed=` fragment, plus `seedInFragment: true`. Pass `--show-secret` to get the full URL.
- `open` copies the seed to the clipboard only when stdout is a terminal. Without a TTY it skips the clipboard and the 60-second clipboard-clear wait.

`webhook` without a TTY stops after `--timeout` seconds (default 60) in human mode as well as with `--json`.

### Org spec

The file `org apply` and `promote` read. YAML or JSON. Only `issuer` is required. Worked examples: [`packages/learn-card-cli/examples`](https://github.com/learningeconomy/LearnCard/tree/main/packages/learn-card-cli/examples); guide: [Bootstrap an Issuer Organization](../how-to-guides/bootstrap-an-issuer-org.md).

| Field                          | Type                                    | Notes                                                                                                                                                                                                                                                                                              |
| :----------------------------- | :-------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `issuer.profileId`             | string                                  | 3–40 chars: lowercase letters, digits, hyphens. Must match the folder's `PROFILE_ID` if one exists.                                                                                                                                                                                                |
| `issuer.displayName`           | string                                  | Updated in place if it differs.                                                                                                                                                                                                                                                                    |
| `issuer.branding`              | object                                  | See _branding_ below.                                                                                                                                                                                                                                                                              |
| `issuer.signingAuthority.type` | `learncard-hosted` \| `self-hosted`     | Hosted: LearnCard creates and registers the key. Self-hosted: also needs `endpoint` (https) and `did`. A registered self-hosted signer whose DID differs from `did` is reported as drift.                                                                                                          |
| `issuer.signingAuthority.name` | string                                  | ≤15 chars, lowercase/digits/hyphens.                                                                                                                                                                                                                                                               |
| `profileManager.displayName`   | string                                  | Creates a profile manager owned by the issuer. Its DID is saved to `.env` as `ORG_PROFILE_MANAGER_DID`. Updated in place if it differs.                                                                                                                                                            |
| `profileManager.managed[]`     | `{ profileId, displayName, branding? }` | Profiles with no seed of their own; act as them with `--as`. `displayName` is updated in place if it differs. With a `learncard-hosted` signer, each also gets its own hosted signing authority registered (so API tokens can sign as it).                                                         |
| `serviceAccounts[]`            | `{ name, scopes[], expiresAt? }`        | One auth grant + API token each. Tokens go to `--secrets-out` as `NAME=…` (upper-cased, `-`→`_`; normalized keys must be unique). Missing token keys are re-issued. Scope/expiry drift errors with a revoke command before replacement; dry-run reports `drifted`.                                 |
| `serviceAccounts[].actAs`      | `'*'` \| `[profileId, …]`               | Which managed profiles the token may act as (`X-LearnCard-Act-As` header; SDK `initLearnCard({ apiKey, actAs })`). `'*'` allows any profile under `profileManager.managed` (requires a `profileManager`); a list must name managed profiles in this spec. Omitted: the token cannot act as anyone. |
| `webhooks[].url`               | https URL                               | Not registered on the network (webhooks are per issuance). The first is saved as `WEBHOOK_URL` in `.env` for `doctor` and your code.                                                                                                                                                               |

**branding** (on `issuer` and on each `managed[]` entry) — every field optional; only listed fields are compared, `display` is merged not replaced:

| Field                                                | Type                                    | Notes                                                                                 |
| :--------------------------------------------------- | :-------------------------------------- | :------------------------------------------------------------------------------------ |
| `image`, `heroImage`                                 | https URL                               | Local paths are rejected with a hint; host the file and use its URL.                  |
| `shortBio`                                           | string ≤280                             |                                                                                       |
| `bio`, `websiteLink`                                 | string / URL                            |                                                                                       |
| `type`                                               | `organization` \| `service` \| `person` |                                                                                       |
| `display.*Color`                                     | `#RRGGBB`                               | `backgroundColor`, `fontColor`, `accentColor`, `accentFontColor`, `idBackgroundColor` |
| `display.*Image`, `display.fade*`, `display.repeat*` | https URL / boolean                     | `backgroundImage`, `idBackgroundImage` and their fade/repeat toggles                  |

### Files the CLI keeps

| File                               | Holds                                                                                                                                                        |
| :--------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.env`                             | This folder's identity and per-network facts (keys below). Mode 0600, added to `.gitignore`.                                                                 |
| `secrets.env` (or `--secrets-out`) | Service-account tokens for your backend. Mode 0600, gitignored. `org apply --secrets-out` reads existing keys to determine whether a token needs re-issuing. |
| `.learncard/<network>/`            | Created by `promote`: a sibling project folder for the other network.                                                                                        |

`.env` keys and the commands that write them:

| Key                                                    | Written by                                                                                                                          |
| :----------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| `SECURE_SEED`, `PROFILE_ID`, `DISPLAY_NAME`            | The first command that [creates the identity](#which-commands-create-an-identity). `DISPLAY_NAME` is later synced from the network. |
| `NETWORK_URL`                                          | Any command that creates the identity or resources on a non-production network.                                                     |
| `SIGNING_AUTHORITY_NAME`, `SIGNING_AUTHORITY_ENDPOINT` | `setup-signing`, `org apply`, `embed`, `send` when it signs from a template.                                                        |
| `TEMPLATE_URI`                                         | `send` when it signs from a template, `webhook`.                                                                                    |
| `MANAGED_DID`                                          | `send --as`.                                                                                                                        |
| `API_TOKEN`, `API_TOKEN_SCOPE`                         | `token`.                                                                                                                            |
| `CONTRACT_URI`, `RETURN_TO`                            | `consent-contract`.                                                                                                                 |
| `INTEGRATION_ID`, `PUBLISHABLE_KEY`                    | `embed`.                                                                                                                            |
| `ORG_PROFILE_MANAGER_DID`, `WEBHOOK_URL`               | `org apply`.                                                                                                                        |

The CLI also reads `CLOUD_URL` and `LCA_API_URL` (from the environment or `.env`) but never writes them.

Commands also write the code they ran into the folder, and never overwrite a file that already exists: `send.mjs` or `send-from-template.mjs` (`send`), `send.sh` (`token`), `webhook.mjs` (`webhook`), `create-contract.mjs`, `consent-callback.mjs`, `read-user-data.mjs` and `issue-through-contract.mjs` (`consent-contract`), and `claim-button.html` (`embed`).

## Interactive REPL

The REPL is a Node console with a LearnCard wallet preloaded as `learnCard`, for exploring the SDK interactively.

### Usage

```bash
npx @learncard/cli repl

# Optionally specify a deterministic seed (hex) to instantiate the wallet with
LEARNCARD_CLI_SEED=1b498556081a298261313657c32d5d0a9ce8285dc4d659e6787392207e4a7ac2 npx @learncard/cli repl
```

`repl <seed>` also takes the seed as an argument, but `LEARNCARD_CLI_SEED` (or `SEED`) takes precedence over it and keeps the seed out of your shell history. Running `npx @learncard/cli` with no command in an interactive terminal opens the REPL too.

{% hint style="warning" %}
**The REPL is separate from the commands above.** It does not read the folder's `.env`: it starts its own wallet from the seed you give it (random if none), always on the **production** network, and prints the seed on startup. It does not accept `--network`, `--json`, or `-y`.
{% endhint %}

### Holder Continuity Export

Export and restore are REPL functions, not CLI commands (there is no `export` or `restore` command). The REPL provides these helpers from `@learncard/holder-continuity` for holder-controlled continuity exports. These helpers create a standard ZIP with a readable manifest and encrypted payload files for keys, credentials, presentations, consent records, and status-list snapshots.

```javascript
const password = await getLearnCardBundlePassword();

await exportLearnCardBundle(learnCard, {
    out: './learncard-export.zip',
    password,
});

const freshWallet = await initLearnCard({ seed: '0'.repeat(64), network: true });
await importLearnCardBundle('./learncard-export.zip', {
    password,
    wallet: freshWallet,
    verifyBeforeImport: true,
});
```

```javascript
const restoredWallet = await restoreLearnCardFromBundle('./learncard-export.zip', { password });
```

`getLearnCardBundlePassword()` prompts without echoing the password into the REPL, which avoids saving it in REPL history. You can still pass a password string directly for local scripts.

`restoreLearnCardFromBundle(...)` decrypts the exported seed and returns a wallet with the original DID. It does not upload bundle payloads or recreate index records; use `importLearnCardBundle(...)` when copying credentials into another wallet.

If you omit the first argument, the CLI exports the default `learnCard` wallet it created at startup:

```javascript
const password = await getLearnCardBundlePassword();
await exportLearnCardBundle({ out: './learncard-export.zip', password });
```

Lower-level helpers are also available in the REPL:

```javascript
const password = await getLearnCardBundlePassword();
await createLearnCardBundle(learnCard, { password });
await readLearnCardBundle('./learncard-export.zip', { password });
```

For the data model and portability caveats, see [Holder Continuity](../core-concepts/architecture-and-principles/holder-continuity.md) and the `@learncard/holder-continuity` package `BUNDLE_SPEC.md`.

### Getting Started

<figure><img src="../.gitbook/assets/Screen Shot 2022-09-29 at 6.08.26 PM.png" alt=""><figcaption><p>Run npx @learncard/cli to boot up the CLI - you should see this screen in your terminal! </p></figcaption></figure>

From within the CLI, you should be able to start playing around with a basic LearnCard. When the CLI boots up, it creates a default LearnCard called `learnCard` that you can interact with.

### Basic Usage

#### View your wallet's DID

One of the easiest ways to interact with your LearnCard is to get its DID:

```javascript
learnCard.id.did();
// 'did:key:z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6'

learnCard.id.did('pkh:sol');
// 'did:pkh:sol:G4Ky3gTVPE9a54o2DrJsAJW1yVRDHYqCni61MSJv8Dgi'

learnCard.id.did('tz');
// 'did:tz:tz1Y2Rg8ofGpdGpRqHfix3yy4J6qqK19NE5h'

learnCard.id.did('pkh:tz');
// 'did:pkh:tz:tz1Y2Rg8ofGpdGpRqHfix3yy4J6qqK19NE5h'
```

If your LearnCard is initialized to support more DID methods, such as `did:web`, you could retrieve the corresponding DID through this function.&#x20;

#### Basic Verifiable Credential Issuance & Verification Flow

Once the CLI has booted up, you can start issuing credentials. Try a basic Verifiable Credential issuance and verification flow, for example:

```javascript
// Create a new, unsigned test Verifiable Credential
const unsignedVerifiableCredential = learnCard.invoke.getTestVc();
/**
{
  '@context': [ 'https://www.w3.org/2018/credentials/v1' ],
  id: 'http://example.org/credentials/3731',
  type: [ 'VerifiableCredential' ],
  issuer: 'did:key:z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6',
  issuanceDate: '2020-08-19T21:41:50Z',
  credentialSubject: { id: 'did:example:d23dd687a7dc6787646f2eb98d0' }
}
*/

// Then, issue the credential to yourself (i.e. sign the credential to turn it into a verifiable credential)
const signedVerifiableCredential = await learnCard.invoke.issueCredential(
    unsignedVerifiableCredential
);
/** 
{
  '@context': [ 'https://www.w3.org/2018/credentials/v1' ],
  id: 'http://example.org/credentials/3731',
  type: [ 'VerifiableCredential' ],
  credentialSubject: { id: 'did:example:d23dd687a7dc6787646f2eb98d0' },
  issuer: 'did:key:z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6',
  issuanceDate: '2020-08-19T21:41:50Z',
  proof: {
    type: 'Ed25519Signature2018',
    proofPurpose: 'assertionMethod',
    verificationMethod: 'did:key:z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6#z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6',
    created: '2022-09-30T15:33:51.015Z',
    jws: 'eyJhbGciOiJFZERTQSIsImNyaXQiOlsiYjY0Il0sImI2NCI6ZmFsc2V9..NkaBWEFT2JCU1ZjMSGmbL72EPhVsAsLykAHULee2uh8YdqBqJbti_FmplQQvGnPDy80pbrFRA-IYQQUx11ISCw'
  }
}
**/

// Then, verify the credential!
// This verifies that the credential is valid, has not been tampered with, and was issued by the correct DID
await learnCard.invoke.verifyCredential(signedVerifiableCredential);
/**
[
  { status: 'Success', check: 'proof', message: 'Valid' },
  {
    status: 'Success',
    check: 'expiration',
    message: 'Valid • Does Not Expire'
  }
]
**/
```

#### Basic Verifiable Presentation Issuance & Verification Flow

Now, take the `signedVerifiableCredential` you created in the [VC issuance flow above](learncard-cli.md#basic-verifiable-credential-issuance-and-verification-flow), and try wrapping it into a Verifiable Presentation, and verifying it.&#x20;

<pre class="language-javascript"><code class="lang-javascript">// Get an unsigned, test Verifiable Presentation template containing your signed VC
const unsignedVerifiablePresentation = await learnCard.invoke.newPresentation(signedVerifiableCredential);
/**
{
  '@context': [ 'https://www.w3.org/2018/credentials/v1' ],
  type: [ 'VerifiablePresentation' ],
  holder: 'did:key:z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6',
  verifiableCredential: {
    '@context': [ 'https://www.w3.org/2018/credentials/v1' ],
    id: 'http://example.org/credentials/3731',
    type: [ 'VerifiableCredential' ],
    credentialSubject: { id: 'did:example:d23dd687a7dc6787646f2eb98d0' },
    issuer: 'did:key:z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6',
    issuanceDate: '2020-08-19T21:41:50Z',
    proof: {
      type: 'Ed25519Signature2018',
      proofPurpose: 'assertionMethod',
      verificationMethod: 'did:key:z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6#z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6',
      created: '2022-09-30T15:33:51.015Z',
      jws: 'eyJhbGciOiJFZERTQSIsImNyaXQiOlsiYjY0Il0sImI2NCI6ZmFsc2V9..NkaBWEFT2JCU1ZjMSGmbL72EPhVsAsLykAHULee2uh8YdqBqJbti_FmplQQvGnPDy80pbrFRA-IYQQUx11ISCw'
    }
  }
}
**/

// Issue (sign) the Verifiable Presentation 
<strong>const verifiablePresentation = await learnCard.invoke.issuePresentation(unsignedVerifiablePresentation);
</strong>/**
{
  '@context': [ 'https://www.w3.org/2018/credentials/v1' ],
  type: [ 'VerifiablePresentation' ],
  verifiableCredential: {
    '@context': [ 'https://www.w3.org/2018/credentials/v1' ],
    id: 'http://example.org/credentials/3731',
    type: [ 'VerifiableCredential' ],
    credentialSubject: { id: 'did:example:d23dd687a7dc6787646f2eb98d0' },
    issuer: 'did:key:z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6',
    issuanceDate: '2020-08-19T21:41:50Z',
    proof: {
      type: 'Ed25519Signature2018',
      proofPurpose: 'assertionMethod',
      verificationMethod: 'did:key:z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6#z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6',
      created: '2022-09-30T15:33:51.015Z',
      jws: 'eyJhbGciOiJFZERTQSIsImNyaXQiOlsiYjY0Il0sImI2NCI6ZmFsc2V9..NkaBWEFT2JCU1ZjMSGmbL72EPhVsAsLykAHULee2uh8YdqBqJbti_FmplQQvGnPDy80pbrFRA-IYQQUx11ISCw'
    }
  },
  proof: {
    type: 'Ed25519Signature2018',
    proofPurpose: 'assertionMethod',
    verificationMethod: 'did:key:z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6#z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6',
    created: '2022-09-30T15:41:39.175Z',
    jws: 'eyJhbGciOiJFZERTQSIsImNyaXQiOlsiYjY0Il0sImI2NCI6ZmFsc2V9..iOAHkQiIp5fi9IiuKIxCAnTQ-A7BL8cbCVAF_-pwDr5uvewWHuk1UISoElVSzeDxBO_OjsjDJ4qZeowwZ4WEDA'
  },
  holder: 'did:key:z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6'
}
**/

// Verify the Verifiable Presentation has not been tampered with.
await learnCard.invoke.verifyPresentation(verifiablePresentation);
/**
{ checks: [ 'proof' ], warnings: [], errors: [] }
**/
</code></pre>

#### Initialize more LearnCards

At any point, you can initialize additional LearnCards in the CLI, which can be helpful for testing cross-wallet flows:

```javascript
// Initialize an empty LearnCard (cannot sign credentials)
const emptyLC = await initLearnCard();

// Initialize a new LearnCard with deterministically seeded key material
const seededLC = await initLearnCard({ seed: 'abc123' });
```

Check out the docs on [initializing LearnCards](learncard-core/construction.md#initialize) for more ways to create a LearnCard.

#### And beyond!&#x20;

There is a ton of functionality exposed through the CLI. Explore the Usage Examples in LearnCard Wallet SDK:

{% content-ref url="learncard-core/construction.md" %}
[construction.md](learncard-core/construction.md)
{% endcontent-ref %}
