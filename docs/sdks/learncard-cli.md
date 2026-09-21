# LearnCard CLI

`npx @learncard/cli` is two things: a set of commands for setting up and operating an issuer (below), and an interactive REPL for exploring the SDK ([further down](#interactive-repl)).

## Commands

Every command reads its identity from the `.env` in the current folder — **one folder is one profile on one network**. `--network staging` (or a tRPC URL) targets a non-production network; `--json` prints a single JSON result on stdout; `-y` accepts defaults.

| Command                                                                                      | Does                                                                                                                                                                                                                                                                                    |
| :------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `send <recipient>`                                                                           | Sends a badge to an email or phone (via the Universal Inbox, with a claim link) or to a profile ID or DID (delivered directly). Signs through your registered signing authority when one exists; `--no-template` signs locally. `--as <profileId>` sends as a profile you manage.       |
| `org apply <file>`                                                                           | Makes the network match an [org spec](#org-spec). Idempotent. `--dry-run` reads only; `--secrets-out <path>` is where new service-account tokens go.                                                                                                                                    |
| `doctor`                                                                                     | Network preflight: identity, signing service, token scopes, signing authority (test-sign + verify), `did:web`, credential refresh, and optional webhook POST (`--webhook-url`). Trusted Registry is a skipped manual check. Does not provision resources. `--strict` fails on warnings. |
| `whoami`                                                                                     | This folder's profile, DID, signing authority, manager DID, and every profile `--as` can target.                                                                                                                                                                                        |
| `promote --from <net> --to <net> --org <file>`                                               | Applies the spec on a second network in `.learncard/<network>/`. Only the seed and profile ID carry over; tokens land in `<target>/secrets.env`; runs `doctor`. `--dry-run` writes nothing.                                                                                             |
| `status [activityId]`                                                                        | Recent sends, or the claim history of one.                                                                                                                                                                                                                                              |
| `inbox list`                                                                                 | Sent inbox credentials. `--status PENDING\|ISSUED\|EXPIRED`, `--since 7d`, `--as <profileId>`.                                                                                                                                                                                          |
| `refresh history <refreshId>`                                                                | Versions published for a [managed credential](../how-to-guides/issue-and-refresh-a-managed-credential.md).                                                                                                                                                                              |
| `clr validate <file>`                                                                        | Zod-validates a CLR 2.0 credential and lints it as `--profile provisional` or `official`. `--dry-run-sign` signs and verifies without delivering.                                                                                                                                       |
| `setup-signing`, `token`, `webhook`, `verify`, `revoke`, `open`, `init`, `export`, `restore` | Single-purpose helpers; `--help` on each.                                                                                                                                                                                                                                               |

`LEARNCARD_AS=<profileId>` is the environment fallback for `--as` on every command that accepts it.

A newly generated `send --as` script reads `MANAGED_DID`, saved in `.env`, and stays bound to that managed issuer and network. It rejects a missing or changed DID. Existing scripts are left untouched with a warning that they may use a different issuer.

### Org spec

The file `org apply` and `promote` read. YAML or JSON. Only `issuer` is required. Worked examples: [`packages/learn-card-cli/examples`](https://github.com/learningeconomy/LearnCard/tree/main/packages/learn-card-cli/examples); guide: [Bootstrap an Issuer Organization](../how-to-guides/bootstrap-an-issuer-org.md).

| Field                          | Type                                    | Notes                                                                                                                                                                                                                                                              |
| :----------------------------- | :-------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `issuer.profileId`             | string                                  | 3–40 chars: lowercase letters, digits, hyphens. Must match the folder's `PROFILE_ID` if one exists.                                                                                                                                                                |
| `issuer.displayName`           | string                                  | Updated in place if it differs.                                                                                                                                                                                                                                    |
| `issuer.branding`              | object                                  | See _branding_ below.                                                                                                                                                                                                                                              |
| `issuer.signingAuthority.type` | `learncard-hosted` \| `self-hosted`     | Hosted: LearnCard creates and registers the key. Self-hosted: also needs `endpoint` (https) and `did`.                                                                                                                                                             |
| `issuer.signingAuthority.name` | string                                  | ≤15 chars, lowercase/digits/hyphens.                                                                                                                                                                                                                               |
| `profileManager.displayName`   | string                                  | Creates a profile manager owned by the issuer. Its DID is saved to `.env` as `ORG_PROFILE_MANAGER_DID`.                                                                                                                                                            |
| `profileManager.managed[]`     | `{ profileId, displayName, branding? }` | Profiles with no seed of their own; act as them with `--as`.                                                                                                                                                                                                       |
| `serviceAccounts[]`            | `{ name, scopes[], expiresAt? }`        | One auth grant + API token each. Tokens go to `--secrets-out` as `NAME=…` (upper-cased, `-`→`_`; normalized keys must be unique). Missing token keys are re-issued. Scope/expiry drift errors with a revoke command before replacement; dry-run reports `drifted`. |
| `webhooks[].url`               | https URL                               | Not registered on the network (webhooks are per issuance). The first is saved as `WEBHOOK_URL` in `.env` for `doctor` and your code.                                                                                                                               |

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

| File                               | Holds                                                                                                                                                                                            |
| :--------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.env`                             | `SECURE_SEED`, `PROFILE_ID`, `NETWORK_URL`, plus per-network facts `org apply` records (`SIGNING_AUTHORITY_*`, `ORG_PROFILE_MANAGER_DID`, `WEBHOOK_URL`, `TEMPLATE_URI`). Mode 0600, gitignored. |
| `secrets.env` (or `--secrets-out`) | Service-account tokens for your backend. Mode 0600, gitignored. `org apply --secrets-out` reads existing keys to determine whether a token needs re-issuing.                                     |
| `.learncard/<network>/`            | Created by `promote`: a sibling project folder for the other network.                                                                                                                            |

## Interactive REPL

**LearnCard CLI** is also an easy to use node REPL that instantiates a Learn Card wallet for you and gives you all the tools you need to easily play around with the Learn Card SDK!

### Usage

```bash
npx @learncard/cli

# Optionally specify a deterministic seed to instantiate the wallet with
npx @learncard/cli 1b498556081a298261313657c32d5d0a9ce8285dc4d659e6787392207e4a7ac2
```

### Holder Continuity Export

The CLI also provides REPL helpers from `@learncard/holder-continuity` for holder-controlled continuity exports. These helpers create a standard ZIP with a readable manifest and encrypted payload files for keys, credentials, presentations, consent records, and status-list snapshots.

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
