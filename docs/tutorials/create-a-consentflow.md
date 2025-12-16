---
description: 'Tutorial: Implementing a Basic ConsentFlow'
---

# Create a ConsentFlow

**What is a ConsentFlow?** A ConsentFlow is a powerful mechanism in LearnCard that allows your application or service (as an "Issuer" or "Contract Owner") to request permission from users ("Holders") to access certain parts of their data or to write new information (like credentials) to their profile. It's all based on explicit user consent, ensuring transparency and user control.

## **What you'll accomplish in this tutorial:**

1. Create a ConsentFlow contract defining what data you want to read or write.
2. Generate a URL for users to view and consent to this contract.
3. Simulate placing a consent button on a webpage.
4. Handle the redirect after a user consents to capture their DID (Decentralized Identifier).
5. Read data from the contract for that consenting user.
6. Send a new credential to that user through the contract.

{% embed url="https://codepen.io/Jacks-n-Smith/pen/azzMQQP" %}

## **Prerequisites:**

1.  **LearnCard SDK Initialized:** You'll need an active `learnCard` instance connected to the network. We'll call it `networkLearnCard`.

    ```typescript
    // Make sure you have the necessary imports
    import { initLearnCard } from '@learncard/init';
    // If using DIDKit, you might need to import the wasm file
    // import didkit from '@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm';

    // Initialize LearnCard (replace with your actual seed and setup)
    const networkLearnCard = await initLearnCard({
        seed: 'your-very-secure-private-hex-seed-for-your-service', // Replace!
        network: true,
        // didkit: didkit, // If you're self-hosting the wasm
    });
    console.log("LearnCard initialized. Your service DID:", networkLearnCard.id.did());
    ```
2.  **Service Profile Created:** Your application needs its own profile on the LearnCard Network to act as the owner of the ConsentFlow contract.

    ```typescript
    // Run this once to create your service profile
    const serviceProfileData = {
      displayName: 'My Awesome Learning App',
      profileId: 'my-learning-app', // Unique ID for your service profile
      image: 'https://example.com/app-logo.png',
      // Add other profile fields as needed
    };
    try {
      const serviceDid = await networkLearnCard.invoke.createServiceProfile(serviceProfileData);
      console.log('Service Profile Created/Exists. DID:', serviceDid);
    } catch (e) {
      // Handle error, profileId might already exist, which is fine if it's yours.
      console.warn('Could not create service profile (it might already exist):', e.message);
    }
    ```
3. **Basic Understanding:** Familiarity with [DIDs](../../core-concepts/identities-and-keys/decentralized-identifiers-dids.md) and [Verifiable Credentials (VCs)](../../core-concepts/credentials-and-data/verifiable-credentials-vcs.md) will be helpful.
4. **Web Environment:** You'll need a way to simulate a user clicking a link and your application handling a redirect (e.g., a simple HTML page and some client-side JavaScript for testing).

***

## Part 1: Creating Your ConsentFlow Contract

This contract will define what permissions your application is requesting from users.

### **Step 1.1: Define Your Contract's Terms**

The contract specifies what your app can `read` from a user's profile/wallet and what it can `write` to it, after they consent.

```typescript
const myAppConsentFlowContract = {
    name: "My Awesome App Data Sharing",
    subtitle: "Share learning achievements and receive new badges!",
    description: "By consenting, you allow My Awesome Learning App to view your completed courses and issue new achievement badges to your profile.",
    image: "https://example.com/contract-image.png", // Optional: URL for an image representing your contract
    
    // This is where you define what data your app wants to read or write
    contract: {
        read: { // What your app wants to read from the user
            personal: {
                Name: { required: false } // Requesting to read the user's name, but it's optional for them to share
            },
            credentials: {
                categories: {
                    "Learning History": { required: true }, // Must share credentials in this category
                    "Achievement": { required: false }    // Optionally share these
                }
            }
        },
        write: { // What your app wants to write (issue) to the user
            credentials: {
                categories: {
                    "Achievement": { required: true }, // Your app will issue 'Achievement' credentials
                    "ID": { required: false }
                }
            }
        }
    },
    // IMPORTANT: Set a URL on your website to handle the user after they consent
    redirectUrl: "https://yourapp.com/consent-callback" // User will be sent here with their DID
};
```

