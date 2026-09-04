---
description: 'How-To Guide: Connect your website or game to LearnCard via ConsentFlow'
---

# Connect Your Website or Game

This guide shows you how to connect your website, game, or platform to LearnCard. You will build a flow where users link their LearnCard wallet to their account on your platform, granting you permission to issue credentials directly to them.

## Do you need this, or just send()?

If you just want to award a badge when something happens and you know the user's email address, use [`learnCard.invoke.send(...)`](../send-credentials.md). It's simpler and requires no setup on the user's part.

Use the connected-account pattern in this guide when you want an ongoing relationship: the user links their LearnCard once, consents to what you may write or read, and you then issue automatically (every lesson, every level) without emails or claim links. For games and platforms serving minors, this pattern (using GameFlow) also builds in guardian consent automatically.

## Part 1: Initialize Your Platform

Your website's backend needs to act as an Issuer. First, initialize the LearnCard SDK.

```typescript
// backend/learncard-setup.ts
import { initLearnCard } from '@learncard/init';

// IMPORTANT: Store your seed securely (e.g., environment variable in production)
const PLATFORM_ISSUER_SEED = process.env.LEARNCARD_SEED;

let networkLearnCard;

export async function getPlatformLearnCard() {
    if (networkLearnCard) return networkLearnCard;

    console.log('Initializing Platform LearnCard SDK...');
    networkLearnCard = await initLearnCard({
        seed: PLATFORM_ISSUER_SEED,
        network: true,
        allowRemoteContexts: true,
    });

    console.log('Platform Issuer DID:', networkLearnCard.id.did());
    return networkLearnCard;
}
```

## Part 2: Create a Consent Contract

Next, you need a contract that defines what permissions you are requesting from the user.

```typescript
// backend/consent-contract.ts
import { getPlatformLearnCard } from './learncard-setup';

// This URL must be an endpoint on YOUR website that can handle the redirect
const YOUR_CALLBACK_URL = 'https://yourplatform.com/auth/learncard/callback';

const badgeIssuanceConsentContract = {
    name: 'Platform Badge Program',
    subtitle: 'Receive digital badges for your achievements!',
    description: 'Connect your LearnCard to allow us to automatically issue you verifiable badges.',
    redirectUrl: YOUR_CALLBACK_URL,
    contract: {
        write: {
            credentials: {
                categories: { 'Achievement': { required: true } },
            },
        },
    },
};

export async function getOrCreateConsentContractUri() {
    const learnCard = await getPlatformLearnCard();
    // In production, you should cache this URI after creating it once
    const uri = await learnCard.invoke.createContract(badgeIssuanceConsentContract);
    return uri;
}
```

{% hint style="info" %}
**For games:** Add `needsGuardianConsent: true` to your contract object. This turns it into a **GameFlow** contract. GameFlow automatically handles COPPA/GDPR compliance by requiring guardian approval for users under the age of digital consent before they can link their account to your game.
{% endhint %}

## Part 3: Add the Connect Button

Add a button to your platform that sends users to LearnCard to approve the contract.

```html
<!-- frontend/index.html -->
<button id="connectBtn">Connect LearnCard</button>

<script>
    document.getElementById('connectBtn').addEventListener('click', async () => {
        // Fetch the contract URI from your backend
        const response = await fetch('/api/get-consent-url');
        const { contractUri } = await response.json();

        // Redirect the user to the LearnCard app to approve
        window.location.href = `https://app.learncard.com/consent?contract=${encodeURIComponent(contractUri)}`;
    });
</script>
```

When users click this, they will be taken to the LearnCard app, where they will see exactly what permissions your platform is requesting. Once they approve, LearnCard redirects them back to your Redirect URL.

## Part 4: Handle the Callback

When LearnCard redirects the user back to your platform, it includes their DID (Decentralized Identifier) and a Verifiable Presentation (VP) proving their consent in the URL parameters.

Your server needs to handle this callback, verify the VP, and store the DID.

```typescript
// backend/routes.ts
import { getPlatformLearnCard } from './learncard-setup';

