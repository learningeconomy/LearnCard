# Usage Examples

This page provides common usage examples for the **LearnCloud Network API**, so you can quickly see how to&#x20;

-   Send and receive credentials, boosts, and presentations
-   Create and claim credentials through peer-to-peer or QR flows
-   Register and manage Signing Authorities
-   Trigger and validate ConsentFlows
-   Monitor health and fetch metadata (like DIDs or challenge keys)
-   Run semantic search across skill frameworks
-   Link and use OpenSALT skill frameworks

Each example is standalone and self-explanatory. Scroll, copy, and paste what you need.

> ✅ All examples assume:
>
> -   You have a **valid LearnCloud JWT** (via auth or delegation)
> -   You’re storing data on behalf of a user identified by a **DID**
> -   You’re using the endpoint: `https://network.learncard.com/api`

---

### 🔐 Authentication

All requests require:

-   `Authorization: Bearer <your-JWT>`
-   The JWT must resolve to a DID matching the stored object owner, unless delegated.

---

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

---

## 🔎 Semantic Skill Search

Use semantic search when keyword matching is too strict and you want meaning-based results.

```typescript
const results = await learnCard.invoke.semanticSearchSkills({
    text: 'hands-on robotics troubleshooting',
    frameworkId: 'framework-123', // optional
    limit: 50, // optional (default 50)
});

console.log(results.records[0]);
// {
//   id: 'skill-id',
//   statement: 'Diagnose wiring faults',
//   description: '...',
//   frameworkId: 'framework-123',
//   score: 0.88,
//   ...
// }
```

{% hint style="info" %}
Semantic search requires skill embeddings to be present. In LearnCard Network, embeddings are generated for skill create/update/sync flows and can be backfilled when enabled by environment configuration.
{% endhint %}

---

## OpenSALT Skill Frameworks

Link an OpenSALT framework by CASE URL (or UUID), then sync it locally:

```typescript
const framework = await learnCard.invoke.createSkillFramework({
    frameworkId:
        'https://opensalt.net/ims/case/v1p0/CFDocuments/c6085394-d7cb-11e8-824f-0242ac160002',
});

await learnCard.invoke.syncFrameworkSkills({ id: framework.id });
```

List frameworks available to the current profile (managed + public):

```typescript
const page = await learnCard.invoke.getAllAvailableFrameworks({
    limit: 25,
    cursor: null,
});

console.log(page.records.map(framework => framework.id));
```

To align a boost with skills from that framework:

```typescript
await learnCard.invoke.alignBoostSkills(boostUri, [{ frameworkId: framework.id, id: 'skill-id' }]);
```

For full details, see [Skill Frameworks & OpenSALT](skills-and-opensalt.md).

---

## 📱 App Store Credentials

### Fetch Credentials Sent by an App

Retrieve credentials that a specific app (App Store listing) has sent to the current user. Useful for building in-app credential dashboards.

```typescript
const result = await learnCard.invoke.getMyCredentialsFromApp(
    'my-app-listing-id', // App Store listing ID or slug
    { limit: 50 } // Optional pagination
);

console.log(result);
// {
//   hasMore: false,
//   cursor: 'abc123',
//   totalCount: 3,
//   records: [
//     {
//       credentialId: 'cred-123',
//       credentialUri: 'lc:credential:...',
//       date: '2024-03-09T12:00:00Z',
//       status: 'claimed',
//       boostName: 'Course Completion Badge',
//       boostCategory: 'Achievement'
//     },
//     ...
//   ]
// }
```

#### Credential Status Values

| Status    | Description                                 |
| --------- | ------------------------------------------- |
| `pending` | Credential sent but not yet claimed by user |
| `claimed` | User has claimed the credential             |
| `revoked` | Credential has been revoked by issuer       |

#### Resolving Full Credential Data

The API returns `credentialUri` which can be used to fetch the full Verifiable Credential:

```typescript
for (const record of result.records) {
    const fullVC = await learnCard.read.get(record.credentialUri);
    console.log(fullVC.credentialSubject);
}
```

{% hint style="info" %}
**Pagination**: Use `cursor` from the response to fetch additional pages. The `hasMore` flag indicates if more records exist.
{% endhint %}
