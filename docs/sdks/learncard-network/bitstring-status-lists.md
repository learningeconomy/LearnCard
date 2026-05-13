# Bitstring Status Lists

LearnCard Network can add W3C Bitstring Status List entries to VC 2.0 credentials. Status entries let verifiers check revocation and suspension without changing the signed credential.

```typescript
import { initLearnCard } from '@learncard/init';

const issuer = await initLearnCard({ seed: 'issuer seed', network: true });
const verifier = await initLearnCard({ seed: 'verifier seed', network: true });
```

## Send a Boost With Status

Network-issued VC 2.0 Boost credentials receive revocation status by default.

```typescript
const credentialUri = await issuer.invoke.sendBoost(recipientProfileId, boostUri);
```

To include both revocation and suspension status, pass `statusPurposes`:

```typescript
const credentialUri = await issuer.invoke.sendBoost(recipientProfileId, boostUri, {
    statusPurposes: ['revocation', 'suspension'],
});
```

Supported status purposes are:

-   `revocation`
-   `suspension`

## Allocate Status for Custom Issuance

Use `allocateCredentialStatus` when you are building and signing a credential directly.

```typescript
const statusEntries = await issuer.invoke.allocateCredentialStatus({
    statusPurposes: ['revocation', 'suspension'],
});

const unsignedCredential = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    issuer: issuer.id.did(),
    validFrom: new Date().toISOString(),
    credentialSubject: {
        id: recipientDid,
    },
    credentialStatus: statusEntries,
};

const signedCredential = await issuer.invoke.issueCredential(unsignedCredential);
```

The returned entries use this shape:

```typescript
type BitstringStatusListEntry = {
    type: 'BitstringStatusListEntry';
    statusPurpose: 'revocation' | 'suspension';
    statusListIndex: string;
    statusListCredential: string;
    id?: string;
};
```

`listSize` can be passed for direct allocation. The default is `131,072` bits.

```typescript
const [statusEntry] = await issuer.invoke.allocateCredentialStatus({
    statusPurposes: ['revocation'],
    listSize: 131_072,
});
```

## Revoke, Suspend, and Unsuspend

Revocation and suspension update the issuer's status list and re-sign the status list credential.

```typescript
await issuer.invoke.revokeBoostRecipient(boostUri, recipientProfileId);

await issuer.invoke.suspendBoostRecipient(boostUri, recipientProfileId);

await issuer.invoke.unsuspendBoostRecipient(boostUri, recipientProfileId);
```

Revocation sets the `revocation` bit. Suspension sets the `suspension` bit. Unsuspension clears only the `suspension` bit.

These methods work for pending credentials as well as accepted credentials, because status is tracked on the issued credential relationship.

## Public Status List Endpoint

Each status entry points to a public status list credential:

```typescript
const statusEntry = Array.isArray(signedCredential.credentialStatus)
    ? signedCredential.credentialStatus[0]
    : signedCredential.credentialStatus;

const response = await fetch(statusEntry.statusListCredential);
const statusListCredential = await response.json();
```

The endpoint has this form:

```http
GET /status-lists/:id
```

The response is a signed VC. The `encodedList` field is the compressed bitstring used by verifiers.

```json
{
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    "id": "https://network.learncard.com/status-lists/...",
    "type": ["VerifiableCredential", "BitstringStatusListCredential"],
    "issuer": "did:web:network.learncard.com",
    "validFrom": "2026-05-08T00:00:00.000Z",
    "credentialSubject": {
        "id": "https://network.learncard.com/status-lists/...#list",
        "type": "BitstringStatusList",
        "statusPurpose": "revocation",
        "encodedList": "u..."
    },
    "proof": {}
}
```

## Verify Status

Raw verification includes structured status check results.

```typescript
const rawVerification = await verifier.invoke.verifyCredential(signedCredential);

console.log(rawVerification.status);
```

Example status result:

```json
[
    {
        "entryType": "BitstringStatusListEntry",
        "statusPurpose": "revocation",
        "statusListCredential": "https://network.learncard.com/status-lists/...",
        "statusListIndex": "42",
        "isSet": false
    }
]
```

Use prettified verification output for user-facing display.

```typescript
const prettyVerification = await verifier.invoke.verifyCredential(signedCredential, {}, true);
```

Prettified status messages include:

-   `Status: Active`
-   `Status: Not Revoked`
-   `Status: Revoked`
-   `Status: Suspended`
-   `Status: Not Suspended`

## Rollover

Each issuer gets status lists scoped by status purpose and list size. When a list reaches its configured size, LearnCard Network automatically creates a new list. Existing credentials keep pointing at their original status list URL.

New credentials receive entries for the current open list.
