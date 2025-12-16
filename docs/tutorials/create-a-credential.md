---
description: 'Tutorial: Create and Send Your First Digital Credential'
---

# Create a Credential

Welcome! This tutorial will walk you through creating your very first digital Verifiable Credential (VC) and sending it to your LearnCard app. Think of a VC as a secure, digital certificate or badge that can prove something, like an achievement or a skill.

{% embed url="https://www.figma.com/board/DPGBfPLlss2K6KmDLCN3ul/LearnCard-Docs?node-id=131-661&p=f&t=fk1wywzjUFmakXJE-0" %}

## **What you'll accomplish:**

1. Set up a simple "Issuer" environment using the LearnCard SDK.
2. Design and create a "Workshop Completion" Verifiable Credential.
3. Digitally sign (issue) the credential to make it official.
4. Send this credential to your own LearnCard app using your Profile ID.
5. View the received credential in your LearnCard app.

**Why is this useful?** Understanding this basic flow is the first step to building applications that can issue digital badges, certificates, or any other kind of verifiable proof to users, empowering them with portable and trustworthy records.

{% embed url="https://codepen.io/Jacks-n-Smith/pen/YPPgyyM" fullWidth="false" %}

## **Prerequisites:**

1. **Node Installed:** Node.js installed on your computer.
2. **Basic Understanding:** While this is a beginner tutorial, a quick read of our [What is a Verifiable Credential?](../core-concepts/credentials-and-data/verifiable-credentials-vcs.md) and [What is a DID?](../core-concepts/identities-and-keys/decentralized-identifiers-dids.md) Core Concept pages will be helpful.

***

## Part 0: Project Setup

{% tabs %}
{% tab title="TypeScript" %}
```bash
# 1. Create a new directory and navigate into it
mkdir learncard-tutorial-1
cd learncard-tutorial-1

# 2. Initialize a Node.js project
npm init -y

# 3. Install LearnCard and the necessary tools for this tutorial
npm install @learncard/init @learncard/core @learncard/types dotenv 
npm install --save-dev typescript tsx @types/node

# 4. Create a TypeScript configuration file
npx tsc --init --rootDir ./ --outDir ./dist --esModuleInterop --resolveJsonModule --lib es2022 --module esnext  --moduleResolution node
```
{% endtab %}

{% tab title="Javascript" %}
```bash
# 1. Create a new directory and navigate into it
mkdir learncard-tutorial-js-1
cd learncard-tutorial-js-1

# 2. Initialize a Node.js project
npm init -y

# 3. Install LearnCard and the necessary tools for this tutorial
npm install @learncard/init @learncard/core dotenv 
```

Open the `package.json` file that was created in your `learncard-tutorial-js` directory and add the following line:

```json
{
  "name": "learncard-tutorial-js-1",
  "version": "1.0.0",
  // ... other fields ...
  "type": "module"  // <--- Add this line
}
```
{% endtab %}
{% endtabs %}

## Part 1: Setting Up Your Issuer Environment

For this tutorial, your computer will act as the "Issuer" – the entity creating and sending the credential.

### **Step 1.1: Create an Issuer Script**&#x20;

{% tabs %}
{% tab title="TypeScript" %}
Create a new file in your project folder: `issueCredential.ts`
{% endtab %}

{% tab title="Javascript" %}
Create a new file in your project folder: `issueCredential.js`
{% endtab %}
{% endtabs %}

### **Step 1.2: Initialize LearnCard SDK for the Issuer**&#x20;

This instance will represent your workshop organization.

