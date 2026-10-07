---
description: 'One call sends a credential to an email, phone, or LearnCard profile. Sign it yourself or let LearnCard sign from a template.'
---

# Send & Issue Credentials

{% hint style="info" %}
**~10 min** · After the [Quickstart](../quick-start/your-first-integration.md).
{% endhint %}

## The one-line version

```bash
npx @learncard/cli send                    # you sign; writes send.mjs
npx @learncard/cli send --template         # LearnCard signs from a reusable template; writes send-from-template.mjs
```

Both prompt for the recipient (or take it as an argument: `send you@yourdomain.com`) and reuse the `.env` the Quickstart created. Everything below is what those scripts do, and the options `send()` takes beyond them.

**The `send` method automatically detects your recipient type:**

-   **Profile ID** → Direct delivery to their LearnCard
-   **DID** → Direct delivery via DID resolution
-   **Email** → Routes through Universal Inbox (sends claim email)
-   **Phone** → Routes through Universal Inbox (sends claim SMS)
## `send()` in one picture

```typescript
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'jane@example.com', // email, phone, profile ID, or DID — detected automatically
    signedCredential, //             ← you signed it       (or)
    templateUri, //                  ← LearnCard signs from a template you created
    refresh: true, //                ← optional: issue it refreshable (email/phone uses deferred inbox signing)
});
```

