---
description: Claim Your First Digital Badge in 5 Minutes!
---

# Your First Integration

Welcome to your first LearnCard integration! In just a few lines of code, you'll create a verifiable, claimable digital badge—what we call a **Boost**.

This quickstart helps you:

* Install LearnCard tools
* Create a demo issuer profile
* Generate a verifiable Boost (credential)
* Output a link that anyone can claim

No experience required. Just code, coffee, and a terminal.

## ⭐️ What You'll Be Making

{% embed url="https://codepen.io/Jacks-n-Smith/pen/KwwEbjY" fullWidth="false" %}

## 🧰 Installation

Choose your preferred package manager:

```bash
# Using npm
npm install @learncard/init @learncard/claimable-boosts-plugin @learncard/simple-signing-plugin dotenv

# Using yarn
yarn add @learncard/init @learncard/claimable-boosts-plugin @learncard/simple-signing-plugin dotenv

# Using pnpm
pnpm add @learncard/init @learncard/claimable-boosts-plugin @learncard/simple-signing-plugin dotenv

```

## 🚀 Quickstart Script

This script:

1. Initializes a LearnCard wallet
2. Creates an issuer profile
3. Defines a Boost template
4. Issues the Boost to the network
5. Generates a claim link for anyone to redeem

## ✅ Prerequisites

* Node.js (v14+)
* A secure seed phrase (stored in `SECURE_SEED`)
* A unique ID for your issuer (e.g. `my-awesome-org-profile`)

## 📁 Create `createBoost.js`:

<pre class="language-javascript"><code class="lang-javascript">import 'dotenv/config';

<strong>import { initLearnCard } from '@learncard/init';
</strong>import { getClaimableBoostsPlugin } from '@learncard/claimable-boosts-plugin';
import { getSimpleSigningPlugin } from '@learncard/simple-signing-plugin';

const DEMO_SEED = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdee'
const secure_seed = process.env.SECURE_SEED;
const profileId = process.env.PROFILE_ID || 'my-awesome-org-profile';
const profileName = process.env.PROFILE_NAME || 'My Awesome Org';

// Use user provided seed, or use backup DEMO seed 
const seed = secure_seed || DEMO_SEED;
if (!secure_seed) {
  console.warn('Warning: SECURE_SEED environment variable is not set, using DEMO_SEED.');
}

async function quickstartBoost() {
  try {
    console.log('Initializing LearnCard...');
    const learnCard = await initLearnCard({
      seed: seed,
      network: true,
      allowRemoteContexts: true
    });

    const signingLearnCard = await learnCard.addPlugin(
      await getSimpleSigningPlugin(learnCard, 'https://api.learncard.app/trpc')
    );

    const claimableLearnCard = await signingLearnCard.addPlugin(
      await getClaimableBoostsPlugin(signingLearnCard)
    );
    console.log('LearnCard initialized with plugins.');

    try {
      console.log(`Creating profile "${profileId}"...`);
      await claimableLearnCard.invoke.createProfile({
        profileId: profileId,
        displayName: profileName,
        description: 'Issuing awesome credentials.',
      });
      console.log(`Profile "${profileId}" created successfully.`);
    } catch (error) {
      if (error.message?.includes('Profile already exists')) {
        console.log(`Profile "${profileId}" already exists, continuing.`);
      } else {
        throw new Error(`Failed to create profile: ${error.message}`);
      }
    }

    console.log('Creating boost template...');
    const boostTemplate = await claimableLearnCard.invoke.newCredential({
      type: 'boost', 
      boostName: 'Quickstart Achievement',
      boostImage: 'https://placehold.co/400x400?text=Quickstart',
      achievementType: 'Influencer',
      achievementName:'Quickstart Achievement',
      achievementDescription: 'Completed the quickstart guide!',
      achievementNarrative: 'User successfully ran the quickstart script.',
      achievementImage: 'https://placehold.co/400x400?text=Quickstart'
    });
    console.log('Boost template created.');

    console.log('Creating boost on the network...');
    const boostUri = await claimableLearnCard.invoke.createBoost(
      boostTemplate,
      {
        name: boostTemplate.name,
        description: boostTemplate.achievementDescription,
      }
    );
    console.log(`Boost created with URI: ${boostUri}`);

    console.log('Generating claim link...');
    const claimLink = await claimableLearnCard.invoke.generateBoostClaimLink(boostUri);
    console.log('\n✅ Success! Your Claimable Boost link is ready:');
    console.log(claimLink);

    return claimLink;

  } catch (error) {
    console.error('\n❌ Error during quickstart process:', error);
    process.exit(1);
  }
}

quickstartBoost();

</code></pre>

## 🔩 Setup Organization Config (optional)

{% hint style="danger" %}
This step sets up your secret seed phrase for controlling your Organization's profile. However, for demonstration, **you may safely skip this step to use the provided DEMO\_SEED**. Never hardcode a seed in production.  Learn more about [seeds](../core-concepts/identities-and-keys/seed-phrases.md).
{% endhint %}

#### Create and save your seed to .en&#x76;_:_

{% tabs %}
{% tab title="macOS / Linux" %}
Run the following command in your terminal:&#x20;

{% code overflow="wrap" %}
```bash
echo "SECURE_SEED=\"$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")\"" > .env
```
{% endcode %}
{% endtab %}

{% tab title="Windows Cmd" %}
Run the following command in your Windows cmd prompt:&#x20;

{% code overflow="wrap" %}
```bash
echo "SECURE_SEED=\"$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")\"" > .env
```
{% endcode %}
{% endtab %}

{% tab title="Powershell" %}
Run the following command in Powershell:&#x20;

{% code overflow="wrap" %}
```bash
"SECURE_SEED=\"$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")\"" | Out-File -Encoding utf8 .env
```
{% endcode %}
{% endtab %}
{% endtabs %}

#### Add config variables to your `.env`:

{% hint style="info" %}
You must create a unique profile ID for your organization. It must be 3-40 characters, lowercase, no spaces or special characters. E.g.: `my-organization`, `acme`, `taffy-co-organization` , etc.
{% endhint %}

{% code title=".env" overflow="wrap" %}
```bash
SECURE_SEED="..." # Created from command in prior step.
PROFILE_ID="<unique-profile-id>" # Unique profile ID.
PROFILE_NAME="<Display Name>" # Human Readable Display Name
```
{% endcode %}

## 🏃‍♂️ Run the Script

```bash
node createBoost.js
```

## 🎉 What You'll See

The console will print a claimable URL like:

```arduino
✅ Success! Your Claimable Boost link is ready:
https://claim.learncard.app/boost/abc123...
```

Anyone with that link can scan or click to claim their badge. It’s a live verifiable credential issued by your script.

{% hint style="success" %}
Want to customize your claimable boost even more? Check out our Core Concepts guide on "[Getting Started with Boosts](../core-concepts/credentials-and-data/getting-started-with-boosts.md)."
{% endhint %}

## ➡️ Next Steps

* 📝 Play with sending different kinds of credentials (see[ Building Verifiable Credentials](../core-concepts/credentials-and-data/building-verifiable-credentials.md))
* 🔐 Add expiration, limits, or QR codes (see [Detailed Usage](../sdks/official-plugins/claimable-boosts.md))
* 🧠 Learn how Boosts work under the hood (see [Core Concepts](../core-concepts/credentials-and-data/boost-credentials.md))
* 🛠️ [Issue credentials ](../tutorials/create-a-credential.md)dynamically in your app or game

**You just built your first digital credential.**\
You’ve touched real-world decentralized identity and verifiable credentials—with just a few lines of code.

We’re glad you’re here. Ready to build something great?
