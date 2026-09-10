---
description: 'Every credential is signed by a key. Decide whether you hold it or LearnCard holds one for you.'
---

# Who Signs Your Credentials?

Every credential is signed by a private key. You have two choices: **you sign** with your own seed, or **LearnCard signs for you** with a key it hosts on your behalf — a _signing authority_. Pick one; you can change later.

**~5 minutes · Needs:** a LearnCard profile (the Quickstart creates one)

## Pick a path

|                         | **You sign**                                                             | **LearnCard signs for you**                                                            | **Your own signing service**                                        |
| :---------------------- | :----------------------------------------------------------------------- | :------------------------------------------------------------------------------------- | :------------------------------------------------------------------ |
| **Choose when**         | You run a server and are happy to keep a seed in an environment variable | You don't want to hold keys, or you use API tokens, templates, or the Developer Portal | You already run a VC-API issuer and it must be the signer of record |
| **What you set up**     | Nothing — `initLearnCard({ seed })`                                      | A hosted signing authority, **once** ([below](#learncard-signs-for-you))               | Register your endpoint ([below](#your-own-signing-service))         |
| **What `send()` takes** | `signedCredential`                                                       | `templateUri` or `template`                                                            | `templateUri` or `template`                                         |
| **Where the key lives** | Your server                                                              | LearnCard, tied to your profile                                                        | Your service                                                        |
| **Also unlocks**        | —                                                                        | Claim links, Developer Portal templates, Partner Connect apps                          | Same as hosted                                                      |

{% hint style="info" %}
If you saw `You must register a signing authority before using send without a pre-signed credential`, you are on the **LearnCard signs for you** path without having done the one-time setup. Either finish it below, or switch to signing yourself and pass `signedCredential`.
{% endhint %}

## You sign

Nothing to set up. The [Quickstart](../quick-start/your-first-integration.md) does this: `initLearnCard({ seed, network: true })` → `issueCredential(...)` → `send({ signedCredential })`. Keep the seed in an environment variable and [back it up](go-to-production.md#security).

## LearnCard signs for you

Do this once per profile per network (staging and production are [separate](deploy-infrastructure/test-safely.md)). Afterwards `send({ templateUri })` and `send({ template })` work with no signing details.

{% tabs %}
{% tab title="Developer Portal (no code)" %}

1. Sign in at [learncard.app/app-store/developer](https://learncard.app/app-store/developer).
2. Open **Guides → Issue Credentials → Signing Authority** and click **Create**.

The first authority you create becomes your primary. Done.

{% endtab %}
{% tab title="Script" %}

Creating a hosted authority needs the LearnCard App API plugin in addition to the network plugin:

```bash
npm install @learncard/init @learncard/lca-api-plugin
```

```javascript
import { initLCALearnCard } from '@learncard/lca-api-plugin';

const learnCard = await initLCALearnCard({ seed: process.env.SECURE_SEED });

// 1. LearnCard generates and stores a key for you.
const authority = await learnCard.invoke.createSigningAuthority('default-issuer');
if (!authority) throw new Error('Could not create signing authority');

// 2. Authorize it to sign for your profile.
await learnCard.invoke.registerSigningAuthority(authority.endpoint, authority.name, authority.did);

// 3. Make it the one send() uses.
await learnCard.invoke.setPrimaryRegisteredSigningAuthority(authority.endpoint, authority.name);

console.log('Primary signing authority:', authority.name);
```

`send()` always uses your **primary** authority. To switch, call `setPrimaryRegisteredSigningAuthority` with another registered one.

{% endtab %}
{% endtabs %}

## Your own signing service

If you run a [VC-API](https://w3c-ccg.github.io/vc-api/) compliant issuer and it must be the signer, register it instead of a hosted authority. It needs a public HTTPS `/issue` endpoint and a DID.

```javascript
import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });

await learnCard.invoke.registerSigningAuthority(
    'https://issuer.my-org.com/issue',
    'my-issuer',
    'did:web:issuer.my-org.com'
);
await learnCard.invoke.setPrimaryRegisteredSigningAuthority(
    'https://issuer.my-org.com/issue',
    'my-issuer'
);
```

`send()` will now call your endpoint to sign. If you register several authorities and need to choose per issuance, use the lower-level [Universal Inbox API](../sdks/learncard-network/universal-inbox-api.md) and pass `configuration.signingAuthority: { name, endpoint }`.

## What you should see

After setup, `send()` with a template returns normally — no signing details in the call:

```javascript
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'you@example.com',
    templateUri: 'lc:network:network.learncard.com/trpc:boost:…',
});
console.log(result.inbox?.status); // 'PENDING' or 'ISSUED'
```

In the Developer Portal, **Signing Authority** shows the authority name with a **Primary** badge.

## Troubleshooting

| If…                                                                                       | Then                                                                                                                                           |
| :---------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| `You must register a signing authority before using send without a pre-signed credential` | You're sending a template without a primary authority. Finish [LearnCard signs for you](#learncard-signs-for-you), or pass `signedCredential`. |
| `learnCard.invoke.createSigningAuthority is not a function`                               | You used `initLearnCard`. Hosted authorities need `initLCALearnCard` from `@learncard/lca-api-plugin`.                                         |
| `Profile not found`                                                                       | Create a profile first (`createServiceProfile`) — the Quickstart's `setup.mjs` does this.                                                      |
| It works on staging but not production                                                    | Authorities are per network. Register again on production — see [Go to Production](go-to-production.md#switch-from-staging-to-production).     |

## Next steps

The CLI's `send --template` saves the reusable script below after setting up your signer and template:

<!-- snippet: quickstart/send-from-template.mjs -->

```javascript
import { initLearnCard } from '@learncard/init';

const recipient = process.argv[2];
if (!recipient)
    throw new Error('Usage: node --env-file=.env send-from-template.mjs you@example.com');
if (!process.env.TEMPLATE_URI)
    throw new Error('Run npx @learncard/cli send you@example.com --template first.');

// The CLI saved a template and registered your primary signing authority once.
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient,
    templateUri: process.env.TEMPLATE_URI,
});
console.log(
    result.inbox?.status === 'PENDING'
        ? `Sent. ${recipient} will get a claim email. You can also share this link directly:\n${result.inbox.claimUrl}`
        : `Delivered. ${recipient} already uses LearnCard — the credential is in their wallet.`
);
console.log(`Reusable template for this badge: ${result.uri}`);
```

<!-- /snippet -->

- Send from a template → [Issue at scale with templates](send-credentials.md#issue-at-scale-with-templates)
- Know when it's claimed → [Know When a Credential Is Claimed](../tutorials/listen-to-webhooks.md)
- Understand what a signing authority is under the hood → [Signing Authorities](../core-concepts/identities-and-keys/signing-authorities.md)