{% hint style="info" %}
✨ **Good to know:**

* `read` and `write` permissions are structured by `personal` data fields and `credentials` (grouped by `categories`).
* You can mark items as `required: true` or `required: false`.
* The `redirectUrl` is crucial for getting the user back to your application with their consent information.
* Supported credential categories include: `Achievement`, `ID`, `Learning History`, `Work History`, `Social Badge`, `Membership`, `Accomplishment`, `Accommodation`, `Family`, `Course`.
{% endhint %}

### **Step 1.2: Create the Contract**

Now, use the LearnCard SDK to publish this contract definition to the LearnCard Network.

```typescript
async function createContract() {
    try {
        const contractUri = await networkLearnCard.invoke.createContract(myAppConsentFlowContract);
        console.log('ConsentFlow Contract Created! URI:', contractUri);
        // Save this contractUri! You'll need it.
        return contractUri;
    } catch (error) {
        console.error('Error creating contract:', error);
        throw error;
    }
}

// Example usage:
// createContract().then(uri => { /* Store and use this URI */ });
```

{% hint style="success" %}
**Action:** Call this function. Keep the `contractUri` safe – it's the unique identifier for your contract.
{% endhint %}

***

## Part 2: Enabling User Consent on Your Website

Now that your contract exists, users need a way to view and consent to it.

### **Step 2.1: Construct the Consent URL**

The LearnCard platform provides a standard URL for users to interact with ConsentFlow contracts.

```typescript
// Assume you have the contractUri from Part 1
const contractUri = 'uri:contract:YOUR_CONTRACT_URI_HERE'; // Replace with your actual contract URI
const userFacingConsentUrl = `https://learncard.app/consent-flow?uri=${encodeURIComponent(contractUri)}`;

// If you want to ensure the user returns to a *specific* page after consenting,
// and that page is different from the contract's main redirectUrl, you can add 'returnTo':
const specificReturnToUrl = 'https://yourapp.com/specific-post-consent-page';
const urlWithSpecificReturn = `https://learncard.app/consent-flow?uri=${encodeURIComponent(contractUri)}&returnTo=${encodeURIComponent(specificReturnToUrl)}`;

console.log("User Consent URL:", userFacingConsentUrl);
// console.log("URL with specific returnTo:", urlWithSpecificReturn);
```

{% hint style="warning" %}
**Important:** The `returnTo` URL _must_ be `http://` or `https://`.
{% endhint %}

### **Step 2.2: Add a Consent Button to Your Webpage**

On your website or application, provide a button or link that directs the user to this `userFacingConsentUrl`.

```html
<a id="consentButton" href="#" target="_blank">
    Share Learning Data with My Awesome App
</a>

<script>
    const contractUriFromBackend = 'uri:contract:YOUR_CONTRACT_URI_HERE'; // Get this from your backend
    const appRedirectPage = 'https://yourapp.com/consent-callback'; // Your page to handle the redirect
    
    const consentUrl = `https://learncard.app/consent-flow?uri=${encodeURIComponent(contractUriFromBackend)}&returnTo=${encodeURIComponent(appRedirectPage)}`;
    
    document.getElementById('consentButton').href = consentUrl;
</script>
```

When a user clicks this, they'll be taken to `learncard.app` to review your contract and give their consent.

***

## Part 3: Handling the Redirect and Capturing the User's DID

After the user consents (or denies) on `learncard.app`, they will be redirected back to the `redirectUrl` you specified in your contract (or the `returnTo` URL in the consent link). The DID of the consenting user will be appended as a query parameter.

### **Step 3.1: Your Redirect Page (`https://yourapp.com/consent-callback`)**

This page in your application needs to be able to read URL query parameters.

### **Step 3.2: Extract the User's DID**

Here's a simple client-side JavaScript example for your redirect page:

