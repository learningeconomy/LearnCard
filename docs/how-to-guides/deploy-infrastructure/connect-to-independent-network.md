---
description: Setting Up ConsentFlow with an Independent Network
---

# Connect a Website to Independent Network

ConsentFlow contracts allow third-party applications to read from and write to a LearnCard with the consent of the LearnCard owner. This guide will walk you through setting up a ConsentFlow with an Independent **Network** (instead of the default LearnCard Network) and Independent **Wallet** (instead of the default LearnCard App) to connect your external, 3rd party application.

### Prerequisites

* Node.js environment
* Access to an Independent Network endpoint
* Access to an Independent Wallet Application&#x20;

### Step 1: Create a Service Profile

First, you need to initialize the LearnCard CLI and create a network LearnCard that points to your Independent Network:

```javascript
// Install and start LearnCard CLI
// pnpm dlx @learncard/cli

// Initialize LearnCard with your Independent Network
const networkLearnCard = await initLearnCard({ 
    seed: '[your secure key]', 
    network: 'https://network.independent.example.org/trpc'  // Point to your Independent Network
})

// Create a service profile
const serviceProfile = {
  displayName: 'Your App Name',
  profileId: 'your-app-unique-id',
  image: 'https://example.com/your-app-logo.jpg',
};

// Register the service profile
await networkLearnCard.invoke.createServiceProfile(serviceProfile);
```

Your service profile represents your application in the LearnCard ecosystem. Make sure to use a unique `profileId` and provide a clear `displayName` and `image` to help users recognize your service.

### Step 2: Create a ConsentFlow Contract

Next, create a ConsentFlow contract that specifies what data your application needs to read from and write to users' LearnCard wallets:

```javascript
const consentFlowContract = {
    "name": "Your App Integration",
    "subtitle": "Connect your LearnCard to Your App",
    "description": "This connection allows Your App to access and issue credentials on your LearnCard.",
    "image": "https://example.com/your-app-logo.jpg",
    "redirectUrl": "https://your-app.com/callback", // Where to redirect after consent
    "contract": {
        "read": {
            "anonymize": true, // Set to false if you need identifiable information
            "credentials": {
                "categories": {
                    // Specify credential categories your app needs to read
                    "Merit Badge": {
                        "required": true
                    },
                    "Skill": {
                        "required": false
                    }
                }
            },
            "personal": {
                "Name": {
                    "required": false
                }
            }
        },
        "write": {
            "credentials": {
                "categories": {
                    // Specify credential categories your app will write
                    "Merit Badge": {
                        "required": true
                    },
                    "Skill": {
                        "required": false
                    }
                }
            },
            "personal": { 
                "SomeCustomID": {
                    "required": true
                }
            }
        }
    }
};

// Create the contract and get its URI
const contractUri = await networkLearnCard.invoke.createContract(consentFlowContract);

// Generate consent flow URLs for your Independent Wallet connected to your Network
const productionUrl = `https://wallet.independent.example.org/consent-flow?uri=${contractUri}`;

console.log("Production ConsentFlow URL:", productionUrl);

```

#### Available Credential Categories

When specifying credential categories in your contract, ensure you are using categories supported by your network. For example, many networks support a subset of the following categories:

* Achievement
* Accommodation
* Accomplishment
* Course
* ID
* Job
* Learning History
* Membership
* Merit Badge
* Skill
* Social Badge
* Work History

### Step 3: Add a "Connect Your Wallet" Button to Your Website

Add a button or link on your application that directs users to the ConsentFlow URL:

```html
<a href="https://wallet.independent.example.org/consent-flow?uri=YOUR_CONTRACT_URI" 
   class="connect-button">
   Connect Your Wallet
</a>
```

When users click this button, they'll be directed to the ConsentFlow consent page where they can review and approve the permissions your app is requesting.

### Step 4: Handle the Redirect After User Consent

After a user consents to your contract, they'll be redirected to the URL specified in your contract's `redirectUrl` parameter with their DID added as a query parameter:

```
https://your-app.com/callback?did=did:method:profile-id
```

In your application, implement a handler for this callback:

```javascript
// Example Express.js route handler
app.get('/callback', (req, res) => {
  const userDid = req.query.did;
  
  if (!userDid) {
    return res.status(400).send('Missing DID parameter');
  }
  
  // Store the DID in your database, associating it with the user's account
  storeUserDid(currentUser.id, userDid)
    .then(() => {
      res.redirect('/dashboard?connection=success');
    })
    .catch(error => {
      console.error('Failed to store user DID:', error);
      res.status(500).send('Failed to complete connection');
    });
});

