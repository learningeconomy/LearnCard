---
description: 'Tutorial: Create reusable credential templates and issue them at scale.'
---

# Issue at Scale with Boosts

Welcome! This tutorial guides you through creating a "Boost" with LearnCard. Boosts are an enhanced way to manage and issue Verifiable Credentials (VCs), especially when you want to issue a similar credential to multiple people or manage it as a distinct "template."

## What is a Boost, and Why Use It?

You already know how to [Design a Custom Credential](create-a-credential.md). That's great for one-off situations.

A **Boost** takes this a step further. Think of a Boost as a **master template or a blueprint for a specific type of credential**.

- **Direct VC:** Like handwriting a single invitation.
- **Boost:** Like designing a beautiful invitation template that you can print and send to many guests. Each guest gets a personalized copy (their own VC instance), but they all originate from your master "Boost" template.

**Use a Boost instead of sending VCs directly when you want to:**

- **Issue the same type of credential to multiple people:** e.g., a "Course Completion" certificate for all students who pass.
- **Track recipients centrally:** Easily see a list of everyone who has received a credential derived from a specific Boost.
- **Manage a credential type:** Update metadata or display properties of the Boost, which can influence future issuances.
- **Delegate issuance:** Grant permissions to others to issue credentials based on a Boost you created.

_(See the diagrams below for a visual comparison)_

**Diagram 1: Sending Individual VCs** _(Covered in the previous tutorial)_

```mermaid
graph LR
    subgraph Issuer Ops
        Urmila["Urmila (Issuer Profile)"]
    end

    subgraph Credentials
        VC1["Book Club ID<br/>for Ted<br/>(Credential)"]
        VC2["Course Completion<br/>for Juniper<br/>(Credential)"]
    end

    subgraph Recipients
        Ted["Ted (Recipient Profile)"]
        Juniper["Juniper (Recipient Profile)"]
    end

    Urmila -- "Issues & Sends VC1" --> VC1
    VC1 -- "CREDENTIAL_RECEIVED" --> Ted

    Urmila -- "Issues & Sends VC2" --> VC2
    VC2 -. "Sent, maybe not claimed" .-> Juniper

    linkStyle 0 stroke-width:2px,fill:none,stroke:green;
    linkStyle 1 stroke-width:2px,fill:none,stroke:blue;
    linkStyle 2 stroke-width:2px,fill:none,stroke:green;
    linkStyle 3 stroke-width:2px,fill:none,stroke:blue,stroke-dasharray: 5 5;
```

{% hint style="info" %}
In this model, each credential is a distinct, standalone item.
{% endhint %}

**Diagram 2: Sending Credentials via a Boost** _(Covered in this tutorial)_

```mermaid
graph LR
    subgraph Issuer Ops
        UrmilaB["Urmila (Issuer Profile)"]
    end

    subgraph BoostDefinition [" "]
        style BoostDefinition fill:#f0f0f0,stroke:#ccc
        MasterBoost["'Book Club ID'<br/>BOOST<br/>(Template)"]
    end

    subgraph CredentialInstances [" "]
      style CredentialInstances fill:#f9f9f9,stroke:#ddd
        VC_Ted["Book Club ID<br/>for Ted<br/>(Credential Instance)"]
        VC_Juniper["Book Club ID<br/>for Juniper<br/>(Credential Instance)"]
    end

    subgraph Recipients
        TedB["Ted (Recipient Profile)"]
        JuniperB["Juniper (Recipient Profile)"]
    end

    UrmilaB -- "CREATED_BY" --> MasterBoost

    MasterBoost -- "INSTANCE_OF" --> VC_Ted
    UrmilaB -- "Issues & Sends instance" --> VC_Ted
    VC_Ted -- "CREDENTIAL_RECEIVED" --> TedB

    MasterBoost -- "INSTANCE_OF" --> VC_Juniper
    UrmilaB -- "Issues & Sends instance" --> VC_Juniper
    VC_Juniper -. "Sent, maybe not claimed" .-> JuniperB

    linkStyle 0 stroke-width:2px,fill:none,stroke:purple;
    linkStyle 1 stroke-width:2px,fill:none,stroke:orange;
    linkStyle 2 stroke-width:2px,fill:none,stroke:green;
    linkStyle 3 stroke-width:2px,fill:none,stroke:blue;
    linkStyle 4 stroke-width:2px,fill:none,stroke:orange;
    linkStyle 5 stroke-width:2px,fill:none,stroke:green;
    linkStyle 6 stroke-width:2px,fill:none,stroke:blue,stroke-dasharray: 5 5;
```

{% hint style="success" %}
Here, Urmila creates one "Book Club ID" Boost. When she sends it to Ted and Juniper, they each receive a credential that is an _instance of_ that main Boost.
{% endhint %}

## Prerequisites

