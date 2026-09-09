---
description: 'Tutorial: Get notified the moment a credential is delivered and claimed'
---

# Listen to Webhooks

Sending a credential doesn't tell you what happened to it. Webhooks push a notification to your own server the moment it's delivered, and again the moment it's claimed, so you don't have to poll.

**~15 minutes · Needs:** Node.js 20+, a public URL (e.g., ngrok)

## Prerequisites

- The [Quickstart](../quick-start/your-first-integration.md), **"Own your keys"** path — this tutorial extends `send.mjs` and reuses its `.env` (`SECURE_SEED`, `PROFILE_ID`)
- [ngrok](https://ngrok.com/download) (or another tunnel) to expose your local server

---

## Know When Your Credential Was Claimed

Pass `options.webhookUrl` when you send a credential to an email or phone number. LearnCard `POST`s a notification to that URL twice: once when the credential is delivered (`ISSUANCE_DELIVERED`), and again when the recipient claims it (`ISSUANCE_CLAIMED`).

### Step 1: Start a receiver

Save this next to `send.mjs` as `webhook-listener.mjs`. It acknowledges fast, logs the fields you care about, and de-duplicates by `issuanceId` (LearnCard's delivery is at-least-once — more on that below):

```javascript
import { createServer } from 'node:http';

const port = 3000;
const seenDeliveries = new Set(); // `${type}:${issuanceId}` — resets on restart; use a database in production

const server = createServer((req, res) => {
    if (req.method !== 'POST') {
        res.writeHead(404).end();
        return;
    }

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
        // Acknowledge immediately. LearnCard waits 6 seconds for a response, then
        // treats it as a failed delivery and retries.
        res.writeHead(200, { 'Content-Type': 'application/json' }).end('{"received":true}');

        const notification = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        const { type, data } = notification;
        const issuanceId = data?.inbox?.issuanceId;
        const dedupeKey = `${type}:${issuanceId}`;

        if (issuanceId && seenDeliveries.has(dedupeKey)) {
            console.log(`Duplicate delivery, already processed: ${dedupeKey}`);
            return;
        }
        if (issuanceId) seenDeliveries.add(dedupeKey);

        console.log(type, {
            issuanceId,
            status: data?.inbox?.status,
            claimedBy: data?.inbox?.recipient?.learnCardId,
        });
    });
});

server.listen(port, () => {
    console.log(`Listening on http://localhost:${port} — point ngrok at this port.`);
});
```

```bash
node webhook-listener.mjs
```

### Step 2: Expose it with ngrok

```bash
ngrok http 3000
```

Copy the `https://` forwarding URL ngrok prints. That's your `webhookUrl` for the next step.

### Step 3: Send with a webhook URL

Save this next to `send.mjs` as `send-with-webhook.mjs`. It's the quickstart's script with one addition: `options.webhookUrl`.

