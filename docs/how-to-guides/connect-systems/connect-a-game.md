---
description: 'How-To Guid: Connect Your Educational Game with LearnCard GameFlow'
---

# Connect a Game

Want to enable your educational game to securely issue verifiable badges, track learning progress, and respect user privacy with robust guardian consent? This guide will walk you through integrating your game with LearnCard using **GameFlow**.

## **Our Example Use Case: "Math Adventures" Game**&#x20;

Imagine "Math Adventures," an online game designed to teach elementary school students fundamental math concepts. As students complete levels or master specific skills (e.g., "Addition Master," "Fraction Whiz"), Math Adventures wants to:

1. Allow parents/guardians to connect their child's LearnCard account.
2. Securely issue digital badges for these achievements directly to the child's LearnCard wallet, with guardian oversight.
3. Optionally, track in-game learning progress using xAPI statements linked to the student's LearnCard identity.

{% hint style="info" %}
GameFlow is a specialized framework built on LearnCard's powerful **ConsentFlow** system. It's designed to create a seamless and secure bridge between educational games and a student's LearnCard digital wallet. [Learn more.](../../core-concepts/consent-and-permissions/gameflow-overview.md)
{% endhint %}

## **What you'll accomplish in this Guide:**

1. Set up your game's backend as a LearnCard Issuer.
2. Create a "GameFlow Contract" with specific settings for guardian consent and data permissions.
3. Implement a "Connect with LearnCard" flow in your game for players/guardians.
4. Handle the consent callback to securely link a player's game account with their LearnCard DID (and capture delegate credentials for xAPI).
5. Automatically issue a "Level Completion" badge when a player achieves a milestone in your game.

## Prerequisites