// Function to store the DID in your database
async function storeUserDid(userId, did) {
  // Implementation depends on your database
  await db.users.update({
    where: { id: userId },
    data: { learnCardDid: did }
  });
}
```

### Step 5: Reading Data from Connected LearnCards

To read data from users who have consented to your contract:

```javascript
// Retrieve ConsentFlow data for your contract
async function getLearnCardData(contractUri, options = {}) {
  let data = await networkLearnCard.invoke.getConsentFlowData(contractUri, options);
  
  // Process the returned records
  for (const record of data.records) {
    // Access shared credentials by category
    const meritBadges = record.credentials.categories['Merit Badge'] || [];
    
    for (const credentialUri of meritBadges) {
      // Read the credential
      const credential = await networkLearnCard.read.get(credentialUri);
      // Process the credential
      console.log('Retrieved credential:', credential);
    }
    
    // Access personal information if shared
    const userName = record.personal['Name'];
    
    // Store or process the retrieved data
  }
  
  // Handle pagination if there are more records
  if (data.hasMore) {
    // Get the next page
    const nextPageData = await getLearnCardData(contractUri, { cursor: data.cursor });
    // Combine with current data
    data.records = [...data.records, ...nextPageData.records];
  }
  
  return data;
}
```

### Step 6: Sending Credentials to Users

#### Option A: Using LearnCard SDK

To issue credentials to connected users with the LearnCard SDK:

```javascript
// Function to send a credential to a user by their DID
async function sendCredentialToUser(did, credentialData) {
  // Extract the profileId from the DID
  // This is a simplified example - you'll need to implement proper DID resolution
  const profileId = did.split(':').pop();
  
  // Create a new credential
  const newCredential = networkLearnCard.invoke.newCredential({
        type: 'boost', 
        boostName: 'Hello from External App',
        boostImage: 'https://placehold.co/400x400?text=External+App', 
        achievementType: 'Achievement',
        achievementName:'Connected External App',
        achievementDescription: 'Awarded for connecting to a 3rd party app.',
        achievementNarrative: 'Created and connected a full external app.'
        achievementImage: 'https://placehold.co/400x400?text=External+App',   
    });
  
  // Issue the credential
  const vc = await networkLearnCard.invoke.issueCredential(newCredential);
  
  // Send the credential to the user (encrypted for security)
  const encrypt = true;
  await networkLearnCard.invoke.sendCredential(profileId, vc, encrypt);
  
  return vc;
}
```

#### Option B: Using HTTP Endpoints

If you prefer not to use the LearnCard npm packages, you can send credentials directly using HTTP endpoints. This approach is useful for integrations in languages other than JavaScript or in environments where installing npm packages might be challenging.

```javascript
/**
 * Send a credential to a user by their profileId using HTTP endpoints
 * @param {string} profileId - The user's profile ID
 * @param {object} credential - The credential to send
 * @param {string} apiBaseUrl - The base URL for the network API
 * @param {string} secretToken - Your authorization token
 */
async function sendCredentialViaHttp(profileId, credential, apiBaseUrl, secretToken) {
  const endpoint = `${apiBaseUrl}/api/credential/send/${profileId}`;
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${secretToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ credential })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to send credential:', error);
    throw error;
  }
}
```

**Example Usage with a Complete Credential**

```javascript
// First, extract the profileId from the user's DID that you stored
const profileId = userDid.split(':').pop(); // Simplified example

// Define a complete credential
const credential = {
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json"
  ],
  "id": "https://yourapp.com/credentials/1234",
  "type": [
    "VerifiableCredential",
    "OpenBadgeCredenial"
  ],
  "issuer": "did:example:issuer",
  "issuanceDate": new Date().toISOString(),
  "name": "Course Completion",
  "credentialSubject": {
    "id": userDid, // The user's DID
    "type": ["AchievementSubject"],
    "achievement": {
      "id": "https://yourapp.com/achievements/course-completion",
      "type": ["Achievement"],
      "name": "Course Completion",
      "description": "Successfully completed the Introduction to Blockchain course",
      "criteria": {
        "narrative": "Completed all modules with a score of 85% or higher",
      },
      "image": "https://yourapp.com/badges/blockchain-intro.png"
    }
  }
};