1. **Node.js 20+** installed.
2. **A basic LearnCard project** set up (from the [Quickstart](../quick-start/your-first-integration.md)).
3. **A Signing Authority:** this tutorial sends templates to email addresses, which LearnCard signs on your behalf — so register one first: [Set Up a Signing Authority](../how-to-guides/create-signing-authority.md). (Sending a credential you signed yourself, as in the Quickstart, doesn't need this.)

---

## Part 1: Setting Up Your Issuer Environment

Create `issueBoost.mjs` and initialize the LearnCard SDK:

```javascript
import 'dotenv/config';
import { initLearnCard } from '@learncard/init';

const issuerSeed = process.env.SECURE_SEED;
if (!issuerSeed) throw new Error('Missing SECURE_SEED in .env');

const learnCard = await initLearnCard({
    seed: issuerSeed,
    network: true,
});

const profileId = process.env.PROFILE_ID;
let profile = await learnCard.invoke.getProfile(profileId);
if (!profile) {
    await learnCard.invoke.createServiceProfile({
        profileId,
        displayName: process.env.PROFILE_NAME || 'Tech Meetup HQ',
    });
}
```

{% hint style="info" %}
**Profiles:** `createProfile` creates a standard user profile (a person). `createServiceProfile` creates an organization or app issuer. Learn more about [Network Profiles](../core-concepts/identities-and-keys/network-profiles.md).
{% endhint %}

---

## Part 2: Defining the Credential Template

This is the "template" for the credential that will be issued each time you send this Boost. Notice we don't specify the recipient's DID (`credentialSubject.id`) or the `issuer` — the network fills those in when you send the Boost.

```javascript
const meetupAttendeeTemplate = {
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    name: 'Monthly Tech Innovators Meetup',
    credentialSubject: {
        type: ['AchievementSubject'],
        achievement: {
            type: ['Achievement'],
            achievementType: 'Badge',
            name: 'Monthly Tech Innovators Meetup',
            description: 'Tech Innovators Meetup is a monthly gathering of tech enthusiasts.',
            criteria: {
                narrative: 'Awarded for attending the Monthly Tech Innovators Meetup.',
            },
            image: {
                id: 'https://cdn.filestackcontent.com/FtOrbWhiTTKb818btGlu',
                type: 'Image',
            },
        },
    },
};
```

---

## Part 3: Creating the Boost

Now, create the Boost on the LearnCard Network using the template content.

```javascript
const boostMetadata = {
    name: 'Tech Innovators Meetup - May 2025 Attendee',
    description: 'Recognizes attendance at the May 2025 Tech Innovators Meetup.',
    category: 'Social Badge',
};

console.log('Creating Boost template...');
const boostUri = await learnCard.invoke.createBoost(meetupAttendeeTemplate, boostMetadata);
console.log('Boost Created! URI:', boostUri);
```

When you run this, you get a `boostUri`. This URI is the identifier for your Boost template.

---

## Part 4: Sending the Boost to Multiple Recipients

With your `boostUri`, you can send it to your attendees. The `send` method automatically populates the recipient, signs the credential using your signing authority, and delivers it.

```javascript
const attendees = ['alice@example.com', 'bob@example.com'];

for (const email of attendees) {
    console.log(`Sending Boost to ${email}...`);
    const result = await learnCard.invoke.send({
        type: 'boost',
        recipient: email, // email, phone, profile ID, or DID — auto-detected
        templateUri: boostUri,
    });

    if (result.inbox?.status === 'PENDING') {
        console.log(`  Sent. Claim link: ${result.inbox.claimUrl}`);
    } else {
        console.log(`  Delivered to wallet.`);
    }
}
```

{% hint style="info" %}
**Lower-level alternative:** You can also use `learnCard.invoke.sendBoost(profileId, boostUri)` if you only have a LearnCard Profile ID and don't need the unified `send` method's email/phone delivery features.
{% endhint %}

---

## Dynamic Templates with Mustache Variables

Want to personalize credentials with unique data for each recipient? Boosts support **Mustache-style templating** that lets you inject dynamic values at issuance time.

### Creating a Templated Boost

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

### Sending with Personalized Data

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

The resulting credential will have all placeholders replaced:

- `{{courseName}}` → `Web Development 101`
- `{{studentName}}` → `Alice Smith`
- `{{grade}}` → `A`

{% hint style="info" %}
**Missing Variables**: If you don't provide a value for a variable, it's rendered as an empty string. This is useful for optional fields.
{% endhint %}

For more details on dynamic templates, see [Dynamic Templates with Mustache](../core-concepts/credentials-and-data/boost-credentials.md#dynamic-templates-with-mustache).

---

## Summary & What's Next

You've learned how to:
✅ Understand the value of Boosts for reusable credential templates.
✅ Define the content for a Boost template.
✅ Create a Boost using the LearnCard SDK.
✅ Send instances of that Boost to multiple recipients using `send()`.
✅ Use dynamic templates with Mustache variables for personalized credentials.

Boosts are a powerful way to manage credentialing at scale. From here, you can explore:

- **Retrieving Boost Recipients:** Use `learnCard.invoke.getPaginatedBoostRecipients(boostUri)` to see who has been issued a credential from this Boost.
- **Boost Permissions:** Control who can edit, issue, or manage your Boosts.
- **Default Permissions:** Use `defaultPermissions` to create open Boosts that anyone can issue. (See [Default Permissions](../core-concepts/credentials-and-data/boost-credentials.md#default-permissions)).