* **LearnCard SDK Initialized (for your Game's Backend):** Your game's backend server will need an active `learnCard` instance.
* **Service Profile for Your Game:** Your game will need its own identity on the LearnCard Network.
* **Basic Understanding:** Familiarity with [DIDs](../../core-concepts/identities-and-keys/decentralized-identifiers-dids.md), [Verifiable Credentials (VCs),](../../core-concepts/credentials-and-data/verifiable-credentials-vcs.md) [Boosts](../../core-concepts/credentials-and-data/boost-credentials.md), and the [general ConsentFlow Tutorial ](../../tutorials/create-a-consentflow.md)is highly recommended. Understanding [xAPI Concepts ](../../tutorials/sending-xapi-statements.md)will be useful if you plan to use that feature.
* **Web Development Setup:**
  * A backend environment for your game (e.g., Node.js with Express).
  * A frontend for your game (HTML/JS, or your game engine's web interface).

## Part 1: Setting Up Your Game's Backend as an Issuer

Similar to other services, your game's backend needs a LearnCard identity to issue credentials.

### **Step 1.1: Initialize LearnCard SDK on Your Backend**

```typescript
// backend/game-learncard-setup.ts
import { initLearnCard } from '@learncard/init';
// import didkit from '@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm'; 

// IMPORTANT: Store your seed securely (e.g., environment variable in production)
const MATH_ADVENTURES_ISSUER_SEED = 'your-math-adventures-game-secure-hex-seed'; // Replace!

let gameLearnCardInstance; 

export async function getGameLearnCard() {
    if (gameLearnCardInstance) return gameLearnCardInstance;

    console.log('Initializing Math Adventures LearnCard SDK...');
    gameLearnCardInstance = await initLearnCard({
        seed: MATH_ADVENTURES_ISSUER_SEED,
        network: true,
        allowRemoteContexts: true,
        // didkit: didkit, 
    });
    console.log("Math Adventures LearnCard Initialized.");
    console.log("Math Adventures Issuer DID:", gameLearnCardInstance.id.did());
    return gameLearnCardInstance;
}

```

### **Step 1.2: Ensure Your Game Has a Service Profile**

```typescript
// backend/game-profile-manager.ts
import { getGameLearnCard } from './game-learncard-setup';

const GAME_PROFILE_ID = 'math-adventures-game';
const GAME_DISPLAY_NAME = 'Math Adventures Game';

export async function ensureGameProfile() {
    const learnCard = await getGameLearnCard();
    try {
        let profile = await learnCard.invoke.getProfile(GAME_PROFILE_ID);
        if (!profile) {
            console.log(`Creating service profile for Math Adventures: ${GAME_PROFILE_ID}`);
            await learnCard.invoke.createServiceProfile({
                profileId: GAME_PROFILE_ID,
                displayName: GAME_DISPLAY_NAME,
                image: 'https://example.com/math-adventures-logo.png' // Optional
            });
            console.log('Math Adventures Service Profile created successfully.');
        } else {
            console.log('Math Adventures Service Profile already exists.');
        }
    } catch (error: any) {
        // Handle potential errors, e.g., if profileId is already taken by someone else
        if (error.message?.includes('Profile ID already exists')) {
            console.log('Math Adventures Service Profile already exists (confirmed by error).');
        } else {
            console.error(`Failed to ensure Math Adventures profile: ${error.message}`);
        }
    }
}

// Call this during your game server's startup sequence
// ensureGameProfile();

```

{% hint style="success" %}
**Action:** Integrate this setup into your game server's initialization process.
{% endhint %}

## Part 2: Creating the GameFlow Contract

A GameFlow Contract is a specialized ConsentFlow Contract. It tells LearnCard what permissions your game needs and, crucially, enables guardian consent features.

### **Step 2.1: Define Your GameFlow Contract Terms**

```typescript
// backend/gameflow-contract.ts
import { getGameLearnCard } from './game-learncard-setup';

// IMPORTANT: This URL must be an endpoint on YOUR game's domain that can handle the redirect
const YOUR_GAME_CONSENT_CALLBACK_URL = 'https://mathadventures.example.com/learncard/callback';

const mathAdventuresGameFlowContract = {
    name: "Math Adventures - Connect & Save Progress",
    subtitle: "Unlock digital badges for your math achievements!",
    description: "Connect LearnCard to save your child's game progress and earn verifiable badges for mastering math skills. Guardian consent is required.",
    image: "https://example.com/math-adventures-contract.png", // Optional
    
    // --- GameFlow Specific Settings ---
    needsGuardianConsent: true, // This is KEY for GameFlow!
    redirectUrl: YOUR_GAME_CONSENT_CALLBACK_URL,
    reasonForAccessing: "Math Adventures uses LearnCard to save your child's learning progress, track achievements, and issue digital badges for completed levels and mastered skills. This helps create a verifiable record of their learning journey.",
    // --- End GameFlow Specific Settings ---

    contract: {
        read: { // What Math Adventures might want to read (e.g., existing math badges)
            credentials: {
                categories: {
                    "Achievement": { required: false } // e.g., to see if they already have certain math badges
                }
            }
        },
        write: { // What Math Adventures wants to write (issue)
            credentials: {
                categories: {
                    "Achievement": { required: true } // For issuing level completion, skill mastery badges
                }
            }
            // Optionally, if your game assigns unique IDs to players recognized by LearnCard
            // personal: { "MathAdventuresPlayerID": { required: false } } 
        }
    }
};

let gameFlowContractUriCache: string | null = null;

export async function getOrCreateGameFlowContractUri(): Promise<string> {
    if (gameFlowContractUriCache) return gameFlowContractUriCache;

    const learnCard = await getGameLearnCard();
    try {
        console.log('Creating Math Adventures GameFlow Contract...');
        const uri = await learnCard.invoke.createContract(mathAdventuresGameFlowContract);
        console.log('GameFlow Contract Created! URI:', uri);
        gameFlowContractUriCache = uri;
        return uri;
    } catch (error) {
        console.error('Error creating GameFlow contract:', error);
        throw error;
    }
}

```

**Key GameFlow Configurations:**

* `needsGuardianConsent: true`: Activates the guardian consent flow. The LearnCard App will guide an adult to verify their presence, select the child playing, and then grant consent.
* `redirectUrl`: Where the user (or guardian) is sent after the consent process. It will receive the consenting user's DID (which could be the child's or guardian's, depending on the flow) and potentially a Verifiable Presentation (`vp`) containing a Delegate Credential for xAPI.
* `reasonForAccessing`: A parent-friendly message explaining why your game needs access.

{% hint style="success" %}
**Action:** Have your game server create this contract (e.g., on startup or via an admin function) and securely store the returned `gameFlowContractUriCache`.
{% endhint %}

## Part 3: Frontend - "Connect with LearnCard" in Your Game

In your game's UI (e.g., settings menu, start screen, or when a significant achievement is reached for the first time), provide a button for players/guardians to connect their LearnCard.

```html
<button id="connectLearnCardGameBtn">Connect LearnCard & Save Progress</button>

<script>
    // This script would run in your game's frontend
    const connectGameButton = document.getElementById('connectLearnCardGameBtn');

    connectGameButton.addEventListener('click', async () => {
        try {
            // Fetch this URI from your game server
            const gameFlowContractUri = 'uri:contract:YOUR_GAMEFLOW_CONTRACT_URI'; // Replace!
            
            // Where the user should land in your game after the consent flow
            const gameReturnUrl = 'https://mathadventures.example.com/game/profile?learncard_setup=complete'; 

            if (gameFlowContractUri === 'uri:contract:YOUR_GAMEFLOW_CONTRACT_URI') {
                alert('Error: GameFlow Contract URI not configured. Please contact game admin.');
                return;
            }
            
            const consentUrl = `https://learncard.app/consent-flow?uri=${encodeURIComponent(gameFlowContractUri)}&returnTo=${encodeURIComponent(gameReturnUrl)}`;
            
            console.log('Redirecting to LearnCard for GameFlow consent:', consentUrl);
            // In a web game, this redirects the main window.
            // For native games using a webview, you'd load this URL in the webview.
            window.location.href = consentUrl; 
        } catch (error) {
            console.error('Error preparing GameFlow consent URL:', error);
            alert('Could not initiate LearnCard connection for the game. Please try again.');
        }
    });
