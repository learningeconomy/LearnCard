---
description: 'Describe your organization in one file, apply it to staging, check it, then apply the same file to production.'
---

# Bootstrap an Issuer Organization

An _organization_ on LearnCard is an issuer profile, the signing authority that signs for it, optionally the profiles it manages (districts, campuses, chapters), and the API tokens your systems use to reach it. Set it up by hand once and you will set it up wrong the second time. Instead, describe it in a file and let the CLI make the network match.

{% hint style="info" %}
**~15 min** · Needs Node 18+. Everything below runs against **staging**; the last step shows how the same file moves to production. Related: [Who Signs Your Credentials?](create-signing-authority.md) · [Generate API Tokens](deploy-infrastructure/generate-api-tokens.md) · [Test Safely](deploy-infrastructure/test-safely.md)
{% endhint %}

## The one-line version

```bash
npx @learncard/cli org apply org.yaml --network staging --secrets-out ./secrets.env
```

Creates missing resources, updates supported profile and signing settings (display names, branding, primary signer, the `SIGNING_AUTHORITY_*` selection in `.env`), and leaves matching resources alone. Service-account scope or expiry drift requires revoking the grant and re-running; it is never silently updated. A self-hosted signer whose registered DID differs from the spec is reported as drift and fails the run. Unknown keys anywhere in the spec are rejected, so a typo cannot silently drop a section. With `--secrets-out`, a missing token is re-issued into that file. An identical run with all tokens present prints `No changes.`

## Before you start: one folder, one identity

The CLI keeps your identity in a `.env` in the current folder. **A folder is one profile on one network.** Make a fresh folder for this guide, and a different folder (or let `promote` make one) for production.

```bash
mkdir my-org && cd my-org
```

## 1. Write the file

