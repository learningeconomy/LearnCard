---
description: Lower-level inbox issuance API — use when you need control that send() doesn't expose.
---

# Universal Inbox API

The `send()` method is the recommended path for issuing credentials. However, for advanced use cases requiring full control over the inbox issuance process, you can use the `sendCredentialViaInbox` method directly.

You might drop down to this API when you need:

- Custom delivery suppression (e.g., generating a claim link without sending an email)
- Custom branding or configuration per issuance
- Webhook-driven status tracking or an ongoing consent relationship

This approach assumes you are familiar with the core concepts of the [Universal Inbox](../../core-concepts/network-and-interactions/universal-inbox.md) and have [a valid API token](authentication.md#id-2.-using-a-scoped-api-token) & [signing authority](../../how-to-guides/create-signing-authority.md) set up.

### About the examples

The REST examples below use a tiny helper so each recipe stays short. It's plain `fetch` against your network's base URL with a [scoped API token](authentication.md):

```javascript
const API_BASE = 'https://network.learncard.com/api';

const learncardApiClient = {
    post: async (path, body) => {
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.LEARNCARD_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`${path} failed: ${res.status} ${await res.text()}`);
        return res.json();
    },
};
```

### The Simplest Case: Fire and Forget

Your goal is to send a single, verifiable record to a user. You want our system to handle all the complexity of signing the credential and notifying the user.

This is the most common use case, perfect for one-off issuances like a course completion certificate.

**The Recipe:** Make a `POST` request to the `/inbox/issue` endpoint with only two required fields: `recipient` and a _signed_ or _unsigned_ `credential`. An unsigned credential requires [a configured signing authority](../../how-to-guides/create-signing-authority.md).

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
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
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
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
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
        "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
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

### Have you configured your default Primary Signing Authority?

If you get an error about a missing signing authority, **ensure you've set one up** [**following this guide**](../../how-to-guides/create-signing-authority.md)**.** When you send an unsigned credential with Universal Inbox, it will use your primary signing authority to sign the credential when a user claims it.

If you'd like to use a custom signing authority, or specify it per request:

```javascript
// Note the explicit `signingAuthority` object in the configuration.
await learncardApiClient.post('/inbox/issue', {
    recipient: {/* ... */},
    credential: {/* ...unsigned credential data... */},
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

- Our system receives the unsigned credential data.
- It sends a professionally designed email to `student@example.com` with a secure link to claim their record.
- When the student claims their record, it automatically signs it using your default Primary Signing Authority attached to your profile.

You're done. The rest of the user onboarding and claim process is handled for you.

### Customizing the User Experience

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
    credential: {/* ... */},
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

### Taking Control of Delivery and Status

You have more advanced needs. You might want to deliver the claim link through your own system (e.g., inside your web portal) or need to know precisely when a user has successfully claimed their record.

#### Recipe 3a: Suppressing Delivery

**Goal:** You want to get a `claimUrl` from our API but prevent us from sending any emails or texts.

**The Recipe:** Set `configuration.delivery.suppress` to `true`.

**Example:**

```javascript
// An HR platform embedding a claim link directly in their onboarding portal.

const response = await learncardApiClient.post('/inbox/issue', {
    recipient: {/* ... */},
    credential: {/* ... */},
    configuration: {
        delivery: {
            suppress: true,
        },
    },
});

// Use the claimUrl from the response to create a button in your own UI.
const claimUrl = response.data.claimUrl;
```

#### Recipe 3b: Tracking Status with Webhooks

**Goal:** You need your system to be notified when a user successfully claims their credential so you can update your internal database.

**The Recipe:** Provide a `configuration.webhookUrl`.

**Example:**

```javascript
// A professional association tracking when a member claims their certificate.

await learncardApiClient.post('/inbox/issue', {
    recipient: {/* ... */},
    credential: {/* ... */},
    configuration: {
        webhookUrl: 'https://api.myassociation.org/learncard/hooks',
    },
});
```

**What Happens:** When the user claims their record, our system will send a `POST` request to your webhook URL with a payload containing the `issuanceId`, a `status` of `CLAIMED`, and the user's permanent `recipientDid`.

### Want an ongoing relationship instead of one-off sends?

If you'll issue to the same people repeatedly, have them connect once through a [ConsentFlow](../../tutorials/create-a-consentflow.md) — after that, credentials land directly in their LearnCard with no email or claim link. See [Connect Your Website or Game](../../how-to-guides/connect-systems/connect-a-website.md).
