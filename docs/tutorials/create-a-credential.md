---
description: 'Tutorial: Design and Send a Custom Digital Credential'
---

# Design a Custom Credential

The [Quickstart](../quick-start/your-first-integration.md) showed you how to send a minimal badge in one command. This tutorial teaches what the Quickstart skipped: designing a real credential with an image, description, criteria, and custom fields, then signing and sending it.

Think of a Verifiable Credential (VC) as a secure, digital certificate or badge that proves an achievement or skill.

{% embed url="https://www.figma.com/board/DPGBfPLlss2K6KmDLCN3ul/LearnCard-Docs?node-id=131-661&p=f&t=fk1wywzjUFmakXJE-0" %}

## Prerequisites

1. **Node.js 20+** installed.
2. **A basic LearnCard project** set up (if you haven't, run the [Quickstart](../quick-start/your-first-integration.md) first to get your `.env` file and `@learncard/init` installed).
3. **Basic Understanding:** Read [What is a Verifiable Credential?](../core-concepts/credentials-and-data/verifiable-credentials-vcs.md) and [What is a DID?](../core-concepts/identities-and-keys/decentralized-identifiers-dids.md).

---

## Part 1: Setting Up Your Issuer Environment

Your computer acts as the "Issuer" — the entity creating and sending the credential.

Create a new file `issueCredential.mjs` (or `.ts` if using TypeScript) and initialize the LearnCard SDK:

```javascript
import { randomUUID } from 'node:crypto';
import { initLearnCard } from '@learncard/init';

// 1. Initialize LearnCard with your secure seed
const issuerSeed = process.env.SECURE_SEED;
if (!issuerSeed) throw new Error('Missing SECURE_SEED in .env');

const learnCard = await initLearnCard({
    seed: issuerSeed,
    network: true,
});

console.log('Issuer DID:', learnCard.id.did());

// 2. Ensure your issuer has a Service Profile
const profileId = process.env.PROFILE_ID;
if (!profileId) throw new Error('Missing PROFILE_ID in .env');

let profile = await learnCard.invoke.getProfile(profileId);
if (!profile) {
    console.log(`Creating service profile: ${profileId}`);
    await learnCard.invoke.createServiceProfile({
        profileId,
        displayName: process.env.PROFILE_NAME || 'My Organization',
    });
}
```

{% hint style="info" %}
**Profiles:** `createProfile` creates a standard user profile (a person). `createServiceProfile` creates an organization or app issuer. Learn more about [Network Profiles](../core-concepts/identities-and-keys/network-profiles.md).
{% endhint %}

---

## Part 2: Designing Your Credential

A Verifiable Credential is a set of claims made by an Issuer about a Subject (the recipient). We will design a "Workshop Completion" badge.

Add this to your script:

```javascript
// 3. Define the credential content
const unsignedVc = {
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: learnCard.id.did(),
    validFrom: new Date().toISOString(),
    name: 'LearnCard Basics Workshop',
    credentialSubject: {
        type: ['AchievementSubject'],
        achievement: {
            id: `urn:uuid:${randomUUID()}`,
            type: ['Achievement'],
            achievementType: 'Badge',
            name: 'LearnCard Basics Workshop',
            description: 'Awarded for successfully completing the interactive LearnCard tutorial.',
            criteria: {
                narrative: 'The recipient attended the workshop and completed all exercises.',
            },
            image: {
                id: 'https://cdn.filestackcontent.com/YjQDRvq6RzaYANcAxKWE',
                type: 'Image',
            },
        },
    },
};
```

{% hint style="success" %}
✨ **Key Points:**

- **`@context`**: Tells systems how to interpret the fields. Always use `context-3.0.3.json` for Open Badges v3.
- **`type`**: Categorizes the credential. `VerifiableCredential` and `OpenBadgeCredential` are standard.
- **`credentialSubject`**: The core information. The `achievement` object holds the badge details like `name`, `description`, `criteria`, and `image`.

{% endhint %}

### Go further: the fields that make a credential yours

| You want to…                                       | Add                                                                                                                                                                                               |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Change how it's categorized in the recipient's app | `achievement.achievementType` — e.g. `'Certificate'`, `'Course'`, `'Competency'`, `'Badge'` ([all types & categories](../core-concepts/credentials-and-data/achievement-types-and-categories.md)) |
| Show proof of the work                             | `credentialSubject.achievement` stays the same; add a top-level `evidence: [{ id: 'https://…', type: ['Evidence'], name: 'Final project' }]`                                                      |
| Make it expire                                     | `validUntil: '2027-01-01T00:00:00Z'` next to `validFrom`                                                                                                                                          |
| Add your own fields (score, cohort, instructor…)   | Put them under `credentialSubject` and add a context that defines them — see [Building Verifiable Credentials](../core-concepts/credentials-and-data/building-verifiable-credentials.md)          |
| Control how it displays in LearnCard               | [Display hint tags](../core-concepts/credentials-and-data/display-hint-tags.md) (`lc:` convention)                                                                                                |

---

## Part 3: Signing and Sending

Now, sign the credential to make it official and send it to an email address.

Add this to the end of your script:

```javascript
// 4. Sign the credential
console.log('Signing the credential...');
const signedVc = await learnCard.invoke.issueCredential(unsignedVc);

// 5. Send it
const recipientEmail = 'you@example.com'; // Replace with a real email you can check
console.log(`Sending to ${recipientEmail}...`);

const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: recipientEmail, // email, phone, profile ID, or DID — auto-detected
    signedCredential: signedVc,
});

if (result.inbox?.status === 'PENDING') {
    console.log(
        `Sent. ${recipientEmail} will get an email with this claim link:\n${result.inbox.claimUrl}`
    );
} else {
    console.log(
        `Delivered. ${recipientEmail} already uses LearnCard — the credential is in their wallet.`
    );
}
```

{% hint style="info" %}
`recipient` is auto-detected: pass an email, a phone number, a LearnCard profile ID, or a DID.
{% endhint %}

---

## Part 4: Run and View

Run your script:

```bash
node --env-file=.env issueCredential.mjs
```

### What you should see

In your terminal, you will see one of two messages:

- **PENDING**: The recipient gets an email with a claim link. They can click it to create an account and claim the badge.
- **ISSUED**: The recipient already has a LearnCard account. The badge is delivered straight to their wallet.

Open the email or your LearnCard app to view the new "Workshop Completion" credential. It will display the image, description, and criteria you designed.

---

## Summary & What's Next

You successfully:
✅ Set up an Issuer environment.
✅ Designed a custom Verifiable Credential with Open Badges v3 fields.
✅ Signed and sent the credential via email.

Next steps:

- **Issue at scale:** Learn how to use templates to issue the same badge to many people in [Issue at Scale with Boosts](create-a-boost.md).
- **Listen for claims:** Know when a user claims your credential in [Listen to Webhooks](listen-to-webhooks.md).
