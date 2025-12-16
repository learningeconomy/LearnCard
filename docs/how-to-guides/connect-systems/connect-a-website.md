---
description: 'How-To Guide: Issue Digital Badges from Your Website'
---

# Connect a Website

Want to award your users verifiable digital badges for their achievements on your website or platform? This tutorial will show you how! We'll explore two main approaches and then dive deep into a robust, integrated solution using LearnCard's ConsentFlow.

**Our Example Use Case: EduPlatform** Imagine "EduPlatform," an online learning site. When a student successfully completes the "JavaScript Fundamentals" course, EduPlatform wants to automatically issue them a digital badge they can store in their LearnCard wallet and share anywhere.

## **What you'll accomplish:**

* Understand two methods for issuing badges.
* Set up your platform (EduPlatform) as a LearnCard Issuer.
* Create a "ConsentFlow Contract" so users can connect their LearnCard accounts to EduPlatform.
* Implement a "Connect LearnCard" button on your website.
* Handle the user consent process and securely store their LearnCard DID.
* Automatically issue a "Course Completion" badge (as a Verifiable Credential) to a user when they complete an activity on your site, using the established consent.

## Choosing Your Badge Issuance Method

There are a couple of ways to get badges to your users:

### **Option 1: Quick & Simple - Claimable Links/QR Codes (via Boosts)**

* **How it works:** You create a "Boost" (a master template for your badge). From this Boost, you generate a unique claim link or QR code. You can display this QR code at the end of a workshop, email the link, etc. Users scan/click it to claim their badge.
* **Pros:** Very easy to set up, no deep integration needed, great for one-off events or when users don't have accounts on your platform.
* **Cons:** Less automated for ongoing achievements tied to user accounts on your site; relies on the user to actively claim.
* ➡️ **If this sounds like what you need, head over to our** [**Quickstart: Create a Claimable Boost Tutorial for a step-by-step guide**](../../quick-start/your-first-integration.md)**!**

### **Option 2: Automated & Integrated - Connecting LearnCard Accounts (This Guide's Focus)**

* **How it works:** Users explicitly connect their LearnCard account to your website by consenting to a "ConsentFlow Contract." This contract gives your website permission to issue specific types of badges directly to their LearnCard wallet when they achieve something.
* **Pros:** Fully automated issuance, badges are tied to their account activity on your platform, enables ongoing recognition, allows for personalized badge data.
* **Cons:** Requires a bit more setup for the initial consent flow.
* ➡️ **If you want this deeper, automated integration, you're in the right place! Let's proceed.**

#### Prerequisites for the Integrated Approach

* **LearnCard SDK Initialized (for your Backend):** Your website's backend will need an active `learnCard` instance connected to the network.
* **Service Profile for Your Website:** Your website/platform will need its own identity on the LearnCard Network.
* **Basic Understanding:** Familiarity with [DIDs](../../core-concepts/identities-and-keys/decentralized-identifiers-dids.md), [Verifiable Credentials (VCs),](../../core-concepts/credentials-and-data/verifiable-credentials-vcs.md) [Boosts](../../core-concepts/credentials-and-data/boost-credentials.md), and the [Create a ConsentFlow Tutorial](../../tutorials/create-a-consentflow.md) will be very helpful.
* **Web Development Setup:**
  * A backend environment (e.g., Node.js with Express) to handle API calls and user data.
  * A frontend (simple HTML/JS is fine for this guide) for the user interface.

{% hint style="success" %}
You can skip **Part 1 & 2** by configuring your issuer and creating your ConsentFlow contract using the built-in UI:
{% endhint %}

{% embed url="https://www.loom.com/share/c4524abf747c4d6f8e3a67821c25050d" %}

## Part 1: Setting Up Your Platform (EduPlatform as Issuer)

Your website's backend needs to act as an Issuer.

### **Step 1.1: Initialize LearnCard SDK on Your Backend**&#x20;

This instance will represent EduPlatform.

