---
description: 'How-To Guide: Sending Credentials with LearnCard'
---

# Send Credentials

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

* LearnCard SDK initialized with `network: true`
* A [signing authority](create-signing-authority.md) configured (for server-side signing) **OR** local key material available (for client-side signing)

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
console.log(result.uri);           // URI of the boost template used
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

console.log(result.inbox?.claimUrl);   // Claim URL (if suppressDelivery=true)
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
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
                "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json"
            ],
            "type": ["VerifiableCredential", "OpenBadgeCredential"],
            "name": "Course Completion",
            "credentialSubject": {
                "type": ["AchievementSubject"],
                "achievement": {
                    "type": ["Achievement"],
                    "name": "Web Development 101",
                    "description": "Completed the Web Development fundamentals course.",
                    "criteria": {
                        "narrative": "Successfully completed all modules and passed the final assessment."
                    }
                }
            }
        },
        name: 'Web Development 101 Certificate',
        category: 'Achievement',
    },
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

### How It Works

1. **Detects recipient type** - Automatically determines if recipient is email, phone, DID, or profile ID
2. **Routes appropriately** - Uses direct send for profiles/DIDs, Universal Inbox for email/phone
3. **Prepares the credential** - Uses your template or creates a new boost on-the-fly
4. **Signs the credential** - Uses client-side signing if available, otherwise falls back to your registered signing authority
5. **Delivers the credential** - Direct delivery or sends claim email/SMS based on recipient type

### Response

```typescript
interface SendResponse {
    type: 'boost';
    credentialUri: string; // URI of the issued credential
    uri: string;           // URI of the boost template
    
    // Only present when sent to email/phone recipients
    inbox?: {
        issuanceId: string;           // Tracking ID for this issuance
        status: 'pending' | 'claimed'; // Current claim status
        claimUrl?: string;             // Present when suppressDelivery=true
    };
}
```

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

---

## Alternative: Direct Universal Inbox API

For advanced use cases requiring full control over the inbox issuance process, you can use the `sendCredentialViaInbox` method directly. This is useful when you need:

- Full configuration control (signing authority, expiration, etc.)
- To send raw credentials (not boost templates)
- Custom template IDs for email/SMS

This approach assumes you are familiar with the core concepts of the [Universal Inbox](../core-concepts/network-and-interactions/universal-inbox.md) and have [a valid API token](../sdks/learncard-network/authentication.md#id-2.-using-a-scoped-api-token) & [signing authority](create-signing-authority.md) set up.

## 1. The Simplest Case: Fire and Forget

Your goal is to send a single, verifiable record to a user. You want our system to handle all the complexity of signing the credential and notifying the user.

This is the most common use case, perfect for one-off issuances like a course completion certificate.

**The Recipe:** Make a `POST` request to the `/inbox/issue` endpoint with only two required fields: `recipient` and a _signed_ or _unsigned_ `credential`.  An unsigned credential requires [a configured signing authority](create-signing-authority.md).

**Example:**

{% tabs %}
{% tab title="SDK" %}
```javascript
// A bootcamp sending an "Advanced Javascript" achievement to a student.
await learnCard.invoke.sendCredentialViaInbox({ 
  recipient: { 
    type: 'email', 
    value: 'student@school.edu' 
  }, 
  credential: {
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
})

// Retrieve sent inbox credential
const sentInbox = await learnCard.invoke.getMySentInboxCredentials()
const inboxCredId = sentInbox.records[0].id

// Retrieve inbox credential
await learnCard.invoke.getInboxCredential(inboxCredId)
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
  recipient: { /* ... */ },
  credential: { /* ...unsigned credential data... */ },
  configuration: {
    signingAuthority: {
      name: 'my-custom-signer',
      endpoint: 'https://my-vc-api.my-org.com/issue'
    }
  }
});
```
{% endhint %}

**What Happens:**

* Our system receives the unsigned credential data.
* It sends a professionally designed email to `student@example.com` with a secure link to claim their record.
* When the student claims their record, it automatically signs it using your default Primary Signing Authority attached to your profile.

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
  credential: { /* ... */ },
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
            name: 'John Doe'
          }
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
  recipient: { /* ... */ },
  credential: { /* ... */ },
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
  recipient: { /* ... */ },
  credential: { /* ... */ },
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
  credential: { /* ... */ },
  
  // ONLY AVAILABLE IN BETA - WILL FAIL IN PRODUCTION
  consentRequest: {
    scopes: ['credential:write:Badge', 'credential:write:SkillAssertion'],
    description: 'Allow Acme Corp to automatically add new skill badges and certificates to your LearnCard Passport.',
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
