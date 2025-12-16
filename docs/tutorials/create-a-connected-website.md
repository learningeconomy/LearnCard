---
description: 'Tutorial: Build ''Pixel Pet Designer'' & Connect with LearnCard GameFlow'
---

# Create a Connected Website

Welcome, game developer! This tutorial is a practical, step-by-step lesson where you'll build a simple web application called "Pixel Pet Designer." More importantly, you'll learn how to integrate it with LearnCard using **GameFlow** to issue unique, verifiable digital badges to your users for their creations, complete with guardian consent for younger players.

{% hint style="info" %}
**What is GameFlow?** GameFlow is LearnCard's specialized framework for educational games. It allows your game to securely interact with a player's LearnCard digital wallet to issue achievement badges and, optionally, track learning progress. A key feature is its built-in **guardian consent system**, ensuring a safe experience for younger learners. (For a deeper dive, see our [GameFlow Core Concept](../core-concepts/consent-and-permissions/gameflow-overview.md).)
{% endhint %}

## **Our Project: Pixel Pet Designer**&#x20;

We'll create a fun, simple app where users can:

1. Design a pixel art pet on a 10x10 grid.
2. Name their pet.
3. "Submit" their design. Upon submission, our app will:
4. Prompt the user (and their guardian, if applicable) to connect their LearnCard account via GameFlow.
5. Issue a verifiable digital badge (a "Pixel Pet Creation" badge) containing the pet's name and its design data.

This tutorial focuses on the **learning experience** of integrating LearnCard. We'll keep the game logic itself very simple to concentrate on the GameFlow integration.

## **What you'll learn by doing:**

