---
description: 'Get a webhook the moment a credential you sent is delivered, and again when it is claimed.'
---

# Know When a Credential Is Claimed

Sending a credential doesn't tell you what happened to it. Pass a webhook URL with the send and LearnCard `POST`s to your server the moment it's delivered, and again the moment it's claimed — no polling.

**~15 minutes · Needs:** Node.js 20+, a public URL (e.g., ngrok)

## The one-line version

```bash
npx @learncard/cli webhook you@example.com --url https://<your-tunnel>
```

Starts a receiver on port 8787, sends a demo credential with `webhookUrl` set, and prints each event as it arrives. Expose the port first (`ngrok http 8787`) and pass the tunnel URL. It writes the receiver as `webhook.mjs` — the same code Step 1 below walks through.

The rest of this page is the same flow in your own code.

## Prerequisites

- The [Quickstart](../quick-start/your-first-integration.md), **"Own your keys"** path — this tutorial extends `send.mjs` and reuses its `.env` (`SECURE_SEED`, `PROFILE_ID`)
- [ngrok](https://ngrok.com/download) (or another tunnel) to expose your local server

---

## Send with a webhook URL

Pass `options.webhookUrl` when you send a credential to an email or phone number. LearnCard `POST`s a notification to that URL twice: once when the credential is delivered (`ISSUANCE_DELIVERED`), and again when the recipient claims it (`ISSUANCE_CLAIMED`).

### Step 1: Start a receiver

Save this next to `send.mjs` as `webhook.mjs`. It verifies that each request really came from the LearnCard Network (a DID-signed bearer token), acknowledges fast, logs the fields you care about, and de-duplicates by `${type}:${issuanceId}` — LearnCard retries on failure, so you will occasionally see the same event twice.

<!-- snippet: cli/webhook.mjs -->

```javascript
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

export const extractBearer = header =>
    typeof header === 'string' ? /^Bearer\s+(\S+)$/i.exec(header)?.[1] : undefined;

export const webhookDedupeKey = payload => {
    const id = payload?.data?.inbox?.issuanceId;
    return ['ISSUANCE_DELIVERED', 'ISSUANCE_CLAIMED', 'ISSUANCE_ERROR'].includes(payload?.type) &&
        typeof id === 'string' &&
        id.length > 0
        ? `${payload.type}:${id}`
        : undefined;
};

export const createWebhookReceiver = (verifier, expectedDid = process.env.EXPECTED_NETWORK_DID) => {
    // Demo only: bounded, in-memory deduplication. Use durable storage in production.
    const seen = new Set();
    return createServer(async (req, res) => {
        if (req.method !== 'POST') return void res.writeHead(404).end();
        const token = extractBearer(req.headers.authorization);
        try {
            if (!token) return void res.writeHead(401).end();
            const result = await verifier.invoke.verifyPresentation(token, { proofFormat: 'jwt' });
            if (result.errors.length) return void res.writeHead(401).end();
            const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
            if (expectedDid && claims.iss !== expectedDid) return void res.writeHead(403).end();
        } catch {
            return void res.writeHead(401).end();
        }
        try {
            const chunks = [];
            let size = 0;
            for await (const chunk of req) {
                size += chunk.length;
                if (size > 65536) return void res.writeHead(413).end();
                chunks.push(chunk);
            }
            const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            const key = webhookDedupeKey(payload);
            if (!key) return void res.writeHead(400).end();
            // Acknowledge before doing any application work; LearnCard waits six seconds.
            res.writeHead(200).end();
            if (seen.has(key)) return;
            if (seen.size >= 10000) seen.delete(seen.values().next().value);
            seen.add(key);
            const inbox = payload.data.inbox;
            const fields = [
                payload.type,
                inbox.status,
                inbox.issuanceId,
                inbox.recipient?.learnCardId,
            ];
            console.log(
                fields
                    .map(value =>
                        typeof value === 'string'
                            ? value.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, '?')
                            : ''
                    )
                    .join(' ')
                    .trim()
            );
        } catch {
            if (!res.headersSent) res.writeHead(400).end();
        }
    });
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const { initLearnCard } = await import('@learncard/init');
    const port = Number(process.env.PORT || 8787);
    if (!Number.isInteger(port) || port < 1 || port > 65535)
        throw new Error('PORT must be 1–65535');
    const verifier = await initLearnCard();
    if (!process.env.EXPECTED_NETWORK_DID) {
        console.log(
            'Demo: signatures are verified, but any DID is accepted. Set EXPECTED_NETWORK_DID to your trusted network DID before production.'
        );
    }
    const server = createWebhookReceiver(verifier);
    server.requestTimeout = 5000;
    server.listen(port, () => console.log(`Listening on http://localhost:${port}`));
}
```

<!-- /snippet -->

```bash
node webhook.mjs
```

It listens on port 8787 (set `PORT` to change).

### Step 2: Expose it with ngrok

```bash
ngrok http 8787
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

There's no server-side de-duplication, so always key idempotency on `${type}:${issuanceId}` — the pattern `webhook.mjs` uses above. Responding quickly reduces duplicates; it doesn't eliminate them.

---

## Other events: profile webhooks

Everything above is scoped to one `send()`. For events about your **profile** — connection requests, boosts accepted, consent-flow activity, guardian approvals — set a standing webhook with `updateProfile({ notificationsWebhook })`. It uses the same authentication and retries, but it **never** receives `ISSUANCE_DELIVERED`, `ISSUANCE_CLAIMED`, or `ISSUANCE_ERROR`; those only go to the per-send `options.webhookUrl`. Setup and every payload shape: [Notifications & Webhooks](../sdks/learncard-network/notifications.md#configuration).

---

## What You Should See

Terminal running `send-with-webhook.mjs`:

```
Issuance ID: 2f1a9c3e-6b8d-4e2f-9a71-58c6d1b4a9f0
Sent. you@example.com will get a claim email. Watch your listener for ISSUANCE_DELIVERED.
```

Terminal running `webhook.mjs`, immediately after:

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
| `Notification webhook transport failed with 404` | Your server is reachable, but nothing is listening on the path ngrok is forwarding to. Match `webhookUrl` to where `webhook.mjs` actually listens.                                            |
| No `ISSUANCE_CLAIMED` after claiming             | The recipient already had a LearnCard account, so the credential was auto-delivered as `ISSUED` at send time — there's nothing left to claim. Check for that in `ISSUANCE_DELIVERED` instead. |
| Duplicate webhooks                               | Expected — delivery is at-least-once, not a sign your server responded too slowly. De-duplicate on `${type}:${issuanceId}` as shown above.                                                    |
| 401s in your own logs                            | `verifyLearnCardRequest` rejected the token. Check you're reading the `Authorization` header — there's no separate signature header to fall back to.                                          |

## Next Steps

- [Send & Issue Credentials](../how-to-guides/send-credentials.md) — the full `send()` reference, including `suppressDelivery` and `guardianEmail`.
- [Notifications & Webhooks](../sdks/learncard-network/notifications.md) — profile-level webhooks and the payload for every notification type.
- [Go to Production](../how-to-guides/go-to-production.md) — checklist before you rely on this for real traffic.