// Send the credential
const apiBaseUrl = "https://network.independent.example.org/api"; // Your network's base URL
const secretToken = "YOUR_SECRET_TOKEN"; // Your authorization token

sendCredentialViaHttp(profileId, credential, apiBaseUrl, secretToken)
  .then(response => {
    console.log("Credential sent successfully:", response);
  })
  .catch(error => {
    console.error("Failed to send credential:", error);
  });
```

**Implementation in Other Languages**

**Python Example**

```python
import requests
import json
from datetime import datetime, timedelta

def send_credential_via_http(profile_id, credential, api_base_url, secret_token):
    """
    Send a credential to a user by their profileId using HTTP endpoints
    
    Args:
        profile_id (str): The user's profile ID
        credential (dict): The credential to send
        api_base_url (str): The base URL for the network API
        secret_token (str): Your authorization token
        
    Returns:
        dict: The response from the API
    """
    endpoint = f"{api_base_url}/api/credential/send/{profile_id}"
    
    headers = {
        "Authorization": f"Bearer {secret_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(
            endpoint,
            headers=headers,
            data=json.dumps({"credential": credential})
        )
        
        response.raise_for_status()  # Raise an exception for HTTP errors
        
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error sending credential: {e}")
        raise
```

### Best Practices

1. **Security**: Always use a strong, secure seed for your LearnCard initialization and keep your secret tokens secure.
2. **Privacy**: Only request access to the credential categories and personal information that your application actually needs.
3. **User Experience**: Clearly explain to users why your application needs access to their LearnCard and what benefits they'll receive.
4. **Error Handling**: Implement robust error handling for all LearnCard operations and HTTP requests.
5. **Persistence**: Store the contract URI securely - you'll need it for all future operations with that contract.
6. **Authentication**: When using HTTP endpoints, ensure proper authentication mechanisms are in place to protect sensitive operations.
7. **Validation**: Always validate credential data before sending to ensure it meets the required format and schema.

### Step 7: Working with Boosts

Boosts are a powerful feature that allow you to create reusable credential templates that can be sent to multiple recipients while maintaining analytics and management capabilities.

#### What is a Boost?

A Boost is a registered credential template in the network that can be:

* Sent to multiple recipients
* Tracked with analytics
* Managed through permissions
* Organized into categories

#### Why Use Boosts Instead of Direct Credential Sending

Understanding the difference between Boosts and direct credential sending is important:

| Feature      | Direct Credential Sending         | Boosts                                         |
| ------------ | --------------------------------- | ---------------------------------------------- |
| Analytics    | No analytics available            | Track how many users claimed, viewed analytics |
| Recipients   | One credential per send operation | Same template can be sent to multiple users    |
| Management   | No central management             | Can edit, update, and manage permissions       |
| Organization | No categorization                 | Can be organized by type and category          |
| Permissions  | Limited control                   | Fine-grained permission management             |



#### Creating a Boost Using HTTP Endpoints

You can create a Boost using the HTTP API:

```javascript
/**
 * Create a boost using HTTP endpoints
 * @param {object} boostData - The boost definition
 * @param {string} apiBaseUrl - The base URL for the network API
 * @param {string} secretToken - Your authorization token
 */