```typescript
// backend/learncard-setup.ts
import { initLearnCard } from '@learncard/init';

// IMPORTANT: Store your seed securely (e.g., environment variable in production)
const EDUPLATFORM_ISSUER_SEED = 'your-eduplatform-secure-hex-seed-string'; // Replace!

let networkLearnCard; // To store the initialized SDK instance

export async function getEduPlatformLearnCard() {
    if (networkLearnCard) return networkLearnCard;

    console.log('Initializing EduPlatform LearnCard SDK...');
    networkLearnCard = await initLearnCard({
        seed: EDUPLATFORM_ISSUER_SEED,
        network: true,     // Connect to the LearnCard Network
        allowRemoteContexts: true, // Often needed for VC contexts
    });
    console.log("EduPlatform LearnCard Initialized.");
    console.log("EduPlatform Issuer DID:", networkLearnCard.id.did());
    return networkLearnCard;
}

```

### **Step 1.2: Ensure EduPlatform Has a Service Profile**&#x20;

Your EduPlatform needs an identity on the LearnCard Network.

```typescript
// backend/profile-manager.ts
import { getEduPlatformLearnCard } from './learncard-setup';

const EDUPLATFORM_PROFILE_ID = 'eduplatform-main';
const EDUPLATFORM_DISPLAY_NAME = 'EduPlatform Online Learning';

export async function ensureEduPlatformProfile() {
    const learnCard = await getEduPlatformLearnCard();
    try {
        let profile = await learnCard.invoke.getProfile(EDUPLATFORM_PROFILE_ID);
        if (!profile) {
            console.log(`Creating service profile for EduPlatform: ${EDUPLATFORM_PROFILE_ID}`);
            await learnCard.invoke.createServiceProfile({
                profileId: EDUPLATFORM_PROFILE_ID,
                displayName: EDUPLATFORM_DISPLAY_NAME,
                image: 'https://example.com/eduplatform-logo.png' // Optional
            });
            console.log('EduPlatform Service Profile created successfully.');
        } else {
            console.log('EduPlatform Service Profile already exists.');
        }
    } catch (error: any) {
        if (error.message?.includes('Profile ID already exists')) {
            console.log('EduPlatform Service Profile already exists (confirmed by error).');
        } else {
            console.error(`Failed to ensure EduPlatform profile: ${error.message}`);
            // In production, you might want to handle this more gracefully or retry
        }
    }
}

// Call this during your application's startup sequence
// ensureEduPlatformProfile();

```

{% hint style="success" %}
**Action:** Integrate these into your backend's startup process.
{% endhint %}

## Part 2: Creating a ConsentFlow Contract for Badge Issuance

This contract defines that EduPlatform requests permission from users to issue "Achievement" badges to them.

### **Step 2.1: Define the Contract Terms**

```typescript
// backend/consent-contract.ts
import { getEduPlatformLearnCard } from './learncard-setup';

// IMPORTANT: This URL must be an endpoint on YOUR website that can handle the redirect
const YOUR_WEBSITE_CONSENT_CALLBACK_URL = 'https://eduplatform.example.com/auth/learncard/callback';

const badgeIssuanceConsentContract = {
    name: "EduPlatform Badge Program",
    subtitle: "Receive digital badges for your course completions!",
    description: "Connect your LearnCard to allow EduPlatform to automatically issue you verifiable badges when you complete courses and achieve milestones.",
    image: "https://example.com/eduplatform-badge-program.png", // Optional
    contract: {
        read: { // What EduPlatform wants to read (optional for this use case)
            personal: {
                // We could request 'Name' to personalize badges, but let's keep it simple.
                // Name: { required: false } 
            }
        },
        write: { // What EduPlatform wants to write (issue) to the user
            credentials: {
                categories: {
                    // We will be issuing "Achievement" badges
                    "Achievement": { required: true } 
                }
            }
        }
    },
    redirectUrl: YOUR_WEBSITE_CONSENT_CALLBACK_URL 
};

let contractUriCache: string | null = null;

export async function getOrCreateBadgeConsentContractUri(): Promise<string> {
    if (contractUriCache) return contractUriCache;

    const learnCard = await getEduPlatformLearnCard();
    try {
        // Optional: Check if a contract with a similar name/purpose already exists to avoid duplicates
        // For this tutorial, we'll assume we create it if we don't have a URI cached.
        console.log('Creating EduPlatform Badge ConsentFlow Contract...');
        const uri = await learnCard.invoke.createContract(badgeIssuanceConsentContract);
        console.log('ConsentFlow Contract Created! URI:', uri);
        contractUriCache = uri; // Cache it for subsequent calls
        return uri;
    } catch (error) {
        console.error('Error creating ConsentFlow contract:', error);
        throw error;
    }
}

```

