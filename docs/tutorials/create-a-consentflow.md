---
description: 'Tutorial: create a ConsentFlow — the starting point for consent and guardian-approval flows.'
---

# Consent & Guardianship: Create a ConsentFlow

A [ConsentFlow](../core-concepts/consent-and-permissions/consentflow-overview.md) lets your application request permission to read user data or write credentials to their profile.

**~15 minutes · Needs:** LearnCard SDK initialized, a service profile

## Consent or guardianship — which do you need?

Decide if you need a standard ConsentFlow or a guardian-gated flow:

- **Standard ConsentFlow**: For independent learners. You request read/write access, they accept, and you can set up ongoing auto-issuance.
- **Guardianship**: For managed accounts. A guardian must approve via email and OTP before the learner can claim the credential. Trigger this by calling `send()` with `options.guardianEmail`, or by creating a contract with `needsGuardianConsent: true`.

For guardianship, see [Guardian-gated credentials](../how-to-guides/implement-flows/guardian-gated-credentials.md). For standard consent, see the [ConsentFlow overview](../core-concepts/consent-and-permissions/consentflow-overview.md).

## In this tutorial:

1. Create a ConsentFlow contract.
2. Generate a consent URL.
3. Add a consent button to a webpage.
4. Handle the redirect to capture the user's DID.
5. Read data from the contract.
6. Send a credential through the contract.

{% embed url="https://codepen.io/Jacks-n-Smith/pen/azzMQQP" %}

## **Prerequisites:**

1.  **LearnCard SDK Initialized:** An active `learnCard` instance connected to the network (`networkLearnCard`).

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
    console.log('LearnCard initialized. Your service DID:', networkLearnCard.id.did());
    ```

2.  **Service Profile Created:** Your application needs a profile on the LearnCard Network to own the ConsentFlow contract.

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

3.  **Basic Understanding:** Familiarity with [DIDs](../core-concepts/identities-and-keys/decentralized-identifiers-dids.md) and [Verifiable Credentials (VCs)](../core-concepts/credentials-and-data/verifiable-credentials-vcs.md).
4.  **Web Environment:** A way to simulate a user clicking a link and handling a redirect.

---

## Part 1: Creating Your ConsentFlow Contract

The contract defines the permissions your application requests.

### **Step 1.1: Define Your Contract's Terms**

The contract specifies what your app can `read` and `write`.

```typescript
const myAppConsentFlowContract = {
    name: 'My Awesome App Data Sharing',
    subtitle: 'Share learning achievements and receive new badges!',
    description:
        'By consenting, you allow My Awesome Learning App to view your completed courses and issue new achievement badges to your profile.',
    image: 'https://example.com/contract-image.png', // Optional: URL for an image representing your contract

    // This is where you define what data your app wants to read or write
    contract: {
        read: {
            // What your app wants to read from the user
            personal: {
                Name: { required: false }, // Requesting to read the user's name, but it's optional for them to share
            },
            credentials: {
                categories: {
                    'Learning History': { required: true }, // Must share credentials in this category
                    'Achievement': { required: false }, // Optionally share these
                },
            },
        },
        write: {
            // What your app wants to write (issue) to the user
            credentials: {
                categories: {
                    'Achievement': { required: true }, // Your app will issue 'Achievement' credentials
                    'ID': { required: false },
                },
            },
        },
    },
    // IMPORTANT: Set a URL on your website to handle the user after they consent
    redirectUrl: 'https://yourapp.com/consent-callback', // User will be sent here with their DID
};
```

{% hint style="info" %}
**Good to know:**

- `read` and `write` permissions are structured by `personal` data fields and `credentials` (grouped by `categories`).
- Items can be `required: true` or `required: false`.
- The `redirectUrl` returns the user to your application.
- Supported credential categories: `Achievement`, `ID`, `Learning History`, `Work History`, `Social Badge`, `Membership`, `Accomplishment`, `Accommodation`, `Family`, `Course`.

{% endhint %}

### **Step 1.2: Create the Contract**

Publish this contract definition to the LearnCard Network.

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
Keep the `contractUri` safe — it identifies your contract.
{% endhint %}

---

## Part 2: Enabling User Consent on Your Website

### **Step 2.1: Construct the Consent URL**

```typescript
// Assume you have the contractUri from Part 1
const contractUri = 'uri:contract:YOUR_CONTRACT_URI_HERE'; // Replace with your actual contract URI
const userFacingConsentUrl = `https://learncard.app/consent-flow?uri=${encodeURIComponent(
    contractUri
)}`;

