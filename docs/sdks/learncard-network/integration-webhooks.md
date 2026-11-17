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

## Enable events

Events are recorded for an Integration from the moment they are enabled. Events that happened before that moment are never added.

| You want         | Do this                            | Result                                                                                    |
| ---------------- | ---------------------------------- | ----------------------------------------------------------------------------------------- |
| Webhook and feed | Set `webhookUrl`                   | Creates a signing secret if there is none, and enables events if they are not enabled yet |
| Feed only        | Set `contractEventsEnabled: true`  | Enables events with no webhook                                                            |
| Stop the webhook | Set `webhookUrl: null`             | Removes the URL. Events stay enabled and the feed keeps filling                           |
| Stop everything  | Set `contractEventsEnabled: false` | No new records and no deliveries                                                          |

In the LearnCard app, open your integration in the developer portal and use the **Webhooks** tab. From code:

{% tabs %}
{% tab title="SDK" %}

```typescript
// Webhook and feed
await learnCard.invoke.updateIntegration(integrationId, {
    webhookUrl: 'https://example.com/learncard/webhook',
});

// Feed only
await learnCard.invoke.updateIntegration(integrationId, { contractEventsEnabled: true });

const integration = await learnCard.invoke.getIntegration(integrationId);
// integration.webhookUrl, integration.hasWebhookSecret, integration.contractEventsEnabledAt
```

{% endtab %}

{% tab title="REST" %}

```bash
curl -X POST "https://network.learncard.com/api/integration/update/$INTEGRATION_ID" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "updates": { "webhookUrl": "https://example.com/learncard/webhook" } }'
```

{% endtab %}
{% endtabs %}

`webhookUrl` must be an `http(s)` URL of at most 2048 characters. At delivery time LearnCard connects only to public addresses and does not follow redirects. The caller must own the Integration. Updates need the `integrations:write` scope; reads need `integrations:read`.

### Get the signing secret

The secret is returned only by the rotate call, and only once. Use it to reveal the secret for the first time and to replace it later.

```typescript
const { secret, previousSecretExpiresAt } =
    await learnCard.invoke.rotateIntegrationWebhookSecret(integrationId);
// secret: "whsec_..." — store it now, it cannot be read again
```

REST: `POST /integration/{id}/webhook-secret/rotate`.

Each call creates a new secret. The secret it replaces stays valid for 24 hours, until `previousSecretExpiresAt`; that field is absent when there was no earlier secret. During those 24 hours every request is signed with both secrets, so you can deploy the new one without dropping events.

### Send a test event

```typescript
const result = await learnCard.invoke.sendIntegrationTestEvent(integrationId);
// { delivered: true, status: 200 }
// { delivered: false, status: 500, error: 'http_500' }
// { delivered: false, error: 'timeout' | 'network_error' | 'invalid_webhook' | 'no_webhook' }
```

REST: `POST /integration/{id}/webhook/test`.

This posts one signed event with `type: "integration.test"` and `sequence: 0` to your URL and reports the result. It is sent once, is not retried, and is not written to the feed.

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