```typescript
// In your /consent-callback page's JavaScript
function handleConsentRedirect() {
    const queryParams = new URLSearchParams(window.location.search);
    const userDid = queryParams.get('did');

    if (userDid) {
        console.log("User consented! Their DID is:", userDid);
        // Now you can:
        // 1. Store this userDid in association with your application's user account.
        // 2. Make a backend call to your server with this DID.
        // 3. Use this DID to fetch consented data (see Part 4).
        alert(`Consent received for DID: ${userDid}`);
        // For a real app, you'd likely redirect them to their dashboard or next step.
    } else {
        console.error("Consent redirect did not include a DID, or user denied consent.");
        alert("Consent process was not completed or was denied.");
    }
}

// Call this function when your redirect page loads
window.onload = handleConsentRedirect;
```

Now you have the DID of the user who consented! This is crucial for interacting with the data they agreed to share.

***

## Part 4: Interacting with Consented Data

With the `contractUri` and the `userDid` of the consenter, your service (using its `networkLearnCard` instance) can now act on the consent.

### **Step 4.1: Reading Data Shared by the User**

You can fetch all data shared by users for a specific contract. Then, you can find the record for the specific user using their DID.

```typescript
// (Assuming networkLearnCard is initialized, and you have contractUri and the userDidFromRedirect)
const contractUri = 'uri:contract:YOUR_CONTRACT_URI_HERE'; // From Part 1
const userDidFromRedirect = 'did:example:CONSENTING_USER_DID'; // From Part 3

async function readConsentedData(contractUriForRead: string, targetUserDid: string) {
    try {
        // Fetch all consented data for this contract
        // You might want to implement pagination for many users
        const consentData = await networkLearnCard.invoke.getConsentFlowData(contractUriForRead, { limit: 100 }); 
        console.log('Raw consented data for contract:', consentData.records);

        // Find the specific user's consented data using their DID
        // Note: The structure of records depends on what you asked for in the contract
        // and what the user consented to share. The user's DID is usually part of the
        // identity information within the consented data's "personal" or "credentials" section.
        // For this example, we'll assume you need to iterate and match.
        // A more direct API 'getConsentFlowDataForDid' might exist or might need specific query parameters.
        // For now, we'll iterate based on the provided API context.
        
        let userSpecificData = null;
        for (const record of consentData.records) {
            // How you find the DID depends on your data structure.
            // Let's assume a 'personal.did' field or similar might exist if you requested it.
            // Or, you might be linking the transaction to the DID server-side upon consent.
            // For this tutorial, let's log and assume you can identify the user.
            // The `getConsentFlowDataForDid` method might be more direct if the `did` parameter refers to the consenter:
            // const userData = await networkLearnCard.invoke.getConsentFlowDataForDid(targetUserDid, { query: { contractUris: [contractUriForRead] } });

            // For now, using getConsentFlowData and manually finding:
            // This part is highly dependent on how the DID is exposed in the returned records.
            // For simplicity in this tutorial, we'll just log the first record if it exists.
            if (record.personal && record.personal.Name) { // Example check
                 console.log(`Processing record from date: ${record.date} for a user.`);
                 // In a real app, you'd have a way to associate this record with targetUserDid
                 // For now, if you're testing with one user, this first record might be theirs.
                 userSpecificData = record; // Placeholder for finding the specific user's data
                 break; 
            }
        }
        
        if (userSpecificData) {
            console.log(`Data for user ${targetUserDid} (or first user found):`, userSpecificData);
            
            // Example: Accessing a shared "Learning History" credential URI
            if (userSpecificData.credentials?.categories?.['Learning History']?.[0]) {
                const credentialUri = userSpecificData.credentials.categories['Learning History'][0];
                console.log('Found Learning History credential URI:', credentialUri);
                // You can now read this credential
                // const credential = await networkLearnCard.read.get(credentialUri);
                // console.log("Shared Credential:", credential);
            }
        } else {
            console.log(`No specific consented data found for DID ${targetUserDid} in the first page of results, or structure mismatch.`);
        }

    } catch (error) {
        console.error('Error reading consented data:', error);
    }
}

// Example usage:
// readConsentedData(contractUri, userDidFromRedirect);
```

