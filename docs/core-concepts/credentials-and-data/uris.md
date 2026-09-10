---
description: The `lc:` URIs that point at credentials, templates, and contracts — and how to resolve them.
---

# Credential URIs

Most things the LearnCard Network gives you back are **URIs**, not raw JSON. A URI is a stable pointer to something stored somewhere; you pass it around, and resolve it when you need the content.

They all start with `lc:` and follow `lc:<where>:<location>`:

| You'll see                                              | It points at                                          | You got it from                                    |
| ------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------- |
| `lc:network:network.learncard.com/trpc:boost:<id>`      | A credential template ([Boost](boost-credentials.md)) | `createBoost()`, `send().uri`                      |
| `lc:network:network.learncard.com/trpc:credential:<id>` | A credential stored on the network                    | `send().credentialUri`                             |
| `lc:network:network.learncard.com/trpc:contract:<id>`   | A consent contract                                    | `createContract()`                                 |
| `lc:network:network.learncard.com/trpc:terms:<id>`      | One user's consent to a contract                      | `consentToContract().termsUri`                     |
| `lc:cloud:<host>/trpc:credential:<id>`                  | A credential in LearnCloud storage                    | `store.LearnCloud.upload()` or `uploadEncrypted()` |

The host in the URI is the network it lives on — a staging URI won't resolve on production.

## Resolving a URI

Set `SECURE_SEED` to your 64-hex seed. This example signs a small Open Badges 3.0 credential, stores it, and checks that resolving the returned URI preserves its contents.

<!-- snippet: understand/uris.mjs -->

```javascript
import { randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { initLearnCard } from '@learncard/init';

if (!process.env.SECURE_SEED) throw new Error('Set SECURE_SEED');
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });
const vc = await learnCard.invoke.issueCredential({
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: learnCard.id.did('key'),
    validFrom: new Date().toISOString(),
    name: 'URI Example',
    credentialSubject: {
        id: learnCard.id.did('key'),
        type: ['AchievementSubject'],
        achievement: {
            id: `urn:uuid:${randomUUID()}`,
            type: ['Achievement'],
            name: 'URI Example',
            description: 'Stored and resolved a credential.',
            criteria: { narrative: 'Run this example.' },
        },
    },
});
// upload is not encrypted: use only non-sensitive example data here.
const uri = await learnCard.store.LearnCloud.upload(vc);
const resolved = await learnCard.read.get(uri);
console.log('prefix:', uri.split(':').slice(0, 2).join(':') + ':');
console.log('equal:', isDeepStrictEqual(resolved, vc));
```

<!-- /snippet -->

`upload()` stores unencrypted data. Use `uploadEncrypted()` for private data; only the designated recipients can decrypt it.

`read.get` looks at the URI's method (`network`, `cloud`, …) and asks the right plugin to fetch it. `store.upload(credential)` does the reverse: saves a credential and hands you a URI.

## Two rules

- **Never build a URI by hand.** Always use the value a method returned. The format is stable, but the IDs aren't guessable and the host matters.
- **Keep the returned URI.** It's your only handle on the thing. If you send a credential and want to revoke it later, you'll need `credentialUri`.