{% tabs %}
{% tab title="TypeScript" %}
{% code title="issueCredential.ts" %}
```typescript
import "dotenv/config";

import { NetworkLearnCardFromSeed, initLearnCard } from "@learncard/init";
import { UnsignedVC, VC, LCNProfile } from "@learncard/types";

async function setupIssuerLearnCard() {
  const issuerSeed = process.env.SECURE_SEED;

  if (!issuerSeed) {
    throw new Error(
      "Can not initialize LearnCard without a secure seed. Please create an .env file with SECURE_SEED set as a 64-digit string."
    );
  }

  const learnCardIssuer: NetworkLearnCardFromSeed['returnValue'] = await initLearnCard({
    seed: issuerSeed, // This generates the Issuer's DID and keys
    network: true, // We need network capabilities to send the credential
    allowRemoteContexts: true, // We will issue a credential with a remote context
  });

  console.log("Issuer LearnCard Initialized.");
  console.log("Issuer DID:", learnCardIssuer.id.did());
  return learnCardIssuer;
}
// (We'll call this function later)
```
{% endcode %}
{% endtab %}

{% tab title="Javascript" %}
{% code title="issueCredential.js" %}
```typescript
import "dotenv/config";

import { initLearnCard } from "@learncard/init";

async function setupIssuerLearnCard() {
  const issuerSeed = process.env.SECURE_SEED;

  if (!issuerSeed) {
    throw new Error(
      "Can not initialize LearnCard without a secure seed. Please create an .env file with SECURE_SEED set as a 64-digit string."
    );
  }

  const learnCardIssuer = await initLearnCard({
    seed: issuerSeed, // This generates the Issuer's DID and keys
    network: true, // We need network capabilities to send the credential
    allowRemoteContexts: true, // We will issue a credential with a remote context
  });

  console.log("Issuer LearnCard Initialized.");
  console.log("Issuer DID:", learnCardIssuer.id.did());
  return learnCardIssuer;
}
// (We'll call this function later)
```
{% endcode %}
{% endtab %}
{% endtabs %}

This code initializes a LearnCard instance.&#x20;

{% hint style="info" %}
The `seed` is used to generate a unique Decentralized Identifier (DID) and cryptographic keys for your Issuer. In a real application, this seed must be kept extremely secure. [Learn more](../core-concepts/identities-and-keys/seed-phrases.md).
{% endhint %}

### **Step 1.3:  Ensure Issuer Has a Service Profile**&#x20;

To interact with the LearnCard Network effectively (like sending credentials), your Issuer's DID should be associated with a Service Profile.&#x20;

{% tabs %}
{% tab title="TypeScript" %}
{% code title="Add this function to issueCredential.ts" %}
```typescript
async function ensureIssuerProfile(learnCardIssuer: NetworkLearnCardFromSeed['returnValue']) {
  const issuerServiceProfileData: Omit<LCNProfile, 'did' | 'isServiceProfile'> = {
    profileId: process.env.PROFILE_ID!,
    displayName: process.env.PROFILE_NAME!,
    bio: '',
    shortBio: '',
    // Add other relevant details for your issuer profile
  };

  if (!issuerServiceProfileData.profileId) {
    throw new Error(
      "Please create an .env file with PROFILE_ID set as a unique, 3-40 character string. e.g: my-organization-id."
    );
  }
  if (!issuerServiceProfileData.displayName) {
    throw new Error(
      'Please create an .env file with PROFILE_NAME set as human readable string, e.g: "My Organization".'
    );
  }

  try {
    // Check if profile exists first, to avoid errors if run multiple times
    let profile = await learnCardIssuer.invoke.getProfile(
      issuerServiceProfileData.profileId
    );
    if (!profile) {
      console.log(
        `Creating service profile for issuer: ${issuerServiceProfileData.profileId}`
      );
      await learnCardIssuer.invoke.createServiceProfile(
        issuerServiceProfileData
      );
      console.log("Issuer Service Profile created successfully.");
    } else {
      console.log("Issuer Service Profile already exists.");
    }
  } catch (error: any) {
    console.error("Error ensuring issuer profile:", error.message);
  }
}
// (We'll call this after setupIssuerLearnCard)
```
{% endcode %}
{% endtab %}

