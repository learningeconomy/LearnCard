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

Creates whatever the file describes that doesn't exist yet, updates what differs, and leaves the rest alone. Run it again and it prints `No changes.`

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

`whoami` shows who this folder is. `doctor` runs a read-only preflight — identity, network, signing authority (it signs and verifies a throwaway credential), your `did:web` document, whether credential refresh is on — and prints one fix line for anything red. Nothing it does touches the network.

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

The token is written **once** to `secrets.env` (mode 0600, added to `.gitignore`) as `NIGHTLY_ISSUER=…`. It is never printed. Your backend uses it as `Authorization: Bearer …` or `initLearnCard({ apiToken })` and acts as your issuer profile within those scopes. Re-running `org apply` never re-fetches an existing token; delete the grant in the Developer Portal (or change `name`) to rotate.

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

In your own code it is one option on `initLearnCard`:

<!-- snippet: cli/org/send-as-managed.mjs -->

```javascript
import { initLearnCard } from '@learncard/init';

const { SECURE_SEED, MANAGED_DID, RECIPIENT } = process.env;
if (!SECURE_SEED || !MANAGED_DID || !RECIPIENT) {
    throw new Error('Set SECURE_SEED, MANAGED_DID (did:web:…:users:<profileId>), and RECIPIENT');
}

// The parent org's seed, bound to a managed profile's did:web. The network
// accepts it because the managed profile's DID document lists the manager's key.
const district = await initLearnCard({ seed: SECURE_SEED, network: true, didWeb: MANAGED_DID });

const me = await district.invoke.getProfile();
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

| You see                                                                    | It means                                                                                             |
| :------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| `This folder's .env is already the profile "x"; --profile-id y would not…` | One folder, one identity. Use `--as y` if `y` is a managed profile, or a new folder.                 |
| `--from … does not match this folder's network`                            | `promote` must run from the folder that is on `--from`. `whoami` shows which network a folder is on. |
| `Credential refresh isn't enabled on this network`                         | Expected on some deployments. `doctor` reports it; nothing else is affected.                         |
| `local files are not uploaded yet — host the image…`                       | Branding images must be `https://` URLs for now.                                                     |
| `Profile not found. Are you sure this person exists?`                      | You sent to a profile ID that doesn't exist on this network.                                         |