```javascript
import { randomUUID } from 'node:crypto';
import { initLearnCard } from '@learncard/init';

const recipientEmail = process.argv[2];
const webhookUrl = process.argv[3];
if (!recipientEmail || !webhookUrl) {
    throw new Error(
        'Usage: node --env-file=.env send-with-webhook.mjs you@example.com https://xxxx.ngrok-free.app'
    );
}

const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });

if (!(await learnCard.invoke.getProfile())) {
    await learnCard.invoke.createProfile({
        profileId: process.env.PROFILE_ID,
        displayName: 'My Organization',
    });
}

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

// The only difference from the quickstart's send.mjs: options.webhookUrl.
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: recipientEmail,
    signedCredential: credential,
    options: { webhookUrl },
});

console.log(`Issuance ID: ${result.inbox?.issuanceId}`);
console.log(
    result.inbox?.status === 'PENDING'
        ? `Sent. ${recipientEmail} will get a claim email. Watch your listener for ISSUANCE_DELIVERED.`
        : `Delivered instantly — ${recipientEmail} already uses LearnCard, so there's no claim step (and no ISSUANCE_CLAIMED will follow).`
);
```

Run it with a real email you can open and the ngrok URL from Step 2:

```bash
node --env-file=.env send-with-webhook.mjs you@example.com https://xxxx.ngrok-free.app
```

### Step 4: Watch it arrive

Your listener logs `ISSUANCE_DELIVERED` immediately. `status: 'PENDING'` means a claim email is on its way; `status: 'ISSUED'` means the recipient already had a LearnCard account and the credential was delivered straight to their wallet (in which case there's nothing left to claim — skip to [Troubleshooting](#troubleshooting)).

### Step 5: Claim it

Open the claim email, tap **Claim**, and sign in or create an account — same as in the quickstart. Your listener logs `ISSUANCE_CLAIMED`, with `claimedBy` set to the DID of the account that just claimed it.

---

## What's in the Payload

### `ISSUANCE_DELIVERED`

Fired at send time. This example is the `PENDING` case (new recipient, claim email sent):

```json
{
    "type": "ISSUANCE_DELIVERED",
    "to": {
        "did": "did:web:network.learncard.com:users:acme-quickstart",
        "profileId": "acme-quickstart",
        "displayName": "My Organization"
    },
    "from": { "did": "did:web:network.learncard.com" },
    "message": {
        "title": "Credential Delivered to Inbox",
        "body": "My Organization sent a credential to email's inbox at you@example.com!"
    },
    "data": {
        "inbox": {
            "issuanceId": "2f1a9c3e-6b8d-4e2f-9a71-58c6d1b4a9f0",
            "status": "PENDING",
            "recipient": {
                "contactMethod": { "type": "email", "value": "you@example.com" }
            },
            "timestamp": "2026-09-09T18:04:12.000Z"
        }
    },
    "sent": "2026-09-09T18:04:12.512Z"
}
```

If the recipient already has a verified LearnCard account, `data.inbox.status` is `"ISSUED"` instead, and `data.inbox.recipient.learnCardId` is set to their DID — the credential landed directly in their wallet.

### `ISSUANCE_CLAIMED`

Fired when a `PENDING` credential is claimed:

```json
{
    "type": "ISSUANCE_CLAIMED",
    "to": { "did": "did:web:network.learncard.com:users:" },
    "from": { "did": "did:web:network.learncard.com" },
    "message": {
        "title": "Credential Claimed from Inbox",
        "body": "you@example.com claimed a credential from their inbox."
    },
    "data": {
        "inbox": {
            "issuanceId": "2f1a9c3e-6b8d-4e2f-9a71-58c6d1b4a9f0",
            "status": "ISSUED",
            "recipient": {
                "contactMethod": { "type": "email", "value": "you@example.com" },
                "learnCardId": "did:web:network.learncard.com:users:jane-doe"
            },
            "timestamp": "2026-09-09T18:11:47.000Z"
        }
    },
    "sent": "2026-09-09T18:11:47.203Z"
}
```

{% hint style="warning" %}
`to.did` on this event isn't populated correctly today — it resolves to an empty profile segment instead of your issuer DID. Don't key off it. `from.did` is reliable (always the network's own DID), and `data.inbox.issuanceId` — the same value returned as `result.inbox.issuanceId` from your `send()` call — is what ties this back to the credential you sent.
{% endhint %}

A third event, `ISSUANCE_ERROR`, fires instead of `ISSUANCE_CLAIMED` if claiming fails on the network's side (for example, a signing authority that stopped responding). Same shape, with the failure reason in `message.body`.

---

## Verify the Request Is From LearnCard

Every webhook request carries `Authorization: Bearer <token>` — a DID-JWT proving the request came from the LearnCard Network's own DID. There's no separate signing secret and no `X-LearnCard-Signature` header; the bearer token **is** the proof.

You don't need a seed to check it — a seedless instance can still verify signatures:

```javascript
import { initLearnCard } from '@learncard/init';

const verifier = await initLearnCard();

