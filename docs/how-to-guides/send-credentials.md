---
description: 'How-To Guide: Sending and issuing credentials with LearnCard'
---

# Send & Issue Credentials

This guide provides practical, step-by-step recipes for sending credentials. We'll start with the simplest possible use case and progressively add more powerful configurations.

---

## Quick Start: The `send` Method (Recommended)

The `send` method is the simplest and most ergonomic way to send credentials to recipients. It handles credential issuance, signing, and delivery in a single call.

**The `send` method automatically detects your recipient type:**

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
    templateUri: 'urn:lc:boost:abc123',
    contractUri: 'urn:lc:contract:xyz789', // Optional: link to consent contract
});
```

{% endtab %}
{% endtabs %}

### REST API (`POST /api/send`)

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
    },
    body: JSON.stringify({
        type: 'boost',
        recipient: 'student@example.com',
        signedCredential: mySignedVC, // A previously signed VC object
    }),
});

const result = await response.json();
console.log(result);
// { type: 'boost', uri: 'urn:lc:boost:...', inbox: { issuanceId: '...', status: 'PENDING' } }
```

{% endtab %}
{% endtabs %}

{% hint style="info" %}
**All SDK parameters work in the REST API too** — `templateUri`, `template`, `signedCredential`, `templateData`, `options`, and `contractUri` are all supported in the JSON body.
{% endhint %}

### How It Works

1. **Detects recipient type** - Automatically determines if recipient is email, phone, DID, or profile ID
2. **Routes appropriately** - Uses direct send for profiles/DIDs, Universal Inbox for email/phone
3. **Prepares the credential** - Uses your template, creates a new template on-the-fly, or uses your pre-signed credential as-is
4. **Signs the credential** - Skips signing if you provided a `signedCredential`; otherwise uses client-side signing if available, or falls back to your registered signing authority
5. **Delivers the credential** - Direct delivery or sends claim email/SMS based on recipient type
6. **Auto-delivery for verified users** - If the email/phone is already verified and linked to a LearnCard profile, the credential is delivered directly to their wallet without requiring them to click a claim link

{% hint style="info" %}
**Pre-Signed Credentials**: When you provide only `signedCredential` (without `templateUri` or `template`), the system automatically creates a template from your credential. This is ideal when you've already signed the credential yourself and don't need the server to sign it. Your original proof is preserved through the entire flow, including email inbox claims.
{% endhint %}

### Guardian-Gated Credentials

To require guardian (parent) approval before a minor can claim a credential, add `guardianEmail` to `options`:

```typescript
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'student@school.edu',
    templateUri: 'urn:lc:boost:abc123',
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
    uri: string; // URI of the boost template
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
        claimUrl?: string; // Present when suppressDelivery=true
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

### Options (for Email/Phone Recipients)

When sending to email or phone recipients, you can provide additional options:

```typescript
options: {
    webhookUrl?: string;       // URL to receive claim notifications
    suppressDelivery?: boolean; // If true, returns claimUrl without sending email/SMS
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
- Creates a `RELATED_TO` relationship between new boosts and the contract

{% endhint %}

{% hint style="info" %}
**Email Verification**: When a recipient claims a credential via an email claim link, their email address becomes a **verified contact method** linked to their LearnCard profile. This means:

- Future credentials sent to that email will be **auto-delivered** directly to their wallet
- No claim link is needed for subsequent issuances
- The issuer receives `status: 'ISSUED'` instead of `status: 'PENDING'`

{% endhint %}

---

## Tracking Boost Recipients

You can track which users have received credentials from a specific boost template using `getPaginatedBoostRecipients`:

```typescript
// Get all recipients of a boost
const { records } = await learnCard.invoke.getPaginatedBoostRecipients(boostUri);

console.log(records);
// [
//   { to: { profileId: 'alice-123', did: 'did:key:z6Mk...' }, received: '2025-01-09T...' },
//   { to: { profileId: 'bob-456', did: 'did:key:z6Mk...' }, received: '2025-01-08T...' },
// ]
```

This is useful for:

- **Auditing**: See who has received a specific credential
- **Preventing duplicates**: Check if a user already received a boost before sending
- **Analytics**: Track issuance metrics for your credentials

---

## Dynamic Templates with `templateData`

Use Mustache-style templates to personalize credentials with unique data for each recipient. This is perfect for issuing the same type of credential (like course completions) with recipient-specific details.

For a full guide on creating templated boosts and sending them with personalized data, see [Dynamic Templates with Mustache Variables](../tutorials/create-a-boost.md#dynamic-templates-with-mustache-variables).

---

## Need more control?

The `send` method covers the vast majority of issuance needs. If you need lower-level control over the inbox issuance process (like custom delivery suppression, custom branding per issuance, or webhook-driven status tracking), check out the [Universal Inbox API](../sdks/learncard-network/universal-inbox-api.md).

---

## Next steps

- Design a custom credential → [Create a Credential](../tutorials/create-a-credential.md)
- Issue at scale with Boosts → [Create a Boost](../tutorials/create-a-boost.md)
- Know when it's claimed → [Listen to Webhooks](../tutorials/listen-to-webhooks.md)
- Verify credentials → [Verify Credentials](../tutorials/verify-credentials.md)
- Guardian approval for minors → [Guardian-Gated Credentials](implement-flows/guardian-gated-credentials.md)
