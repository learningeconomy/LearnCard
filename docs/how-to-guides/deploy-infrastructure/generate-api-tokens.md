# Generate API Tokens

{% hint style="info" %}
Click here for more information on [Auth Grants and Scopes](../../core-concepts/architecture-and-principles/auth-grants-and-api-tokens.md).
{% endhint %}

### How to Generate API Tokens

Here's an example showing how to:

1. Create an AuthGrant
2. Generate an API token
3. Use the token to send a boost via the HTTP API

```javascript
// Step 1: Create an AuthGrant with specific permissions
const grantId = await learnCard.invoke.addAuthGrant({
    name: "Boost Sender Auth",
    description: "Permission to send boosts",
    scope: 'boosts:write',
});

// Step 2: Generate an API token from the AuthGrant
const token = await learnCard.invoke.getAPITokenForAuthGrant(grantId);

// Step 3: Prepare the payload for your API request
const payload = {
    boostUri: "uri-of-the-boost-to-send",
    signingAuthority: "your-signing-authority"
};

// Step 4: Make an authenticated HTTP request using the token
const response = await fetch(
    `https://network.learncard.com/api/boost/send/via-signing-authority/RECIPIENT_PROFILE_ID`,
    {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    }
);

// Step 5: Process the response
if (response.status === 200) {
    const sentBoostUri = await response.json();
    console.log(`Boost sent successfully: ${sentBoostUri}`);
} else {
    console.error(`Error sending boost: ${response.status}`);
    const errorDetails = await response.json();
    console.error(errorDetails);
}
```

### Managing API Tokens in LearnCardApp

#### Steps to Create an API Token

1. **Navigate to Your Profile:**
   * Go to **Developer Tools** > **API Tokens**.
2. **Create an API Token:**
   * **Click**: Create an API Token
   * **Provide the Following Information:**
     * **Name** (required)
     * **Description** (optional)
     * **Scope** (required)
     * **Expiration** (optional)
   * **Click**: Create
3. Already Signed In? Deep link below 👇\
   \- [LearnCardApp API Token Dev Tools](https://learncard.app/passport?showTokenDevTools=true)

#### Token Management Features

* **Revoke/Delete a Token**
* **Update an Existing Token**
* **View Token Details**: Including status, token, creation date, expiration, and scope.

{% embed url="https://www.loom.com/share/fe1901f8e3344f26b9dffdc7cd4bfff7" %}





