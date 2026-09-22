# LinkedClaims Plugin

Create, verify, store, and retrieve endorsement credentials using Open Badges v3 EndorsementCredential, linked to each original credential by its unique top-level id.

## Install

Workspace package. Build with Nx:

```
bunx nx run linked-claims-plugin:build
```

## Usage

```ts
import { getLinkedClaimsPlugin } from '@learncard/linked-claims-plugin';

const lc = await LearnCard.fromSomewhere().then(lc => lc.addPlugin(getLinkedClaimsPlugin(lc)));

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