**Action:** Ensure your backend can create this contract (perhaps on startup or via an admin function) and store the `contractUri`.

## Part 3: Enabling Users to Connect Their LearnCard on Your Website

### **Step 3.1: Frontend - The "Connect LearnCard" Button**&#x20;

On EduPlatform's user profile page or settings page, add a button.

```html
<div>
    <h2>LearnCard Integration</h2>
    <p>Connect your LearnCard to automatically receive digital badges for your achievements!</p>
    <button id="connectLearnCardBtn">Connect Your LearnCard</button>
</div>

<script>
    // This script would run on your frontend
    const connectButton = document.getElementById('connectLearnCardBtn');

    connectButton.addEventListener('click', async () => {
        try {
            // In a real app, you'd fetch this URI from your backend
            // For demo, we assume it's available or hardcoded after backend creates it.
            const eduPlatformContractUri = 'uri:contract:YOUR_EDUPLATFORM_CONTRACT_URI'; // Replace!
            const userReturnUrl = 'https://eduplatform.example.com/dashboard?learncard_connected=true'; // Where user lands on your site after consenting

            if (eduPlatformContractUri === 'uri:contract:YOUR_EDUPLATFORM_CONTRACT_URI') {
                alert('Error: Contract URI not set. Backend might not have created it yet.');
                return;
            }
            
            const consentUrl = `https://learncard.app/consent-flow?uri=${encodeURIComponent(eduPlatformContractUri)}&returnTo=${encodeURIComponent(userReturnUrl)}`;
            
            console.log('Redirecting to LearnCard for consent:', consentUrl);
            window.location.href = consentUrl; // Redirect user to LearnCard consent page
        } catch (error) {
            console.error('Error preparing consent URL:', error);
            alert('Could not initiate LearnCard connection. Please try again.');
        }
    });
</script>

```

{% hint style="success" %}
**Action:** Implement this button. When clicked, it redirects the user to `learncard.app` to approve the connection based on your contract.
{% endhint %}

## Part 4: Handling the Consent Callback & Storing User DIDs

After the user consents on `learncard.app`, they are redirected back to the `redirectUrl` you specified in your contract (or the `returnTo` URL from the consent link).

### **Step 4.1: Backend - Create a Callback Endpoint**&#x20;

Your backend (e.g., EduPlatform's Node.js/Express server) needs an endpoint to handle this.

```typescript
// backend/routes/authRoutes.ts (example using Express.js)
// import express from 'express';
// const router = express.Router();

// This would be your endpoint: e.g., GET https://eduplatform.example.com/auth/learncard/callback
// router.get('/learncard/callback', async (req, res) => {
async function handleLearnCardCallback(req, res) { // req, res are Express request/response
    const userDid = req.query.did as string;

    if (userDid) {
        console.log(`LearnCard consent callback received for User DID: ${userDid}`);
        
        // TODO:
        // 1. Validate this request (e.g., check a state parameter if you sent one)
        // 2. Get your application's internal user ID (e.g., from the current session)
        const internalUserId = req.session?.userId; // Example: if using sessions

        if (!internalUserId) {
            // res.status(400).send('User session not found. Please log in to EduPlatform first.');
            console.error('User session not found during LearnCard callback.');
            return; // Or handle error appropriately
        }

        // 3. Securely store the userDid in your database, associating it with internalUserId
        //    Example: await db.users.update({ id: internalUserId }, { learnCardDid: userDid });
        console.log(`ACTION: Store LearnCard DID ${userDid} for EduPlatform user ${internalUserId}`);
        
        // 4. Redirect the user to a success page on your platform
        //    res.redirect('/dashboard?learncard_connected=true');
        console.log('Redirecting user to their dashboard...');
    } else {
        console.error('LearnCard consent callback error: DID not found in query parameters.');
        // res.status(400).send('LearnCard connection failed or was denied.');
    }
}
// export default router;