// If you want to ensure the user returns to a *specific* page after consenting,
// and that page is different from the contract's main redirectUrl, you can add 'returnTo':
const specificReturnToUrl = 'https://yourapp.com/specific-post-consent-page';
const urlWithSpecificReturn = `https://learncard.app/consent-flow?uri=${encodeURIComponent(
    contractUri
)}&returnTo=${encodeURIComponent(specificReturnToUrl)}`;

console.log('User Consent URL:', userFacingConsentUrl);
// console.log("URL with specific returnTo:", urlWithSpecificReturn);
```

{% hint style="warning" %}
**Important:** The `returnTo` URL _must_ be `http://` or `https://`.
{% endhint %}

### **Step 2.2: Add a Consent Button to Your Webpage**

Provide a button or link that directs the user to `userFacingConsentUrl`.

```html
<a id="consentButton" href="#" target="_blank"> Share Learning Data with My Awesome App </a>

<script>
    const contractUriFromBackend = 'uri:contract:YOUR_CONTRACT_URI_HERE'; // Get this from your backend
    const appRedirectPage = 'https://yourapp.com/consent-callback'; // Your page to handle the redirect

    const consentUrl = `https://learncard.app/consent-flow?uri=${encodeURIComponent(
        contractUriFromBackend
    )}&returnTo=${encodeURIComponent(appRedirectPage)}`;

    document.getElementById('consentButton').href = consentUrl;
</script>
```

Users click this to review your contract on `learncard.app`.

---

## Part 3: Handling the Redirect and Capturing the User's DID

After the user consents or denies, they redirect to your `redirectUrl` or `returnTo` URL. The user's DID is appended as a query parameter.

### **Step 3.1: Your Redirect Page (`https://yourapp.com/consent-callback`)**

### **Step 3.2: Extract the User's DID**

```typescript
// In your /consent-callback page's JavaScript
function handleConsentRedirect() {
    const queryParams = new URLSearchParams(window.location.search);
    const userDid = queryParams.get('did');

    if (userDid) {
        console.log('User consented! Their DID is:', userDid);
        // Now you can:
        // 1. Store this userDid in association with your application's user account.
        // 2. Make a backend call to your server with this DID.
        // 3. Use this DID to fetch consented data (see Part 4).
        alert(`Consent received for DID: ${userDid}`);
        // For a real app, you'd likely redirect them to their dashboard or next step.
    } else {
        console.error('Consent redirect did not include a DID, or user denied consent.');
        alert('Consent process was not completed or was denied.');
    }
}

// Call this function when your redirect page loads
window.onload = handleConsentRedirect;
```

---

## Part 4: Interacting with Consented Data

### **Step 4.1: Reading Data Shared by the User**

Fetch all data shared by users for a specific contract, then find the record for the specific user using their DID.

```typescript
// (Assuming networkLearnCard is initialized, and you have contractUri and the userDidFromRedirect)
const contractUri = 'uri:contract:YOUR_CONTRACT_URI_HERE'; // From Part 1
const userDidFromRedirect = 'did:example:CONSENTING_USER_DID'; // From Part 3

async function readConsentedData(contractUriForRead: string, targetUserDid: string) {
    try {
        // Fetch all consented data for this contract
        // You might want to implement pagination for many users
        const consentData = await networkLearnCard.invoke.getConsentFlowData(contractUriForRead, {
            limit: 100,
        });
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
            if (record.personal && record.personal.Name) {
                // Example check
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
                const credentialUri =
                    userSpecificData.credentials.categories['Learning History'][0];
                console.log('Found Learning History credential URI:', credentialUri);
                // You can now read this credential
                // const credential = await networkLearnCard.read.get(credentialUri);
                // console.log("Shared Credential:", credential);
            }
        } else {
            console.log(
                `No specific consented data found for DID ${targetUserDid} in the first page of results, or structure mismatch.`
            );
        }
    } catch (error) {
        console.error('Error reading consented data:', error);
    }
}

// Example usage:
// readConsentedData(contractUri, userDidFromRedirect);
```