-   LearnCard SDK initialized with `network: true`
-   A [signing authority](create-signing-authority.md) configured (for server-side signing) **OR** local key material available (for client-side signing) **OR** a pre-signed credential (no signing authority needed)
You choose **who the recipient is** and **who signs**. Everything else — delivery, the claim email, auto-delivery to existing accounts — is the same call. Add `refresh: true` and the recipient can receive in-place updates later; see [Issue and Refresh a Managed Credential](issue-and-refresh-a-managed-credential.md). Add `idempotencyKey` to make an SDK-signed or server-signed refreshable send safe to retry (direct REST callers providing `signedCredential` omit the key and retry the same signed credential and `templateUri`); see [Retrying a refreshable send safely](issue-and-refresh-a-managed-credential.md#retrying-a-refreshable-send-safely).

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
{% tab title="Send to Profile ID or DID" %}

```typescript
// Send to an existing LearnCard user
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'recipient-profile-id', // or 'did:key:z6Mk...'
    templateUri: 'urn:lc:boost:abc123',
});

console.log(result.credentialUri); // URI of the sent credential
console.log(result.uri); // URI of the boost template used
```

{% endtab %}

{% tab title="Send to Email" %}

```typescript
// Send to someone via email (they'll get a claim link)
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'student@example.com', // Auto-detected as email
    templateUri: 'urn:lc:boost:abc123',
    options: {
        branding: {
            issuerName: 'My Organization',
            issuerLogoUrl: 'https://example.com/logo.png',
            recipientName: 'John Doe',
        },
        webhookUrl: 'https://api.example.com/webhooks/claimed',
    },
});

console.log(result.inbox?.claimUrl); // Claim URL (if suppressDelivery=true)
console.log(result.inbox?.issuanceId); // Issuance tracking ID
```

{% endtab %}

{% tab title="Send to Phone" %}

```typescript
// Send to someone via SMS
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: '+15551234567', // Auto-detected as phone
    templateUri: 'urn:lc:boost:abc123',
    options: {
        suppressDelivery: true, // Don't send SMS, just get claimUrl
    },
});

// Use result.inbox.claimUrl in your own notification
```

{% endtab %}

{% tab title="Creating a New Boost On-the-Fly" %}

```typescript
// Send by creating a new boost from an unsigned credential
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'recipient-profile-id',
    template: {
        credential: {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json',
            ],
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': 'did:web:example.com',
            'name': 'Course Completion',
            'credentialSubject': {
                'type': ['AchievementSubject'],
                'achievement': {
                    'type': ['Achievement'],
                    'name': 'Web Development 101',
                    'description': 'Completed the Web Development fundamentals course.',
                    'criteria': {
                        'narrative':
                            'Successfully completed all modules and passed the final assessment.',
                    },
                },
            },
        },
        name: 'Web Development 101 Certificate',
        category: 'Achievement',
    },
});
```

{% endtab %}

{% tab title="Send a Pre-Signed Credential" %}

```typescript
// Sign a credential yourself, then send it — no template needed
{% tab title="You sign" %}

```typescript
const signedCredential = await learnCard.invoke.issueCredential({
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    'type': ['VerifiableCredential', 'OpenBadgeCredential'],
    'issuer': learnCard.id.did(),
    'credentialSubject': {
        'type': ['AchievementSubject'],
        'achievement': {
            'type': ['Achievement'],
            'name': 'Teamwork Badge',
            'description': 'Recognized for outstanding collaboration.',
            'criteria': { 'narrative': 'Nominated by peers.' },
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

{% endtab %}

{% tab title="With ConsentFlow Contract" %}

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

### REST API (`POST /send`)

The `send` method is also available as a REST endpoint. Use an API key or bearer token for authentication.

{% tabs %}
{% tab title="cURL: Send with Template" %}

```bash
curl -X POST https://network.learncard.com/api/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "boost",
    "recipient": "student@example.com",
    "templateUri": "urn:lc:boost:abc123"
  }'
```

{% endtab %}

{% tab title="cURL: Send Pre-Signed Credential" %}

```bash
curl -X POST https://network.learncard.com/api/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "boost",
    "recipient": "student@example.com",
    "signedCredential": {
      "@context": [
        "https://www.w3.org/ns/credentials/v2",
        "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
        "https://w3id.org/security/suites/ed25519-2020/v1"
      ],
      "type": ["VerifiableCredential", "OpenBadgeCredential"],
      "issuer": { "id": "did:web:example.com" },
      "validFrom": "2025-01-01T00:00:00Z",
      "name": "Teamwork Badge",
      "credentialSubject": {
        "type": ["AchievementSubject"],
        "achievement": {
          "type": ["Achievement"],
          "name": "Teamwork",
          "description": "Recognized for outstanding collaboration.",
          "criteria": { "narrative": "Nominated by peers." }
        }
      },
      "proof": {
        "type": "Ed25519Signature2020",
        "proofPurpose": "assertionMethod",
        "proofValue": "z...",
        "verificationMethod": "did:web:example.com#owner",
        "created": "2025-01-01T00:00:00Z"
      }
    }
  }'
```

{% endtab %}

{% tab title="JavaScript (fetch)" %}

```javascript
const response = await fetch('https://network.learncard.com/api/send', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
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
    expiresInDays?: number;     // How long the credential stays claimable (1–720, default 30). Use a short window for sensitive records.
    branding?: {
        issuerName?: string;
        issuerLogoUrl?: string;
        credentialName?: string; // display name in the claim email
        recipientName?: string;  // "Hi Jane,"
    };
}
```

Email and phone sends stay claimable for **30 days** by default. Claims are single-use, and the network can't read the credential after it's claimed. For transcripts, CLRs, or other sensitive learner data, set `expiresInDays` to the shortest practical window — it controls how long the payload can be claimed, not the credential's own validity dates. Details in [Universal Inbox](../core-concepts/network-and-interactions/universal-inbox.md#security-and-retention).

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
interface SendResponse {
    type: 'boost';
    credentialUri: string; // URI of the issued credential
    uri: string; // URI of the boost template

    // Only present when sent to email/phone recipients
    inbox?: {
        issuanceId: string; // Tracking ID for this issuance
        status:
            | 'PENDING' // Waiting to be claimed
            | 'ISSUED' // Auto-delivered to verified user
            | 'CLAIMED'; // Claimed via claim link
        claimUrl?: string; // Present when suppressDelivery=true
        recipientDid?: string; // DID of recipient (present when ISSUED)
        guardianStatus?: // Present when guardianEmail was specified
        | 'AWAITING_GUARDIAN' // Waiting for guardian approval
            | 'GUARDIAN_APPROVED' // Guardian approved
            | 'GUARDIAN_REJECTED'; // Guardian rejected
    };
{
    type: 'boost',
    uri: string,            // the template used or created — reuse it
    activityId: string,     // key for status tracking (below)
    credentialUri?: string, // the issued credential — set for profile/DID sends; for email/phone, once claimed
    refresh?: {             // set when you passed refresh: true — the issuance receipt
        refreshId: string,      // publish future versions against this
        refreshService: object, // the managed refresh service inside the signed credential
        credentialId: string,   // every version reuses this ID
        issuerDid: string,      // every version reuses this issuer
        holderDid: string,      // the recipient identity
        credentialStatus?: object, // the status descriptor to preserve
    },

    inbox?: {               // only for email/phone recipients
        issuanceId: string,
        status: 'PENDING' | 'ISSUED' | 'DELIVERED' | 'CLAIMED' | 'EXPIRED', // PENDING or ISSUED right after send()
        claimUrl?: string,  // present when PENDING
        guardianStatus?: 'AWAITING_GUARDIAN' | 'GUARDIAN_APPROVED' | 'GUARDIAN_REJECTED',
    },
}
```

`refresh` is the one part you can't get anywhere else: refreshable credentials are stored encrypted to the recipient, so keep the receipt alongside your own record of the claims if you want to publish updates. It's metadata only — no credential content. Full walkthrough: [Issue and Refresh a Managed Credential](issue-and-refresh-a-managed-credential.md).

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

{% hint style="info" %}
**Contract Integration**: When you provide a `contractUri`, the method automatically:

-   Checks if the recipient has consented to the contract
-   Routes the credential through the consent flow if terms exist
-   Creates a `RELATED_TO` relationship between new boosts and the contract
    {% endhint %}

{% hint style="info" %}
**Email Verification**: When a recipient claims a credential via an email claim link, their email address becomes a **verified contact method** linked to their LearnCard profile. This means:

-   Future credentials sent to that email will be **auto-delivered** directly to their wallet
-   No claim link is needed for subsequent issuances
-   The issuer receives `status: 'ISSUED'` instead of `status: 'PENDING'`
    {% endhint %}
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

This is useful for:

-   **Auditing**: See who has received a specific credential
-   **Preventing duplicates**: Check if a user already received a boost before sending
-   **Analytics**: Track issuance metrics for your credentials

---

## Dynamic Templates with `templateData`

Use Mustache-style templates to personalize credentials with unique data for each recipient. This is perfect for issuing the same type of credential (like course completions) with recipient-specific details.

### Creating a Templated Boost

First, create a boost with `{{variableName}}` placeholders:

```typescript
const templatedBoostUri = await learnCard.invoke.createBoost(
    {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json',
        ],
        'type': ['VerifiableCredential', 'OpenBadgeCredential'],
        'issuer': learnCard.id.did(),
        'issuanceDate': new Date().toISOString(),
        'name': 'Certificate for {{courseName}}',
        'credentialSubject': {
            'type': ['AchievementSubject'],
            'achievement': {
                'type': ['Achievement'],
                'name': '{{courseName}} - {{level}}',
                'description':
                    'Awarded to {{studentName}} for completing {{courseName}} with grade {{grade}}',
                'criteria': { 'narrative': 'Complete all course modules' },
            },
        },
    },
    { name: 'Course Completion Template' }
);
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

### Special Characters

Template values are automatically escaped for JSON safety. You can safely include:

-   Quotes: `"Course with \"quotes\""`
-   Newlines: `"Line 1\nLine 2"`
-   Backslashes: `"Path\\to\\file"`
-   Unicode: `"Café ☕ 日本語"`

{% hint style="info" %}
**Missing Variables**: If a variable in the template isn't provided in `templateData`, it renders as an empty string. This allows for optional fields.
{% endhint %}

For more details, see [Dynamic Templates with Mustache](../core-concepts/credentials-and-data/boost-credentials.md#dynamic-templates-with-mustache).
Note that re-running `send` for the same recipient and template will re-send the credential (it is not idempotent). To avoid duplicates, use `learnCard.invoke.getPaginatedBoostRecipients(boostUri)` to reconcile who has already received it before sending.

---

## Next steps

For advanced use cases requiring full control over the inbox issuance process, you can use the `sendCredentialViaInbox` method directly. This is useful when you need:

-   Full configuration control (signing authority, expiration, etc.)
-   To send raw credentials (not boost templates)
-   Custom template IDs for email/SMS

This approach assumes you are familiar with the core concepts of the [Universal Inbox](../core-concepts/network-and-interactions/universal-inbox.md) and have [a valid API token](../sdks/learncard-network/authentication.md#id-2.-using-a-scoped-api-token) & [signing authority](create-signing-authority.md) set up.

## 1. The Simplest Case: Fire and Forget

Your goal is to send a single, verifiable record to a user. You want our system to handle all the complexity of signing the credential and notifying the user.

This is the most common use case, perfect for one-off issuances like a course completion certificate.

**The Recipe:** Make a `POST` request to the `/inbox/issue` endpoint with only two required fields: `recipient` and a _signed_ or _unsigned_ `credential`. An unsigned credential requires [a configured signing authority](create-signing-authority.md).

**Example:**

{% tabs %}
{% tab title="SDK" %}

```javascript
// A bootcamp sending an "Advanced Javascript" achievement to a student.
await learnCard.invoke.sendCredentialViaInbox({
    recipient: {
        type: 'email',
        value: 'student@school.edu',
    },
    credential: {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json',
        ],
        'id': 'http://example.com/credentials/3527',
        'type': ['VerifiableCredential', 'OpenBadgeCredential'],
        'issuer': 'did:key:z6Mku381DztEvDosbgR5RZrvLxMhVgJ33sLVhTnngDuUA5bM',
        'issuanceDate': '2025-07-03T17:54:56.881Z',
        'name': 'Advanced Javascript',
        'credentialSubject': {
            'id': 'did:example:d23dd687a7dc6787646f2eb98d0',
            'type': ['AchievementSubject'],
            'achievement': {
                'id': 'https://example.com/certificates/javascript/advanced',
                'type': ['Achievement'],
                'criteria': {
                    'narrative':
                        'Team members are nominated for this badge by their peers and recognized upon review by Example Corp management.',
                },
                'description': 'This badge recognizes advanced javasript proficiency.',
                'name': 'Advanced Javascript',
            },
        },
    },
});

// Retrieve sent inbox credential
const sentInbox = await learnCard.invoke.getMySentInboxCredentials();
const inboxCredId = sentInbox.records[0].id;

// Retrieve inbox credential
await learnCard.invoke.getInboxCredential(inboxCredId);
```

{% endtab %}

{% tab title="Javascript" %}

```javascript
// A bootcamp sending an "Advanced Javascript" achievement to a student.
const apiKey = 'YOUR_API_KEY';

const response = await fetch('https://network.learncard.com/api/inbox/issue', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        recipient: {
            type: 'email',
            value: 'student@example.com',
        },
        credential: {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json',
            ],
            'id': 'http://example.com/credentials/3527',
            'type': ['VerifiableCredential', 'OpenBadgeCredential'],
            'issuer': 'did:key:z6Mku381DztEvDosbgR5RZrvLxMhVgJ33sLVhTnngDuUA5bM',
            'issuanceDate': '2025-07-03T17:54:56.881Z',
            'name': 'Advanced Javascript',
            'credentialSubject': {
                'id': 'did:example:d23dd687a7dc6787646f2eb98d0',
                'type': ['AchievementSubject'],
                'achievement': {
                    'id': 'https://example.com/certificates/javascript/advanced',
                    'type': ['Achievement'],
                    'criteria': {
                        'narrative':
                            'Team members are nominated for this badge by their peers and recognized upon review by Example Corp management.',
                    },
                    'description': 'This badge recognizes advanced javasript proficiency.',
                    'name': 'Advanced Javascript',
                },
            },
        },
    }),
});

const data = await response.json();
console.log(data);
```

{% endtab %}

{% tab title="cURL" %}

```bash
curl -X POST https://network.learncard.com/api/inbox/issue \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": {
      "type": "email",
      "value": "student@example.com"
    },
    "credential": {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json"
      ],
      "id": "http://example.com/credentials/3527",
      "type": [
        "VerifiableCredential",
        "OpenBadgeCredential"
      ],
      "issuer": "did:key:z6Mku381DztEvDosbgR5RZrvLxMhVgJ33sLVhTnngDuUA5bM",
      "issuanceDate": "2025-07-03T17:54:56.881Z",
      "name": "Advanced Javascript",
      "credentialSubject": {
        "id": "did:example:d23dd687a7dc6787646f2eb98d0",
        "type": [
          "AchievementSubject"
        ],
        "achievement": {
          "id": "https://example.com/certificates/javascript/advanced",
          "type": [
            "Achievement"
          ],
          "criteria": {
            "narrative": "Team members are nominated for this badge by their peers and recognized upon review by Example Corp management."
          },
          "description": "This badge recognizes advanced javasript proficiency.",
          "name": "Advanced Javascript"
        }
      }
    }
  }'
```

{% endtab %}
{% endtabs %}

{% hint style="warning" %}

## Have you configured your default Primary Signing Authority?

If you get an error about a missing signing authority, **ensure you've set one up** [**following this guide**](create-signing-authority.md)**.** When you send an unsigned credential with Universal Inbox, it will use your primary signing authority to sign the credential when a user claims it.&#x20;

If you'd like to use a custom signing authority, or specify it per request:

```javascript
// Note the explicit `signingAuthority` object in the configuration.
await learncardApiClient.post('/inbox/issue', {
    recipient: {
        /* ... */
    },
    credential: {
        /* ...unsigned credential data... */
    },
    configuration: {
        signingAuthority: {
            name: 'my-custom-signer',
            endpoint: 'https://my-vc-api.my-org.com/issue',
        },
    },
});
```

{% endhint %}

**What Happens:**

-   Our system receives the unsigned credential data.
-   It sends a professionally designed email to `student@example.com` with a secure link to claim their record.
-   When the student claims their record, it automatically signs it using your default Primary Signing Authority attached to your profile.

You're done. The rest of the user onboarding and claim process is handled for you.

## 2. Customizing the User Experience

Your goal is to send a credential, but you want the notification email to be branded with your organization's identity to build trust and recognition.

**The Recipe:** Use the optional `configuration.delivery.template.model` object to provide your branding details.

**Example:**

```javascript
// A university sending a branded digital transcript.

await learncardApiClient.post('/inbox/issue', {
    recipient: {
        type: 'email',
        value: 'student@stateu.edu',
    },
    credential: {
        /* ... */
    },
    configuration: {
        delivery: {
            template: {
                model: {
                    issuer: {
                        name: 'State University',
                        logoUrl: 'https://stateu.edu/logo.png', //1024px x 1024px Recommended
                    },
                    credential: {
                        name: 'Official Fall Semester Transcript',
                        type: 'transcript',
                    },
                    recipient: {
                        name: 'John Doe',
                    },
                },
            },
        },
    },
});
```

**What Happens:** The email sent to the student will now feature the State University name and logo prominently, creating a more professional and trustworthy experience.

## 3. Taking Control of Delivery and Status

You have more advanced needs. You might want to deliver the claim link through your own system (e.g., inside your web portal) or need to know precisely when a user has successfully claimed their record.

### **Recipe 3a: Suppressing Delivery**

**Goal:** You want to get a `claimUrl` from our API but prevent us from sending any emails or texts.

**The Recipe:** Set `configuration.delivery.suppress` to `true`.

**Example:**

```javascript
// An HR platform embedding a claim link directly in their onboarding portal.

const response = await learncardApiClient.post('/inbox/issue', {
    recipient: {
        /* ... */
    },
    credential: {
        /* ... */
    },
    configuration: {
        delivery: {
            suppress: true,
        },
    },
});

// Use the claimUrl from the response to create a button in your own UI.
const claimUrl = response.data.claimUrl;
```

### **Recipe 3b: Tracking Status with Webhooks**

**Goal:** You need your system to be notified when a user successfully claims their credential so you can update your internal database.

**The Recipe:** Provide a `configuration.webhookUrl`.

**Example:**

```javascript
// A professional association tracking when a member claims their certificate.

await learncardApiClient.post('/inbox/issue', {
    recipient: {
        /* ... */
    },
    credential: {
        /* ... */
    },
    configuration: {
        webhookUrl: 'https://api.myassociation.org/learncard/hooks',
    },
});
```

**What Happens:** When the user claims their record, our system will send a `POST` request to your webhook URL with a payload containing the `issuanceId`, a `status` of `CLAIMED`, and the user's permanent `recipientDid`.

## 4. Advanced: Building an Ongoing Relationship

{% hint style="warning" %}
**This feature is currently in beta.** _Please reach out the the LearnCard team if you'd like early access!_
{% endhint %}

**Goal:** You plan to send credentials to the same user repeatedly over time (e.g., skill badges, course completions). You want to ask for their permission once, so future records can be sent directly to their passport without them needing to claim each one individually.

**The Recipe:** On the _first_ issuance, include the `consentRequest` object.

**Example:**

```javascript
// A corporate learning platform that will issue multiple skill badges over time.

await learncardApiClient.post('/inbox/issue', {
    recipient: { type: 'email', value: 'employee@acme.com' },
    credential: {
        /* ... */
    },

    // ONLY AVAILABLE IN BETA - WILL FAIL IN PRODUCTION
    consentRequest: {
        scopes: ['credential:write:Badge', 'credential:write:SkillAssertion'],
        description:
            'Allow Acme Corp to automatically add new skill badges and certificates to your LearnCard Passport.',
    },
    configuration: {
        webhookUrl: 'https://api.acme.com/hooks/learncard',
    },
});
```

**What Happens:**

1. The employee claims their first badge as normal.
2. Immediately after, a prompt appears asking for their permission based on your `description`.
3. If they allow it, your webhook receives a notification that includes a `contractId`.
4. For all future issuances to this user, credentials will appear directly in their passport, friction-free.
- Know whether it was claimed → [Know When a Credential Is Claimed](../tutorials/listen-to-webhooks.md)
- Take one back → [Revoke or Update a Credential](revoke-or-update-a-credential.md)
- Design your own credential → [Building Verifiable Credentials](../core-concepts/credentials-and-data/building-verifiable-credentials.md)
- Lower-level inbox control (per-issuance signer, custom claim flows) → [Universal Inbox API](../sdks/learncard-network/universal-inbox-api.md)