async function createBoostViaHttp(boostData, apiBaseUrl, secretToken) {
  const endpoint = `${apiBaseUrl}/api/boost/create`;
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${secretToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(boostData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to create boost:', error);
    throw error;
  }
}
```

**Example Boost Creation**

Here's a complete example of creating a merit badge Boost:

```javascript
javascriptCopy// Define the boost data
const meritBadgeBoost = {
  "name": "Knot Master",
  "type": "ext:KnotMaster",
  "category": "Social Badge",
  "status": "LIVE", // DRAFT or LIVE
  "credential": {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.1.json",
      "https://ctx.learncard.com/boosts/1.0.0.json"
    ],
    "attachments": [],
    "credentialSubject": {
      "achievement": {
        "achievementType": "ext:KnotMaster",
        "criteria": {
          "narrative": "The Friendship Knot Fanatic Badge is awarded to the Scout demonstrating a consistent and passionate dedication to tying friendship knots."
        },
        "description": "For the Scout tying friendship knots every day!",
        "id": "urn:uuid:123",
        "image": "https://cdn.filestackcontent.com/CKa9uvnqTrWYHlG2B5af",
        "name": "Friendship Knot Fanatic",
        "type": [
          "Achievement"
        ]
      },
      "type": [
        "AchievementSubject"
      ]
    },
    "display": {
      "backgroundColor": "",
      "backgroundImage": "",
      "displayType": "",
      "emoji": {
        "activeSkinTone": "",
        "imageUrl": "",
        "names": [],
        "unified": "",
        "unifiedWithoutSkinTone": ""
      }
    },
    "groupID": "",
    "image": "https://cdn.filestackcontent.com/CKa9uvnqTrWYHlG2B5af",
    "issuanceDate": "2025-04-04T19:31:38.373Z",
    "name": "Friendship Knot Fanatic",
    "skills": [],
    "type": [
      "VerifiableCredential",
      "OpenBadgeCredential",
      "BoostCredential"
    ]
  }
};

// Create the boost
const apiBaseUrl = "https://network.independent.example.org/api"; // Your network's base URL
const secretToken = "YOUR_SECRET_TOKEN"; // Your authorization token

createBoostViaHttp(meritBadgeBoost, apiBaseUrl, secretToken)
  .then(response => {
    console.log("Boost created successfully with URI:", response.uri);
    // Store this URI for future use when sending the boost
  })
  .catch(error => {
    console.error("Failed to create boost:", error);
  });
```

#### Sending a Boost to Recipients

Once you've created a Boost, you can send it to recipients using their profileId:

```javascript
/**
 * Send a boost to a user by their profileId using HTTP endpoints
 * @param {string} profileId - The recipient's profile ID
 * @param {string} boostUri - The URI of the boost to send
 * @param {object} credential - Optional: customized credential for this recipient
 * @param {object} options - Optional: additional options like skipNotification
 * @param {string} apiBaseUrl - The base URL for the network API
 * @param {string} secretToken - Your authorization token
 */
async function sendBoostViaHttp(profileId, boostUri, credential, options, apiBaseUrl, secretToken) {
  const endpoint = `${apiBaseUrl}/api/boost/send/${profileId}`;
  
  const payload = {
    uri: boostUri,
    credential: credential // Optional: if you want to customize the credential for this recipient
  };
  
  if (options) {
    payload.options = options;
  }
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${secretToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to send boost:', error);
    throw error;
  }
}
```

#### Best Practices for Working with Boosts

1. **Create Reusable Templates**: Design your Boosts to be reusable across multiple recipients.
2. **Use Meaningful Categories**: Organize Boosts into logical categories for easier management.
3. **Set Appropriate Permissions**: Define who can issue, edit, and manage your Boosts.
4. **Use DRAFT Status**: When creating a new Boost, set it to DRAFT until you're ready to start issuing.

### Troubleshooting

* **Connection Issues**: Ensure your network endpoint is correctly configured and accessible.
* **Missing DIDs**: Verify that users are completing the consent process and your redirect handler is properly extracting the DID.
* **Credential Read Failures**: Check that your contract has the necessary read permissions for the credential categories you're trying to access.
* **Credential Write Failures**: Verify that your contract has the necessary write permissions and that you're using the correct profileId when sending credentials.
* **HTTP Errors**: For HTTP endpoint issues, check your authorization token, ensure the correct endpoint URL, and verify your payload structure meets the API requirements.
* **Authentication Problems**: Ensure you're using the correct authorization token and that it hasn't expired.
* **Profile ID Format**: When extracting profileId from a DID, make sure you're using the correct format required by the network.
* **Boost Creation Failures**: Verify that all required fields are provided and properly formatted in your Boost creation request.
* **Boost Sending Issues**: Ensure the Boost URI is valid and that you have permission to issue the Boost.

By following this guide, you should be able to successfully integrate LearnCard with your application using an Independent Network, allowing users to connect their LearnCards and exchange credentials securely.
