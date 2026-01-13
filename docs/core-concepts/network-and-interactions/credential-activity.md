# Credential Activity Tracking

The Credential Activity system provides unified, event-sourced tracking of all credential issuance and claim lifecycle events. It enables partners to have a clear audit trail and analytics for credentials they've issued.

## Overview

When credentials are sent through the LearnCard Network, the system automatically logs activity events that track the full lifecycle:

```
CREATED → DELIVERED → CLAIMED
              ↓
          EXPIRED / FAILED
```

## Event Types

| Event | Description |
|-------|-------------|
| `CREATED` | Credential created and sent to inbox (email/phone recipient) |
| `DELIVERED` | Credential delivered to profile (profile ID/DID recipient) |
| `CLAIMED` | Recipient claimed/accepted the credential |
| `EXPIRED` | Credential expired before being claimed |
| `FAILED` | Credential delivery failed |

## Activity Record Structure

Each activity record contains:

```typescript
interface CredentialActivity {
    id: string;              // Unique event ID
    activityId: string;      // Groups related events for same issuance
    eventType: string;       // CREATED | DELIVERED | CLAIMED | EXPIRED | FAILED
    timestamp: string;       // ISO timestamp
    actorProfileId: string;  // Who triggered the action
    recipientType: string;   // 'profile' | 'email' | 'phone'
    recipientIdentifier: string;
    boostUri?: string;       // Associated boost template
    credentialUri?: string;  // Credential URI (for profile sends)
    inboxCredentialId?: string; // Inbox credential ID (for inbox sends)
    integrationId?: string;  // Integration attribution
    source: string;          // Entry point (see Source Types below)
    metadata?: object;       // Additional context
}
```

## Understanding Activity IDs

The `activityId` is a key concept that links related events in a credential's lifecycle. Each time a credential is sent, a new unique `activityId` is generated. When that credential is later claimed, the CLAIMED event shares the same `activityId`.

### Example: Same Boost Sent Multiple Times

```
Boost "Employee Badge"
├── send() to Alice → activityId: "abc123"
│   ├── DELIVERED (timestamp 1)
│   └── CLAIMED (timestamp 2) ← same activityId "abc123"
│
├── send() to Bob → activityId: "def456"  
│   ├── DELIVERED (timestamp 3)
│   └── CLAIMED (timestamp 4) ← same activityId "def456"
│
└── send() to Alice (again) → activityId: "ghi789"
    └── DELIVERED (timestamp 5) ← different activityId even for same recipient
```

**Key points:**
- `activityId` tracks a **single issuance lifecycle**, not a boost or recipient
- Same boost sent twice = two different `activityId`s
- Same recipient receiving twice = two different `activityId`s
- The `boostUri` field links activities to the boost template for aggregate stats

## Source Types

The `source` field indicates how the credential was issued:

| Source | Description |
|--------|-------------|
| `send` | Via the unified `send()` route |
| `sendBoost` | Via the `sendBoost` route |
| `sendCredential` | Via the `sendCredential` route |
| `inbox` | Claimed from Universal Inbox |
| `claim` | Profile-to-profile credential acceptance |
| `claimLink` | Claimed via a claim link (combined send+claim) |
| `contract` | Issued via ConsentFlow contract |

## API Endpoints

### Get My Activities

Retrieve a paginated list of credential activities for the authenticated profile.

```http
GET /activity/credentials
```

**Query Parameters:**
- `limit` (number, default: 25) - Max results per page
- `cursor` (string) - Pagination cursor
- `boostUri` (string) - Filter by boost template
- `eventType` (string) - Filter by event type
- `integrationId` (string) - Filter by integration

**Response:**
```json
{
    "records": [
        {
            "id": "abc123",
            "activityId": "xyz789",
            "eventType": "DELIVERED",
            "timestamp": "2024-01-15T10:30:00Z",
            "recipientType": "profile",
            "recipientIdentifier": "alice",
            "boostUri": "lc:network:example.com/trpc:boost:123",
            "boost": {
                "id": "123",
                "name": "Achievement Badge",
                "category": "Achievement"
            },
            "recipientProfile": {
                "profileId": "alice",
                "displayName": "Alice Smith"
            }
        }
    ],
    "hasMore": true,
    "cursor": "2024-01-15T10:30:00Z"
}
```

### Get Activity Stats

Retrieve aggregated statistics for credential activities.

```http
GET /activity/credentials/stats
```

**Query Parameters:**
- `boostUris` (string[]) - Filter by boost templates
- `integrationId` (string) - Filter by integration

**Response:**
```json
{
    "total": 150,
    "created": 50,
    "delivered": 100,
    "claimed": 75,
    "expired": 5,
    "failed": 2,
    "claimRate": 75.0
}
```

### Get Activity by ID

Retrieve details of a specific activity by its activity ID.

```http
GET /activity/credentials/{activityId}
```

## Usage Examples

### JavaScript/TypeScript

```typescript
// Get recent activity
const activity = await learnCard.invoke.getMyActivities({
    limit: 10,
});

console.log(`Total activities: ${activity.records.length}`);

// Get stats for a specific boost
const stats = await learnCard.invoke.getActivityStats({
    boostUris: ['lc:network:example.com/trpc:boost:123'],
});

console.log(`Claim rate: ${stats.claimRate}%`);
```

### Filtering by Event Type

```typescript
// Get only claimed credentials
const claimed = await learnCard.invoke.getMyActivities({
    eventType: 'CLAIMED',
    limit: 50,
});
```

## Best Practices

1. **Use `activityId` to track lifecycle** - Related events share the same `activityId`, making it easy to track a credential from send to claim.

2. **Poll with timestamps** - When polling for new activity, use the `cursor` parameter to efficiently fetch only new events.

3. **Filter by boost for template-specific analytics** - Use `boostUri` to get stats for specific credential templates.

4. **Monitor claim rates** - The `claimRate` in stats helps identify which credentials are being claimed and which may need follow-up.

## Integration with Notifications

Activity events are separate from the notification system. While notifications push real-time updates to recipients, activity records provide a persistent audit trail for issuers.

For real-time updates, consider using webhooks configured during credential issuance.
