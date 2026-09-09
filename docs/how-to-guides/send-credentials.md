---
description: 'How-To Guide: Sending and issuing credentials with LearnCard'
---

# Send & Issue Credentials

---

**~10 minutes · Needs:** a seed or API token from the [Quickstart](../quick-start/your-first-integration.md).

## Quick Start: The `send` Method (Recommended)

The `send` method handles credential issuance, signing, and delivery in a single call.

The `send` method detects your recipient type:

- **Profile ID** → Direct delivery to their LearnCard
- **DID** → Direct delivery via DID resolution
- **Email** → Routes through Universal Inbox (sends claim email)
- **Phone** → Routes through Universal Inbox (sends claim SMS)

### Prerequisites

- LearnCard SDK initialized with `network: true`
- A [signing authority](create-signing-authority.md) configured (for server-side signing) **OR** local key material available (for client-side signing) **OR** a pre-signed credential (no signing authority needed)

{% hint style="info" %}
**Issuer Profiles**: Before sending, you need a profile on the network. Use `createProfile` for a person, or `createServiceProfile` for an organization, app, or bot issuer. See [Network Profiles](../core-concepts/identities-and-keys/network-profiles.md).
{% endhint %}

### Basic Usage

{% hint style="info" %}
Template URIs look like `lc:network:<host>/trpc:boost:<id>`. Always use the value returned by `createBoost` or `send` (`result.uri`) — don't construct them.
{% endhint %}

{% tabs %}
{% tab title="Send to Profile ID or DID" %}

```typescript
// Send to an existing LearnCard user
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'recipient-profile-id', // or 'did:key:z6Mk...'
    templateUri: 'lc:network:network.learncard.com/trpc:boost:abc123',
});

console.log(result.credentialUri); // URI of the sent credential
console.log(result.uri); // URI of the credential template used
```

{% endtab %}

{% tab title="Send to Email" %}

```typescript
// Send to someone via email (they'll get a claim link)
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'student@example.com', // Auto-detected as email
    templateUri: 'lc:network:network.learncard.com/trpc:boost:abc123',
    options: {
        branding: {
            issuerName: 'My Organization',
            issuerLogoUrl: 'https://example.com/logo.png',
            recipientName: 'John Doe',
        },
        webhookUrl: 'https://api.example.com/webhooks/claimed',
    },
});

console.log(result.inbox?.claimUrl); // Present when inbox.status is 'PENDING' (new recipient)
console.log(result.inbox?.issuanceId); // Issuance tracking ID
```

{% endtab %}

{% tab title="Send to Phone" %}

```typescript
// Send to someone via SMS
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: '+15551234567', // Auto-detected as phone
    templateUri: 'lc:network:network.learncard.com/trpc:boost:abc123',
    options: {
        suppressDelivery: true, // Skip the SMS — inbox.claimUrl is still returned; deliver it yourself
    },
});

// Use result.inbox.claimUrl in your own notification
```

{% endtab %}

{% tab title="Creating a New Credential Template On-the-Fly" %}

```typescript
// Send by creating a new credential template from an unsigned credential
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'recipient-profile-id',
    template: {
        credential: {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
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
        },
    },
});

const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'recipient@example.com', // or profile ID, DID
    signedCredential,
});
```

{% endtab %}

{% tab title="With ConsentFlow Contract" %}

```typescript
// Send through a consent flow contract
// Automatically routes via consent terms if the recipient has consented
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'recipient-profile-id',
    templateUri: 'lc:network:network.learncard.com/trpc:boost:abc123',
    contractUri: 'lc:network:network.learncard.com/trpc:contract:abc123', // Optional: link to consent contract
});
```

{% endtab %}
{% endtabs %}

### REST API (`POST /api/send`)

The `send` method is available as a REST endpoint. Authenticate with `Authorization: Bearer <API token>`, using a token from an auth grant with `boosts:write` scope (create one in the Developer Portal, or via `addAuthGrant` + `getAPITokenForAuthGrant`).

{% tabs %}
{% tab title="cURL: Send with Template" %}

```bash
curl -X POST https://network.learncard.com/api/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "boost",
    "recipient": "student@example.com",
    "templateUri": "lc:network:network.learncard.com/trpc:boost:abc123"
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
    },
    body: JSON.stringify({
        type: 'boost',
        recipient: 'student@example.com',
        signedCredential: mySignedVC, // A previously signed VC object
    }),
});

const result = await response.json();
console.log(result);
// { type: 'boost', uri: 'lc:network:network.learncard.com/trpc:boost:...', inbox: { issuanceId: '...', status: 'PENDING' } }
```

{% endtab %}
{% endtabs %}

{% hint style="info" %}
**All SDK parameters work in the REST API too** — `templateUri`, `template`, `signedCredential`, `templateData`, `options`, and `contractUri` are all supported in the JSON body.
{% endhint %}

### Sign locally, send over HTTP

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

### How It Works

1. **Detects recipient type**: email, phone, DID, or profile ID.
2. **Routes**: direct send for profiles/DIDs, Universal Inbox for email/phone.
3. **Prepares the credential**: uses your template, creates a new template, or uses your pre-signed credential.
4. **Signs the credential**: skips signing if you provided a `signedCredential`; otherwise uses client-side signing or your registered signing authority.
5. **Delivers the credential**: direct delivery or sends claim email/SMS.
6. **Auto-delivery**: if the email/phone is verified and linked to a LearnCard profile, the credential is delivered directly to their wallet.