{% hint style="info" %}
_Note on reading specific user data:_ The `getConsentFlowData` retrieves all consented data for the contract. To get data for a specific user, you'd typically filter the results by the user's DID, or your backend might record the link between the `termsUri` (returned when a user consents) and the user's DID for more direct lookups via `getConsentFlowTransactions` or similar. The most direct way to get data for a _specific DID_ for _your contracts_ is often `getConsentFlowDataForDid`, then filtering the results for the relevant `contractUri` if that method returns data across multiple contracts. For this tutorial, we're simplifying.
{% endhint %}

### **Step 4.2: Sending a Credential to the User Through the Contract**

Your contract might allow you to `write` credentials to users who have consented.

```typescript
// (Assuming networkLearnCard, contractUri, userDidFromRedirect are defined)
// You'll also need a boostUri that acts as a template/category for the credential you're writing.
// Creating boosts is covered in other docs/tutorials. For here, assume you have one.
const relevantBoostUri = 'uri:boost:YOUR_RELEVANT_BOOST_URI'; // Replace!

// Define the credential you want to issue to this user
const boostTemplate = await networkLearnCard.invoke.newCredential({
  type: "boost"
});

const credentialTemplate = {
  ...boostTemplate,
  issuer: networkLearnCard.id.did(),
  name: "Completed ConsentFlow CodePen Tutorial Step",
  credentialSubject: {
    ...boostTemplate.credentialSubject,
    id: consentedUserDidGlobal,
    achievement: {
      ...boostTemplate.credentialSubject.achievement,
      name: "Completed ConsentFlow Tutorial Step",
      description: "LearnCard Docs tutorial on ConsentFlow.",
      achievementType: "LearnCard Docs"
    }
  }
};

const boostMetadata = {
  name: "Completed ConsentFlow Tutorial Step",
  description: "LearnCard Docs tutorial on ConsentFlow.",
  category: "Achievement"
};

const boostUri = await networkLearnCard.invoke.createBoost(
  credentialTemplate,
  boostMetadata
);

const newCredentialToIssue = await networkLearnCard.invoke.issueCredential({
  ...credentialTemplate,
  boostId: boostUri
});

async function sendCredentialViaContract(
    consenterDid: string, 
    contract: string, 
    credential: any, 
    boost: string
) {
    try {
        const issuedCredentialUri = await networkLearnCard.invoke.writeCredentialToContract(
            consenterDid,
            contract,
            credential,
            boost
        );
        console.log('Credential successfully sent via contract! Issued Credential URI:', issuedCredentialUri);
        // The user might receive a notification if they have a webhook configured.
        return issuedCredentialUri;
    } catch (error) {
        console.error('Error sending credential via contract:', error);
        throw error;
    }
}

// Example usage:
// sendCredentialViaContract(userDidFromRedirect, contractUri, newCredentialToIssue, relevantBoostUri);
```

{% hint style="warning" %}
**Important:**

* The `credential.type` and its category must match what your ConsentFlow contract allows for `write` permissions.
* The `boostUri` parameter in `writeCredentialToContract` links the issued credential to a "Boost," which can act as a template or define its category and display properties. Ensure this Boost exists and your service profile has permission to use it.
{% endhint %}

***

## Summary & Next Steps

You've now learned the end-to-end process of:

1. **Creating** a ConsentFlow contract.
2. **Generating a URL** for users to provide consent.
3. **Handling the redirect** to capture the consenting user's DID.
4. **Reading** data the user consented to share.
5. **Sending/Writing** a new credential to the user through the contract.

This is a foundational flow for many powerful applications. From here, you can explore more advanced ConsentFlow features like:

* [Updating and withdrawing consent.](../../sdks/learncard-core/construction.md#retrieving-profiles-5)
* Using [Auto-Boosts](../../core-concepts/consent-and-permissions/auto-boosts.md) to automatically issue credentials upon consent.
* More complex data queries.

Check out our Core Concept pages on [Consent Contracts](../../core-concepts/consent-and-permissions/consent-contracts.md), [User Consent & Terms](../../core-concepts/consent-and-permissions/user-consent-and-terms.md), and [Accessing Consented Data](../../core-concepts/consent-and-permissions/accessing-consented-data.md) for more details.
