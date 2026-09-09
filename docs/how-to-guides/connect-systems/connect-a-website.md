---
description: 'How-To Guide: Connect your website or game to LearnCard via ConsentFlow'
---

# Connect Your Website or Game

Connect your website, game, or platform to LearnCard. Users link their LearnCard wallet to their account on your platform, granting you permission to issue credentials directly to them.

**~30 minutes · Needs:** Node.js backend, a frontend button, a LearnCard seed

## Do you need this, or just send()?

If you just want to award a badge when something happens and you know the user's email address, use [`learnCard.invoke.send(...)`](../send-credentials.md). It's simpler and requires no setup on the user's part.

Use the connected-account pattern when you want an ongoing relationship: the user links their LearnCard once, consents to what you may write or read, and you issue automatically (every lesson, every level) without emails or claim links. For games and platforms serving minors, this pattern (using GameFlow) builds in guardian consent automatically.

## Part 1: Initialize Your Platform

Your website's backend needs to act as an Issuer. Initialize the LearnCard SDK.

```typescript
import { initLearnCard } from '@learncard/init';

let networkLearnCard;

export async function getPlatformLearnCard() {
    if (networkLearnCard) return networkLearnCard;
    networkLearnCard = await initLearnCard({
        seed: process.env.LEARNCARD_SEED,
        network: true,
    });
    return networkLearnCard;
}
```

## Part 2: Create a Consent Contract

Define what permissions you are requesting from the user.

```typescript
const badgeIssuanceConsentContract = {
    name: 'Platform Badge Program',
    subtitle: 'Receive digital badges for your achievements!',
    description: 'Connect your LearnCard to allow us to automatically issue you verifiable badges.',
    redirectUrl: 'https://yourplatform.com/auth/learncard/callback',
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
    return await learnCard.invoke.createContract(badgeIssuanceConsentContract);
}
```

{% hint style="info" %}
**For games:** Add `needsGuardianConsent: true` to your contract object. This turns it into a **GameFlow** contract. GameFlow automatically handles COPPA/GDPR compliance by requiring guardian approval for users under the age of digital consent before they can link their account to your game.
{% endhint %}

## Part 3: Add the Connect Button

Add a button to your platform that sends users to LearnCard to approve the contract.

```html
<button id="connectBtn">Connect LearnCard</button>

<script>
    document.getElementById('connectBtn').addEventListener('click', async () => {
        const response = await fetch('/api/get-consent-url');
        const { contractUri } = await response.json();
        window.location.href = `https://app.learncard.com/consent?contract=${encodeURIComponent(contractUri)}`;
    });
</script>
```

## Part 4: Handle the Callback

When LearnCard redirects the user back to your platform, it includes their DID and a Verifiable Presentation (VP) proving their consent.

```typescript
app.get('/auth/learncard/callback', async (req, res) => {
    const { did, vp } = req.query;
    if (!did || !vp) return res.status(400).send('Missing DID or VP');

    try {
        const learnCard = await getPlatformLearnCard();
        const verification = await learnCard.invoke.verifyPresentation(vp);

        if (verification.errors.length > 0) {
            return res.status(400).send('Invalid consent presentation');
        }

        // Store the DID in your database linked to the current user
        await db.users.update(req.session.userId, { learnCardDid: did });
        res.redirect('/dashboard?connected=true');
    } catch (error) {
        res.status(500).send('Failed to process connection');
    }
});
```

### What you should see

1. The user clicks Connect and approves in LearnCard
2. They are redirected back to your site
3. Your server logs show the DID and successful verification
4. Your database now has the user's `learnCardDid` saved

## Troubleshooting

| If…                      | Then                                                                     |
| :----------------------- | :----------------------------------------------------------------------- |
| Callback never fires     | Check the `redirectUrl` in your contract configuration                   |
| No DID in query          | User did not complete the consent flow                                   |
| Credential not appearing | Missing `credentials:write` permission in contract, or category mismatch |

## Part 5: Create a Credential Template

Before you can issue credentials, you need a template.

```typescript
export async function getOrCreateBadgeBoost() {
    const learnCard = await getPlatformLearnCard();

    const badgeTemplate = {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
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

    return await learnCard.invoke.createBoost(badgeTemplate, boostMetadata);
}
```

## Part 6: Issue Credentials Automatically

With the user's DID and consent, you can issue credentials directly to their wallet whenever they achieve something on your platform.

```typescript
async function awardLevelUpBadge(userId) {
    const user = await db.users.get(userId);
    if (!user.learnCardDid) return;

    try {
        const learnCard = await getPlatformLearnCard();
        const boostUri = await getOrCreateBadgeBoost();
        const contractUri = await getOrCreateConsentContractUri();

        const { boost: template } = await learnCard.invoke.getBoost(boostUri);
        const credential = await learnCard.invoke.issueCredential({
            ...template,
            credentialSubject: { ...template.credentialSubject, id: user.learnCardDid },
        });

        await learnCard.invoke.writeCredentialToContract(
            user.learnCardDid,
            contractUri,
            credential,
            boostUri
        );
    } catch (error) {
        console.error('Failed to award badge:', error);
    }
}
```

## Next steps

- See a runnable example: [Gashapon Game Corner](https://github.com/learningeconomy/LearnCard/tree/main/examples/app-store-apps/4-gashapon-game-corner)
- Learn more about [Auto-Boosts](../../core-concepts/credentials-and-data/boost-credentials.md)
- Understand the concepts behind [ConsentFlow](../../core-concepts/consent-and-permissions/consentflow-overview.md)
