# Usage Examples

This page provides common usage examples for the **LearnCloud Network API**, so you can quickly see how to&#x20;

* Send and receive credentials, boosts, and presentations
* Create and claim credentials through peer-to-peer or QR flows
* Register and manage Signing Authorities
* Trigger and validate ConsentFlows
* Monitor health and fetch metadata (like DIDs or challenge keys)

Each example is standalone and self-explanatory. Scroll, copy, and paste what you need.

> ✅ All examples assume:
>
> * You have a **valid LearnCloud JWT** (via auth or delegation)
> * You’re storing data on behalf of a user identified by a **DID**
> * You’re using the endpoint: `https://network.learncard.com/api`

***

### 🔐 Authentication

All requests require:

* `Authorization: Bearer <your-JWT>`
* The JWT must resolve to a DID matching the stored object owner, unless delegated.

***

## 📤 Sending Credentials

### The `send` Method (Recommended)

The simplest way to send credentials is using the `send` method, which handles credential issuance, signing, and delivery in a single call.

#### Using an Existing Boost Template

```typescript
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'recipient-profile-id', // Profile ID or DID
    templateUri: 'urn:lc:boost:abc123',
});

// Returns: { type: 'boost', credentialUri: '...', uri: '...' }
```

#### Creating and Sending a New Boost

```typescript
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'recipient-profile-id',
    template: {
        credential: unsignedVC,
        name: 'Course Completion Certificate',
        category: 'Achievement',
    },
});
```

#### With ConsentFlow Contract

```typescript
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'recipient-profile-id',
    templateUri: 'urn:lc:boost:abc123',
    contractUri: 'urn:lc:contract:xyz789', // Routes via consent terms if applicable
});
```

{% hint style="info" %}
**Signing Behavior**: The `send` method uses client-side signing when key material is available. Otherwise, it falls back to your registered signing authority.
{% endhint %}

***

##
