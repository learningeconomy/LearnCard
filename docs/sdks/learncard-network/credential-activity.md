---
description: The event log behind every credential you send — created, delivered, claimed — and how to query it.
---

# Credential Activity

Every `send()` (and every claim, template issue, or consent-driven write) is logged as a chain of events keyed by an `activityId`. This is the same data the Developer Portal dashboard shows and exports. Query it to answer "what happened to the credential I sent?" without a webhook.

## Events

| `eventType` | When                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CREATED`   | You sent to an email or phone; the credential is waiting in the [Universal Inbox](../../core-concepts/network-and-interactions/universal-inbox.md) |
| `DELIVERED` | It reached the recipient — directly to an existing account, or the claim message went out                                                          |
| `CLAIMED`   | The recipient accepted it; `credentialUri` is now set                                                                                              |
| `EXPIRED`   | The claim window passed                                                                                                                            |
| `FAILED`    | Delivery failed; see `metadata.error`                                                                                                              |

A send to an existing profile goes straight to `DELIVERED`. A send to a new email is `CREATED` → `DELIVERED` → `CLAIMED`.

## Record

```typescript
{
    activityId: string;         // groups every event for one send
    eventType: 'CREATED' | 'DELIVERED' | 'CLAIMED' | 'EXPIRED' | 'FAILED';
    timestamp: string;          // ISO 8601
    recipientType: 'profile' | 'email' | 'phone';
    recipientIdentifier: string;
    boostUri?: string;          // the template, if any
    credentialUri?: string;     // set once claimed
    status?: 'active' | 'revoked' | 'suspended';
    source: 'send' | 'sendBoost' | 'sendCredential' | 'contract' | 'claim' | 'inbox' | 'claimLink' | 'acceptCredential' | 'appEvent';
    metadata?: Record<string, unknown>;
    boost?: { id: string; name?: string; category?: string };
    recipientProfile?: { profileId: string; displayName?: string };
}
```

## Methods

All via `learnCard.invoke`; REST paths under `https://network.learncard.com/api`.

| Method                                                                        | REST                                           | Returns                                                              |
| ----------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------- |
| `getActivityChain({ activityId })`                                            | `GET /activity/credentials/{activityId}/chain` | Every event for one send, oldest first                               |
| `getActivity({ activityId })`                                                 | `GET /activity/credentials/{activityId}`       | The latest event for one send                                        |
| `getMyActivities({ limit?, cursor?, eventType?, boostUri?, integrationId? })` | `GET /activity/credentials`                    | Your sends, newest first; `eventType` filters by **current** state   |
| `getActivityStats({ boostUris?, integrationId? })`                            | `GET /activity/credentials/stats`              | `{ total, created, delivered, claimed, expired, failed, claimRate }` |
| `getMyCredentialLifecycleStatuses({ uris })`                                  | `GET /activity/credentials/lifecycle-statuses` | Holder-side: `active`/`revoked`/`suspended` per URI                  |

`eventType` on `getMyActivities` means "sends whose latest event is this" — filtering by `DELIVERED` returns credentials that are delivered and not yet claimed, not everything that was ever delivered.

## Examples

Did this one get claimed?

```typescript
const chain = await learnCard.invoke.getActivityChain({ activityId: result.activityId });
const claimed = chain.some(e => e.eventType === 'CLAIMED');
```

Everything still waiting to be claimed:

```typescript
const { records, hasMore, cursor } = await learnCard.invoke.getMyActivities({
    eventType: 'DELIVERED',
    limit: 100,
});
```

Claim rate for one template:

```typescript
const { claimed, total, claimRate } = await learnCard.invoke.getActivityStats({
    boostUris: [templateUri],
});
```

From the terminal: `npx @learncard/cli status` lists recent sends; `status <activityId>` shows one chain; add `--json` for scripts.

## Related

- [Know When a Credential Is Claimed](../../tutorials/listen-to-webhooks.md) — polling vs. webhooks
- [Notifications & Webhooks](notifications.md) — the push alternative
- [Send & Issue Credentials](../../how-to-guides/send-credentials.md#track-what-happened-to-a-credential)