{% tab title="Javascript" %}
{% code title="Add this function to issueCredential.js" %}
```typescript
async function ensureIssuerProfile(learnCardIssuer) {
  const issuerServiceProfileData = {
    profileId: process.env.PROFILE_ID,
    displayName: process.env.PROFILE_NAME,
  };

  if (!issuerServiceProfileData.profileId) {
    throw new Error(
      "Please create an .env file with PROFILE_ID set as a unique, 3-40 character string. e.g: my-organization-id."
    );
  }
  if (!issuerServiceProfileData.displayName) {
    throw new Error(
      'Please create an .env file with PROFILE_NAME set as human readable string, e.g: "My Organization".'
    );
  }

  try {
    let profile = await learnCardIssuer.invoke.getProfile(
      issuerServiceProfileData.profileId
    );
    if (!profile) {
      console.log(
        `Creating service profile for issuer: ${issuerServiceProfileData.profileId}`
      );
      await learnCardIssuer.invoke.createServiceProfile(
        issuerServiceProfileData
      );
      console.log("Issuer Service Profile created successfully.");
    } else {
      console.log("Issuer Service Profile already exists.");
    }
  } catch (error) {
    console.error("Error ensuring issuer profile:", error.message);
  }
}

```
{% endcode %}
{% endtab %}
{% endtabs %}

### **Step 1.4:  Generate Secure Seed and .env file**&#x20;

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

***

## Part 2: Designing Your "Workshop Completion" Credential

Now, let's define what information our "Workshop Completion" credential will hold.

### Step 2.1: Retrieve Your LearnCard Profile ID