| Field                 | Meaning                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eventId`             | Id of the source event. The same event sent to two Integrations has the same `eventId`                                                            |
| `deliveryKey`         | Unique per Integration and record. Use it to deduplicate                                                                                          |
| `sequence`            | Position in this Integration's feed. Increases by one per record, with no reuse                                                                   |
| `type`                | One of the event types below                                                                                                                      |
| `contractUri`         | The contract the event belongs to                                                                                                                 |
| `termsUri`            | The consent terms the event is about. Absent on request events, on `contract_retired`, and on records whose `role` is `requester`                 |
| `subject`             | The profile the event is about (the consenter or the request target). Absent on `contract_retired`                                                |
| `requestId`           | The contract request linked to the event, when there is one                                                                                       |
| `externalReferenceId` | Your reference from `sendContractRequest`. Present only when the Integration's owner manages the contract (owner or writer) or sent the request   |
| `reason`              | Why the event happened, for `consent_withdrawn` (`contract_retired`) and `consent_paused` (`needs_reconsent`)                                     |
| `role`                | Why this Integration received the record: `owner`, `writer`, `recipient` or `requester`. A profile with several roles gets the first that applies |
| `occurredAt`          | ISO 8601 time of the source event                                                                                                                 |

The record carries identifiers only. It never contains shared credentials or personal fields; read those through the consented data APIs, which apply current permissions.

### Event types

| Type                 | Sent to the Integrations of           | Meaning                                                                              |
| -------------------- | ------------------------------------- | ------------------------------------------------------------------------------------ |
| `request_sent`       | Owner, requester                      | A contract request was sent                                                          |
| `request_accepted`   | Owner, requester                      | The target consented with that request. Written just before the consent event        |
| `request_denied`     | Owner, requester                      | The target declined                                                                  |
| `request_cancelled`  | Owner, requester                      | The request was cancelled                                                            |
| `consent_created`    | Owner, writers, recipients, requester | New consent. The connection is live                                                  |
| `consent_updated`    | Owner, writers, recipients, requester | Terms changed or consent was given again                                             |
| `consent_withdrawn`  | Owner, writers, recipients, requester | Consent ended. `reason: "contract_retired"` when the contract was retired            |
| `credentials_synced` | Owner, writers, recipients, requester | The consenter shared more credentials                                                |
| `consent_paused`     | Owner, writers, recipients, requester | A contract update needs new consent (`reason: "needs_reconsent"`). Access is paused  |
| `consent_suspended`  | Owner, writers, recipients, requester | The re-consent deadline passed without an answer                                     |
| `consent_expired`    | Owner, writers, recipients, requester | The terms or the contract reached their expiry time. Sent once per terms             |
| `contract_retired`   | Owner, writers, recipients            | The contract was retired. One `consent_withdrawn` per active consent is sent as well |
| `integration.test`   | The Integration you tested            | Test delivery only. Never in the feed                                                |

A requester receives a record only for events that carry its own request.

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

        Map<String, Object> event =
            (Map<String, Object>) JSON.deserializeUntyped(body.toString());

        // Delivery_Key__c is a unique External ID, so a retry updates the same row.
        LearnCard_Event__c row = new LearnCard_Event__c(
            Delivery_Key__c = (String) event.get('deliveryKey'),
            Sequence__c = Decimal.valueOf(String.valueOf(event.get('sequence'))),
            Type__c = (String) event.get('type'),
            Payload__c = body.toString()
        );
        upsert row Delivery_Key__c;

        res.statusCode = 204;
    }

    private static Boolean isValid(String header, Blob body, String secret) {
        if (String.isBlank(header) || String.isBlank(secret)) return false;

        String timestamp;
        List<String> signatures = new List<String>();

        for (String part : header.split(',')) {
            part = part.trim();
            if (part.startsWith('t=')) timestamp = part.substring(2);
            else if (part.startsWith('v1=')) signatures.add(part.substring(3));
        }

        if (String.isBlank(timestamp) || !timestamp.isNumeric() || signatures.isEmpty()) {
            return false;
        }

        Long age = Math.abs(System.now().getTime() / 1000 - Long.valueOf(timestamp));
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

        Integer difference = 0;
        for (Integer i = 0; i < a.length(); i++) {
            difference |= a.charAt(i) ^ b.charAt(i);
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
- Order across requests is not guaranteed, because a failed delivery is retried later. Use `sequence` to order records, or read the feed.
- A timeout, a network error, a `5xx`, and `408`, `425` or `429` are retried.
- Any other `4xx` is final: the delivery is marked rejected and is not retried.
- A delivery gets up to **12 attempts within 24 hours** of the record being written. The wait starts at 60 seconds and doubles after each failed attempt, up to 1 hour.
- A worker runs about once a minute, so a first delivery normally arrives within a minute.
- A failed or rejected delivery never removes the record from the feed. Failed deliveries are not replayed after you fix your endpoint; read the feed to catch up.
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
curl "https://network.learncard.com/api/integrations/$INTEGRATION_ID/events?since=$CURSOR&limit=100" \
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
- A cursor this API did not produce returns `BAD_REQUEST`.

```typescript
const isCursorExpired = (error: unknown): boolean =>
    error instanceof Error && error.message.startsWith('CURSOR_EXPIRED: ');
```

## Connections snapshot

The snapshot answers "who is connected to this contract right now". It returns one record per consenter whose terms are `live`, `needs_reconsent` or `suspended` and have not expired. A retired or expired contract returns no records.

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

- Only the contract owner and current data recipients can call it. It needs the `contracts-data:read` scope.
- `limit` defaults to 100, with a maximum of 200. Pages are ordered by terms id, so they stay stable while statuses change.
- `externalReferenceId` follows the same rule as events: it is present only for contract managers and for the profile that sent that request.
- Like events, it returns identifiers only.

## Stay in sync

Both patterns keep a table of connections keyed by `termsUri`. Apply each record like this:

| Type                                   | Effect on your table                                   |
| -------------------------------------- | ------------------------------------------------------ |
| `consent_created`, `consent_updated`   | Insert or update the connection as `live`              |
| `consent_paused`                       | Set status `needs_reconsent`                           |
| `consent_suspended`                    | Set status `suspended`                                 |
| `consent_withdrawn`, `consent_expired` | Remove the connection                                  |
| `contract_retired`                     | Remove every connection of that contract               |
| `credentials_synced`                   | No status change. Read the consented data again        |
| `request_*`                            | Update your own request tracking; no connection change |

Applying a record twice must give the same result, so replays are harmless.

### Webhook with feed catch-up

1. Verify and store each webhook request, and remember the highest `sequence` you have applied.
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

            for (const record of page.records) await applyRecord(record);

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

| SDK method                              | REST route                                     | Scope                 |
| --------------------------------------- | ---------------------------------------------- | --------------------- |
| `updateIntegration(id, updates)`        | `POST /integration/update/{id}`                | `integrations:write`  |
| `rotateIntegrationWebhookSecret(id)`    | `POST /integration/{id}/webhook-secret/rotate` | `integrations:write`  |
| `sendIntegrationTestEvent(id)`          | `POST /integration/{id}/webhook/test`          | `integrations:write`  |
| `getIntegrationEvents(id, options?)`    | `GET /integrations/{id}/events`                | `integrations:read`   |
| `getContractConnections(uri, options?)` | `GET /consent-flow-contracts/connections`      | `contracts-data:read` |
