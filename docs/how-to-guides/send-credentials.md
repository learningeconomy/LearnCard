---
description: 'One call sends a credential to an email, phone, or LearnCard profile. Sign it yourself or let LearnCard sign from a template.'
---

# Send & Issue Credentials

{% hint style="info" %}
**~10 min** · After the [Quickstart](../quick-start/your-first-integration.md).
{% endhint %}

## The one-line version

```bash
npx @learncard/cli send you@example.com            # you sign; writes send.mjs
npx @learncard/cli send you@example.com --template # LearnCard signs from a reusable template; writes send-from-template.mjs
```

Both reuse the `.env` the Quickstart created. Everything below is what those scripts do, and the options `send()` takes beyond them.

## `send()` in one picture

```typescript
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'jane@example.com', // email, phone, profile ID, or DID — detected automatically
    signedCredential, //             ← you signed it       (or)
    templateUri, //                  ← LearnCard signs from a template you created
});
```

You choose **who the recipient is** and **who signs**. Everything else — delivery, the claim email, auto-delivery to existing accounts — is the same call.

| Recipient looks like          | What happens                                                                                                                                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `jane@example.com`            | Goes to the [Universal Inbox](../core-concepts/network-and-interactions/universal-inbox.md); Jane gets a claim email. If that email is already verified on a LearnCard account, it's delivered straight there. |
| `+15551234567`                | Same, by SMS. Phone delivery is limited to issuers on the [trusted registry](verify-my-issuer.md).                                                                                                             |
| `jane-doe` (profile ID)       | Delivered directly to that account.                                                                                                                                                                            |
| `did:key:z6Mk…` / `did:web:…` | Delivered directly to that DID.                                                                                                                                                                                |

| You pass                                   | Who signs                                                                                               | Set up                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `signedCredential`                         | You did, with `issueCredential()` and your seed                                                         | Nothing                                                    |
| `templateUri`                              | LearnCard, with your [signing authority](create-signing-authority.md), from a template you created once | `setup-signing`, then `createBoost` (or `send --template`) |
| `template: { credential, name, category }` | Same, creating the template in this call                                                                | `setup-signing`                                            |

Template URIs look like `lc:network:<host>/trpc:boost:<id>`. Always use the value returned by `createBoost` or `send` (`result.uri`) — never build one.

You need a network profile before you send — `createServiceProfile` for an organization or bot, `createProfile` for a person. The Quickstart and `learncard init` do this for you. [Network Profiles](../core-concepts/identities-and-keys/network-profiles.md).

## Examples

{% tabs %}
{% tab title="You sign" %}

```typescript
const signedCredential = await learnCard.invoke.issueCredential({
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: learnCard.id.did(),
    credentialSubject: {
        type: ['AchievementSubject'],
        achievement: {
            type: ['Achievement'],
            name: 'Teamwork Badge',
            description: 'Recognized for outstanding collaboration.',
            criteria: { narrative: 'Nominated by peers.' },
        },
    },
});

const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'jane@example.com',
    signedCredential,
});
```

Your proof is kept as-is all the way to the recipient. `send()` also saves the credential as a template (`result.uri`) so you can send the same badge again with `templateUri`.

{% endtab %}
{% tab title="LearnCard signs (template)" %}

```typescript
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'jane-doe', // or an email, phone, or DID
    templateUri, // from createBoost() or an earlier send()'s result.uri
});
```