```

{% hint style="success" %}
**Action:** Implement this callback endpoint on your backend. Securely associate the received `userDid` with the logged-in user on your platform.
{% endhint %}

## Part 5: Issuing a Badge When a User Completes an Activity

Let's say a user completes the "JavaScript Fundamentals" course on EduPlatform.

### **Step 5.1: Create a Boost for Your Badge (One-time Setup)**&#x20;

It's best practice to create a "Boost" to act as the template for your "JavaScript Fundamentals Completion" badge. This makes managing and issuing it easier.

```typescript
// backend/badge-manager.ts
import { getEduPlatformLearnCard } from './learncard-setup';
import { randomUUID } from 'crypto'; // Node.js built-in

const JS_FUNDAMENTALS_BOOST_NAME = 'JavaScript Fundamentals Completion Badge';
let jsFundamentalsBoostUri: string | null = null;

export async function getOrCreateJsFundamentalsBoost(): Promise<string> {
    if (jsFundamentalsBoostUri) return jsFundamentalsBoostUri;

    const learnCard = await getEduPlatformLearnCard();
    
    const badgeTemplate = {
        "@context": [
            "https://www.w3.org/2018/credentials/v1",
            "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.1.json", // Open Badges context
            "https://ctx.learncard.com/boosts/1.0.0.json" // LearnCard Boosts context
        ],
        type: ["VerifiableCredential", "OpenBadgeCredential", "BoostCredential"],
        name: JS_FUNDAMENTALS_BOOST_NAME, // Name of the credential instances
        credentialSubject: {
            // 'id' will be the recipient's DID, filled in during issuance
            achievement: {
                achievementType: "Badge",
                criteria: { narrative: "Awarded for demonstrating foundational knowledge of JavaScript programming." },
                description: "This badge certifies the successful completion of the JavaScript Fundamentals course on EduPlatform.",
                id: "urn:uuid:" + randomUUID(), // Unique ID for this achievement definition
                image: "https://example.com/badges/js-fundamentals.png",
                name: "JavaScript Fundamentals Completion",
                type: ["Achievement"]
            },
            type: ["AchievementSubject"]
        },
        display: { backgroundColor: "#F9A825", displayType: "badge" }, // Example display
        image: "https://example.com/badges/js-fundamentals.png"
    };

    const boostMetadata = {
        name: JS_FUNDAMENTALS_BOOST_NAME, // Name of the Boost template itself
        description: 'Awards a badge for completing the JavaScript Fundamentals course.',
        category: 'Achievement'
    };

    try {
        // In a real app, you might search for an existing Boost by name/metadata first.
        console.log('Creating JavaScript Fundamentals Boost template...');
        // `createBoost` expects the credential template itself, not a pre-signed VC
        jsFundamentalsBoostUri = await learnCard.invoke.createBoost(badgeTemplate, boostMetadata);
        console.log('JavaScript Fundamentals Boost Created! URI:', jsFundamentalsBoostUri);
        return jsFundamentalsBoostUri;
    } catch (error) {
        console.error('Error creating JavaScript Fundamentals Boost:', error);
        throw error;
    }
}

// Call this during your application's startup or via an admin function
// getOrCreateJsFundamentalsBoost();

```

{% hint style="success" %}
**Action:** Ensure this Boost is created and you store its `jsFundamentalsBoostUri`.
{% endhint %}

### **Step 5.2: Backend Logic - Issue Badge on Course Completion**&#x20;

When your backend detects a user has completed the course:

```typescript
// backend/course-completion-handler.ts
import { getEduPlatformLearnCard } from './learncard-setup';
import { getOrCreateBadgeConsentContractUri } from './consent-contract';
import { getOrCreateJsFundamentalsBoost } from './badge-manager';
import { randomUUID } from 'crypto';

