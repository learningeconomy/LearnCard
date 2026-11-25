# @learncard/linked-claims-plugin

Create, verify, store, and retrieve endorsement credentials using Open Badges v3 EndorsementCredential, linked to each original credential by its unique top-level id.

## Install

```bash
bun add @learncard/init @learncard/linked-claims-plugin
```

Inside this monorepo, build it with `bunx nx run linked-claims-plugin:build`.

## Usage

```ts
import { initLearnCard } from '@learncard/init';
import { getLinkedClaimsPlugin } from '@learncard/linked-claims-plugin';

// Needs a wallet with id, store, index, and read planes (a seed wallet has all four)
const learnCard = await initLearnCard({ seed: 'a'.repeat(64) });
const lc = await learnCard.addPlugin(getLinkedClaimsPlugin(learnCard));

const endorsement = await lc.invoke.endorseCredential(originalVc, {
    // OBv3 fields
    endorsementComment: 'I endorse this credential.',
    name: 'Endorsement of First Aid',
    description: 'Peer endorsement',
});

// The original credential must have a unique top-level id. A holder DID in
// credentialSubject.id does not identify a specific credential.

const verified = await lc.invoke.verifyEndorsement(endorsement);

const { uri } = await lc.invoke.storeEndorsement(endorsement);

const endorsements = await lc.invoke.getEndorsements(originalVc);
```

## Endorsement Context

Uses VC v2 and OBv3 contexts:

```
"@context": [
  "https://www.w3.org/ns/credentials/v2",
  "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
]
```

### Endorsement Fields (details input)

- `endorsementComment?: string`
- `name?: string`
- `description?: string`