Needs a [signing authority](create-signing-authority.md) — one command: `npx @learncard/cli setup-signing`. Templates can carry `{{variables}}` filled per send; see [Issue at scale](#issue-at-scale-with-templates).

{% endtab %}
{% tab title="Create the template in the same call" %}

```typescript
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'jane-doe',
    template: {
        credential: {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                'https://ctx.learncard.com/boosts/1.0.1.json',
            ],
            type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
            name: 'Web Development 101',
            credentialSubject: {
                type: ['AchievementSubject'],
                achievement: {
                    type: ['Achievement'],
                    name: 'Web Development 101',
                    description: 'Completed the Web Development fundamentals course.',
                    criteria: { narrative: 'Passed all modules and the final assessment.' },
                },
            },
        },
        name: 'Web Development 101',
        category: 'Achievement',
    },
});

console.log(result.uri); // the new template — reuse it next time
```

Include the LearnCard Boost context and `BoostCredential` type on templates the network signs; it stamps `boostId` on each issued credential. [Why](../core-concepts/credentials-and-data/boost-credentials.md#anatomy).

{% endtab %}
{% tab title="Through a consent contract" %}

```typescript
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'jane-doe',
    templateUri,
    contractUri, // the contract Jane consented to
});
```

If Jane has consented to `contractUri` with write permission for this template's category, the credential is written under that consent and appears in her consent history. See [Connect a User's LearnCard](../tutorials/create-a-consentflow.md).

{% endtab %}
{% endtabs %}

## Options for email and phone recipients

```typescript
options: {
    webhookUrl?: string;        // POSTed ISSUANCE_DELIVERED, then ISSUANCE_CLAIMED — see Know When a Credential Is Claimed
    suppressDelivery?: boolean; // Don't send the email/SMS. inbox.claimUrl is still returned; deliver it your way.
    guardianEmail?: string;     // A parent must approve before the recipient can claim. Must differ from recipient.
    branding?: {
        issuerName?: string;
        issuerLogoUrl?: string;
        credentialName?: string; // display name in the claim email
        recipientName?: string;  // "Hi Jane,"
    };
}
```

### Guardian approval

```typescript
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'student@school.edu',
    templateUri,
    options: { guardianEmail: 'parent@example.com' },
});
console.log(result.inbox?.guardianStatus); // 'AWAITING_GUARDIAN'
```

The guardian gets an approval email with a 6-digit code; the learner sees a pending notice, then a normal claim button once approved. `guardianStatus` moves to `GUARDIAN_APPROVED` or `GUARDIAN_REJECTED`. If the guardian goes on to create a LearnCard account, they become the learner's manager and **every future credential to that learner is gated automatically** — no `guardianEmail` needed, approval in-app without a code.

| If…                                                                    | Then                                                                                                      |
| :--------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| `guardianEmail must differ from recipient (self-approval not allowed)` | Use a different address for the guardian.                                                                 |
| Stuck at `AWAITING_GUARDIAN`                                           | The guardian hasn't acted. They can reopen the link from their email; the learner can't claim until then. |
| Learner can't claim after approval                                     | Check `guardianStatus` — `GUARDIAN_REJECTED` means not claimable. Send again if it was a mistake.         |

## What comes back

```typescript
{
    type: 'boost',
    uri: string,            // the template used or created — reuse it
    activityId: string,     // key for status tracking (below)
    credentialUri?: string, // the issued credential — set for profile/DID sends; for email/phone, once claimed

    inbox?: {               // only for email/phone recipients
        issuanceId: string,
        status: 'PENDING' | 'ISSUED',
        claimUrl?: string,  // present when PENDING
        guardianStatus?: 'AWAITING_GUARDIAN' | 'GUARDIAN_APPROVED' | 'GUARDIAN_REJECTED',
    },
}
```

| `inbox.status` | Means                                                                                               | `claimUrl` |
| :------------- | :-------------------------------------------------------------------------------------------------- | :--------- |
| `PENDING`      | New recipient. A claim email/SMS went out (unless `suppressDelivery`); they claim at `claimUrl`.    | yes        |
| `ISSUED`       | That email/phone is already verified on a LearnCard account — delivered directly. Nothing to claim. | no         |

Once someone claims by email, that address is verified on their account, so your next send to it comes back `ISSUED`.

## Over HTTP

`send()` is also `POST https://network.learncard.com/api/send` with the same JSON body. Authenticate with `Authorization: Bearer <API token>` from an auth grant with `boosts:write` scope — `npx @learncard/cli token`, or [Generate API Tokens](deploy-infrastructure/generate-api-tokens.md).

```bash
curl -X POST https://network.learncard.com/api/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "type": "boost", "recipient": "jane@example.com", "templateUri": "lc:network:network.learncard.com/trpc:boost:…" }'
```

### Sign locally, send over HTTP

If you sign credentials yourself but want to deliver them from any language, create a token and POST the signed credential. This script creates the token and writes the request body to `request.json`:

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

#### What you should see

The response is JSON:

```json
{
    "uri": "lc:network:network.learncard.com/trpc:boost:...",
    "inbox": { "status": "PENDING", "claimUrl": "https://learncard.app/..." }
}
```

`inbox.status` is `PENDING` for a new recipient (`inbox.claimUrl` is where they claim it) or `ISSUED` if they already use LearnCard (auto-delivered, no `claimUrl`).

The token has one permission (`boosts:write`). Store it like a password. [Revoke it](../core-concepts/architecture-and-principles/auth-grants-and-api-tokens.md) any time.

---

## Track what happened to a credential

Every `send()` returns an `activityId`. The network logs each step against it — `CREATED` when you sent, `DELIVERED` when it reached an existing account or the claim email went out, `CLAIMED` when the recipient accepted, and `EXPIRED` or `FAILED` if it didn't get there.

```typescript
const chain = await learnCard.invoke.getActivityChain({ activityId: result.activityId });
console.log(chain.map(e => `${e.eventType} ${e.timestamp}`));
// ['CREATED 2026-09-11T18:12:27Z', 'DELIVERED 2026-09-11T18:12:28Z', 'CLAIMED 2026-09-11T18:20:04Z']
```

Or from the terminal: `npx @learncard/cli status <activityId>`. No server needed — poll this when you want to know if a credential was claimed. Details, filters, and stats: [Credential Activity](../sdks/learncard-network/credential-activity.md). To be told instead of asking, see [Know When a Credential Is Claimed](../tutorials/listen-to-webhooks.md).

### Who has a template

For a per-template view — everyone who holds a credential issued from it, and whether each one is `active`, `revoked`, or `suspended`:

```typescript
const { records } = await learnCard.invoke.getPaginatedBoostRecipients(templateUri);
// [{ to: { profileId: 'alice-123' }, received: '2026-01-09T…', uri: 'lc:network:…:credential:…', status: 'active' }, …]
```

This is also how you find the `credentialUri` to [revoke](revoke-or-update-a-credential.md).

---

## Issue at scale with templates

Boosts support **Mustache-style templating** to inject dynamic values at issuance time.

### Personalize with `{{variables}}`

Use `{{variableName}}` syntax in your credential template:

```javascript
const templatedCredential = {
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    name: 'Certificate for {{courseName}}',
    credentialSubject: {
        type: ['AchievementSubject'],
        achievement: {
            type: ['Achievement'],
            name: '{{courseName}} Completion',
            description:
                'Awarded to {{studentName}} for completing {{courseName}} with grade {{grade}}',
            criteria: { narrative: 'Successfully complete the course' },
        },
    },
};

const dynamicBoostUri = await learnCard.invoke.createBoost(templatedCredential, {
    name: 'Course Completion Template',
});
```

Provide `templateData` when sending to fill in the variables:

```javascript
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'student@example.com',
    templateUri: dynamicBoostUri,
    templateData: {
        courseName: 'Web Development 101',
        studentName: 'Alice Smith',
        grade: 'A',
    },
});
```

The resulting credential will have all placeholders replaced.

### Issue from a spreadsheet

You can issue credentials in bulk by reading a CSV file.

```javascript
import fs from 'node:fs';

// Assuming a CSV with header: name,email,cohort
const csvData = fs.readFileSync('students.csv', 'utf-8');
const rows = csvData
    .split('\n')
    .slice(1)
    .filter(row => row.trim());

let pending = 0;
let issued = 0;

for (const row of rows) {
    const [name, email, cohort] = row.split(',');

    const result = await learnCard.invoke.send({
        type: 'boost',
        recipient: email.trim(),
        templateUri: dynamicBoostUri,
        templateData: { name: name.trim(), cohort: cohort.trim() },
    });

    if (result.inbox?.status === 'PENDING') pending++;
    else issued++;
}

console.log(`Issued: ${issued}, Pending: ${pending}`);
```

Note that re-running `send` for the same recipient and template will re-send the credential (it is not idempotent). To avoid duplicates, use `learnCard.invoke.getPaginatedBoostRecipients(boostUri)` to reconcile who has already received it before sending.

---

## Next steps

- Know whether it was claimed → [Know When a Credential Is Claimed](../tutorials/listen-to-webhooks.md)
- Take one back → [Revoke or Update a Credential](revoke-or-update-a-credential.md)
- Design your own credential → [Building Verifiable Credentials](../core-concepts/credentials-and-data/building-verifiable-credentials.md)
- Lower-level inbox control (per-issuance signer, custom claim flows) → [Universal Inbox API](../sdks/learncard-network/universal-inbox-api.md)
