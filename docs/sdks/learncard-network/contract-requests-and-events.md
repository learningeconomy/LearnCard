---
description: Send attributed contract requests and consume correlated consent events.
---

# Contract Requests and Events

A contract request invites an existing network profile to review a ConsentFlow contract. Sending a request grants no permission to read or write the user's data. The user chooses consent terms through the existing consent flow, including guardian approval when required.

The Salesforce Data Mediator, or any other external integration, is a client of these APIs and webhooks.

## Roles

| Action                                     | Who can perform it                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| Send a generic request                     | Contract owner, explicit writer, or current data recipient                     |
| List sent requests / inspect target status | Owner, writer, current recipient; a target may inspect its own status          |
| List incoming requests                     | The target profile only                                                        |
| Mark a generic request seen                | The target, for an existing request only                                       |
| Deny                                       | The target only                                                                |
| Cancel                                     | Owner, writer, target, or the requesting recipient while still in the audience |
| Read consented data                        | Owner and current data recipients, under current consent permissions           |
| Write outcomes                             | Owner or explicit writer, under current write permissions                      |

A writer outside the data audience receives only a decision and correlation metadata for a request it sent. Being a writer does not grant read access.

## Send and track a request

Use an initialized network-enabled LearnCard instance with an existing profile. Generic send, deny, seen and cancel actions require `contracts:write` scope when using an auth grant.

```typescript
await referrer.invoke.sendContractRequest({
    contractUri,
    targetProfileId: learnerProfileId,
    externalReferenceId: 'referral-123',
    message: 'Career support is available through this partner.',
});

const status = await referrer.invoke.getRequestStatusForProfile(
    learnerProfileId,
    undefined,
    contractUri
);
// status includes requestId, requestedBy, externalReferenceId, requestedAt,
// message, status and readStatus. Legacy requests may omit attribution fields.
```

`externalReferenceId` is an opaque integration reference, limited to 256 characters; `message` is limited to 500. Avoid putting sensitive data in either field. Targets may also be addressed by a resolvable network DID. Missing targets return `NOT_FOUND`; email-only invitations are not supported by this endpoint. Requests are limited to 500 per hour per contract and sender.

There is one request per contract/target pair in this version. An identical pending retry keeps the same request and event IDs. Conflicting sender, reference or message returns `CONFLICT`. Terminal requests and existing legacy requests are not replaced. Sending to a target with an unexpired active consent, including a one-time snapshot, also returns `CONFLICT`.

## Target actions

```typescript
const requests = await learner.invoke.getAllContractRequestsForProfile(learnerProfileId);
await learner.invoke.markContractRequestAsSeen(contractUri, learnerProfileId);

// Explicitly decline; merely dismissing a card is not denial.
await learner.invoke.denyContractRequest(contractUri);

// Or cancel a pending request; authorized senders use this method too.
await learner.invoke.cancelContractRequest(contractUri, learnerProfileId);
```

Acceptance uses `consentToContract` after the user reviews the latest contract, audience and permissions. Include its current `audienceVersion` for recipient-bearing contracts. Encryption must cover the owner and current recipients before sharing credential URIs. See [ConsentFlow](../../core-concepts/consent-and-permissions/consentflow-overview.md).

```mermaid
stateDiagram-v2
    [*] --> pending: Send attributed request
    pending --> pending: Exact retry / mark seen
    pending --> accepted: Consent committed
    pending --> denied: Target declines
    pending --> cancelled: Authorized cancellation
```

Denied and cancelled generic requests retain their correlation fields. Withdrawing consent retains an accepted generic request and the referral captured on consent history. It revokes current data access; it does not reset a terminal request to pending.

## Webhook events

Configure the receiving profile's `notificationsWebhook` using the existing profile API. Events use `type: "CONSENT_FLOW_TRANSACTION"` and a localized `message`. Correlation lives in `data.metadata`:

```json
{
    "eventId": "stable-event-id",
    "deliveryKey": "stable-event-id:recipient-profile-id",
    "event": "consent_created",
    "contractUri": "lc:network:example.com/trpc:contract:contract-id",
    "termsUri": "lc:network:example.com/trpc:terms:terms-id",
    "requestId": "request-id",
    "requestedBy": "referrer-profile-id",
    "externalReferenceId": "referral-123",
    "recipientRole": "recipient"
}
```

| Event                                 | Delivery                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------- |
| `request_sent`                        | Target; metadata includes `type: "contract-request"` and optional message                   |
| `request_accepted`                    | Requester outside the data audience; no transaction payload or Terms URI                    |
| `request_denied`, `request_cancelled` | Owner, current recipients and non-audience requester; no consent payload                    |
| `consent_created`, `consent_updated`  | Owner and data recipients                                                                   |
| `consent_withdrawn`                   | Owner and data recipients; signals revocation                                               |
| `credentials_synced`                  | Owner and data recipients; legacy transaction shape retained with permitted credential URIs |

Each event is deduplicated per recipient, excluding the acting profile. Consenting to a request also changes its status to accepted atomically. A Terms update that accepts a pending request after prior consent expired sends the requester an acceptance decision too.

`termsUri` appears only on consent events delivered to the data audience. Referral fields are optional for direct or legacy consent, and are preserved on Terms, transaction history, and holder export metadata. Use the consented data APIs for current values; notification transactions are not a substitute for permission checks.

## Delivery and retry

State changes and event intents commit in the same Neo4j statement. Notification transport failure does not roll back consent or a request. A leased worker retries pending deliveries once per minute, using the existing SQS/webhook transport. Production uses the scheduled `contractEvents` Lambda; Docker starts the same worker after server readiness and stops it during shutdown. Local Serverless Offline can use the handler directly; it does not start the Docker timer.

Delivery is **at least once**. Persist `deliveryKey` with the downstream side effect to deduplicate retries, and acknowledge only after durable storage. Return an existing supported acknowledgement such as `{"success": true}`. Transport timeouts, HTTP 503 and explicit unsuccessful acknowledgements remain pending for retry.

Recipients removed before dispatch are skipped, including events already placed on SQS. Expired or withdrawn consent blocks queued data events, and revoked personal values or credential URIs are removed before delivery. A queued invitation is skipped if the request was already decided. Already delivered copies cannot be recalled.

Completed outbox intents discard their payload and message after all deliveries finish; stable event/delivery metadata remains for deduplication. Pending intents remain available for recovery.

## Legacy compatibility

Existing owner-only contracts and consent calls require no migration. `sendAiInsightsContractRequest` retains its boolean output and `type: "AI Insight"`, `shareLink`, and `contractUri` notification metadata. Legacy writer seen/upsert and legacy cancellation/deletion behavior remain available for legacy requests. The AI-specific shared-insights list excludes attributed generic requests.

REST paths and response schemas are generated from the brain-service tRPC router. The TypeScript brain client inherits route types; the network plugin exposes the invoke methods above. Python client generation follows the repository's published OpenAPI workflow after deployment.
