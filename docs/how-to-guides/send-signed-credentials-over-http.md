---
description: Sign a credential yourself, then deliver it over HTTP from any language using the LearnCard Network REST API.
---

# Send Signed Credentials over HTTP

**~10 minutes · Needs:** a seed from the [Quickstart](../quick-start/your-first-integration.md).

If you sign credentials yourself but want to deliver them from any language, create an API token and POST the signed credential to `/api/send`. This script creates the token (scope `boosts:write`) and writes the request body to `request.json`:

<!-- snippet: quickstart/api-token.mjs -->

```javascript
import { writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { initLearnCard } from '@learncard/init';

const recipientEmail = process.argv[2];
if (!recipientEmail) throw new Error('Usage: node --env-file=.env api-token.mjs you@example.com');

const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });

// 1. A token that can only send boosts. Create once, store like a password.
const grantId = await learnCard.invoke.addAuthGrant({ name: 'sender', scope: 'boosts:write' });
const token = await learnCard.invoke.getAPITokenForAuthGrant(grantId);

// 2. A signed credential to send — same shape as send.mjs.
const credential = await learnCard.invoke.issueCredential({
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: learnCard.id.did(),
    validFrom: new Date().toISOString(),
    name: 'Quickstart Complete',
    credentialSubject: {
        type: ['AchievementSubject'],
        achievement: {
            id: `urn:uuid:${randomUUID()}`,
            type: ['Achievement'],
            name: 'Quickstart Complete',
            description: 'Sent a verifiable credential with LearnCard.',
            criteria: { narrative: 'Ran the LearnCard quickstart.' },
        },
    },
});

// 3. The exact request body the HTTP API expects.
writeFileSync(
    'request.json',
    JSON.stringify(
        { type: 'boost', recipient: recipientEmail, signedCredential: credential },
        null,
        2
    )
);

console.log(`export TOKEN=${token}`);
console.log('Wrote request.json');
```

<!-- /snippet -->

```bash
node --env-file=.env api-token.mjs you@example.com
# prints:  export TOKEN=...   ← run that line, then:
```

<!-- snippet: quickstart/send.sh -->

```bash
curl -X POST https://network.learncard.com/api/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
```

<!-- /snippet -->

## What you should see

The response is JSON:

```json
{
    "uri": "lc:network:network.learncard.com/trpc:boost:...",
    "inbox": { "status": "PENDING", "claimUrl": "https://learncard.app/..." }
}
```

`inbox.status` is `PENDING` for a new recipient (`inbox.claimUrl` is where they claim it) or `ISSUED` if they already use LearnCard (auto-delivered, no `claimUrl`).

The token has one permission (`boosts:write`). Store it like a password. [Revoke it](../core-concepts/architecture-and-principles/auth-grants-and-api-tokens.md) any time. Full API reference, phone delivery, templates, and webhooks: [Send & Issue Credentials](send-credentials.md).