{% hint style="info" %}
_Note on reading specific user data:_ `getConsentFlowData` retrieves all consented data for the contract. To get data for a specific user, filter the results by the user's DID. The most direct way to get data for a specific DID is `getConsentFlowDataForDid`, then filtering the results for the relevant `contractUri`.
{% endhint %}

### **Step 4.2: Sending a Credential to the User Through the Contract**

```typescript
// (Assuming networkLearnCard, contractUri, userDidFromRedirect are defined)
// You'll also need a templateUri that acts as a template/category for the credential you're writing.
// Creating credential templates is covered in other docs/tutorials. For here, assume you have one.
const relevantTemplateUri = 'uri:boost:YOUR_RELEVANT_TEMPLATE_URI'; // Replace!

// Define the credential you want to issue to this user
const credentialBase = networkLearnCard.invoke.newCredential({
    type: 'boost',
});

const credentialTemplate = {
    ...credentialBase,
    issuer: networkLearnCard.id.did(),
    name: 'Completed ConsentFlow CodePen Tutorial Step',
    credentialSubject: {
        ...credentialBase.credentialSubject,
        id: consentedUserDidGlobal,
        achievement: {
            ...credentialBase.credentialSubject.achievement,
            name: 'Completed ConsentFlow Tutorial Step',
            description: 'LearnCard Docs tutorial on ConsentFlow.',
            achievementType: 'LearnCard Docs',
        },
    },
};

const templateMetadata = {
    name: 'Completed ConsentFlow Tutorial Step',
    description: 'LearnCard Docs tutorial on ConsentFlow.',
    category: 'Achievement',
};

const templateUri = await networkLearnCard.invoke.createBoost(credentialTemplate, templateMetadata);

const newCredentialToIssue = await networkLearnCard.invoke.issueCredential({
    ...credentialTemplate,
    boostId: templateUri,
});

async function sendCredentialViaContract(
    consenterDid: string,
    contract: string,
    credential: any,
    template: string
) {
    try {
        const issuedCredentialUri = await networkLearnCard.invoke.writeCredentialToContract(
            consenterDid,
            contract,
            credential,
            template
        );
        console.log(
            'Credential successfully sent via contract! Issued Credential URI:',
            issuedCredentialUri
        );
        // The user might receive a notification if they have a webhook configured.
        return issuedCredentialUri;
    } catch (error) {
        console.error('Error sending credential via contract:', error);
        throw error;
    }
}

// Example usage:
// sendCredentialViaContract(userDidFromRedirect, contractUri, newCredentialToIssue, relevantTemplateUri);
```

{% hint style="warning" %}
**Important:**

- The `credential.type` and its category must match what your ConsentFlow contract allows for `write` permissions.
- The `templateUri` parameter in `writeCredentialToContract` links the issued credential to a credential template (a _Boost_ in the API), which defines its category and display properties. Ensure this template exists and your service profile has permission to use it.

{% endhint %}

---

## What you should see

When the user completes the flow, they are redirected back to your `redirectUrl` with their DID in the query string. You can then use this DID to read their consented data or issue credentials to them.

## Troubleshooting

| If…                          | Then                                                                                                                       |
| :--------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| `Invalid Terms for Contract` | You might be trying to consent to a contract twice, or the terms you're accepting don't match the contract's requirements. |
| `Could not find contract`    | Double-check your `contractUri`. It must be exact.                                                                         |
| `Redirect fails`             | Ensure your `redirectUrl` is a valid `http://` or `https://` URL.                                                          |

## Next Steps

Explore more advanced ConsentFlow features:

- [Updating and withdrawing consent.](../sdks/learncard-core/construction.md#retrieving-profiles-5)
- Using [Auto-Issuance](../core-concepts/consent-and-permissions/auto-boosts.md) to automatically issue credentials upon consent.
- Using an existing contract as a template in **Admin Tools → Manage ConsentFlow Contracts** by selecting **"Use as template"** from the contract detail view.
- More complex data queries.

Check out our Core Concept pages on [Consent Contracts](../core-concepts/consent-and-permissions/consent-contracts.md), [User Consent & Terms](../core-concepts/consent-and-permissions/user-consent-and-terms.md), and [Accessing Consented Data](../core-concepts/consent-and-permissions/accessing-consented-data.md) for more details.