app.get('/auth/learncard/callback', async (req, res) => {
    const { did, vp } = req.query;

    if (!did || !vp) {
        return res.status(400).send('Missing DID or VP');
    }

    try {
        const learnCard = await getPlatformLearnCard();

        // 1. Verify the presentation proves consent to your contract
        const verification = await learnCard.invoke.verifyPresentation(vp);

        if (verification.errors.length > 0) {
            return res.status(400).send('Invalid consent presentation');
        }

        // 2. Store the DID in your database linked to the current user
        const userId = req.session.userId;
        await db.users.update(userId, { learnCardDid: did });

        res.redirect('/dashboard?connected=true');
    } catch (error) {
        console.error('Callback error:', error);
        res.status(500).send('Failed to process connection');
    }
});
```

### What you should see

When this works correctly:

1. The user clicks Connect and approves in LearnCard
2. They are redirected back to your site
3. Your server logs show the DID and successful verification
4. Your database now has the user's `learnCardDid` saved

| Problem                  | Likely Cause                                                             |
| :----------------------- | :----------------------------------------------------------------------- |
| Callback never fires     | Check the Redirect URL in your contract configuration                    |
| No DID in query          | User did not complete the consent flow                                   |
| Credential not appearing | Missing `credentials:write` permission in contract, or category mismatch |

## Part 5: Create a Boost Template

Before you can issue credentials, you need a template.

```typescript
// backend/badge-manager.ts
import { getPlatformLearnCard } from './learncard-setup';

export async function getOrCreateBadgeBoost() {
    const learnCard = await getPlatformLearnCard();

    const badgeTemplate = {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            'https://ctx.learncard.com/boosts/1.0.3.json',
        ],
        type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
        name: 'Level Up Badge',
        credentialSubject: {
            achievement: {
                achievementType: 'Badge',
                name: 'Level Up',
                description: 'Awarded for reaching a new level!',
                type: ['Achievement'],
            },
            type: ['AchievementSubject'],
        },
    };

    const boostMetadata = {
        name: 'Level Up Badge',
        description: 'Awards a badge for leveling up.',
        category: 'Achievement',
    };

    // In production, cache this URI
    return await learnCard.invoke.createBoost(badgeTemplate, boostMetadata);
}
```

## Part 6: Issue Credentials Automatically

Now that you have the user's DID and their consent, you can issue credentials directly to their wallet whenever they achieve something on your platform.

```typescript
// backend/achievement-handler.ts
import { getPlatformLearnCard } from './learncard-setup';
import { getOrCreateConsentContractUri } from './consent-contract';
import { getOrCreateBadgeBoost } from './badge-manager';

async function awardLevelUpBadge(userId) {
    // 1. Get the user's DID from your database
    const user = await db.users.get(userId);

    if (!user.learnCardDid) {
        console.log('User has not connected LearnCard');
        return;
    }

    try {
        const learnCard = await getPlatformLearnCard();
        const boostUri = await getOrCreateBadgeBoost();
        const contractUri = await getOrCreateConsentContractUri();

        // 2. Issue the credential through the consent contract.
        //    No email or claim link — it lands in the user's LearnCard directly.
        const { boost: template } = await learnCard.invoke.getBoost(boostUri);
        const credential = await learnCard.invoke.issueCredential({
            ...template,
            credentialSubject: { ...template.credentialSubject, id: user.learnCardDid },
        });
        const issuedCredentialUri = await learnCard.invoke.writeCredentialToContract(
            user.learnCardDid, // recipient DID (from the callback you stored)
            contractUri, // your ConsentFlow contract
            credential, // the signed credential to issue
            boostUri // the Boost template it instantiates
        );

        console.log('Successfully awarded badge!');
    } catch (error) {
        console.error('Failed to award badge:', error);
    }
}
```

{% hint style="info" %}
**For games:** You can also send xAPI statements to track granular progress (like "User defeated Boss X" or "User collected Item Y") before they earn a full credential. See [Sending xAPI Statements](../../tutorials/sending-xapi-statements.md) for details.
{% endhint %}

## Summary & Next Steps

You have now built a fully connected platform that can request permission and automatically issue credentials to users.

- For a hands-on version of this guide, see the [Create a Connected Website](../../tutorials/create-a-connected-website.md) tutorial.
- Learn more about [Auto-Boosts](../../core-concepts/credentials-and-data/boost-credentials.md).
- Understand the concepts behind [ConsentFlow](../../core-concepts/consent-and-permissions/consentflow-overview.md).
