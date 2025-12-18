---
description: 'Tutorial: Verify a Verifiable Credential'
---

# Verify Credentials

This tutorial walks you through verifying a Verifiable Credential (VC) using LearnCard. Verification checks that:

1. The credential's cryptographic proof is valid
2. The credential hasn't been tampered with
3. The credential hasn't expired

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
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiableCredential"],
  "issuer": "did:key:z6MkjZ...",
  "issuanceDate": "2024-01-01T00:00:00Z",
  "credentialSubject": {
    "id": "did:key:z6Mkp...",
    "achievement": "Completed Tutorial"
  },
  "proof": {
    "type": "Ed25519Signature2020",
    // ... proof details
  }
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

For a more detailed, human-readable result, pass `true` as the third argument:

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
tamperedCredential.credentialSubject.achievement = "Fake Achievement";

const result = await learnCard.invoke.verifyCredential(tamperedCredential);

console.log(result);
// {
//   checks: [],
//   warnings: [],
//   errors: ['signature error: Verification equation was not satisfied']
// }
```

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

## Next Steps

- Learn about [Verifiable Presentations](../core-concepts/credentials-and-data/verifiable-credentials-vcs.md) for sharing credentials
- Explore [Trust Registries](../core-concepts/identities-and-keys/trust-registries.md) for validating issuers

