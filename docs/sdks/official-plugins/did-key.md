---
description: Generating did:key's and did:pkh's
---

# DID Key

### Overview

The DID Key plugin is responsible for generating DIDs and keypairs on the fly using a 32 Byte input seed. It implements the [**ID Control Plane**](../../core-concepts/architecture-and-principles/control-planes.md#id-control-plane), and allows consumers and consuming plugins to easily get a DID or keypair that can be derived from the input seed.

### Install

```bash
pnpm i @learncard/didkey-plugin
```

### Use Cases

The main use case for this plugin is to satisfy the [**ID Control Plane**](../../core-concepts/architecture-and-principles/control-planes.md#id-control-plane), allowing other plugins to build on top of this and do useful things with the holder's key material, without need to directly manage access to the holder's key material.

### How to instantiate and use DID Keys

Instantiation is straightforward—simply pass in a random 32 Bytes to use as entropy, and you will gain access to DIDs and keypairs associated with those 32 Bytes:

```typescript
const randomBytes = 'a'.repeat(64); // Please actually randomly generate your bytes!

// DIDKit is needed to satisfy the Did Key plugin's dependent methods   
const didkitLearnCard = await (await initLearnCard({ custom: true })).addPlugin(await getDidKitPlugin());

const learnCard = await didkitLearnCard.addPlugin(
    await getDidKeyPlugin(didkitLearnCard, randomBytes, 'key')
);

const did = learnCard.id.did();
const keypair = learnCard.id.keypair();
```
