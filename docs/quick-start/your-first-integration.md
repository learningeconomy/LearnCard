---
description: Send a credential to any email address in about 15 lines of code.
---

# Quickstart: Send a Credential

The fastest way to see LearnCard work: send a verifiable credential to an email address. The recipient gets an email with a claim link — no account needed before claiming.

{% hint style="info" %}
No code at all? You can issue credentials directly from the [LearnCard app](https://learncard.app) — no integration required. This guide is for sending credentials programmatically.
{% endhint %}

## 1. Install

```bash
npm install @learncard/init dotenv
```

You'll need Node.js 18+ and a secure seed phrase in a `.env` file:

```bash
SECURE_SEED=abcdef1234567890...
```

{% hint style="warning" %}
Your seed controls your issuer identity. Generate a random 64-char hex string, keep it secret, and never commit it.
{% endhint %}

## 2. Send a credential

Create `send.js`:

```javascript
import 'dotenv/config';
import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });

await learnCard.invoke.createProfile({
    profileId: 'my-organization',
    displayName: 'My Organization',
});

const credential = await learnCard.invoke.issueCredential(learnCard.invoke.getTestVc());

const result = await learnCard.invoke.sendCredentialViaInbox({
    recipient: { type: 'email', value: 'learner@example.com' },
    credential,
});

console.log(result.status, result.claimUrl);
```

```bash
node send.js
```

That's it. The recipient receives an email with a claim link, and `result.claimUrl` gives you the same link to deliver through your own channels.

{% hint style="info" %}
`createProfile` only needs to run once per issuer — wrap it in a try/catch or remove it after the first run.
{% endhint %}

## Prefer raw HTTP?

Generate an API token once, then send from any language:

```javascript
const grantId = await learnCard.invoke.addAuthGrant({
    name: 'inbox-sender',
    scope: 'inbox:write',
});
const token = await learnCard.invoke.getAPITokenForAuthGrant(grantId);
```

```bash
curl -X POST https://network.learncard.com/api/inbox/issue \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": { "type": "email", "value": "learner@example.com" },
    "credential": { "...": "your signed credential JSON" }
  }'
```

See [Send Credentials](../how-to-guides/send-credentials.md) for the full API reference, phone delivery, templates, and webhooks.

## Next steps

-   **Design a real badge** instead of the test credential → [Create a Credential](../tutorials/create-a-credential.md)
-   **Issue the same badge to many people** → [Create a Boost](../tutorials/create-a-boost.md)
-   **Not sure what to build?** → [Use Cases & Possibilities](../introduction/use-cases-and-possibilities.md)