Start from the smallest example and grow it. Every example in [`packages/learn-card-cli/examples`](https://github.com/learningeconomy/LearnCard/tree/main/packages/learn-card-cli/examples) shows one idea:

| File                               | Adds                                                                     |
| :--------------------------------- | :----------------------------------------------------------------------- |
| `minimal.network.yaml`             | An issuer profile that LearnCard signs for                               |
| `service-account.network.yaml`     | A scoped, expiring API token for a backend that must not hold the seed   |
| `branded.network.yaml`             | Profile image, bios, website, and wallet display colours                 |
| `self-hosted-signing.network.yaml` | You keep the keys; LearnCard calls your signing endpoint                 |
| `state-districts.network.yaml`     | A parent org with managed profiles underneath it, plus a default webhook |

Here is the minimal one. Save it as `org.yaml`:

<!-- snippet: cli/org/minimal.network.yaml -->

```yaml
# The smallest useful org: one issuer profile that LearnCard signs for.
issuer:
    profileId: example-issuer
    displayName: Example Issuer
    signingAuthority:
        type: learncard-hosted
        name: example-signer
```

<!-- /snippet -->

Change `profileId` to something nobody else will have picked. The full field list is in the [CLI reference](../sdks/learncard-cli.md#org-spec).

## 2. Preview, then apply

```bash
npx @learncard/cli org apply org.yaml --network staging --dry-run
```

Every row says `would-create`, and nothing was written — not on the network, not in your folder. Now for real:

```bash
npx @learncard/cli org apply org.yaml --network staging
```

```
issuer            example-issuer   created
signingAuthority  example-signer   created
Issuer DID: did:web:staging.network.learncard.com:users:example-issuer
```

Run it once more. It should end with `No changes.` — that is the whole point.

## 3. Check it

```bash
npx @learncard/cli whoami
npx @learncard/cli doctor
```

`whoami` shows who this folder is. `doctor` checks identity, network, signing authority (it signs and verifies a throwaway credential), your `did:web` document, and whether credential refresh is on, then prints one fix line for anything red. It calls network services and optionally POSTs a webhook ping, but does not issue credentials to recipients or provision resources. The Trusted Registry check is a manual check reported as skipped.

## 4. Send something

```bash
npx @learncard/cli send you@example.com
```

Because a signing authority is registered, this signs through it (you'll see `Signing through the registered signing authority "example-signer"`). Add `--no-template` to sign with the local key instead.

## 5. Grow the file

### Add a service account

Your backend should not hold the seed. Add a token with only the permissions it needs and an expiry:

```yaml
serviceAccounts:
    - name: nightly-issuer
      scopes: [inbox:write, inbox:read, credentials:write, credentials:read]
      expiresAt: 2027-06-30
```

```bash
npx @learncard/cli org apply org.yaml --network staging --secrets-out ./secrets.env
```

The token is written to `secrets.env` (mode 0600, added to `.gitignore`) as `NIGHTLY_ISSUER=…`. It is never printed or stored elsewhere by the CLI. Your backend uses it as `Authorization: Bearer …` or `initLearnCard({ apiToken })` and acts as your issuer profile within those scopes. Re-running `org apply --secrets-out ./secrets.env` re-issues a token if its key is missing from the file. If scopes or expiry differ, apply errors with a revoke command; revoke the grant and re-run to create its replacement. Dry-run reports this as `drifted`.

{% hint style="warning" %}
Two different secrets, two different owners. The **seed** in `.env` _is_ the organization — whoever holds it can do anything, including mint more tokens. The **token** in `secrets.env` is what you hand to a vendor or a cron job: scoped, expiring, revocable. Keep them apart.
{% endhint %}

### Add branding

```yaml
issuer:
    # ...
    branding:
        image: https://cdn.example.org/logo.png
        shortBio: Issuing verified learning records since 2026.
        websiteLink: https://example.org
        display: { backgroundColor: '#18224E', accentColor: '#2E7D32' }
```

Only the fields you list are compared, and `display` colours are merged — naming two colours never wipes a third set in the app. Images must be `https://` URLs you host; the validator will tell you if you pass a local path.

### Add managed profiles

For a parent organization with members underneath it — a state with districts, a university with departments:

```yaml
profileManager:
    displayName: Example Districts
    managed:
        - profileId: example-north
          displayName: North District
          branding: { websiteLink: https://north.example.org }
```

Managed profiles have **no seed of their own**. You act as one from the parent's folder:

```bash
npx @learncard/cli send you@example.com --as example-north
npx @learncard/cli inbox list --as example-north
```

The credential is signed with `did:web:…:users:example-north` — the district, not the parent. `whoami` lists every profile you can `--as`, and `LEARNCARD_AS=example-north` does the same for a whole shell session without persisting anything. Passing `--profile-id example-north` instead is an error: the folder's identity doesn't change.

When creating a new runnable script, `send --as` saves `MANAGED_DID` in `.env` and binds the script to that managed issuer and network. The script rejects a missing or changed `MANAGED_DID`. Existing scripts are not overwritten; the CLI warns that they may use a different issuer.

In your own code it is one option on `initLearnCard`. Export `NETWORK_URL` from your staging project's `.env` along with the seed; without it this snippet defaults to production:

<!-- snippet: cli/org/send-as-managed.mjs -->

```javascript
import { initLearnCard } from '@learncard/init';

const { SECURE_SEED, MANAGED_DID, RECIPIENT, NETWORK_URL } = process.env;
if (!SECURE_SEED || !MANAGED_DID || !RECIPIENT) {
    throw new Error('Set SECURE_SEED, MANAGED_DID (did:web:…:users:<profileId>), and RECIPIENT');
}

// The parent org's seed, bound to a managed profile's did:web. The network
// accepts it because the managed profile's DID document lists the manager's key.
const district = await initLearnCard({
    seed: SECURE_SEED,
    network: true,
    // Keep the default explicit so the docs test harness can substitute its local network.
    ...(NETWORK_URL != null ? { network: NETWORK_URL } : {}),
    didWeb: MANAGED_DID,
});

const me = await district.invoke.getProfile();
if (!me) throw new Error('Managed profile not found. Check MANAGED_DID and NETWORK_URL.');
console.log(`Sending as ${me.displayName} (${me.profileId})`);

// Sign with the district's own key, then send. (Registering a hosted signing authority
// on the district instead lets you pass `template` and skip the signing step.)
const signed = await district.invoke.issueCredential({
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: me.did,
    validFrom: new Date().toISOString(),
    name: 'Welcome',
    credentialSubject: {
        type: ['AchievementSubject'],
        achievement: {
            id: `urn:uuid:${crypto.randomUUID()}`,
            type: ['Achievement'],
            name: 'Welcome',
            description: 'Sent by a managed profile.',
            criteria: { narrative: 'Be a recipient.' },
        },
    },
});

const result = await district.invoke.send({
    type: 'boost',
    recipient: RECIPIENT,
    signedCredential: signed,
});
console.log(result.inbox?.claimUrl ?? result.credentialUri);
```

<!-- /snippet -->

`getManagedProfiles()` on the manager's `did:web` (shown by `whoami`) returns every managed DID if you need to loop.

### Let a service account act as a district

Your backend probably holds a **token**, not the seed. A token is bound to the profile that minted it — so to issue as a district, the request says who it is acting as, and the network checks two things: that your issuer really manages that profile, and that the token was allowed to delegate.

Allow it in the spec, per account:

```yaml
serviceAccounts:
    - name: nightly-issuer
      scopes: [inbox:write, inbox:read, credentials:write, credentials:read]
      actAs: [example-north] # or '*' for every profile under profileManager
```

Omit `actAs` and the token cannot act as anyone — this is deny-by-default on purpose, so a leaked single-district token can never issue as the whole state. `doctor` and `whoami` both report what each token may act as.

Then in your backend, name the district on the call:

<!-- snippet: cli/org/send-as-managed-token.mjs -->

```javascript
import { initLearnCard } from '@learncard/init';

const { API_TOKEN, DISTRICT_PROFILE_ID, RECIPIENT } = process.env;
if (!API_TOKEN || !DISTRICT_PROFILE_ID || !RECIPIENT) {
    throw new Error('Set API_TOKEN (from --secrets-out), DISTRICT_PROFILE_ID, and RECIPIENT');
}

// One token for the whole org. Each request names the profile it acts as; the network
// enforces both the manager relationship and the token's actAs policy.
const org = await initLearnCard({ apiKey: API_TOKEN, network: true });
const district = await org.invoke.actAs(DISTRICT_PROFILE_ID);

const me = await district.invoke.getProfile();
console.log(`Acting as ${me.displayName} (${me.profileId})`);

// A token has no signing key, so LearnCard signs for the district through the hosted
// signing authority that `org apply` registered on it. Passing `template` (not a
// pre-signed credential) is what asks the network to sign.
const result = await district.invoke.send({
    type: 'boost',
    recipient: RECIPIENT,
    template: {
        credential: {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            issuer: me.did,
            validFrom: new Date().toISOString(),
            name: 'Welcome',
            credentialSubject: {
                type: ['AchievementSubject'],
                achievement: {
                    id: `urn:uuid:${crypto.randomUUID()}`,
                    type: ['Achievement'],
                    name: 'Welcome',
                    description: 'Sent by a district through the org token.',
                    criteria: { narrative: 'Be a recipient.' },
                },
            },
        },
        name: 'Welcome',
        category: 'Achievement',
    },
});
console.log(result.inbox?.claimUrl ?? result.credentialUri);
```

<!-- /snippet -->

`org.invoke.actAs(id)` returns a new instance; `org` itself is unchanged. If you only ever act as one profile, `initLearnCard({ apiKey, network: true, actAs: id })` sets it once. Under the hood this is a single request header, `X-LearnCard-Act-As`, so any HTTP client can do the same against the REST API. The token's scope is unchanged while acting — `inbox:write` as a district is still just `inbox:write`.

## 6. Move it to production

Staging and production are [separate networks](deploy-infrastructure/test-safely.md): profiles, tokens, signing authorities, and credentials do not carry over. Your seed does. So the production setup is the **same file, applied again**:

```bash
npx @learncard/cli promote --from staging --to production --org org.yaml --dry-run
```

Every row is `would-create`; nothing is written anywhere. Show this to whoever approves the change. Then:

```bash
npx @learncard/cli promote --from staging --to production --org org.yaml
```

This makes a `.learncard/production/` folder holding a production `.env` (seed and profile ID copied, nothing else), applies the spec there, writes fresh tokens to `.learncard/production/secrets.env`, runs `doctor`, and prints the list of what did not carry over. From then on, `cd .learncard/production` to operate production.

{% hint style="info" %}
The production issuer's DID is `did:web:network.learncard.com:users:<profileId>`. If you issue credentials that will later be updated in place ([managed credentials](issue-and-refresh-a-managed-credential.md)), every version must come from that same DID — so settle on the profile ID before the first real issuance.
{% endhint %}

## Troubleshooting

| You see                                                                        | It means                                                                                                                                                                                                                                         |
| :----------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `This folder's .env is already the profile "x"; --profile-id y would not…`     | One folder, one identity. Use `--as y` if `y` is a managed profile, or a new folder.                                                                                                                                                             |
| `--from … does not match this folder's network`                                | `promote` must run from the folder that is on `--from`. `whoami` shows which network a folder is on.                                                                                                                                             |
| `Credential refresh isn't enabled on this network`                             | Expected on some deployments. `doctor` reports it; nothing else is affected.                                                                                                                                                                     |
| `local files are not uploaded yet — host the image…`                           | Branding images must be `https://` URLs for now.                                                                                                                                                                                                 |
| `This API token may not act as "x". Grant actAs on the token.`                 | Add `actAs` to that service account in the spec, then re-run `org apply` — it detects the drift and errors with a `token --revoke <grantId>` command; run that, then re-run `org apply --secrets-out ./secrets.env` to mint a replacement token. |
| `You do not manage profile "x".`                                               | `x` isn't under your `profileManager.managed`, or you're acting from the wrong issuer.                                                                                                                                                           |
| `Profile not found. Are you sure this person exists?`                          | You sent to a profile ID that doesn't exist on this network.                                                                                                                                                                                     |
| `Signing authority "x" is registered at … with DID …, but the spec declares …` | The network keys a registration by name + DID, so a rotated key cannot be swapped in place. Register it under a new name or fix `did` in the spec.                                                                                               |
| `Unrecognized key(s) in object`                                                | A field in the spec is misspelled or misplaced. Compare with the reference table.                                                                                                                                                                |
| `… already holds a different SECURE_SEED`                                      | The `promote` target folder belongs to another identity. Move that `.env` aside or choose another target.                                                                                                                                        |
| `Another org apply is reconciling service accounts for …`                      | Two applies overlapped on the same secrets file. Wait for the other to finish (remove a stale `.secrets.env.lock` only if none is running).                                                                                                      |
