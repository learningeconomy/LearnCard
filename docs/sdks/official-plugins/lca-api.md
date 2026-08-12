# LCA API

The LCA API plugin provides LearnCard-managed Signing Authorities and other LearnCard App services. See the [Signing Authorities core concept](../../core-concepts/identities-and-keys/signing-authorities.md) and the [Signing Authority setup guide](../../how-to-guides/create-signing-authority.md).

## Installation

```bash
bun add @learncard/lca-api-plugin
```

## Example Usage

```typescript
import { initLearnCard } from '@learncard/init';
import { getLCAPlugin } from '@learncard/lca-api-plugin';

const seed = process.env.SECURE_SEED;

if (!seed) throw new Error('SECURE_SEED is required.');

const learnCard = await initLearnCard({
    seed,
    network: true,
});

const lcaApiLearnCard = await learnCard.addPlugin(
    await getLCAPlugin(learnCard, 'https://api.learncard.app/trpc')
);

const signingAuthority = await lcaApiLearnCard.invoke.createSigningAuthority(
    'my-first-signing-authority'
);

if (!signingAuthority) throw new Error('Could not create signing authority.');

await lcaApiLearnCard.invoke.registerSigningAuthority(
    signingAuthority.endpoint,
    signingAuthority.name,
    signingAuthority.did
);
```
