# LinkedClaims Plugin

Create, verify, store, and retrieve endorsement credentials linked to original credentials by credentialSubject.id (endorsedId) or original credential id.

## Install
Workspace package. Build with Nx:

```
pnpm nx run linked-claims-plugin:build
```

## Usage

```ts
import { getLinkedClaimsPlugin } from '@learncard/linked-claims-plugin';

const lc = await LearnCard.fromSomewhere().then(lc => lc.addPlugin(getLinkedClaimsPlugin(lc)));

const endorsement = await lc.invoke.endorseCredential(originalVc, {
  // Endorsement fields
  recommendationText: 'Great work!',
  portfolio: [{ url: 'https://example.com/work' }],
  howKnow: 'Managed them for 2 years',
  qualifications: ['Senior Engineer', 'Project Lead'],
  rating: 4.5,
  tags: ['peer-review'],
  reference: originalVc.id,
});

const verified = await lc.invoke.verifyEndorsement(endorsement);

const { uri } = await lc.invoke.storeEndorsement(endorsement);

const endorsements = await lc.invoke.getEndorsements(originalVc);
```

## Endorsement Context
Uses `https://ctx.learncard.com/linked-claims/endorsement/1.0.0.json` with type `EndorsementClaim`.

### Endorsement Fields

- `recommendationText: string`
- `portfolio: unknown[]`
- `howKnow: string`
- `qualifications: string[]`
- `rating?: number`
- `tags?: string[]`
- `reference?: string`
- `metadata?: Record<string, unknown>`
