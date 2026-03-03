---
description: Quick Start Guide
---

# LearnCard Wallet SDK

**LearnCard Wallet SDK** is the fundamental component of the LearnCard ecosystem, providing core functionality for working with verifiable credentials (VCs) and decentralized identifiers (DIDs). It serves as the foundation upon which the entire LearnCard system is built, offering a plugin system for extending functionality and standardized interfaces for common operations.

## Install the SDK

Install using the package manager of your choice:

{% tabs %}
{% tab title="pnpm" %}
```bash
pnpm i @learncard/init
```
{% endtab %}

{% tab title="yarn" %}
```bash
yarn add @learncard/init
```
{% endtab %}

{% tab title="npm" %}
```bash
npm i @learncard/init
```
{% endtab %}
{% endtabs %}

## Create, Issue, and Verify a Credential

To make your first wallet, import and call `initLearnCard` with a unique string that is 64 characters or less:

```typescript
import { initLearnCard } from '@learncard/init';

// Generate a random key for wallet seed
const seed = Array.from(crypto.getRandomValues(new Uint8Array(32)), dec =>
  dec.toString(16).padStart(2, "0")
).join("");

/** Or, if in node environment:
    const seed = crypto.randomBytes(32).toString('hex');
**/

// Initialize a new LearnCard wallet with a unique string that is 64 characters or less 
const learnCard = await initLearnCard({ seed });

// Returns an unsigned, achievement credential in the OBv3 spec.
const unsignedAchievementCredential = learnCard.invoke.newCredential({ type: 'achievement' });

// Sign the Credential with your LearnCard issuer DID
const signedVc = await learnCard.invoke.issueCredential(unsignedAchievementCredential);

// Verify the Credential
const result = await learnCard.invoke.verifyCredential(signedVc, {}, true);
console.log(result);
// [
//     { status: "Success", check: "proof", message: "Valid" },
//     {
//         status: "Success",
//         check: "expiration",
//         message: "Valid • Does Not Expire"
//     }
// ]
```
