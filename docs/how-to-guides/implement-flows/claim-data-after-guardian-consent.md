---
description: How to implement the Consentful "Claim Later" Flow
---

# Claim Data after Guardian Consent

### Overview

The Consentful "Claim Later" Flow enables applications to save an ephemeral user's session data as a "Save Game" state, which can be restored after obtaining guardian consent. This pattern is ideal for applications that need to:

* Create low-PII profiles quickly (using nicknames)
* Allow users to start using the application immediately
* Obtain guardian consent after initial engagement
* Restore the user's session state after consent is granted

### Use Case: MyLittleTabbyCat

To illustrate this flow, we'll use a fictional application called "MyLittleTabbyCat" where a child creates a personalized tabby cat and receives daily inspirational quotes. The child initially creates their cat in an ephemeral session, then takes a QR code home for their guardian to scan and provide consent.

### Implementation Steps

{% hint style="warning" %}
Before you begin, make sure you've [setup a Service Profile ](https://docs.learncard.com/learn-card-sdk/learncard-network/learncard-network-api/profile#id-2.-create-a-service-profile)in the network for your LearnCard.&#x20;

```javascript
const serviceProfile = {
  displayName: 'My Tabby Cat',
  profileId: 'my-tabby-cat',
  image: 'https://i.postimg.cc/s2xdx5Ss/erik-jan-leusink-Ib-Px-GLg-Ji-MI-unsplash.jpg',
};

await learnCard.invoke.createServiceProfile(serviceProfile);
```
{% endhint %}

#### 1. Create a "Save Game" Boost

After the user creates their content in your application, store this data as a Boost on the LearnCard network:

{% hint style="info" %}
This example shows how to extend a regular "BoostCredential" with a "TabbyCat" schema in JSON-LD. Check it out on the JSON-LD playground [here](https://app.gitbook.com/o/6uDv1QDlxaaZC7i8EaGb/s/yM1TQS4JsC2o2UyqGfWZ/). You can verify it's a valid credential by "issuing it" in the CLI:

```javascript
await learnCard.invoke.issueCredential(credential)
```
{% endhint %}

<pre class="language-javascript"><code class="lang-javascript">// Prepare the credential with user data
const credential {
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.1.json",
    "https://ctx.learncard.com/boosts/1.0.3.json",
    {
      "tabby": "https://docs.mylittletabbycat.com/definitions#",
      "xsd": "https://www.w3.org/2001/XMLSchema#",
      "TabbyCat": {
        "@context": {
          "catName": {
            "@id": "tabby:catName",
            "@type": "xsd:string"
          },
          "bodyParts": {
            "@container": "@set",
            "@context": {
              "head": {
                "@id": "tabby:partsHead",
                "@type": "xsd:string"
              },
              "body": {
                "@id": "tabby:partsBody",
                "@type": "xsd:string"
              },
              "ears": {
                "@id": "tabby:partsEars",
                "@type": "xsd:string"
              }
            },
            "@id": "tabby:bodyParts"
          },
          "externalUserId": {
            "@id": "tabby:externalUserId",
            "@type": "xsd:string"
          }
          
        },
        "@id": "tabby:tabbyCat"
      },
    }
  ],
  "credentialSubject": {
    "achievement": {
      "achievementType": "ext:LCA_CUSTOM:Social Badge:TabbyCat",
      "criteria": {
        "narrative": "[Nickname] created a unique tabby cat."
      },
      "description": "Personalized tabby cat.",
      "id": "urn:uuid:123",
      "image": "https://i.postimg.cc/s2xdx5Ss/erik-jan-leusink-Ib-Px-GLg-Ji-MI-unsplash.jpg",
      "name": "Tabby Cat Completion",
      "type": [
        "Achievement"
      ]
    },
    "id": "did:web:network.learncard.com:users:jsmith",
    "type": [
      "AchievementSubject"
    ]
  },
  "display": {
    "backgroundColor": "",
    "backgroundImage": "",
    "displayType": "badge"
  },
  "image": "https://i.postimg.cc/s2xdx5Ss/erik-jan-leusink-Ib-Px-GLg-Ji-MI-unsplash.jpg",
  "skills": [],
  "issuanceDate": "2025-04-01T16:56:00.667Z",
  "issuer": "did:web:network.learncard.com:users:my-tabby-cat",
  "name": "Tabby Cat",
  "catName": "Butternut",
  "bodyParts": {
    "head": "ROUND",
    "body": "STRIPED",
    "ears": "FLOPPY"
  },
  "externalUserId": "12345",
  "type": [
    "VerifiableCredential",
    "OpenBadgeCredential",
    "BoostCredential",
    "TabbyCat"
  ]
};