* How to set up your web application's backend as a LearnCard Issuer.
* How to define and create a **GameFlow Contract**, including `needsGuardianConsent`.
* How to implement a "Connect with LearnCard" button on your website.
* How your backend can handle the LearnCard callback, capturing the player's DID after consent (including the guardian flow).
* How to issue a Verifiable Credential (badge) with custom data (the pet's name and design) from your application.

## **Prerequisites:**

* **Node.js (v16+ recommended):** For running a simple backend server.
* **Basic HTML, CSS, and JavaScript knowledge:** We'll build a simple frontend.
* **Text Editor:** Your favorite code editor (e.g., VS Code).
* **LearnCard SDK Packages:** You'll install these in your project.
* **A Secure Seed for your Issuer:** A 64-character hexadecimal string. **For this tutorial, generate one for testing; for production, it must be cryptographically random and kept highly secure.**
* **Familiarity (Recommended):** Briefly review DIDs, Verifiable Credentials (VCs), and the general ConsentFlow Tutorial.

Let's get started!

## Part 1: Setting Up the "Pixel Pet Designer" Frontend

First, let's create the basic visual part of our application.

### **Step 1.1: Project Setup**&#x20;

Create a new folder for your project, e.g., `pixel-pet-designer`. Inside it, create the following files:

* `index.html`
* `style.css`
* `app.js`
* `server.js` (We'll work on this later for the backend)

### **Step 1.2: `index.html` - The Basic Structure**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pixel Pet Designer</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>Pixel Pet Designer</h1>
        
        <div class="controls">
            <label for="petName">Pet Name:</label>
            <input type="text" id="petName" placeholder="My Awesome Pet">
            
            <label for="colorPicker">Pick a Color:</label>
            <input type="color" id="colorPicker" value="#3498db">
        </div>

        <div id="pixelGrid" class="pixel-grid">
            </div>

        <button id="submitPetBtn">Create & Get Badge!</button>
        
        <div id="learnCardConnectArea" style="margin-top: 20px; padding: 15px; border: 1px dashed #ccc; display: none;">
            <p id="lcStatus">Connect your LearnCard to save your pet as a badge!</p>
            <button id="connectLearnCardBtn" style="display: none;">Connect with LearnCard</button>
        </div>

        <div id="badgeResultArea" style="margin-top: 20px; display: none;">
            <h3>Badge Issued!</h3>
            <p>Your "Pixel Pet Creation" badge has been sent to your LearnCard wallet.</p>
            <p>Pet Name: <span id="resultPetName"></span></p>
            <p>Pet Design (Data URI): <a id="resultPetDesignLink" href="#" target="_blank">View Design</a></p>
            <div id="resultPetPreview" style="width: 100px; height: 100px; border: 1px solid black; margin-top: 10px;"></div>
        </div>
    </div>
    <script src="app.js"></script>
</body>
</html>

```

### **Step 1.3: `style.css` - Basic Styling**

```css
body {
    font-family: sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f0f0f0;
    margin: 0;
    color: #333;
}
.container {
    background-color: white;
    padding: 25px;
    border-radius: 8px;
    box-shadow: 0 0 15px rgba(0,0,0,0.1);
    text-align: center;
}
.controls {
    margin-bottom: 20px;
    display: flex;
    gap: 15px;
    align-items: center;
    justify-content: center;
}
.controls label {
    font-weight: bold;
}
.controls input[type="text"] {
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
}
.controls input[type="color"] {
    width: 40px;
    height: 40px;
    border: none;
    padding: 0;
    border-radius: 4px;
    cursor: pointer;
}
.pixel-grid {
    display: grid;
    grid-template-columns: repeat(10, 30px);
    grid-template-rows: repeat(10, 30px);
    width: 300px; /* 10 * 30px */
    height: 300px; /* 10 * 30px */
    border: 1px solid #ccc;
    margin: 20px auto;
}
.pixel {
    width: 30px;
    height: 30px;
    background-color: #ffffff;
    border: 1px solid #eee;
    box-sizing: border-box;
}
.pixel:hover {
    opacity: 0.7;
}
button {
    background-color: #007bff;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.2s;
}
button:hover {
    background-color: #0056b3;
}
button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

```

### **Step 1.4: `app.js` - Basic Frontend Logic (Pixel Grid)**

```typescript
// app.js
const pixelGrid = document.getElementById('pixelGrid');
const colorPicker = document.getElementById('colorPicker');
const petNameInput = document.getElementById('petName');
const submitPetBtn = document.getElementById('submitPetBtn');

const learnCardConnectArea = document.getElementById('learnCardConnectArea');
const connectLearnCardBtn = document.getElementById('connectLearnCardBtn');
const lcStatus = document.getElementById('lcStatus');

const badgeResultArea = document.getElementById('badgeResultArea');
const resultPetName = document.getElementById('resultPetName');
const resultPetDesignLink = document.getElementById('resultPetDesignLink');
const resultPetPreview = document.getElementById('resultPetPreview');


const gridSize = 10;
let currentDrawingColor = colorPicker.value;
let pixelData = Array(gridSize * gridSize).fill('#ffffff'); // Store colors

colorPicker.addEventListener('input', (event) => {
    currentDrawingColor = event.target.value;
});

// Create Grid
for (let i = 0; i < gridSize * gridSize; i++) {
    const pixel = document.createElement('div');
    pixel.classList.add('pixel');
    pixel.addEventListener('click', () => {
        pixel.style.backgroundColor = currentDrawingColor;
        pixelData[i] = currentDrawingColor;
    });
    pixelGrid.appendChild(pixel);
}

// Initially, the submit button might be disabled until LearnCard is connected
submitPetBtn.disabled = true; 
learnCardConnectArea.style.display = 'block'; // Show connection area
connectLearnCardBtn.style.display = 'inline-block'; // Show connect button

// We'll add more logic for LearnCard connection and pet submission later.
logToPage("Frontend initialized. Ready to connect LearnCard.");

function logToPage(message) { // Simple logger for frontend messages
    console.log(message);
    // In a real app, you might have a dedicated status area on the page.
}

```

At this point, you should be able to open `index.html` in your browser and see the Pixel Pet Designer interface. You can draw, but submitting doesn't do anything related to LearnCard yet.

## Part 2: Setting Up the Backend (Issuer & GameFlow Contract)

Your game's backend will handle LearnCard initialization, contract creation, and credential issuance. We'll use Node.js with conceptual Express-like routing for this tutorial.

### **Step 2.1: Install Dependencies**&#x20;

In your project folder (`pixel-pet-designer`), open your terminal:

```bash
npm init -y
npm install express @learncard/init # Add any other backend dependencies
# If using TypeScript for backend: npm install typescript @types/express @types/node ts-node --save-dev

```

### **Step 2.2: Backend Setup (`server.js`)**&#x20;

Create `server.js`:

```typescript
// server.js
const express = require('express'); // Or import express from 'express'; if using ES modules
const { initLearnCard } = require('@learncard/init'); 

const app = express();
const port = 3000; // Port for your backend server

app.use(express.json()); // Middleware to parse JSON bodies

// --- LearnCard Issuer Setup ---
// IMPORTANT: Store your seed securely (e.g., environment variable in production)
const PIXELPET_ISSUER_SEED = 'YOUR_PIXELPET_GAME_SECURE_64_CHAR_HEX_SEED'; // Replace!
const PIXELPET_PROFILE_ID = 'pixelpet-designer-game';
const PIXELPET_DISPLAY_NAME = 'Pixel Pet Designer Official';

// This URL must be publicly accessible for LearnCard redirect. 
const YOUR_GAME_CALLBACK_URL = 'http://localhost:3000/learncard-callback'; 

let gameLearnCardInstance;
let gameFlowContractUriCache = null;

async function initializeLearnCardIssuer() {
    if (gameLearnCardInstance) return gameLearnCardInstance;
    if (PIXELPET_ISSUER_SEED === 'YOUR_PIXELPET_GAME_SECURE_64_CHAR_HEX_SEED') {
        console.error("FATAL: Please replace YOUR_PIXELPET_GAME_SECURE_64_CHAR_HEX_SEED in server.js");
        process.exit(1);
    }

    console.log('Initializing Pixel Pet Issuer LearnCard SDK...');
    gameLearnCardInstance = await initLearnCard({
        seed: PIXELPET_ISSUER_SEED,
        network: true,
        allowRemoteContexts: true,
    });
    console.log("Pixel Pet Issuer LearnCard Initialized.");
    console.log("Pixel Pet Issuer DID:", gameLearnCardInstance.id.did());

    // Ensure Service Profile
    try {
        let profile = await gameLearnCardInstance.invoke.getProfile(PIXELPET_PROFILE_ID);
        if (!profile) {
            console.log(`Creating service profile: ${PIXELPET_PROFILE_ID}`);
            await gameLearnCardInstance.invoke.createServiceProfile({
                profileId: PIXELPET_PROFILE_ID,
                displayName: PIXELPET_DISPLAY_NAME,
            });
            console.log('Pixel Pet Service Profile created.');
        } else {
            console.log('Pixel Pet Service Profile already exists.');
        }
    } catch (error) {
        if (error.message?.includes('Profile ID already exists')) {
            console.log('Pixel Pet Service Profile already exists (confirmed by error).');
        } else {
            console.error(`Failed to ensure Pixel Pet profile: ${error.message}`);
        }
    }
    return gameLearnCardInstance;
}

// --- GameFlow Contract Definition & Creation ---
const pixelPetGameFlowContract = {
    name: "Pixel Pet Designer - Badge Connection",
    subtitle: "Connect to save your pixel pet designs as verifiable badges!",
    description: "Allows Pixel Pet Designer to issue you a unique badge for each pet you create. Guardian consent is required for younger designers.",
    needsGuardianConsent: true, // KEY for GameFlow
    redirectUrl: YOUR_GAME_CALLBACK_URL,
    reasonForAccessing: "Pixel Pet Designer needs permission to issue you a digital badge for your created pet. This badge will include your pet's name and its design.",
    contract: {
        read: { /* We don't need to read anything for this simple example */ },
        write: {
            credentials: {
                categories: { "Achievement": { required: true } } // We will issue "Achievement" badges
            }
        }
    }
};

async function getOrCreateGameFlowContract() {
    if (gameFlowContractUriCache) return gameFlowContractUriCache;
    if (!gameLearnCardInstance) await initializeLearnCardIssuer();

    console.log('Creating Pixel Pet GameFlow Contract...');
    try {
        const uri = await gameLearnCardInstance.invoke.createContract(pixelPetGameFlowContract);
        console.log('Pixel Pet GameFlow Contract Created! URI:', uri);
        gameFlowContractUriCache = uri;
        return uri;
    } catch (error) {
        console.error('Error creating GameFlow contract:', error);
        throw error;
    }
}

// Initialize everything on server start
(async () => {
    await initializeLearnCardIssuer();
    await getOrCreateGameFlowContract(); // Create contract on startup
})();

// --- API Endpoints for Frontend ---
app.get('/api/get-consent-url', async (req, res) => {
    try {
        const contractUri = await getOrCreateGameFlowContract();
        // The frontend will redirect the user to this LearnCard page
        const consentUrl = `https://learncard.app/consent-flow?uri=${encodeURIComponent(contractUri)}&returnTo=${encodeURIComponent(YOUR_GAME_CALLBACK_URL)}`;
        res.json({ consentUrl });
    } catch (error) {
        console.error("Error in /api/get-consent-url:", error);
        res.status(500).json({ error: "Could not generate consent URL." });
    }
});

// We'll add more endpoints later for the callback and issuing badges.

app.listen(port, () => {
    console.log(`Pixel Pet Designer backend listening on http://localhost:${port}`);
    console.log(`Ensure your GameFlow Contract redirectUrl is set to: ${YOUR_GAME_CALLBACK_URL}`);
});

```

{% hint style="success" %}
## **Action**

* Replace `YOUR_PIXELPET_GAME_SECURE_64_CHAR_HEX_SEED` with a unique 64-character hex string.
* Start your backend: `node server.js` (or `npx ts-node server.js` if using TypeScript).
{% endhint %}

## Part 3: Connecting LearnCard - Frontend

Now, let's make the "Connect with LearnCard" button functional.

### **Step 3.1: Update `app.js` to Fetch Consent URL**

```typescript
// app.js - (add to existing app.js content)

// ... (keep existing variable declarations and grid creation logic) ...

connectLearnCardBtn.addEventListener('click', async () => {
    logToPage("Attempting to connect LearnCard...");
    connectLearnCardBtn.disabled = true;
    lcStatus.textContent = "Preparing connection...";

    try {
        // Ask our backend for the consent URL (which includes our GameFlow Contract URI)
        const response = await fetch('/api/get-consent-url'); // Assumes frontend and backend on same origin during dev, or configure CORS
        if (!response.ok) {
            throw new Error(`Failed to get consent URL: ${response.statusText}`);
        }
        const data = await response.json();
        
        if (data.consentUrl) {
            logToPage(`Redirecting to LearnCard for consent: ${data.consentUrl}`);
            window.location.href = data.consentUrl; // Redirect user
        } else {
            throw new Error("Consent URL not received from backend.");
        }
    } catch (error) {
        logToPage(`Error connecting LearnCard: ${error.message}`);
        lcStatus.textContent = "Connection failed. Please try again.";
        connectLearnCardBtn.disabled = false;
    }
});

// ... (rest of app.js) ...

```

{% hint style="success" %}
## **Action**&#x20;

Test this. Open `index.html`. Your backend server (`server.js`) should be running. Clicking the "Connect with LearnCard" button should now redirect you to `learncard.app`. You'll see your GameFlow contract details. Since `needsGuardianConsent: true`, you'll be guided through the guardian consent flow.
{% endhint %}

## Part 4: Connecting LearnCard - Backend Callback

After the user (and guardian, if applicable) consents on `learncard.app`, they are redirected back to `YOUR_GAME_CALLBACK_URL` (`http://localhost:3000/learncard-callback`).

### **Step 4.1: Implement the Callback Endpoint in `server.js`**

```typescript
// server.js - (add this endpoint to your Express app)

// ... (keep existing setup and /api/get-consent-url endpoint) ...

app.get('/learncard-callback', async (req, res) => {
    const userDid = req.query.did; // The DID of the child/player, if guardian flow completed successfully
    const delegateVpJwt = req.query.vp; // Optional: Verifiable Presentation with Delegate Credential for xAPI

    console.log('Received LearnCard Callback:');
    console.log('  User/Player DID:', userDid);
    console.log('  Delegate VP JWT (first 50 chars if any):', delegateVpJwt ? delegateVpJwt.substring(0,50) + '...' : 'N/A');

    if (!userDid) {
        console.error('LearnCard callback error: User DID not found.');
        // Redirect to an error page on your frontend
        return res.redirect('/#learncard-error=did_missing'); 
    }

    // --- IMPORTANT: Link userDid to your game's internal player account ---
    // In a real game, you'd have a way to know which of YOUR game players this callback is for.
    // This might involve:
    // 1. Storing a temporary state in the user's session before redirecting to LearnCard.
    // 2. Using the `returnTo` URL to pass back a unique identifier for your game session.
    // For this tutorial, we'll assume you can identify the game player.
    const internalGamePlayerId = "player123"; // Placeholder - replace with actual player ID logic

    console.log(`Associating LearnCard DID ${userDid} with game player ${internalGamePlayerId}.`);
    // Example: Save to your database
    // await YourGameDatabase.linkLearnCardDid(internalGamePlayerId, userDid, guardianDid, delegateVpJwt);
    
    // For the frontend to know, we can use a query parameter or session state
    // Redirecting to a page that indicates success and stores the DID client-side (for demo purposes)
    // In production, you'd likely handle this association server-side and update session state.
    const frontendRedirectUrl = `/index.html?learncard_did=${encodeURIComponent(userDid)}&status=connected`;
    res.redirect(frontendRedirectUrl);
});

// ... (rest of server.js) ...

```

### **Step 4.2: Frontend - Handle Successful Connection (`app.js`)**&#x20;

Update `app.js` to check for the `learncard_did` from the redirect and update the UI.

```typescript
// app.js - (add this to existing app.js content)

// ... (existing variables) ...

window.addEventListener('DOMContentLoaded', () => {
    const queryParams = new URLSearchParams(window.location.search);
    const connectedDid = queryParams.get('learncard_did');
    const connectionStatus = queryParams.get('status');

    if (connectionStatus === 'connected' && connectedDid) {
        logToPage(`Successfully connected LearnCard! Player DID: ${connectedDid}`);
        lcStatus.textContent = `LearnCard Connected! DID: ${connectedDid.substring(0, 20)}...`;
        connectLearnCardBtn.style.display = 'none';
        submitPetBtn.disabled = false; // Enable pet submission!

        // Store the DID for later use (e.g., when submitting the pet)
        sessionStorage.setItem('learnCardPlayerDid', connectedDid);

        // Clean up URL params (optional)
        // window.history.replaceState({}, document.title, "/index.html"); 
    } else if (window.location.hash.includes('learncard-error')) {
        logToPage("LearnCard connection failed or was cancelled.");
        lcStatus.textContent = "LearnCard connection failed. Please try again.";
        connectLearnCardBtn.disabled = false;
    }
});

// ... (rest of app.js) ...

```

{% hint style="success" %}
## **Action**

* Restart your `server.js`.
* Go through the "Connect LearnCard" flow from your `index.html`.
* Complete the consent (and guardian steps if prompted) on `learncard.app`.
* You should be redirected back to `index.html` (or your specified callback, then to index.html), and the UI should update to show the connected DID. The "Create & Get Badge!" button should now be enabled.
{% endhint %}

## Part 5: Designing & Submitting a Pet (Frontend)

This part focuses on capturing the pet design and name.

### **Step 5.1: Update `app.js` for Pet Submission**

```typescript
// app.js - (add to existing app.js content)

// ... (existing variables and functions) ...

submitPetBtn.addEventListener('click', async () => {
    const petName = petNameInput.value.trim();
    const connectedDid = sessionStorage.getItem('learnCardPlayerDid');

    if (!petName) {
        alert("Please give your pixel pet a name!");
        return;
    }
    if (!connectedDid) {
        alert("LearnCard not connected. Please connect your LearnCard first.");
        // Optionally, re-trigger connection flow or show the button
        learnCardConnectArea.style.display = 'block';
        connectLearnCardBtn.style.display = 'inline-block';
        submitPetBtn.disabled = true;
        return;
    }

    logToPage(`Submitting pet: ${petName} for DID: ${connectedDid}`);
    submitPetBtn.disabled = true;
    lcStatus.textContent = "Creating your pet badge...";

    // Prepare pet data (name and pixelData)
    const petSubmissionData = {
        playerName: petName, // Using the input field as player/pet name for simplicity
        petDesign: pixelData, // The array of colors from the grid
        playerLearnCardDid: connectedDid
    };

    try {
        // Send this data to your backend to issue the badge
        const response = await fetch('/api/issue-pet-badge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(petSubmissionData)
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.error || `Failed to issue badge: ${response.statusText}`);
        }

        const result = await response.json();
        logToPage(`Badge issued successfully! Credential URI: ${result.credentialUri}`);
        lcStatus.textContent = "Badge Issued! Check your LearnCard App.";

        // Display badge result on page
        resultPetName.textContent = result.issuedPetName;
        
        // Create a data URI for the pixel art to display it
        const canvas = document.createElement('canvas');
        canvas.width = 10 * 10; // 10 pixels per grid square, 10 squares
        canvas.height = 10 * 10;
        const ctx = canvas.getContext('2d');
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                ctx.fillStyle = pixelData[r * gridSize + c];
                ctx.fillRect(c * 10, r * 10, 10, 10);
            }
        }
        const petImageURI = canvas.toDataURL();
        resultPetDesignLink.href = petImageURI;
        resultPetPreview.innerHTML = `<img src="${petImageURI}" alt="Pixel Pet Preview" style="image-rendering: pixelated; width: 100%; height: 100%;">`;
        
        badgeResultArea.style.display = 'block';

    } catch (error) {
        logToPage(`Error issuing pet badge: ${error.message}`);
        lcStatus.textContent = "Failed to issue badge. Please try again.";
    } finally {
        submitPetBtn.disabled = false; // Re-enable for another try or new pet
    }
});

// ... (rest of app.js) ...

```

## Part 6: Issuing the Pet Badge (Backend)

When the frontend submits the pet data, your backend issues the Verifiable Credential.

### **Step 6.1: Create a Boost for "Pixel Pet Creation" Badges (One-time Setup)**&#x20;

Add this to your `server.js` (or a separate `badge-manager.js` like in the previous tutorial).

```typescript
// server.js - (add near other LearnCard setup)
// ... (imports and existing setup) ...

const PIXELPET_BADGE_BOOST_NAME = 'Pixel Pet Creation Badge';
let pixelPetBoostUriCache = null;

async function getOrCreatePixelPetBoost() {
    if (pixelPetBoostUriCache) return pixelPetBoostUriCache;
    if (!gameLearnCardInstance) await initializeLearnCardIssuer();

    const badgeTemplate = {
        "@context": [
            "https://www.w3.org/2018/credentials/v1",
            "https://purl.imsglobal.org/spec/ob/v3p0/context.json",
            "https://ctx.learncard.com/boosts/1.0.0.json"
        ],
        type: ["VerifiableCredential", "OpenBadgeCredential", "BoostCredential"],
        name: PIXELPET_BADGE_BOOST_NAME, // This will be part of the issued VC name
        credentialSubject: {
            // id will be the recipient's DID
            achievement: {
                achievementType: "Badge",
                name: "Pixel Pet Creator", // General name for the achievement type
                description: "Awarded for designing and creating a unique Pixel Pet!",
                id: "urn:uuid:" + require('crypto').randomUUID(), // Unique ID for this achievement definition
                image: "https://placehold.co/100x100/FFD700/000000?text=Pet!", // Placeholder badge image for the Boost
                type: ["Achievement"],
                criteria: { narrative: "User designed a custom pixel art pet and named it."}
            },
            type: ["AchievementSubject"]
        },
        display: { backgroundColor: "#FF69B4", displayType: "badge" }, // Hot Pink!
        image: "https://placehold.co/100x100/FF69B4/FFFFFF?text=Pet!"
    };
    const boostMetadata = { 
        name: PIXELPET_BADGE_BOOST_NAME, 
        description: 'Awards a badge for creating a Pixel Pet.', 
        category: 'Achievement' 
    };
    try {
        console.log('Creating Pixel Pet Creation Boost...');
        const uri = await gameLearnCardInstance.invoke.createBoost(badgeTemplate, boostMetadata);
        console.log('Pixel Pet Creation Boost Created! URI:', uri);
        pixelPetBoostUriCache = uri;
        return uri;
    } catch (error) {
        console.error('Error creating Pixel Pet Boost:', error);
        throw error;
    }
}

// Ensure this is called on server startup, after initializeLearnCardIssuer()
// Add to your IIFE:
// (async () => {
//     await initializeLearnCardIssuer();
//     await getOrCreateGameFlowContract(); 
//     await getOrCreatePixelPetBoost(); // Add this line
// })();

```

{% hint style="success" %}
## **Action**

Update your server startup to include `await getOrCreatePixelPetBoost();`.
{% endhint %}

### **Step 6.2: Backend - Create the `/api/issue-pet-badge` Endpoint**

Add this new route to your `server.js`.

```typescript
// server.js - (add this endpoint)
// ... (imports and existing setup and routes) ...

app.post('/api/issue-pet-badge', async (req, res) => {
    if (!gameLearnCardInstance || !gameFlowContractUriCache || !pixelPetBoostUriCache) {
        return res.status(500).json({ error: "Backend not fully initialized." });
    }

    const { playerName, petDesign, playerLearnCardDid } = req.body;

    if (!playerName || !petDesign || !playerLearnCardDid) {
        return res.status(400).json({ error: "Missing pet name, design, or player DID." });
    }

    console.log(`Attempting to issue Pixel Pet badge for ${playerName} to DID ${playerLearnCardDid}`);

    try {
        // The credential we issue will be an *instance* of the Pixel Pet Boost.
        // We personalize the `credentialSubject` for this specific instance.
        const petCredentialInstance = {
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
                "https://purl.imsglobal.org/spec/ob/v3p0/context.json",
                "https://ctx.learncard.com/boosts/1.0.0.json"
            ],
            id: "urn:uuid:" + require('crypto').randomUUID(), // Unique ID for THIS credential instance
            type: ["VerifiableCredential", "OpenBadgeCredential", "BoostCredential"],
            name: 'Pixel Pet Creation Badge', // This will be part of the issued VC name
            issuer: gameLearnCardInstance.id.did(), // Your game's DID
            issuanceDate: new Date().toISOString(),
            credentialSubject: {
                id: playerLearnCardDid, // The player's DID
                achievement: {
                    achievementType: "Badge",
                    name: "Pixel Pet Creator", // General name for the achievement type
                    description: "Awarded for designing and creating a unique Pixel Pet!",
                    id: "urn:uuid:" + require('crypto').randomUUID(), // Unique ID for this achievement definition
                    image: "https://placehold.co/100x100/FFD700/000000?text=Pet!", // Placeholder badge image for the Boost
                    type: ["Achievement"],
                    criteria: { narrative: "User designed a custom pixel art pet and named it."}
                },
                type: ["AchievementSubject"]
            },
            display: { backgroundColor: "#FF69B4", displayType: "badge" }, // Hot Pink!
            image: "https://placehold.co/100x100/FF69B4/FFFFFF?text=Pet!"
        }
        
        const issuedPetCredentialInstance = await gameLearnCardInstance.issueCredential(petCredentialInstance) 

        console.log(`Issuing Pixel Pet badge to ${playerLearnCardDid} via contract ${gameFlowContractUriCache}`);
        const issuedCredentialUri = await gameLearnCardInstance.invoke.writeCredentialToContract(
            playerLearnCardDid,
            gameFlowContractUriCache,
            issuedPetCredentialInstance,
            pixelPetBoostUriCache // URI of the "Pixel Pet Creation" Boost
        );

        console.log(`Pixel Pet Badge successfully issued to ${playerLearnCardDid}! Credential URI: ${issuedCredentialUri}`);
        res.json({ 
            success: true, 
            credentialUri: issuedCredentialUri,
            issuedPetName: playerName 
        });

    } catch (error) {
        console.error(`Error issuing Pixel Pet badge to DID ${playerLearnCardDid}:`, error);
        res.status(500).json({ error: "Failed to issue badge. " + error.message });
    }
});

// ... (rest of server.js, including app.listen) ...

```

{% hint style="success" %}
## **Action**

1. Add the `getOrCreatePixelPetBoost` function and call it during server startup.
2. Add the `/api/issue-pet-badge` endpoint to your `server.js`.
3. Restart your `server.js`.
4. Go back to your `index.html` in the browser.
   * Connect LearnCard (if not already).
   * Design your pixel pet, give it a name.
   * Click "Create & Get Badge!"

You should see logs on both your frontend and backend. The frontend will update to show the badge was issued, and if you check the LearnCard app associated with the `playerLearnCardDid`, you should find your new "Pixel Pet: \[YourPetName]" badge!
{% endhint %}

## Summary & Next Steps

Congratulations! You've successfully built "Pixel Pet Designer" and integrated it with LearnCard GameFlow to: ✅ Set up your game as a LearnCard Issuer. ✅ Create a GameFlow Contract enabling guardian consent. ✅ Allow players/guardians to connect their LearnCard accounts. ✅ Handle the consent callback and link player DIDs. ✅ Automatically issue a custom "Pixel Pet Creation" badge when a pet is designed.

This tutorial demonstrates a powerful way to add verifiable achievements and data portability to your educational games.

From here, you can explore:

* **Storing Pet Designs:** Instead of just embedding pixel data in the VC, you could save the design (e.g., as an image or JSON on a server) and include a URL to it in the VC's `evidence` field.
* **xAPI Integration:** Use the `delegateVpJwt` (captured in Part 4) to [send xAPI statements about game activities ](sending-xapi-statements.md)(e.g., "Player X started designing a pet," "Player X submitted pet Y").
* **Advanced Boost Features:** Explore Boost permissions, hierarchies, and more detailed display customizations.
* **Error Handling & UI/UX:** Improve the user interface, error messages, and overall flow for a production-ready game.

You're now equipped to bring the power of Verifiable Credentials and LearnCard GameFlow to your own educational projects!
