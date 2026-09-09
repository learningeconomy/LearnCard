---
description: Send a verifiable credential to any email address with one command, curl, or one short script.
---

# Quickstart: Send a Credential

Send a badge to an email address. The recipient gets a claim link and does not need an account until they claim it.

{% hint style="info" %}
You can issue credentials without code from the [LearnCard app](https://learncard.app). The options below send them programmatically.
{% endhint %}

Choose one option.

{% tabs %}
{% tab title="Fastest: one command" %}

You need **Node.js 20 or newer**. In an empty folder, run:

```bash
npx @learncard/cli send you@example.com
```

Use **a real email address you can open**. The command:

1. Ask for your issuer name and a badge name (Enter accepts the defaults)
2. Generate a secret seed and write it to `.env` (and add `.env` to `.gitignore`)
3. Create your profile on the LearnCard Network
4. Sign a "Quickstart Complete" badge and send it
5. Write the generated code to `./send.mjs`

Then skip to [What you should see](#what-you-should-see).

{% endtab %}

{% tab title="No keys: Developer Portal + curl" %}

LearnCard signs the credential; this option requires no installation or key management.

1. Sign in at [learncard.app](https://learncard.app) and open **[learncard.app/app-store/developer](https://learncard.app/app-store/developer)**. Create an Integration if you don't have one.
2. Open **Guides → Issue Credentials** and work down the steps:
    - **API Token** — create one and copy it. It's shown once.
    - **Signing Authority** — create one hosted by LearnCard.
    - **Create Templates** — make a badge (any name). The **template URI** shown under the template selector — copy it exactly.
3. Send it:

```bash
export TOKEN=...                   # from the API Token step
export TEMPLATE_URI=lc:network:... # paste the template URI shown under the template selector
export RECIPIENT_EMAIL=you@example.com
```

<!-- snippet: quickstart/send-from-template.sh -->

```bash
curl -X POST https://network.learncard.com/api/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"boost\",
    \"recipient\": \"$RECIPIENT_EMAIL\",
    \"templateUri\": \"$TEMPLATE_URI\"
  }"
```

<!-- /snippet -->

The response is JSON. `inbox.status` is `PENDING` (new person — they get an email with `inbox.claimUrl`) or `ISSUED` (already a LearnCard user — it's in their wallet). Skip to [What you should see](#what-you-should-see).

{% endtab %}

{% tab title="Own your keys: one script" %}

**Set up.**
You need **Node.js 20 or newer**. In an empty folder:

```bash
npm install @learncard/init
```

Create a `.env` file with a secret seed and a profile ID:

```bash
# Generate the seed with:  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SECURE_SEED=paste-the-64-character-hex-string-here

# Your organization's public handle on the network. 3–40 chars, lowercase, letters/numbers/hyphens.
# IDs are global — pick something specific to you.
PROFILE_ID=acme-quickstart
```

{% hint style="warning" %}
The seed **is** your issuer identity. Anyone with it can issue credentials as you. Never commit it or share it.
{% endhint %}

**Send a credential.** Save this as `send.mjs`:

<!-- snippet: quickstart/send.mjs -->

```javascript
import { randomUUID } from 'node:crypto';
import { initLearnCard } from '@learncard/init';

const recipientEmail = process.argv[2];
if (!recipientEmail) throw new Error('Usage: node --env-file=.env send.mjs you@example.com');

// `network: true` connects to the production LearnCard Network.
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });

// Your public identity on the network. Created once; safe to re-run.
if (!(await learnCard.invoke.getProfile())) {
    await learnCard.invoke.createProfile({
        profileId: process.env.PROFILE_ID,
        displayName: 'My Organization',
    });
}

// A minimal Open Badges 3.0 credential, signed by you.
const credential = await learnCard.invoke.issueCredential({
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: learnCard.id.did(),
    validFrom: new Date().toISOString(),
    name: 'Quickstart Complete',
    credentialSubject: {
        type: ['AchievementSubject'],
        achievement: {
            id: `urn:uuid:${randomUUID()}`,
            type: ['Achievement'],
            name: 'Quickstart Complete',
            description: 'Sent a verifiable credential with LearnCard.',
            criteria: { narrative: 'Ran the LearnCard quickstart.' },
        },
    },
});

// Send it. The recipient can be an email, phone number, profile ID, or DID.
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: recipientEmail,
    signedCredential: credential,
});

if (result.inbox?.status === 'PENDING') {
    console.log(
        `Sent. ${recipientEmail} will get an email with this claim link:\n${result.inbox.claimUrl}`
    );
} else {
    console.log(
        `Delivered. ${recipientEmail} already uses LearnCard — the credential is in their wallet.`
    );
}
console.log(`Reusable template for this badge: ${result.uri}`);
```

<!-- /snippet -->

Run it with **a real email address you can open**. Placeholder domains like `example.com` are rejected by the mail provider.

```bash
node --env-file=.env send.mjs you@example.com
```

{% endtab %}
{% endtabs %}

## What you should see

<figure><img src="../.gitbook/assets/quickstart-complete-badge.png" alt="The Quickstart Complete badge as it appears in the recipient's LearnCard wallet: a certificate reading Quickstart Complete, awarded on today's date, certified by My Organization." width="420"><figcaption>What the recipient sees after claiming.</figcaption></figure>

{% tabs %}
{% tab title="CLI / script" %}

Your terminal shows one of two results:

```
Sent. you@example.com will get an email with this claim link:
https://learncard.app/...
```

Open the email, tap **Claim**, and sign in or create an account. **"Quickstart Complete"**, a verifiable Open Badges 3.0 credential signed by you, appears in the wallet.

```
Delivered. you@example.com already uses LearnCard — the credential is in their wallet.
```

The recipient already has a verified account, so the credential is in their wallet.

Both are followed by:

```
Reusable template for this badge: lc:network:network.learncard.com/trpc:boost:…
```

You can rerun the script; it creates the profile only once.

{% endtab %}

{% tab title="curl" %}

The response is JSON:

```json
{
    "uri": "lc:network:network.learncard.com/trpc:boost:...",
    "inbox": { "status": "PENDING", "claimUrl": "https://learncard.app/..." }
}
```

`inbox.status` is `PENDING` for a new recipient — email them `inbox.claimUrl` to claim it — or `ISSUED` if they already use LearnCard, meaning it was auto-delivered with no `claimUrl`.

{% endtab %}
{% endtabs %}

Every `send` saves the badge as a **template** (a Boost). To send the same badge to more people, pass `templateUri: result.uri` instead of `signedCredential`. LearnCard fills in and signs each one server-side once you set up a [signing authority](../how-to-guides/create-signing-authority.md).

## If something goes wrong

| You see                                                                                             | Why                                                                                | Fix                                                                                               |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `Cannot use import statement outside a module`                                                      | File is named `.js`                                                                | Name it `send.mjs`                                                                                |
| `Key must be a hexadecimal string!`                                                                 | `SECURE_SEED` isn't 64 hex characters                                              | Generate it with the command in step 1                                                            |
| `A LearnCard has been initialized with a seed that is less than 32 bytes`                           | Seed is too short                                                                  | Same — generate a full 64-character seed                                                          |
| `Profile already exists!`                                                                           | Someone else already took your `PROFILE_ID`                                        | Pick a more specific one                                                                          |
| `Usage: node --env-file=.env send.mjs you@example.com`                                              | No recipient given                                                                 | Add the email address as the last argument                                                        |
| `Sending credentials via phone is a feature reserved for members of the LearnCard Trusted Registry` | You passed a phone number as the recipient                                         | Email works for everyone; phone needs [issuer verification](../how-to-guides/verify-my-issuer.md) |
| `Failed to send email via Postmark: … marked as inactive`                                           | The address is a placeholder (`example.com`) or has bounced before                 | Use a real address you can open                                                                   |
| `You must register a signing authority before using send without a pre-signed credential`           | You passed `template` or `templateUri` (server-signed) without a signing authority | Sign locally (`signedCredential`) or [set one up](../how-to-guides/create-signing-authority.md)   |

## Next steps

- [Send Signed Credentials over HTTP](../how-to-guides/send-signed-credentials-over-http.md) — sign credentials yourself and deliver them from any language via the REST API.
- [Create a Credential](../tutorials/create-a-credential.md) — add an image, criteria, and skills.
- [Create a Boost](../tutorials/create-a-boost.md) — issue the same badge to many people.
- [Listen to Webhooks](../tutorials/listen-to-webhooks.md) — detect when credentials are claimed.
- [What Do You Want to Build?](../introduction/what-do-you-want-to-build.md) — choose an integration path.