[Login or Signup for LearnCard App](https://learncard.app/), and grab your unique Profile ID:

{% embed url="https://www.loom.com/share/79905a8d12e14f4c9da5e6929f187445?sid=954f288f-87b6-4986-846b-08e1238964d4" %}

{% hint style="info" %}
#### **How to Find:**&#x20;

Open your [LearnCard app](https://learncard.app/), navigate to your profile section by clicking it in the upper right corner. Click "My Account." Copy the Profile ID accurately; it's case-sensitive and usually looks something like `@your-chosen-profile-id` or a longer unique string.
{% endhint %}

### **Step 2.1: Define the Credential Content**&#x20;

A Verifiable Credential is a set of claims made by an Issuer about a Subject (the recipient).

{% tabs %}
{% tab title="TypeScript" %}
{% code title="// Add this to issueCredential.ts" %}
```typescript
// IMPORTANT: Replace with the Profile ID you got from YOUR LearnCard App
const recipientProfileId = 'YOUR_LEARNCARD_APP_PROFILE_ID'; 

async function generateWorkshopCredentialForRecipient(
  learnCardIssuer: NetworkLearnCardFromSeed['returnValue'],
  recipientProfileId: string
): Promise<UnsignedVC> {
  // Retrieve recipient profile to retrieve their DID
  const recipientProfile = await learnCardIssuer.invoke.getProfile(
    recipientProfileId
  );
  if (!recipientProfile) {
    throw new Error(
      "Recipient LearnCard Profile ID does not exist in LearnCloud Network."
    );
  }

  // This will also be the credentialSubject.id if the credential is about the recipient directly.
  const recipientDidForCredential = recipientProfile.did;

  const workshopCredentialContent: UnsignedVC = {
    // "@context" defines the vocabulary used (like a dictionary for terms)
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.1.json",
      "https://ctx.learncard.com/boosts/1.0.0.json",
    ],
    // "type" specifies what kind of credential this is
    type: ["VerifiableCredential", "OpenBadgeCredential", "BoostCredential"], // Standard VC type + OpenBadge type + Boost type
    issuanceDate: new Date().toISOString(), // Today's date
    issuer: learnCardIssuer.id.did(),
    name: "LearnCard Basics Workshop",
    // "credentialSubject" is about whom or what the credential is
    credentialSubject: {
      achievement: {
        achievementType: "Badge",
        criteria: {
          narrative:
            "Awarded for successfully completing the interactive LearnCard tutorial.",
        },
        description:
          "This badge was generated in the CodePen demonstration project in the LearnCard Developer Docs.",
        id: "urn:uuid:" + crypto.randomUUID(), // Generate a unique ID
        image: "https://example.com/badge-images/teamwork.png",
        name: "LearnCard Basics Workshop",
        type: ["Achievement"],
      },
      id: recipientDidForCredential, // The DID of the person who completed the workshop
      type: ["AchievementSubject"],
    },
    // Additional Boost Display Fields for Extra Customization
    display: {
      backgroundColor: "#40cba6",
      displayType: "badge",
    },
    image: "https://cdn.filestackcontent.com/YjQDRvq6RzaYANcAxKWE",
    // "proof" will be added automatically when the credential is signed
  };

  return workshopCredentialContent;
}
```
{% endcode %}


{% endtab %}

{% tab title="Javascript" %}
{% code title="// Add this to issueCredential.js" %}
```typescript
// IMPORTANT: Replace with the Profile ID you got from YOUR LearnCard App
const recipientProfileId = 'YOUR_LEARNCARD_APP_PROFILE_ID'; 

async function generateWorkshopCredentialForRecipient(
  learnCardIssuer: NetworkLearnCardFromSeed,
  recipientProfileId: string
): Promise<UnsignedVC> {
  // Retrieve recipient profile to retrieve their DID
  const recipientProfile = await learnCardIssuer.invoke.getProfile(
    recipientProfileId
  );
  if (!recipientProfile) {
    throw new Error(
      "Recipient LearnCard Profile ID does not exist in LearnCloud Network."
    );
  }

  // This will also be the credentialSubject.id if the credential is about the recipient directly.
  const recipientDidForCredential = recipientProfile.did;

  const workshopCredentialContent: UnsignedVC = {
    // "@context" defines the vocabulary used (like a dictionary for terms)
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.1.json",
      "https://ctx.learncard.com/boosts/1.0.0.json",
    ],
    // "type" specifies what kind of credential this is
    type: ["VerifiableCredential", "OpenBadgeCredential", "BoostCredential"], // Standard VC type + OpenBadge type + Boost type
    issuanceDate: new Date().toISOString(), // Today's date
    issuer: learnCardIssuer.id.did(),
    name: "LearnCard Basics Workshop",
    // "credentialSubject" is about whom or what the credential is
    credentialSubject: {
      achievement: {
        achievementType: "Badge",
        criteria: {
          narrative:
            "Awarded for successfully completing the interactive LearnCard tutorial.",
        },
        description:
          "This badge was generated in the CodePen demonstration project in the LearnCard Developer Docs.",
        id: "urn:uuid:" + crypto.randomUUID(), // Generate a unique ID
        image: "https://example.com/badge-images/teamwork.png",
        name: "LearnCard Basics Workshop",
        type: ["Achievement"],
      },
      id: recipientDidForCredential, // The DID of the person who completed the workshop
      type: ["AchievementSubject"],
    },
    // Additional Boost Display Fields for Extra Customization
    display: {
      backgroundColor: "#40cba6",
      displayType: "badge",
    },
    image: "https://cdn.filestackcontent.com/YjQDRvq6RzaYANcAxKWE",
    // "proof" will be added automatically when the credential is signed
  };

  return workshopCredentialContent;
}
```
{% endcode %}
{% endtab %}
{% endtabs %}

{% hint style="success" %}
✨ **Key Points:**

* **`@context`**: Tells systems how to interpret the fields.
* **`type`**: Helps categorize the credential. `VerifiableCredential` is standard.
* **`credentialSubject`**: This is the core information. The `id` here should be the DID of the person receiving the credential. For this tutorial, we're using the `recipientProfileId` (which you got from your app) to construct a DID.

Learn more about schemas in our[ Credentials and Data section of our Core Concepts](../core-concepts/credentials-and-data/).
{% endhint %}

***

## Part 3: Creating and Signing the Credential (Issuance)

Let's take the content and make it an official, signed Verifiable Credential.

### **Step 3.1: "Issue" / "Sign" the Unsigned Credential**&#x20;

The LearnCard SDK helps you with this:

{% tabs %}
{% tab title="TypeScript" %}
{% code title="// Add this function to issueCredential.ts" %}
```typescript
async function createAndSignCredential(
  learnCardIssuer: NetworkLearnCardFromSeed['returnValue'],
  unsignedVc: UnsignedVC
) {
  console.log("Unsigned VC:", JSON.stringify(unsignedVc, null, 2));

  console.log("Now signing (issuing) the credential...");
  const signedVc = await learnCardIssuer.invoke.issueCredential(unsignedVc);
  console.log("Signed VC created successfully!");
  console.log(JSON.stringify(signedVc, null, 2));
  return signedVc;
}

// (We'll call this later)
```
{% endcode %}
{% endtab %}

{% tab title="Javascript" %}
{% code title="// Add this function to issueCredential.js" %}
```typescript
async function createAndSignCredential(learnCardIssuer, unsignedVc) {
  console.log("Unsigned VC:", JSON.stringify(unsignedVc, null, 2));

  console.log("Now signing (issuing) the credential...");
  const signedVc = await learnCardIssuer.invoke.issueCredential(unsignedVc);
  console.log("Signed VC created successfully!");
  console.log(JSON.stringify(signedVc, null, 2));
  return signedVc;
}

// (We'll call this later)
```
{% endcode %}
{% endtab %}
{% endtabs %}

{% hint style="info" %}
`issueCredential` adds the issuer's DID, issuance date, and a cryptographic signature, making it verifiable.
{% endhint %}

***

## Part 4: Sending the Credential to Your LearnCard App

Now, let's send this official credential to your LearnCard app.

### **Step 4.1: Use `sendCredential`**&#x20;

This function from the LearnCard SDK (via the Network plugin) handles the delivery.

{% tabs %}
{% tab title="TypeScript" %}
{% code title="// Add this function to issueCredential.ts" %}
```typescript
async function sendVcToRecipient(
  learnCardIssuer: NetworkLearnCardFromSeed['returnValue'],
  recipientLcnProfileId: string,
  signedVc: VC
) {
  console.log(`Sending credential to Profile ID: ${recipientLcnProfileId}`);
  try {
    const sentCredentialUri = await learnCardIssuer.invoke.sendCredential(
      recipientLcnProfileId,
      signedVc,
    );
    console.log(
      "Credential sent successfully! Sent Credential URI:",
      sentCredentialUri
    );
    return sentCredentialUri;
  } catch (error) {
    console.error("Error sending credential:", error);
    throw error;
  }
}

// (We'll call this later)
```
{% endcode %}
{% endtab %}

{% tab title="Javascript" %}
{% code title="// Add this function to issueCredential.js" %}
```javascript
async function sendVcToRecipient(
  learnCardIssuer,
  recipientLcnProfileId,
  signedVc
) {
  console.log(`Sending credential to Profile ID: ${recipientLcnProfileId}`);
  try {
    const sentCredentialUri = await learnCardIssuer.invoke.sendCredential(
      recipientLcnProfileId,
      signedVc
    );
    console.log(
      "Credential sent successfully! Sent Credential URI:",
      sentCredentialUri
    );
    return sentCredentialUri;
  } catch (error) {
    console.error("Error sending credential:", error);
    throw error;
  }
}

```
{% endcode %}
{% endtab %}
{% endtabs %}

***

## Part 5: Putting It All Together & Viewing in Your App

Let's create a main function to run these steps.

### **Step 5.1: Main Script Logic**

{% tabs %}
{% tab title="TypeScript" %}
{% code title="// Add this main execution block at the end of issueCredential.ts" %}
```typescript
async function main() {
  // @ts-ignore
  if (recipientProfileId === "YOUR_LEARNCARD_APP_PROFILE_ID") {
    console.error(
      "Please replace 'YOUR_LEARNCARD_APP_PROFILE_ID' with your actual Profile ID from the LearnCard app in the 'recipientProfileId' variable."
    );
    return;
  }

  const learnCardIssuer = await setupIssuerLearnCard();
  await ensureIssuerProfile(learnCardIssuer);
  const workshopCredential = await generateWorkshopCredentialForRecipient(
    learnCardIssuer,
    recipientProfileId
  );

  const signedVc = await createAndSignCredential(
    learnCardIssuer,
    workshopCredential
  );

  if (signedVc) {
    await sendVcToRecipient(learnCardIssuer, recipientProfileId, signedVc);
    console.log(
      "\nTutorial complete! Check your LearnCard app for the new credential."
    );
    console.log("It might take a moment to receive a notification.");
  } else {
    console.log("Credential creation or signing failed. Cannot send.");
  }
}

main().catch((err) => console.error("Tutorial encountered an error:", err));
```
{% endcode %}
{% endtab %}

{% tab title="Javascript" %}
{% code title="// Add this main execution block at the end of issueCredential.js" %}
```typescript
async function main() {

  if (recipientProfileId === "YOUR_LEARNCARD_APP_PROFILE_ID") {
    console.error(
      "Please replace 'YOUR_LEARNCARD_APP_PROFILE_ID' with your actual Profile ID from the LearnCard app in the 'recipientProfileId' variable."
    );
    return;
  }

  const learnCardIssuer = await setupIssuerLearnCard();
  await ensureIssuerProfile(learnCardIssuer);
  const workshopCredential = await generateWorkshopCredentialForRecipient(
    learnCardIssuer,
    recipientProfileId
  );

  const signedVc = await createAndSignCredential(
    learnCardIssuer,
    workshopCredential
  );

  if (signedVc) {
    await sendVcToRecipient(learnCardIssuer, recipientProfileId, signedVc);
    console.log(
      "\nTutorial complete! Check your LearnCard app for the new credential."
    );
    console.log("It might take a moment to receive a notification.");
  } else {
    console.log("Credential creation or signing failed. Cannot send.");
  }
}

main().catch((err) => console.error("Tutorial encountered an error:", err));
```
{% endcode %}
{% endtab %}
{% endtabs %}

### **Step 5.2: Run Your Script**

{% tabs %}
{% tab title="TypeScript" %}
1. **Replace Placeholders:**
   * [ ] In `issueCredential.ts`, find `YOUR_LEARNCARD_APP_PROFILE_ID` and replace it with the Profile ID you copied from your LearnCard app.
   * [ ] Ensure `.env` file contains `SECURE_SEED`, `PROFILE_ID`, and `PROFILE_NAME` with your own unique values set,&#x20;
2. Save the file.
3. Open your terminal in your project directory and run:
   * `npx tsx issueCredential.ts`
{% endtab %}

{% tab title="Javascript" %}
1. **Replace Placeholders:**
   * [ ] In `issueCredential.js`, find `YOUR_LEARNCARD_APP_PROFILE_ID` and replace it with the Profile ID you copied from your LearnCard app.
   * [ ] Ensure `.env` file contains `SECURE_SEED`, `PROFILE_ID`, and `PROFILE_NAME` with your own unique values set,&#x20;
2. Save the file.
3. Open your terminal in your project directory and run:
   * `node issueCredential.js`
{% endtab %}
{% endtabs %}

### **Step 5.3: View in Your LearnCard App**&#x20;

After the script runs successfully, [open your LearnCard app on your device](https://learncard.app/notifications). You should see the new "Workshop Completion Certificate" appear! It might take a few moments for you to get the notification.

<figure><img src="../.gitbook/assets/Screenshot 2025-05-29 at 12.58.44 PM.png" alt=""><figcaption><p>Head to the <a href="https://learncard.app/notifications">"Alerts" section in LearnCard app</a> to claim the credential you just sent! Ensure you are signed in as the recipient Profile ID.</p></figcaption></figure>

***

## Summary & What's Next

Congratulations! You've successfully: ✅ Set up a basic Issuer using the LearnCard SDK. ✅ Defined, created, and digitally signed a Verifiable Credential. ✅ Sent that credential to your own LearnCard app.

This tutorial covers the fundamental flow of issuing credentials. From here, you can explore:

* Creating more complex credentials with different [**Schemas and Types**](../core-concepts/credentials-and-data/achievement-types-and-categories.md).
* Using [**ConsentFlows**](../core-concepts/consent-and-permissions/consentflow-overview.md) to manage data sharing before issuing credentials.
* Integrating this issuance logic into your own applications and backend services.

Explore the rest of our documentation to learn more about the powerful features of LearnCard!