{% hint style="info" %}
**Pre-Signed Credentials**: When you provide only `signedCredential` (without `templateUri` or `template`), the system creates a template from your credential. Your original proof is preserved through the entire flow, including email inbox claims.
{% endhint %}

### Guardian-Gated Credentials

To require guardian (parent) approval before a minor can claim a credential, add `guardianEmail` to `options`:

```typescript
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'student@school.edu',
    templateUri: 'lc:network:network.learncard.com/trpc:boost:abc123',
    options: {
        guardianEmail: 'parent@example.com',
    },
});

console.log(result.inbox?.guardianStatus); // 'AWAITING_GUARDIAN'
```

The guardian receives an approval email with an OTP challenge. The student cannot claim the credential until the guardian approves. See [Guardian-Gated Credentials](implement-flows/guardian-gated-credentials.md) for the full guide.

### Response

```typescript
interface SendResponse {
    type: 'boost';
    credentialUri: string; // URI of the issued credential
    uri: string; // URI of the credential template
    activityId: string; // Links to the activity lifecycle for this issuance

    // Only present when sent to email/phone recipients
    inbox?: {
        issuanceId: string; // Tracking ID for this issuance
        status:
            | 'PENDING' // Waiting to be claimed
            | 'ISSUED' // Auto-delivered to verified user
            | 'EXPIRED' // Claim link expired
            | 'DELIVERED' // Delivered to inbox
            | 'CLAIMED'; // Claimed via claim link
        claimUrl?: string; // Present when status is 'PENDING'; not tied to suppressDelivery
        guardianStatus?:
            // Present when guardianEmail was specified
            | 'AWAITING_GUARDIAN' // Waiting for guardian approval
            | 'GUARDIAN_APPROVED' // Guardian approved
            | 'GUARDIAN_REJECTED'; // Guardian rejected
    };
}
```

{% hint style="success" %}
**Auto-Delivery**: When `status` is `ISSUED`, the credential was automatically delivered to the recipient's wallet because their email/phone was already verified. No claim link was needed!
{% endhint %}

**Response conditions**

| `inbox.status` | `claimUrl` present? | What was delivered                                                                                                                        |
| :------------- | :------------------ | :---------------------------------------------------------------------------------------------------------------------------------------- |
| `PENDING`      | Yes                 | New recipient — a claim email/SMS was sent, unless `options.suppressDelivery: true` (then nothing was sent; deliver `claimUrl` yourself). |
| `ISSUED`       | No                  | Recipient already had a verified email/phone linked to a LearnCard profile — the credential was auto-delivered directly to their wallet.  |

### Options (for Email/Phone Recipients)

When sending to email or phone recipients, you can provide additional options:

```typescript
options: {
    webhookUrl?: string;       // Receives ISSUANCE_DELIVERED and ISSUANCE_CLAIMED events — see Listen to Webhooks
    suppressDelivery?: boolean; // Skips the email/SMS only — the inbox record and claimUrl are created either way
    branding?: {
        issuerName?: string;    // Your organization name
        issuerLogoUrl?: string; // Your logo URL
        credentialName?: string; // Display name for the credential
        recipientName?: string;  // Recipient's name for personalization
    };
}
```

{% hint style="info" %}
**Contract Integration**: When you provide a `contractUri`, the method automatically:

- Checks if the recipient has consented to the contract
- Routes the credential through the consent flow if terms exist
- Creates a `RELATED_TO` relationship between new credential templates and the contract

{% endhint %}

{% hint style="info" %}
**Email Verification**: When a recipient claims a credential via an email claim link, their email address becomes a **verified contact method** linked to their LearnCard profile. This means:

- Future credentials sent to that email will be **auto-delivered** directly to their wallet
- No claim link is needed for subsequent issuances
- The issuer receives `status: 'ISSUED'` instead of `status: 'PENDING'`

{% endhint %}

---

## Tracking Credential Template Recipients

Track which users have received credentials from a specific credential template using `getPaginatedBoostRecipients`:

```typescript
// Get all recipients of a credential template
const { records } = await learnCard.invoke.getPaginatedBoostRecipients(boostUri);

console.log(records);
// [
//   { to: { profileId: 'alice-123', did: 'did:key:z6Mk...' }, received: '2025-01-09T...' },
//   { to: { profileId: 'bob-456', did: 'did:key:z6Mk...' }, received: '2025-01-08T...' },
// ]
```

Use this for auditing, preventing duplicates, and tracking issuance metrics.

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

## Need more control?

For lower-level control over the inbox issuance process (custom delivery suppression, custom branding per issuance, or webhook-driven status tracking), see the [Universal Inbox API](../sdks/learncard-network/universal-inbox-api.md).

---

## Next steps

- Design a custom credential → [Building Verifiable Credentials](../core-concepts/credentials-and-data/building-verifiable-credentials.md)
- Issue at scale with credential templates → [Issue at scale with templates](#issue-at-scale-with-templates)
- Know when it's claimed → [Listen to Webhooks](../tutorials/listen-to-webhooks.md)
- Verify credentials → [Verify Credentials](../tutorials/verify-credentials.md)
- Guardian approval for minors → [Guardian-Gated Credentials](implement-flows/guardian-gated-credentials.md)
