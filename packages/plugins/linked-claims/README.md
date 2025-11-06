# LinkedClaims Plugin

Create, verify, store, and retrieve endorsement credentials using Open Badges v3 EndorsementCredential, linked to original credentials by subject id or original credential id.

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
  // OBv3 fields
  endorsementComment: 'I endorse this credential.',
  name: `Endorsement of ${originalVc.id ?? originalVc.credentialSubject?.id}`,
  description: 'Peer endorsement',
});

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