</script>

```

{% hint style="success" %}
**Action:** Implement this button. It redirects to `learncard.app` for the GameFlow consent process (which includes guardian steps).
{% endhint %}

## Part 4: Handling the GameFlow Callback

After the consent process on `learncard.app` (which might involve guardian verification and child selection), the user is redirected back to your game's `redirectUrl` (e.g., `https://mathadventures.example.com/learncard/callback`).

This callback will include query parameters:

* `did`: The DID of the consenting user (this might be the child's DID if selected by a guardian, or the guardian's DID if they are consenting for themselves or if the child selection step wasn't needed/used).
* `vp` (Optional): A Verifiable Presentation (as a JWT string) containing a "Delegate Credential." This is crucial if you plan to send xAPI statements on behalf of the user.

### **Step 4.1: Backend - Create a Callback Endpoint**

```typescript
// backend/routes/gameAuthRoutes.ts (example using Express.js)
// import express from 'express';
// const gameAuthRouter = express.Router();

// This is your endpoint: e.g., GET https://mathadventures.example.com/learncard/callback
// gameAuthRouter.get('/learncard/callback', async (req, res) => {
async function handleGameFlowCallback(req, res) { // req, res are Express request/response
    const userDid = req.query.did as string;
    const delegateVpJwt = req.query.vp as string; // JWT string for the Verifiable Presentation

    console.log(`GameFlow callback received for User DID: ${userDid}`);
    if (delegateVpJwt) {
        console.log(`Received Delegate Credential VP (JWT - first 50 chars): ${delegateVpJwt.substring(0,50)}...`);
        // TODO: You should verify this VP and extract the Delegate Credential.
        // This credential allows your game server to make xAPI calls on behalf of userDid.
        // Store this delegateVpJwt or the extracted credential securely, associated with userDid.
    }

    if (userDid) {
        // TODO:
        // 1. Get your game's internal player ID (e.g., from the current session if the user was logged into your game)
        const internalPlayerId = req.session?.playerId; // Example

        if (!internalPlayerId) {
            console.error('Game player session not found during GameFlow callback.');
            // res.status(400).send('Player session not found. Please log in to Math Adventures first.');
            return; 
        }

        // 2. Securely store the userDid (and delegateVpJwt if applicable) in your game's database, 
        //    associating it with the internalPlayerId.
        //    Example: await gameDb.players.update({ id: internalPlayerId }, { learnCardDid: userDid, delegateVp: delegateVpJwt });
        console.log(`ACTION: Store LearnCard DID ${userDid} for game player ${internalPlayerId}`);
        if (delegateVpJwt) {
            console.log(`ACTION: Store Delegate VP JWT for game player ${internalPlayerId} to enable xAPI statements.`);
        }
        
        // 3. Redirect the user back into your game, perhaps to a success page or their profile.
        //    The `returnTo` parameter used in Part 3 would typically handle this final redirect.
        //    If not using `returnTo`, then redirect from here:
        //    res.redirect('https://mathadventures.example.com/game/profile?learncard_connected=true');
        console.log('Redirecting player back into the game...');
    } else {
        console.error('GameFlow callback error: DID not found in query parameters.');
        // res.status(400).send('LearnCard GameFlow connection failed or was denied.');
    }
}
// export default gameAuthRouter;

```

{% hint style="success" %}
**Action:** Implement this callback endpoint. Securely store the `userDid` (and `delegateVpJwt`) associated with the player in your game.
{% endhint %}

## Part 5: Issuing a Game Achievement Badge

When a player completes a level or masters a skill in Math Adventures:

### **Step 5.1: Create a Boost for Your Game Badge (One-time Setup)**&#x20;

Similar to the "Issue Badges from a Website" tutorial, create a Boost for each type of badge (e.g., "Addition Level 1 Complete").

```typescript
// backend/game-badge-manager.ts
import { getGameLearnCard } from './game-learncard-setup';
import { randomUUID } from 'crypto';

const ADDITION_L1_BOOST_NAME = 'Math Adventures: Addition Level 1 Badge';
let additionL1BoostUri: string | null = null;

export async function getOrCreateAdditionL1Boost(): Promise<string> {
    if (additionL1BoostUri) return additionL1BoostUri;
    const learnCard = await getGameLearnCard();
    const badgeTemplate = { /* ... Define your badge VC structure ... */ 
        "@context": ["https://www.w3.org/2018/credentials/v1", "https://purl.imsglobal.org/spec/ob/v3p0/context.json", "https://ctx.learncard.com/boosts/1.0.0.json"],
        type: ["VerifiableCredential", "OpenBadgeCredential", "BoostCredential"],
        name: ADDITION_L1_BOOST_NAME,
        credentialSubject: {
            achievement: {
                achievementType: "Badge",
                name: "Addition Level 1 Mastered",
                description: "Awarded for successfully completing all challenges in Addition Level 1 of Math Adventures.",
                id: "urn:uuid:" + randomUUID(),
                image: "https://example.com/badges/math-addition-l1.png",
                type: ["Achievement"],
                criteria: { narrative: "Player demonstrated proficiency in single-digit addition."}
            },
            type: ["AchievementSubject"]
        },
        display: { backgroundColor: "#4CAF50", displayType: "badge" },
        image: "https://example.com/badges/math-addition-l1.png"
    };
    const boostMetadata = { name: ADDITION_L1_BOOST_NAME, description: 'Awards a badge for completing Addition Level 1.', category: 'Achievement' };
    try {
        console.log('Creating Addition Level 1 Boost...');
        additionL1BoostUri = await learnCard.invoke.createBoost(badgeTemplate, boostMetadata);
        console.log('Addition Level 1 Boost Created! URI:', additionL1BoostUri);
        return additionL1BoostUri;
    } catch (error) { /* ... error handling ... */ throw error; }
}
// getOrCreateAdditionL1Boost(); // Call on server startup

```

{% hint style="success" %}
**Action:** Create Boosts for all your game's achievements. Store their URIs.
{% endhint %}

### **Step 5.2: Backend Logic - Issue Badge on Achievement**

```typescript
// backend/game-achievements.ts
import { getGameLearnCard } from './game-learncard-setup';
import { getOrCreateGameFlowContractUri } from './gameflow-contract';
import { getOrCreateAdditionL1Boost } from './game-badge-manager';
import { randomUUID } from 'crypto';

export async function awardAdditionLevel1Badge(internalPlayerId: string, playerName: string) {
    const learnCard = await getGameLearnCard();
    
    // 1. Retrieve the player's LearnCard DID (stored in Part 4)
    // const playerLearnCardDid = await gameDb.players.getLearnCardDid(internalPlayerId); // Example
    const playerLearnCardDid = 'PLAYER_DID_FROM_YOUR_DB'; // Replace with actual lookup

    if (!playerLearnCardDid) {
        console.log(`Player ${internalPlayerId} has not connected LearnCard. Cannot issue badge.`);
        return;
    }

    try {
        const gameContractUri = await getOrCreateGameFlowContractUri();
        const boostUriToIssue = await getOrCreateAdditionL1Boost();

        const credentialForPlayer = {
            "@context": ["https://www.w3.org/2018/credentials/v1", "https://purl.imsglobal.org/spec/ob/v3p0/context.json", "https://ctx.learncard.com/boosts/1.0.0.json"],
            id: "urn:uuid:" + randomUUID(),
            type: ["VerifiableCredential", "OpenBadgeCredential", "BoostCredential", "AchievementCredential"],
            issuer: learnCard.id.did(), // Game's DID
            issuanceDate: new Date().toISOString(),
            name: `Math Adventures: Addition Level 1 - ${playerName}`,
            credentialSubject: {
                id: playerLearnCardDid, // The player's DID
                achievement: {
                    achievementType: "Badge",
                    name: "Addition Level 1 Mastered",
                    description: `Awarded to ${playerName} for mastering Addition Level 1.`,
                }
            }
        };
        
        console.log(`Issuing Addition L1 badge to ${playerLearnCardDid} via contract ${gameContractUri}`);
        const issuedCredentialUri = await learnCard.invoke.writeCredentialToContract(
            playerLearnCardDid,
            gameContractUri,
            credentialForPlayer,
            boostUriToIssue
        );
        console.log(`Addition L1 Badge successfully issued to ${playerLearnCardDid}! Credential URI: ${issuedCredentialUri}`);
    } catch (error) {
        console.error(`Error issuing Addition L1 badge to player ${internalPlayerId}:`, error);
    }
}

// Example: When player completes level 1
// awardAdditionLevel1Badge('game_player_789', 'Player One');

```

{% hint style="success" %}
**Action:** Integrate this logic into your game's achievement system.
{% endhint %}

## Part 6: (Optional) Sending xAPI Statements

If you captured the `delegateVpJwt` in Part 4, your game server can now send xAPI statements on behalf of the user.

```typescript
// backend/xapi-handler.ts

// Assume userDid and delegateVpJwt were stored for the player
// const userDid = 'PLAYER_DID_FROM_YOUR_DB'; e.g. `did:web:network.learncard.com:users:${profileId}`
// const delegateVpJwt = 'JWT_STRING_CAPTURED_FROM_CALLBACK'; 
// const xapiEndpoint = 'https://cloud.learncard.com/xapi/statements';

async function sendGameXAPIStatement(playerDid: string, playerDelegateVpJwt: string, verbId: string, verbDisplay: string, activityId: string, activityName: string, activityDesc: string) {
    const statement = {
        actor: {
            objectType: "Agent",
            name: playerDid,
            account: { homePage: "https://www.w3.org/TR/did-core/", name: playerDid }
        },
        verb: { id: verbId, display: { "en-US": verbDisplay } },
        object: {
            id: activityId,
            definition: { name: { "en-US": activityName }, description: { "en-US": activityDesc }, type: "http://adlnet.gov/expapi/activities/serious-game" }
        }
    };

    try {
        const response = await fetch(xapiEndpoint, { // Ensure xapiEndpoint is defined
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Experience-API-Version': '1.0.3',
                'X-VP': playerDelegateVpJwt // Use the Delegate VP JWT for authentication
            },
            body: JSON.stringify(statement)
        });
        if (!response.ok) { /* ... error handling ... */ }
        const responseData = await response.json();
        console.log('xAPI statement for game activity sent successfully:', responseData);
    } catch (error) { /* ... error handling ... */ }
}

// Example: Player started a new puzzle
// sendGameXAPIStatement(
//     userDid, 
//     delegateVpJwt,
//     "http://adlnet.gov/expapi/verbs/attempted", "attempted",
//     "https://mathadventures.example.com/puzzles/addition_5", "Addition Puzzle 5", "Attempted puzzle 5 in Addition Level 1."
// );

```

This allows rich tracking of in-game learning, authenticated as the user via the delegate credential.

## Summary & Next Steps

You've now learned how to integrate your educational game with LearnCard using GameFlow! This includes: ✅ Setting up your game as an Issuer. ✅ Creating a GameFlow Contract with guardian consent. ✅ Enabling players/guardians to connect their LearnCard accounts. ✅ Handling the callback to link game accounts with LearnCard DIDs (and capture delegate VPs for xAPI). ✅ Automatically issuing achievement badges to players via the GameFlow contract. ✅ (Optionally) Sending authenticated xAPI statements.

This robust integration enhances your game by providing verifiable recognition for players and valuable, secure data tracking capabilities, all while prioritizing user control and safety.

Explore further:

* Dive deeper into the [ConsentFlow Core Concepts](../../core-concepts/consent-and-permissions/consentflow-overview.md) that power [GameFlow](../../core-concepts/consent-and-permissions/gameflow-overview.md).
* Learn more about [xAPI](../../core-concepts/credentials-and-data/xapi-data.md) and its integration with LearnCard.
* Design various [**Boosts**](../../core-concepts/credentials-and-data/boost-credentials.md) for all the unique achievements and skills in your game.
