---
description: Receive signed contract events at a webhook, or poll an ordered change feed, for one Integration.
---

# Integration Webhooks and Change Feed

An Integration can receive the contract events its owner is allowed to see in two ways:

- a **signed webhook**: LearnCard posts each event to your HTTPS endpoint with an HMAC signature
- a **change feed**: your server polls an ordered list of the same events with a cursor

Both carry the same record. The feed is always available once events are enabled, so a webhook receiver can use it to catch up after an outage, and a server that cannot accept inbound requests can use the feed alone.

{% hint style="info" %}
Integration events are separate from **profile notification webhooks** (`notificationsWebhook` on a profile). Profile notification webhooks carry an `Authorization: Bearer <DID-JWT>` token and have no signature header; see [Know When a Credential Is Claimed](../../tutorials/listen-to-webhooks.md) and [Contract Requests and Events](contract-requests-and-events.md). Everything on this page applies to Integrations only.
{% endhint %}

## What an Integration receives

An Integration is not tied to particular contracts. It receives the events of **every** contract where its owner profile is the owner, a writer or a data recipient, and the request events where its owner profile is the requester. `contractUri` in each record tells you which contract it belongs to, so a client that only cares about some contracts can filter on it.

A profile can have several Integrations with contract events enabled. Each of them receives the events of every contract of that profile, with its own `sequence`.

{% hint style="warning" %}
Do not put the Integrations of different customers under one profile. Each of them would receive the events of all the others' contracts. Give each customer its own profile and its own API token.
{% endhint %}

## Enable events

Events are recorded for an Integration from the moment they are enabled. Events that happened before that moment are never added.