// This function would be called by your platform's logic when a course is completed.
export async function issueJsBadgeToUser(internalUserId: string, userFullName: string) {
    const learnCard = await getEduPlatformLearnCard();
    
    // 1. Retrieve the user's LearnCard DID (stored in Part 4)
    // const userLearnCardDid = await db.users.getLearnCardDid(internalUserId); // Example DB call
    const userLearnCardDid = 'did:lcn:USER_PROFILE_ID_FROM_YOUR_DB'; // Replace with actual lookup

    if (!userLearnCardDid) {
        console.log(`User ${internalUserId} has not connected their LearnCard. Cannot issue badge.`);
        return;
    }

    try {
        const contractUri = await getOrCreateBadgeConsentContractUri();
        const boostUriToIssue = await getOrCreateJsFundamentalsBoost();

        // 2. Define the specific credential content for THIS user
        //    The `writeCredentialToContract` will use the Boost as a template
        //    but we provide the final `credentialSubject` and other instance-specific details.
        const credentialForUser = {
            "@context": [ // Contexts from your Boost template are often inherited or merged
                "https://www.w3.org/2018/credentials/v1",
                "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.1.json",
                "https://ctx.learncard.com/boosts/1.0.0.json"
            ],
            id: "urn:uuid:" + randomUUID(), // Unique ID for this specific credential instance
            type: ["VerifiableCredential", "OpenBadgeCredential", "BoostCredential", "AchievementCredential"], // Ensure "Achievement" is in your contract's write.credentials.categories
            issuer: learnCard.id.did(), // EduPlatform's DID
            issuanceDate: new Date().toISOString(),
            name: `JavaScript Fundamentals Completion - ${userFullName}`, // Personalized name
            credentialSubject: {
                id: userLearnCardDid, // The recipient's DID
                achievement: { // This structure should align with what your Boost template expects
                    achievementType: "Badge",
                    name: "JavaScript Fundamentals Completion",
                    description: "Successfully completed all modules and assessments for JavaScript Fundamentals.",
                    // You can add more personalized details here if your Boost template supports them
                }
            },
            // Display properties might be inherited from the Boost, or you can specify some here
        };
        
        console.log(`Issuing JS Fundamentals badge to ${userLearnCardDid} via contract ${contractUri} using boost ${boostUriToIssue}`);

        // 3. Issue the credential via the ConsentFlow contract
        const issuedCredentialUri = await learnCard.invoke.writeCredentialToContract(
            userLearnCardDid,   // The DID of the consenting user (recipient)
            contractUri,        // The URI of your ConsentFlow contract
            credentialForUser,  // The specific VC data to issue
            boostUriToIssue     // The URI of the Boost template this credential is an instance of
        );

        console.log(`Badge successfully issued to ${userLearnCardDid}! Credential URI: ${issuedCredentialUri}`);
        // Optionally, notify the user within your EduPlatform UI.
        // The user will also get a notification in their LearnCard app if they have webhooks configured.

    } catch (error) {
        console.error(`Error issuing badge to user ${internalUserId} (DID: ${userLearnCardDid}):`, error);
    }
}

// Example: Simulate a user completing a course
// issueJsBadgeToUser('eduplatform_user_123', 'Jane Doe'); 

```

{% hint style="success" %}
**Action:** Integrate this logic into your platform's course completion flow.
{% endhint %}

## Part 6: User Experience - Viewing the Badge

Once EduPlatform issues the badge:

* The user will receive a notification in their LearnCard app (if they have notifications enabled).
* The "JavaScript Fundamentals Completion" badge will appear in their LearnCard alerts notification tray, ready to be claimed, viewed and shared.

## Summary & Next Steps

Congratulations! You've now outlined a complete system for: ✅ **Setting up** your website (EduPlatform) as a LearnCard Issuer. ✅ **Creating a ConsentFlow Contract** to request permission to issue badges. ✅ Allowing users to **connect their LearnCard accounts** via a button on your site. ✅ **Handling the consent callback** to store user DIDs. ✅ **Automatically issuing a specific badge** (as a Verifiable Credential instance of a Boost) to a user's LearnCard wallet when they complete an action on your site.

This integrated approach provides a seamless experience for your users and a powerful way for your platform to issue verifiable digital recognition.

From here, you can explore:

* Creating a variety of [**Boosts**](../../core-concepts/credentials-and-data/boost-credentials.md) for different badges and achievements.
* Using [**Auto-Boosts**](../../core-concepts/consent-and-permissions/auto-boosts.md) within your ConsentFlow contract to issue an initial badge just for connecting.
* Implementing more detailed **error handling and user feedback** throughout the process.
