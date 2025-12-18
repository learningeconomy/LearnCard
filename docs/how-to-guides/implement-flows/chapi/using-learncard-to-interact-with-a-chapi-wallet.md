---
description: >-
  Learn How to Store an Issued Verifiable Credential into a CHAPI compliant
  Wallet with LearnCard!
---

# 🔰 Using LearnCard to Interact with a CHAPI Wallet

## Overview

Using [CHAPI](https://chapi.io/), Wallet software can register itself for a user, allowing it to become easily discoverable by a third party that would like to send a credential into that Wallet software. The result is a shared interface where issuers can simply send a credential off to CHAPI and allow the wallet to take care of everything else. The wallet software can then report back to the issuer whether or not it successfully stored the credential.

Let's use LearnCard to build out the issuer side of this flow together!

## Instantiating a LearnCard

As an issuer, we will need an _identity_ in the form of a did. LearnCard allows us to determinstically create a did from a simple string. In a real application, you will want to use a true random source to generate one of these strings, and then store it somewhere very secure. However, for the purposes of this documentation, we will get by with the string `'a'` 😉

```typescript
import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard({ seed: 'a' });
```

## Generating a Credential

Before we can ask a wallet to _store_ a credential, we first need to _generate_ a credential! There are many different ways to go about this, but `LearnCard` allows us to create a test credential rather easily!

```typescript
const testVc = learnCard.invoke.newCredential();
```

## Option 1: Easy DID Auth

Now that our credential is made, we can easily use CHAPI/DIDAuth to ask for the user's `did`, sign the credential, and store it all in one go!

```typescript
const result = await learnCard.invoke.storeCredentialViaChapiDidAuth(testVc);
```

### Reading the Result

The `result` object is a simple object with a `success` boolean, and a `reason` string. The four possible values it can hold, as well as what they represent are below:

<table><thead><tr><th width="394">Value</th><th>Explanation</th></tr></thead><tbody><tr><td><code>{ success: true }</code></td><td>The credential was successfully stored</td></tr><tr><td><code>{</code><br>  <code>success: false,</code><br>  <code>reason: 'did not auth'</code><br><code>}</code></td><td>The user rejected the DIDAuth request</td></tr><tr><td><code>{</code><br>  <code>success: false,</code><br>  <code>reason: 'auth failed verification'</code><br><code>}</code></td><td>The user's wallet software failed the verification challenge</td></tr><tr><td><code>{</code><br>  <code>success: false,</code><br>  <code>reason: 'did not store'</code><br><code>}</code></td><td>The user passed DID Authentication, but did not store the credential</td></tr></tbody></table>

## Option 2: Skipping DID Auth

### Signing a Credential

With our credential generated, we will need to _sign_ it, which will allow verifying parties to prove that this credential actually came from our did!

```typescript
const vc = await learnCard.invoke.issueCredential(testVc);
```

### Generating/Signing a Presentation

With our credential signed and generated, we will now need to create a _presentation_ that we can send off via CHAPI. This presentation will store the credential inside of it, and we can easily create and sign one with LearnCard!

```typescript
const unsignedVp = await learnCard.invoke.getTestVp(vc);
const vp = await learnCard.invoke.issuePresentation(unsignedVp);
```

### Storing a Presentation with CHAPI

Now that we've got our presentation made, we can send it off to CHAPI and ask a wallet to store it!

```typescript
const success = await learnCard.invoke.storePresentationViaChapi(vp);

if (success) console.log('Credential successfully stored!');
else console.log('Credential could not be stored');
```