// Add searchable metadata for later lookup
const metadata = {
  name: 'Butternut',
  description: 'User data for MyLittleTabbyCat application, for cat "Butternut."',
};

// Create the boost
<strong>const boostUri = await learnCard.invoke.createBoost(credential, metadata);
</strong></code></pre>

#### 2. Create a Guardian ConsentFlow

After creating the boost, set up a ConsentFlow that requires guardian consent:

{% hint style="warning" %}
To attach autoboosts to your ConsentFlow, you need to setup a "Signing Authority". You can do this once for your LearnCard service profile like so:<br>

```javascript
// Make sure to pnpm install @learncard/simple-signing-plugin
import { getSimpleSigningPlugin } from '@learncard/simple-signing-plugin';

// Add signing plugin to your learnCard
const signingLearnCard = await learnCard.addPlugin(
  await getSimpleSigningPlugin(learnCard, 'https://api.learncard.app/trpc')
);

// Create a Signing Authority (one-time). The name is an arbitrary identifier. 
const sa = await signingLearnCard.invoke.createSigningAuthority('autoboost');

// Register a signing authority with LearnCard Network
await signingLearnCard.invoke.registerSigningAuthority(sa.endpoint, sa.name, sa.did);

// Get the signing authority
const saResult = await signingLearnCard.invoke.getRegisteredSigningAuthority(sa.endpoint, sa.name);

// Save this — use when creating contracts with autoboosts
const signingAuthority = {
    endpoint: saResult.signingAuthority.endpoint,
    name: saResult.relationship.name,
};
```
{% endhint %}

```javascript

// Create a GameFlow contract (based on ConsentFlow)
const gameFlowContract = {
  name: "MyLittleTabbyCat Game",
  subtitle: "Guardian Consent for Child's Tabby Cat",
  description: "Allow your child to save their tabby cat and receive inspirational quotes",
  image: "https://i.postimg.cc/s2xdx5Ss/erik-jan-leusink-Ib-Px-GLg-Ji-MI-unsplash.jpg",
  needsGuardianConsent: true,
  
  // Ensure this redirects to a valid URL where the user will go after consent
  redirectUrl: "https://mylittletabbycat.com/callback",
  reasonForAccessing: "Allow your child to save their progress and tabby cat design",
  contract: {
    read: {
      anonymize: true,
      credentials: {
        categories: {
          "Social Badge": { required: false }
        }
      }
    },
    write: {
      credentials: {
        categories: {
          "Social Badge": { required: true }
        }
      }
    }
  },
  // Most important part: link the boost for auto-claim after consent
  autoboosts: [{ 
    boostUri,
    signingAuthority
  }]
};

// Create the contract on the LearnCard network
const contractUri = await learnCard.invoke.createContract(gameFlowContract);

// Generate QR code URL for the contract
const consentLink = `https://learncard.app/consent-flow?uri=${contractUri}`
```

#### 3. Generate QR Code for User

Display a QR code linking to the ConsentFlow for the user:

```javascript
// Generate QR code (example using a hypothetical QR library)
const qrCode = generateQRCode(consentLink);