async function verifyLearnCardRequest(authHeader) {
    const token = authHeader?.replace(/^Bearer\s+/i, '');
    if (!token) return false;

    const result = await verifier.invoke.verifyPresentation(token, { proofFormat: 'jwt' });
    return result.errors.length === 0;
}
```

Add the check at the top of your handler, before you trust the body:

```javascript
const authHeader = req.headers['authorization'];
if (!(await verifyLearnCardRequest(authHeader))) {
    res.writeHead(401).end();
    return;
}
```

That confirms the request is signed by _some_ DID — decode the token to see which one:

```javascript
function holderFromJwt(token) {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    return payload.iss; // the DID that signed this request
}
```

The production LearnCard Network signs as `did:web:network.learncard.com` — no `:users:` segment; that's reserved for profiles. If you're pointed at a different environment, pin the DID you see on the first delivery and compare against it on every request after that.

---

## Retries and Duplicates

- LearnCard waits 6 seconds for your response. Slower than that counts as a failed delivery.
- A 4xx response (other than 408, 425, or 429) is treated as a definitive rejection — it will not be retried.
- Anything else that fails (5xx, timeout, network error) is retried through a queue, up to 3 attempts total, before it's dropped into a dead-letter queue.
- Delivery is **at-least-once**, not exactly-once. You can receive the same notification more than once even when nothing went wrong on your end.

There's no server-side de-duplication, so always key idempotency on `${type}:${issuanceId}` — the pattern `webhook-listener.mjs` uses above. Responding quickly reduces duplicates; it doesn't eliminate them.

---

## Part 2: Profile Notifications

Everything above is **per-issuance** — scoped to one `send()` call. For everything else that happens to your profile — connection requests, someone accepting a boost, consent-flow activity — set a standing webhook on the profile itself:

```javascript
await learnCard.invoke.updateProfile({
    notificationsWebhook: 'https://your-server.example.com/webhooks/learncard',
});
```

This delivers every notification type _except_ `ISSUANCE_DELIVERED`, `ISSUANCE_CLAIMED`, and `ISSUANCE_ERROR` — those three only ever go to the per-issuance `options.webhookUrl` from Part 1, even if you also have `notificationsWebhook` set. Types you'll see here include `CONNECTION_REQUEST`, `CONNECTION_ACCEPTED`, `CREDENTIAL_RECEIVED`, `BOOST_RECEIVED`, `BOOST_ACCEPTED`, `PRESENTATION_RECEIVED`, `CONSENT_FLOW_TRANSACTION`, `GUARDIAN_APPROVAL_PENDING`, `GUARDIAN_APPROVED`, `GUARDIAN_REJECTED`, `APP_NOTIFICATION`, `CREDENTIAL_REVOKED`, and more.

Same authentication, same retry behavior as above. Full payload shape for every type: [Notifications & Webhooks](../sdks/learncard-network/notifications.md).

---

## What You Should See

Terminal running `send-with-webhook.mjs`:

```
Issuance ID: 2f1a9c3e-6b8d-4e2f-9a71-58c6d1b4a9f0
Sent. you@example.com will get a claim email. Watch your listener for ISSUANCE_DELIVERED.
```

Terminal running `webhook-listener.mjs`, immediately after:

```
ISSUANCE_DELIVERED { issuanceId: '2f1a9c3e-6b8d-4e2f-9a71-58c6d1b4a9f0', status: 'PENDING', claimedBy: undefined }
```

Open the claim email, tap **Claim**, and sign in or create an account. Back in the listener:

```
ISSUANCE_CLAIMED { issuanceId: '2f1a9c3e-6b8d-4e2f-9a71-58c6d1b4a9f0', status: 'ISSUED', claimedBy: 'did:web:network.learncard.com:users:jane-doe' }
```

## Troubleshooting

| If…                                              | Then                                                                                                                                                                                          |
| :----------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Webhook never arrives                            | Confirm the ngrok URL you passed as `options.webhookUrl` is still running — ngrok URLs change every restart on the free tier.                                                                 |
| `Notification webhook transport failed with 404` | Your server is reachable, but nothing is listening on the path ngrok is forwarding to. Match `webhookUrl` to where `webhook-listener.mjs` actually listens.                                   |
| No `ISSUANCE_CLAIMED` after claiming             | The recipient already had a LearnCard account, so the credential was auto-delivered as `ISSUED` at send time — there's nothing left to claim. Check for that in `ISSUANCE_DELIVERED` instead. |
| Duplicate webhooks                               | Expected — delivery is at-least-once, not a sign your server responded too slowly. De-duplicate on `${type}:${issuanceId}` as shown above.                                                    |
| 401s in your own logs                            | `verifyLearnCardRequest` rejected the token. Check you're reading the `Authorization` header — there's no separate signature header to fall back to.                                          |

## Next Steps

- [Send & Issue Credentials](../how-to-guides/send-credentials.md) — the full `send()` reference, including `suppressDelivery` and `guardianEmail`.
- [Notifications & Webhooks](../sdks/learncard-network/notifications.md) — payload reference for every profile-level notification type.
- [Go to Production](../how-to-guides/go-to-production.md) — checklist before you rely on this for real traffic.