| You want         | Do this                                                   | Result                                                                                                              |
| ---------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Webhook and feed | `setIntegrationWebhook(id, url)`                          | Stores the URL, creates the signing secret if there is none and returns it once, and enables events if they are off |
| Feed only        | `updateIntegration(id, { contractEventsEnabled: true })`  | Enables events with no webhook                                                                                      |
| Stop the webhook | `setIntegrationWebhook(id, null)`                         | Removes the URL. Events stay enabled and the feed keeps filling. The secret is kept                                 |
| Stop everything  | `updateIntegration(id, { contractEventsEnabled: false })` | No new records, and deliveries stop at once (see [Delivery and retries](#delivery-and-retries))                     |

In the LearnCard app, open your integration in the developer portal and use the **Webhooks** tab. Everything on that tab can also be done with an API token alone; see [API-only setup](#api-only-setup).

### Register the webhook and store the secret

{% tabs %}
{% tab title="SDK" %}

```typescript
const registration = await learnCard.invoke.setIntegrationWebhook(
    integrationId,
    'https://example.com/learncard/webhook'
);
// registration.webhookUrl               the stored URL
// registration.contractEventsEnabledAt  when events were enabled
// registration.secret                   "whsec_..." — only when this call created the first secret

if (registration.secret) await storeSecret(registration.secret);
```

{% endtab %}

{% tab title="REST" %}

```bash
curl -X POST "https://network.learncard.com/api/integration/$INTEGRATION_ID/webhook" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "webhookUrl": "https://example.com/learncard/webhook" }'
# { "webhookUrl": "https://example.com/learncard/webhook",
#   "secret": "whsec_...",
#   "contractEventsEnabledAt": "2026-11-17T10:00:00.000Z" }
```

{% endtab %}
{% endtabs %}

- **The secret is returned once**, by the call that creates it: the first time a URL is set for the Integration. Store it then. No route returns it again.
- Replacing the URL, or removing it with `null`, keeps the same secret and returns no `secret`.
- If you lose the secret, replace it with a rotation (below).
- `webhookUrl` must be an `http` or `https` URL of at most 2048 characters, with no username or password in it. Any other scheme, or a URL such as `https://user:pass@example.com`, is rejected. At delivery time LearnCard connects only to public addresses and does not follow redirects.
- The caller must own the Integration. Writes need the `integrations:write` scope; reads need `integrations:read`.

### Rotate the secret

Rotation is for later: to replace a secret on a schedule, or one that was lost or exposed. You do not need it to get the first secret.

```typescript
const { secret, previousSecretExpiresAt } =
    await learnCard.invoke.rotateIntegrationWebhookSecret(integrationId);
// secret: "whsec_..." — store it now, it cannot be read again
```

REST: `POST /integration/{id}/webhook-secret/rotate`.

Each call creates a new secret and raises `secretVersion` by one. The secret it replaces stays valid for 24 hours, until `previousSecretExpiresAt`. During those 24 hours every request is signed with both secrets, so you can deploy the new one without dropping events.

### Send a test ping

```typescript
const result = await learnCard.invoke.sendIntegrationTestEvent(integrationId);
// { delivered: true,  httpStatus: 200, latencyMs: 84 }
// { delivered: false, httpStatus: 401, latencyMs: 120, error: 'http_401' }
// { delivered: false, latencyMs: 6001, error: 'timeout' }
// { delivered: false, latencyMs: 12, error: 'network_error' }
// { delivered: false, httpStatus: 302, latencyMs: 40, error: 'redirect' }
// { delivered: false, error: 'invalid_webhook' }
// { delivered: false, error: 'no_webhook' }
```

REST: `POST /integration/{id}/webhook/test`.

This posts one signed event with `type: "integration.test"` and `sequence: 0` to your URL right away and returns the result in the same response. It is sent once, is not retried, and is not written to the feed. It also works while contract events are disabled, so you can check a receiver before you enable them.

| Field        | Meaning                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------- |
| `delivered`  | `true` when your endpoint answered `2xx`                                                     |
| `httpStatus` | The status your endpoint answered with. Absent when there was no answer                      |
| `latencyMs`  | How long the request took. Absent when no request was made (`no_webhook`, `invalid_webhook`) |
| `error`      | A fixed code when it was not delivered. See [failure codes](#failure-codes)                  |

You can send **10 test pings per Integration per minute**. Every call counts, including one that ends in `no_webhook`. More are refused with HTTP 429 (tRPC code `TOO_MANY_REQUESTS`). If the rate-limit service is unavailable the call is refused with a server error (HTTP 500); try again later.

A test ping updates the health shown by `getIntegrationWebhook`, but only for the URL it was sent to. Results measured against a URL you have since replaced are discarded.

### Read configuration and health

{% tabs %}
{% tab title="SDK" %}

```typescript
const webhook = await learnCard.invoke.getIntegrationWebhook(integrationId);
```

{% endtab %}

{% tab title="REST" %}

```bash
curl "https://network.learncard.com/api/integration/$INTEGRATION_ID/webhook" \
  -H "Authorization: Bearer $API_TOKEN"
```

{% endtab %}
{% endtabs %}

```json
{
    "webhookUrl": "https://example.com/learncard/webhook",
    "state": "failing",
    "contractEventsEnabledAt": "2026-11-17T10:00:00.000Z",
    "hasSecret": true,
    "secretVersion": 2,
    "previousSecretExpiresAt": "2026-11-18T10:05:00.000Z",
    "lastSuccessAt": "2026-11-17T10:01:12.000Z",
    "lastFailureAt": "2026-11-17T10:07:40.000Z",
    "lastFailureReason": "http_401",
    "pendingDeliveries": 1,
    "retryingDeliveries": 3
}
```

| Field                     | Meaning                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| `webhookUrl`              | The stored URL, or `null`                                                                               |
| `state`                   | `active`, `failing` or `disabled` (below)                                                               |
| `contractEventsEnabledAt` | When events were enabled. Absent while they are disabled                                                |
| `hasSecret`               | Whether a signing secret exists                                                                         |
| `secretVersion`           | `0` with no secret, `1` for the first secret, plus one for every rotation. The secret is never returned |
| `previousSecretExpiresAt` | Until when the previous secret also signs requests. Present for 24 hours after a rotation               |
| `lastSuccessAt`           | When a request to the URL last got a `2xx` answer                                                       |
| `lastFailureAt`           | When a request to the URL last failed                                                                   |
| `lastFailureReason`       | The [failure code](#failure-codes) of that failure. Never a URL or a response body                      |
| `pendingDeliveries`       | Feed records waiting for their first delivery attempt                                                   |
| `retryingDeliveries`      | Feed records that failed at least once and will be tried again                                          |

| State      | Meaning                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| `active`   | A URL is set, events are enabled, and the most recent attempt succeeded (or nothing has been sent yet)        |
| `failing`  | A URL is set, events are enabled, and the most recent attempt failed. It becomes `active` on the next success |
| `disabled` | There is no URL, or contract events are disabled                                                              |

Health counts every request made to the URL: deliveries of feed records and test pings. Storing a different URL clears `lastSuccessAt`, `lastFailureAt` and `lastFailureReason`, because they describe the old URL. The read needs only the `integrations:read` scope.

### Failure codes

The same fixed codes appear as `error` on a test ping and as `lastFailureReason` in health.

| Code              | Meaning                                                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `http_<status>`   | Your endpoint answered with that status, for example `http_401` or `http_503`                                                                            |
| `timeout`         | No answer within 6 seconds                                                                                                                               |
| `network_error`   | The connection failed (DNS, TLS, refused, reset)                                                                                                         |
| `redirect`        | Your endpoint answered with a redirect (3xx). LearnCard does not follow redirects, so register the final URL. A test ping reports the status and latency |
| `invalid_webhook` | The URL does not resolve to a public address. LearnCard sent nothing                                                                                     |
| `no_webhook`      | Test ping only: the Integration has no URL or no secret                                                                                                  |

### API-only setup

A server that holds only an API token for the Integration's owner can do the whole setup. No developer-portal access is needed. The token needs the `integrations:write` and `integrations:read` scopes.

{% tabs %}
{% tab title="SDK" %}

```typescript
import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard({ apiKey: process.env.LEARNCARD_API_TOKEN, network: true });

// 1. Register the webhook. The first registration returns the secret, once.
const { secret } = await learnCard.invoke.setIntegrationWebhook(
    integrationId,
    'https://example.com/learncard/webhook'
);

if (secret) await storeSecret(secret); // your receiver verifies signatures with it

// 2. Test it. The answer comes back in the same call.
const ping = await learnCard.invoke.sendIntegrationTestEvent(integrationId);

if (ping.delivered) {
    console.log(`Connected (HTTP ${ping.httpStatus}, ${ping.latencyMs} ms)`);
} else if (ping.httpStatus) {
    console.log(`Your endpoint returned ${ping.httpStatus}: check its settings`);
} else {
    console.log(`Not delivered: ${ping.error}`);
}

// 3. Read health whenever you want to show the connection's state.
const webhook = await learnCard.invoke.getIntegrationWebhook(integrationId);

console.log(webhook.state, webhook.lastFailureReason, webhook.retryingDeliveries);
```

{% endtab %}

{% tab title="REST" %}

```bash
BASE="https://network.learncard.com/api"
AUTH="Authorization: Bearer $API_TOKEN"

# 1. Register the webhook. Save "secret" from this response; it is not returned again.
curl -X POST "$BASE/integration/$INTEGRATION_ID/webhook" -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{ "webhookUrl": "https://example.com/learncard/webhook" }'

# 2. Test it. { "delivered": true, "httpStatus": 200, "latencyMs": 84 }
#    or       { "delivered": false, "httpStatus": 401, "latencyMs": 120, "error": "http_401" }
curl -X POST "$BASE/integration/$INTEGRATION_ID/webhook/test" -H "$AUTH" \
  -H "Content-Type: application/json" -d '{}'

# 3. Read health.
curl "$BASE/integration/$INTEGRATION_ID/webhook" -H "$AUTH"
```

{% endtab %}
{% endtabs %}

A failing test ping is the quickest way to find a setup problem: `http_401` or `http_403` usually means your endpoint is not public or rejects the signature, `redirect` means the URL answers with a redirect (register the final URL), `invalid_webhook` means it does not resolve to a public address, and `timeout` means the endpoint did not answer within 6 seconds.

## The event record

The feed record and the webhook body are the same JSON object.

```json
{
    "eventId": "3f0c…",
    "deliveryKey": "3f0c…:<integrationId>",
    "sequence": 42,
    "type": "consent_created",
    "contractUri": "lc:network:network.learncard.com/trpc:contract:…",
    "termsUri": "lc:network:network.learncard.com/trpc:terms:…",
    "subject": {
        "profileId": "learner-profile-id",
        "did": "did:web:network.learncard.com:users:learner-profile-id",
        "didKey": "did:key:z6Mk…"
    },
    "requestId": "…",
    "externalReferenceId": "referral-123",
    "reason": "contract_retired",
    "role": "recipient",
    "occurredAt": "2026-11-14T00:00:00.000Z"
}
```

| Field                 | Meaning                                                                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eventId`             | Id of the source event. The same event sent to two Integrations has the same `eventId`                                                               |
| `deliveryKey`         | Unique per Integration and record. Use it to deduplicate                                                                                             |
| `sequence`            | Position in this Integration's feed. Increases by one per record, with no reuse                                                                      |
| `type`                | One of the event types below                                                                                                                         |
| `contractUri`         | The contract the event belongs to                                                                                                                    |
| `termsUri`            | The consent terms the event is about. Absent on request events, on `contract_retired`, and on records whose `role` is `requester`                    |
| `subject`             | The profile the event is about (the consenter or the request target). Absent on `contract_retired`                                                   |
| `requestId`           | The contract request linked to the event, when there is one                                                                                          |
| `externalReferenceId` | Your reference from `sendContractRequest`. Present only when the Integration's owner manages the contract (owner or writer) or sent the request      |
| `reason`              | Why the event happened, for `consent_withdrawn` (`contract_retired`), `consent_paused` (`needs_reconsent`) and `consent_updated` (`expiry_extended`) |
| `role`                | Why this Integration received the record: `owner`, `writer`, `recipient` or `requester`. A profile with several roles gets the first that applies    |
| `occurredAt`          | ISO 8601 time of the source event                                                                                                                    |

The record carries identifiers only. It never contains shared credentials or personal fields; read those through the consented data APIs, which apply current permissions.

### Event types

| Type                 | Sent to the Integrations of | Meaning                                                                                  |
| -------------------- | --------------------------- | ---------------------------------------------------------------------------------------- |
| `request_sent`       | Owner, requester            | A contract request was sent                                                              |
| `request_accepted`   | Owner, requester            | The target consented with that request. Written just before the consent event            |
| `request_denied`     | Owner, requester            | The target declined                                                                      |
| `request_cancelled`  | Owner, requester            | The request was cancelled                                                                |
| `consent_created`    | Owner, writers, recipients  | New consent. The connection is live                                                      |
| `consent_updated`    | Owner, writers, recipients  | Terms changed or consent was given again. `reason: "expiry_extended"` is explained below |
| `consent_withdrawn`  | Owner, writers, recipients  | Consent ended. `reason: "contract_retired"` when the contract was retired                |
| `credentials_synced` | Owner, writers, recipients  | The consenter shared more credentials                                                    |
| `consent_paused`     | Owner, writers, recipients  | A contract update needs new consent (`reason: "needs_reconsent"`). Access is paused      |
| `consent_suspended`  | Owner, writers, recipients  | The re-consent deadline passed without an answer                                         |
| `consent_expired`    | Owner, writers, recipients  | The consent expired (see [Expiry](#expiry)). Can occur again after a renewal             |
| `contract_retired`   | Owner, writers, recipients  | The contract was retired. One `consent_withdrawn` per active consent is sent as well     |
| `integration.test`   | The Integration you tested  | Test delivery only. Never in the feed                                                    |

The requester is the profile that sent the referral. It receives the request events of its own requests. It receives consent events only while it is also the contract owner, a writer or a data recipient: a profile that has been removed as a data recipient stops receiving them, even for people it referred.

### Expiry

`consent_expired` follows the same rule as the consented data reads. A consent expires when either of these times passes:

- the `expiresAt` of the consent terms themselves
- the `expiresAt` of the **contract version the consenter accepted**

The newest contract version does not count for a consenter who has not accepted it yet. After a contract update, someone who is still asked to re-consent expires with the version they accepted, not with the new one.

One event is sent per expiry time, and its `eventId` contains that time (`<termsId>:expired:<expiresAt>`). The same expiry is never sent twice. `consent_expired` **can occur again** for the same terms: if the consenter renews an expired consent by accepting a newer contract version (you receive `consent_updated`), and that version later expires, you receive a second `consent_expired`. When the terms' own expiry and the accepted version's expiry are different times and both pass, you receive one event for each; treat `consent_expired` for a connection you already removed as a repeat.

When a non-breaking contract update moves a consent that had expired onto a contract version that has not expired, you receive `consent_updated` with `reason: "expiry_extended"`. The connection is live again, so treat it like any other `consent_updated`.

The terms status is not changed by expiry, and the [connections snapshot](#connections-snapshot) leaves expired consents out by the same rule.

{% hint style="warning" %}
**A category's `shareUntil` passing is not an expiry.** `shareUntil` is set per credential category inside the terms. When it passes, the consented data reads stop returning that category's data, but the connection stays live: it does not emit `consent_expired`, and the connection snapshot is unaffected. The consented data read is always the source of truth for what a category currently returns.
{% endhint %}

## Verify the signature

Every webhook request is a `POST` with these headers:

| Header                  | Value                                                           |
| ----------------------- | --------------------------------------------------------------- |
| `Content-Type`          | `application/json`                                              |
| `X-LearnCard-Signature` | `t=<unix seconds>,v1=<hex HMAC-SHA256(secret, t + "." + body)>` |
| `X-LearnCard-Event-Id`  | The record's `eventId`                                          |
| `X-LearnCard-Delivery`  | The record's `deliveryKey`                                      |

To verify:

1. Read the **raw body bytes** before any JSON parsing. A re-serialized body will not match.
2. Split the header on `,`. Take `t` and every `v1` value. There are **two `v1` values** for 24 hours after a rotation: one for the current secret and one for the previous secret.
3. Compute HMAC-SHA256 over `t + "." + body`. The key is the **whole secret string, including the `whsec_` prefix**, as UTF-8 bytes. Do not base64-decode it.
4. Hex-encode the result and compare it with each `v1` value in constant time. Accept the request if any one matches.
5. Reject requests whose `t` is too old (for example more than 5 minutes). Each attempt is signed with a new timestamp.

{% tabs %}
{% tab title="Node.js" %}

```javascript
import crypto from 'node:crypto';
import express from 'express';

const SECRET = process.env.LEARNCARD_WEBHOOK_SECRET; // "whsec_..."
const TOLERANCE_SECONDS = 300;

const verifyLearnCardSignature = (rawBody, header, secret) => {
    if (!header) return false;

    const parts = header.split(',').map(part => part.trim());
    const timestamp = parts.find(part => part.startsWith('t='))?.slice(2);
    const signatures = parts.filter(part => part.startsWith('v1=')).map(part => part.slice(3));

    if (!timestamp || !/^\d+$/.test(timestamp) || signatures.length === 0) return false;
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > TOLERANCE_SECONDS) return false;

    const expected = crypto
        .createHmac('sha256', secret) // the whole string, including "whsec_"
        .update(`${timestamp}.`)
        .update(rawBody) // Buffer of the exact bytes received
        .digest();

    return signatures.some(signature => {
        const candidate = Buffer.from(signature, 'hex');

        return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
    });
};

const app = express();

// express.raw keeps the exact bytes. Do not use express.json() on this route.
app.post('/learncard/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!verifyLearnCardSignature(req.body, req.get('X-LearnCard-Signature'), SECRET)) {
        return res.status(401).end();
    }

    const event = JSON.parse(req.body.toString('utf8'));

    // Store first, keyed by deliveryKey, so a retry is a no-op. Then answer 2xx.
    await saveEventOnce(event.deliveryKey, event);

    res.status(204).end();
});
```

{% endtab %}

{% tab title="Salesforce Apex" %}

```apex
@RestResource(urlMapping='/learncard/webhook')
global without sharing class LearnCardWebhook {
    private static final Integer TOLERANCE_SECONDS = 300;

    @HttpPost
    global static void receive() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;

        // The raw bytes. Never verify over a re-serialized body.
        Blob body = req.requestBody;
        String header = getHeader(req, 'X-LearnCard-Signature');

        // Keep the secret in a protected custom setting or protected custom metadata,
        // not in code. The value is the whole string, including "whsec_".
        String secret = LearnCard_Settings__c.getOrgDefaults().Webhook_Secret__c;

        if (body == null || !isValid(header, body, secret)) {
            res.statusCode = 401;
            return;
        }

        String rawBody = body.toString();
        Map<String, Object> event = (Map<String, Object>) JSON.deserializeUntyped(rawBody);

        // Delivery_Key__c is a unique External ID, so a retry updates the same row.
        LearnCard_Event__c row = new LearnCard_Event__c(
            Delivery_Key__c = (String) event.get('deliveryKey'),
            Sequence__c = Decimal.valueOf(String.valueOf(event.get('sequence'))),
            Type__c = (String) event.get('type'),
            Payload__c = rawBody
        );
        upsert row Delivery_Key__c;

        res.statusCode = 204;
    }

    private static Boolean isValid(String header, Blob body, String secret) {
        if (String.isBlank(header) || String.isBlank(secret)) return false;

        String timestamp;
        List<String> signatures = new List<String>();

        for (String rawPart : header.split(',')) {
            String part = rawPart.trim();
            if (part.startsWith('t=')) timestamp = part.substring(2);
            else if (part.startsWith('v1=')) signatures.add(part.substring(3));
        }

        // The length limit keeps Long.valueOf from throwing on an absurd value.
        if (
            String.isBlank(timestamp) ||
            !timestamp.isNumeric() ||
            timestamp.length() > 12 ||
            signatures.isEmpty()
        ) {
            return false;
        }

        Long nowSeconds = System.now().getTime() / 1000;
        Long age = Math.abs(nowSeconds - Long.valueOf(timestamp));
        if (age > TOLERANCE_SECONDS) return false;

        // The body is UTF-8 JSON, so this is the same byte sequence that was signed.
        Blob signedPayload = Blob.valueOf(timestamp + '.' + body.toString());
        String expected = EncodingUtil.convertToHex(
            Crypto.generateMac('HmacSHA256', signedPayload, Blob.valueOf(secret))
        );

        // Two v1 values are present for 24 hours after a secret rotation.
        Boolean matched = false;
        for (String signature : signatures) {
            if (constantTimeEquals(expected, signature.toLowerCase())) matched = true;
        }
        return matched;
    }

    private static Boolean constantTimeEquals(String a, String b) {
        if (a.length() != b.length()) return false;

        // String.charAt returns the character code as an Integer. Apex defines |= only for
        // Booleans, so write the integer bitwise OR out in full.
        Integer difference = 0;
        for (Integer i = 0; i < a.length(); i++) {
            difference = difference | (a.charAt(i) ^ b.charAt(i));
        }
        return difference == 0;
    }

    private static String getHeader(RestRequest req, String name) {
        for (String key : req.headers.keySet()) {
            if (key.equalsIgnoreCase(name)) return req.headers.get(key);
        }
        return null;
    }
}
```

`LearnCard_Settings__c`, `LearnCard_Event__c` and their fields are example names; create your own. Expose the class through a Salesforce Site or another public endpoint that LearnCard can reach, and give its guest user access to this class only.

{% endtab %}
{% endtabs %}

## Delivery and retries

- Any `2xx` answer counts as delivered. Answer within 6 seconds; the response body is ignored.
- Delivery is **at least once**. Store `deliveryKey` with your side effect and treat a repeat as a no-op.
- Order across requests is not guaranteed, because a failed delivery is retried later and can arrive after newer records. Deduplicate by `deliveryKey`. Within the feed, `sequence` is the order. See [Ordering and stale records](#ordering-and-stale-records).
- A timeout, a network error, a `5xx`, and `408`, `425` or `429` are retried.
- Any other `4xx` is final: the delivery is marked rejected and is not retried.
- A delivery gets up to **12 attempts within 24 hours** of the record being written. The wait starts at 60 seconds and doubles after each failed attempt, up to 1 hour.
- A worker runs about once a minute, so a first delivery normally arrives within a minute.
- Each delivery pass sends at most 5 records per Integration and interleaves Integrations, so a busy Integration does not hold back the others. A slow endpoint slows only its own deliveries.
- A configuration change applies to the very next delivery: disabling events, changing or removing the URL, and rotating the secret.
- Before a record reaches the feed, LearnCard fans the source event out to the Integrations that should see it. An event that repeatedly fails to fan out is retried with a growing delay for about three days and then abandoned. While it is being retried, later events of the same contract wait behind it; other contracts are not affected. Such an event never reaches the feed, so keep the safety-net feed read and the occasional snapshot described below.
- A failed or rejected delivery never removes the record from the feed. Failed deliveries are not replayed after you fix your endpoint; read the feed to catch up.
- **Disabling contract events stops deliveries.** Records that were still waiting, for a first attempt or for a retry, are closed without being sent (delivery failure reason `disabled`). They stay in the feed. Records from before a disable are not sent after events are enabled again; read the feed to catch up.
- Use [`getIntegrationWebhook`](#read-configuration-and-health) to see whether deliveries are arriving, why the last one failed, and how many are waiting.
- Records written while the Integration had no `webhookUrl` are feed-only. They are not sent later when a URL is added.

## Read the feed

{% tabs %}
{% tab title="SDK" %}

```typescript
const page = await learnCard.invoke.getIntegrationEvents(integrationId, {
    since: savedCursor, // omit to start at the oldest retained record
    limit: 100, // default 100, maximum 200
});
// page.records       ordered by sequence, ascending
// page.cursor        pass as `since` next time
// page.latestCursor  cursor of the newest record that exists right now
// page.hasMore       true when another page is ready
```

{% endtab %}

{% tab title="REST" %}

```bash
curl "https://network.learncard.com/api/integration/$INTEGRATION_ID/events?since=$CURSOR&limit=100" \
  -H "Authorization: Bearer $API_TOKEN"
```

{% endtab %}
{% endtabs %}

- Records are returned in `sequence` order. The cursor is opaque; store it and pass it back unchanged.
- `cursor` points after the last record of the page. On an empty page it repeats your `since` value, and it is absent only when you sent no `since` and there are no records. In that case store `latestCursor`.
- Save the cursor only after you have stored the page.
- `latestCursor` is always returned. Record it before taking a snapshot (see below).
- Records are kept for **30 days**, then deleted.
- A cursor older than the retention window is rejected with **HTTP 409** (tRPC code `CONFLICT`) and a message that starts with `CURSOR_EXPIRED: `. Take a new connections snapshot and continue from `latestCursor`.
- A cursor belongs to one Integration. A malformed cursor, a cursor from another Integration, and a cursor that is ahead of the feed are all rejected with **HTTP 400** (tRPC code `BAD_REQUEST`).

```typescript
const isCursorExpired = (error: unknown): boolean =>
    error instanceof Error && error.message.startsWith('CURSOR_EXPIRED: ');
```

## Connections snapshot

The snapshot answers "who is connected to this contract right now". It returns one record per consenter whose terms are `live`, `needs_reconsent` or `suspended` and have not expired. A retired or expired contract returns no records.

Each request scans a bounded number of consents, so a page can hold fewer records than `limit`, or none at all, while `hasMore` is still `true`. Keep reading with the returned `cursor` until `hasMore` is `false`.

{% tabs %}
{% tab title="SDK" %}

```typescript
let cursor: string | undefined;

do {
    const page = await learnCard.invoke.getContractConnections(contractUri, { limit: 200, cursor });

    for (const connection of page.records) {
        // { profileId, did, didKey, termsUri, status, requestId?, externalReferenceId?, updatedAt }
        await saveConnection(connection);
    }

    cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);
```

{% endtab %}

{% tab title="REST" %}

```bash
curl -G "https://network.learncard.com/api/consent-flow-contracts/connections" \
  --data-urlencode "contractUri=$CONTRACT_URI" \
  --data-urlencode "limit=200" \
  -H "Authorization: Bearer $API_TOKEN"
```

{% endtab %}
{% endtabs %}

- The contract owner, contract writers and data recipients can call it. It needs the `contracts-data:read` scope.
- A profile that only sent a referral and is no longer a data recipient cannot read the snapshot. It also no longer receives consent events for that contract, so it has nothing to resync.
- `limit` defaults to 100, with a maximum of 200. Pages are ordered by terms id, so they stay stable while statuses change.
- `externalReferenceId` follows the same rule as events: it is present only for contract managers and for the profile that sent that request.
- Like events, it returns identifiers only.

## Stay in sync

Both patterns keep a table of connections keyed by `termsUri`. Apply each record like this:

| Type                                   | Effect on your table                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `consent_created`, `consent_updated`   | Insert or update the connection as `live` (this includes `consent_updated` with `reason: "expiry_extended"`) |
| `consent_paused`                       | Set status `needs_reconsent`, but only for a connection you hold                                             |
| `consent_suspended`                    | Set status `suspended`, but only for a connection you hold                                                   |
| `consent_withdrawn`, `consent_expired` | Remove the connection (a no-op if already removed)                                                           |
| `contract_retired`                     | Remove every connection of that contract                                                                     |
| `credentials_synced`                   | No status change. Read the consented data again                                                              |
| `request_*`                            | Update your own request tracking; no connection change                                                       |

Applying a record twice must give the same result, so replays are harmless.

### Ordering and stale records

Delivery is at least once, and retries can arrive out of order. Deduplicate by `deliveryKey`. Within the feed, `sequence` is the order.

Within one contract, records are written to the feed in the order things happened. If an event cannot be written, later events of the same contract wait behind it until it succeeds or is abandoned, so a newer event never overtakes an older one. There is no order guarantee between different contracts. Webhook requests can still arrive out of order because failed deliveries are retried, so apply records by `sequence`, not by arrival time. As a defence against replays, you can also keep the `occurredAt` of the last record you applied for each `termsUri` and ignore one that is older.

Records written by one change share one `occurredAt` and have no defined order among themselves. For example, when a contract is retired, `contract_retired` can come before or after the `consent_withdrawn` records of that retirement.

A consent that has already expired can still be paused or suspended by a later contract update, and you receive those events. The [connections snapshot](#connections-snapshot) leaves such a consent out, so do not add a connection back on `consent_paused` or `consent_suspended`: apply them only to connections you hold.

### Webhook with feed catch-up

1. Verify and store each webhook request, deduplicated by `deliveryKey`, and remember the highest `sequence` you have applied.
2. If a record arrives with a gap in `sequence`, or after your endpoint was down, read the feed from your saved cursor until `hasMore` is `false`.
3. Run the same feed read on a schedule (for example hourly) as a safety net. Deliveries that used up their retries are only in the feed.
4. On `CURSOR_EXPIRED`, follow the snapshot steps below.

### Feed-only polling

1. Call `getIntegrationEvents` and store `latestCursor`. Do this **before** the snapshot.
2. Page through `getContractConnections` for each contract and replace your table with the result.
3. Poll `getIntegrationEvents` with `since` set to that cursor. Apply the records, then save the new `cursor`. Repeat while `hasMore` is `true`, then wait and poll again.
4. On `CURSOR_EXPIRED` (your server was away for longer than 30 days), start again at step 1.

Reading `latestCursor` first means that a change made while the snapshot is running is also in the feed after that cursor. You may apply such a change twice, which is safe; you cannot miss it.

```typescript
const syncOnce = async (): Promise<void> => {
    let since = await loadCursor();

    if (!since) since = await resnapshot();

    try {
        let hasMore = true;

        while (hasMore) {
            const page = await learnCard.invoke.getIntegrationEvents(integrationId, { since });

            for (const record of page.records) await applyRecord(record); // skip a record whose occurredAt is older than the one applied for its termsUri

            since = page.cursor ?? page.latestCursor;
            await saveCursor(since);
            hasMore = page.hasMore;
        }
    } catch (error) {
        if (!isCursorExpired(error)) throw error;

        await saveCursor(await resnapshot());
    }
};

const resnapshot = async (): Promise<string> => {
    const { latestCursor } = await learnCard.invoke.getIntegrationEvents(integrationId, {
        limit: 1,
    });

    await replaceConnectionsFromSnapshot(); // pages through getContractConnections

    return latestCursor;
};
```

{% hint style="warning" %}
An event tells you that something changed. It is not permission to use data. Before you act on a connection, read the current consented data, which applies the consenter's current terms.
{% endhint %}

## Reference

| SDK method                               | REST route                                     | Scope                 |
| ---------------------------------------- | ---------------------------------------------- | --------------------- |
| `setIntegrationWebhook(id, url \| null)` | `POST /integration/{id}/webhook`               | `integrations:write`  |
| `getIntegrationWebhook(id)`              | `GET /integration/{id}/webhook`                | `integrations:read`   |
| `sendIntegrationTestEvent(id)`           | `POST /integration/{id}/webhook/test`          | `integrations:write`  |
| `rotateIntegrationWebhookSecret(id)`     | `POST /integration/{id}/webhook-secret/rotate` | `integrations:write`  |
| `updateIntegration(id, updates)`         | `POST /integration/update/{id}`                | `integrations:write`  |
| `getIntegrationEvents(id, options?)`     | `GET /integration/{id}/events`                 | `integrations:read`   |
| `getContractConnections(uri, options?)`  | `GET /consent-flow-contracts/connections`      | `contracts-data:read` |
