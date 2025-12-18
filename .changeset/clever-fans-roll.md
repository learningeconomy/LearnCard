---
'@learncard/network-brain-service': minor
'@learncard/network-plugin': minor
'@learncard/types': minor
---

Add generic `send` method for ergonomic credential sending

**Features:**

-   New `send` method that auto-issues credentials from boost templates
-   Supports client-side credential issuance when available, falls back to signing authority
-   Contract-aware: automatically routes through consent flow when recipient has consented
-   Creates `RELATED_TO` relationship between newly created boosts and contracts

**Usage:**

```typescript
// Send using existing boost template
await lc.invoke.send({
    type: 'boost',
    recipient: 'userProfileId',
    templateUri: 'urn:lc:boost:...',
});

// Send by creating a new boost
await lc.invoke.send({
    type: 'boost',
    recipient: 'userProfileId',
    template: { credential: unsignedVC },
    contractUri: 'urn:lc:contract:...', // optional
});
```