// Display to user with instructions
displayQRCode(qrCode, "Have your guardian scan this code to save your cat!");
```

#### 4. Handle Redirect After Guardian Consent

After the guardian provides consent, LearnCard redirects to your application's callback URL with the user's DID:

```javascript
// Example callback handler (server-side route)
app.get('/callback', async (req, res) => {
  const userDid = req.query.did;
  
  if (!userDid) {
    return res.redirect('/error?message=No+user+ID+provided');
  }
  
  // Store the LearnCard DID in your system, associated with the user account
  await storeUserDid(userDid);
  
  // Redirect to the restoration page
  res.redirect(`/restore?did=${userDid}`);
});
```

#### 5. Retrieve "Save Game" Data

After receiving the user's DID, retrieve their boost data to restore their session:

```javascript
// Client-side restoration code
async function restoreUserSessionFromProfileID(userProfileId) { 
  try {
  
    if userProfileId.contains("did") {
     // If profileID is in "did" format (i.e. "did:web:network.learncard.com:users:my-tabby-cat"), extract plain profileId
      userProfileId = userProfileId.split(':').reverse()[0]
    }
    
    const sentCredentials = await learnCard.invoke.getSentCredentials(userProfileId)
    
    if (sentCredentials.length <= 0) {
      showError("Guardian has not consented for this profile ID.")
    }
  
    const catCredential = await learnCard.read.get(sentCredentials[0].uri)
    
    if (catCredential) {
      restoreUserSession(catCredential)
    } else {
      showError("Could not find your saved cat");
    }
    
  } catch (error) {
    console.error("Error restoring session:", error);
    showError("Error restoring your saved game");
  }
}

async function restoreUserSession(catCredential) {
  try {
    if (catCredential) {
      // Extract the saved data
      const catName = catCredential.catName;
      const bodyParts = catCredential.bodyParts;
      const externalUserId = catCredential.externalUserId;
      
      // Restore the user's experience
      restoreTabbycat(catName, bodyParts, externalUserId);
      showWelcomeBack(catName);
    } else {
      showError("Could not find your saved cat");
    }
  } catch (error) {
    console.error("Error restoring session:", error);
    showError("Error restoring your saved game");
  }
}
```

#### 6. Return User Flow (Login by Cat Name)

For returning users who know their cat's name:

```javascript
async function lookupByCatName(catName) {
  try {
    // Search for boosts with the provided catName in metadata
    const tabbyCatBoosts = await learnCard.invoke.getPaginatedBoosts({
          query: {
             name: catName 
          }
      })
      
    if (boosts.records.length === 0) {
      return showError("No cat found with that name");
    }
    
    const boost = boosts.records[0];
    
    // Check if the boost has been claimed (has recipients) and therefore guardian consent achieved.
    const recipients = await learnCard.invoke.getPaginatedBoostRecipients(boost.uri);
    
    if (recipients.records.length === 0) {
      return showError("Your cat exists but hasn't been claimed yet. Please ask a guardian to scan the QR code");
    }
    
    // The boost is claimed, extract user profileId
    const profileId = recipients.records[0].to.profileId
    const profileDID = `did:web:network.learncard.com:users:${profileId}`
    
    // Check that the Guardian approved with consent
    const consentFlowData = await learnCard.invoke.getConsentFlowDataForDid(profileDID)
    const didGuardianConsent = await learnCard.invoke.verifyConsent(consentFlowData.records[0].contractUri, profileDID)
    
    if (!didGuardianConsent) {
      return showError("Guardian has not yet consented for this user.")
    }
    
    // Extract the saved cat credential in the boost.
    const catCredential = (await learnCard.invoke.getBoost(boost.uri)).boost
    
    // Restore session using the cat credential
    restoreUserSession(catCredential);
  } catch (error) {
    console.error("Error looking up cat:", error);
    showError("Error looking up your cat");
  }
}
```

### Complete Flow Diagram

1. User creates content in your application (ephemeral session)
2. Application creates a Boost with the user's data
3. Application creates a ConsentFlow with guardian consent requirement, linking the Boost
4. User receives a QR code to take home
5. Guardian scans QR code and provides consent
6. User is redirected back to your application with their LearnCard DID
7. Application retrieves "Save Game" data using the DID
8. Application restores the user's session



### Best Practices

1. **Add Searchable Metadata**: Always include unique identifiers in the boost metadata for easy lookup.
2. **Clear Consent Reasons**: Provide clear explanations for guardians about what data is being stored.
3. **Graceful Fallbacks**: Handle cases where consent is denied or the process is interrupted.
4. **Secure User Associations**: Verify that the returning user is associated with the correct boost.
5. **Data Minimization**: Store only necessary information in the boost credential.

### Related Documentation

For more information on GameFlow (the framework this flow is built on), see the [GameFlow ](../../core-concepts/consent-and-permissions/gameflow-overview.md)documentation.
