---
description: 'Tutorial: Verify a Verifiable Credential'
---

# Verify & Request Credentials

Verification checks that:

1. The credential's cryptographic proof is valid.
2. The credential hasn't been tampered with.
3. The credential hasn't expired.

**~10 minutes · Needs:** Node.js (v18+), basic familiarity with Verifiable Credentials

## Prerequisites

- Node.js (v18+)
- Basic familiarity with [Verifiable Credentials](../core-concepts/credentials-and-data/verifiable-credentials-vcs.md)

## Installation

```bash
npm install @learncard/init
```

## Basic Verification

```typescript
import { initLearnCard } from '@learncard/init';

// Initialize LearnCard (no seed needed for verification-only)
const learnCard = await initLearnCard();

// Example signed credential (you'd receive this from an issuer)
const signedCredential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    'type': ['VerifiableCredential'],
    'issuer': 'did:key:z6MkjZ...',
    'issuanceDate': '2024-01-01T00:00:00Z',
    'credentialSubject': {
        'id': 'did:key:z6Mkp...',
        'achievement': 'Completed Tutorial',
    },
    'proof': {
        'type': 'Ed25519Signature2020',
        // ... proof details
    },
};

// Verify the credential
const result = await learnCard.invoke.verifyCredential(signedCredential);

console.log(result);
// { checks: ['proof', 'expiration'], warnings: [], errors: [] }
```

## Understanding Results

### Valid Credential

```typescript
const result = await learnCard.invoke.verifyCredential(validCredential);

if (result.errors.length === 0) {
    console.log('✅ Credential is valid!');
    console.log('Checks passed:', result.checks);
} else {
    console.log('❌ Credential is invalid');
    console.log('Errors:', result.errors);
}
```

### Human-Readable Output

Pass `true` as the third argument for a human-readable result:

```typescript
const result = await learnCard.invoke.verifyCredential(signedCredential, {}, true);

console.log(result);
// [
//   { status: "Success", check: "proof", message: "Valid" },
//   { status: "Success", check: "expiration", message: "Valid • Does Not Expire" }
// ]
```

### Handling Invalid Credentials

```typescript
// Tampered credential (modified after signing)
const tamperedCredential = { ...signedCredential };
tamperedCredential.credentialSubject.achievement = 'Fake Achievement';

const result = await learnCard.invoke.verifyCredential(tamperedCredential);

console.log(result);
// {
//   checks: [],
//   warnings: [],
//   errors: ['signature error: Verification equation was not satisfied']
// }
```

## Check status, not just the signature

A valid signature does not mean the credential is still valid. The issuer may have revoked it. LearnCard automatically checks the `credentialStatus` field (often using [Bitstring Status Lists](../core-concepts/credentials-and-data/credential-status-and-bitstring-status-lists.md)) during verification.

If a credential has been revoked, `verifyCredential` returns an error:

```typescript
const result = await learnCard.invoke.verifyCredential(revokedCredential);

console.log(result);
// {
//   checks: ['proof'],
//   warnings: [],
//   errors: ['credentialStatus error: Credential has been revoked']
// }
```

To learn how to revoke credentials you've issued, see [Revoke or Update a Credential](../how-to-guides/revoke-or-update-a-credential.md).

## Request a credential from a LearnCard user

There are two main ways to request credentials from a user's wallet:

### 1. Using ConsentFlow (Recommended)

ConsentFlow is LearnCard's native way to request data. You create a contract asking for specific credentials, the user approves it, and you read the data.

```typescript
// 1. Create a contract requesting read access
const contract = await learnCard.invoke.createConsentContract({
    title: 'Job Application',
    description: 'We need to verify your degree',
    permissions: [{ type: 'read', uri: 'credential-uri-here' }],
});

// 2. Send it to the user
await learnCard.invoke.send({
    type: 'consentFlow',
    recipient: 'user@example.com',
    contract,
});

// 3. After they accept, read the data
const data = await learnCard.invoke.getConsentFlowData(contract.id);
const credentials = await learnCard.invoke.getCredentialsForContract(contract.id);
```

See [Create a ConsentFlow](../tutorials/create-a-consentflow.md) for a complete guide.

### 2. Using Open Standards

If you are building a non-LearnCard application that needs to request credentials from a LearnCard wallet, you can use standard protocols like OID4VP or VC-API QueryByExample.

See [Requesting credentials from a LearnCard user](../how-to-guides/interoperate-with-learncard.md#requesting-credentials-from-a-learncard-user) for details on standard interoperability.

## Complete Example

```typescript
import { initLearnCard } from '@learncard/init';

async function verifyCredentialFromIssuer(credential: any) {
  const learnCard = await initLearnCard();

  const result = await learnCard.invoke.verifyCredential(credential, {}, true);

  const isValid = result.every(check => check.status === 'Success');

  if (isValid) {
    console.log('✅ Credential verified successfully!');
    result.forEach(check => {
      console.log(`  ${check.check}: ${check.message}`);
    });
  } else {
    console.log('❌ Credential verification failed:');
    result.forEach(check => {
      if (check.status === 'Failed') {
        console.log(`  ${check.check}: ${check.details}`);
      }
    });
  }

  return isValid;
}

// Usage
const credential = /* ... received from issuer ... */;
await verifyCredentialFromIssuer(credential);
```

## What you should see

When you run the verification code, you will see the result object indicating whether the credential passed all checks. A valid credential returns an empty `errors` array.

## Troubleshooting

| If…                                                        | Then                                                                          |
| :--------------------------------------------------------- | :---------------------------------------------------------------------------- |
| `signature error: Verification equation was not satisfied` | The credential was modified after it was signed, or the signature is invalid. |
| `credentialStatus error: Credential has been revoked`      | The issuer revoked the credential. It is no longer valid.                     |
| `Cannot get default verification method`                   | The issuer DID could not be resolved, or the network is unreachable.          |

## Next Steps

- Learn about [Verifiable Presentations](../core-concepts/credentials-and-data/verifiable-credentials-vcs.md) for sharing credentials
- Explore [Trust Registries](../core-concepts/identities-and-keys/trust-registries.md) for validating issuers
