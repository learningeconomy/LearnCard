# Generate API Tokens

**~5 minutes · Needs:** a LearnCard Passport profile

{% hint style="info" %}
See [Auth Grants and Scopes](../../core-concepts/architecture-and-principles/auth-grants-and-api-tokens.md).
{% endhint %}

### How to Generate API Tokens

To generate and use an API token:

```javascript
// Step 1: Create an AuthGrant with specific permissions
const grantId = await learnCard.invoke.addAuthGrant({
    name: 'Credential Sender Auth',
    description: 'Permission to send credentials',
    scope: 'boosts:write',
});

// Step 2: Generate an API token from the AuthGrant
const token = await learnCard.invoke.getAPITokenForAuthGrant(grantId);

// Step 3: Prepare the payload for your API request
const payload = {
    templateUri: 'uri-of-the-template-to-send',
    signingAuthority: 'your-signing-authority',
};

// Step 4: Make an authenticated HTTP request using the token
const response = await fetch(`https://network.learncard.com/api/send`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
        type: 'boost',
        recipient: 'RECIPIENT_PROFILE_ID',
        ...payload,
    }),
});

// Step 5: Process the response
if (response.status === 200) {
    const result = await response.json();
    console.log(`Credential sent successfully:`, result);
} else {
    console.error(`Error sending credential: ${response.status}`);
    const errorDetails = await response.json();
    console.error(errorDetails);
}
```

### Managing API Tokens in LearnCardApp

#### Steps to Create an API Token

1. **Navigate to Your Profile:**
    - Go to **Developer Tools** > **API Tokens**.
2. **Create an API Token:**
    - **Click**: Create an API Token
    - **Provide the Following Information:**
        - **Name** (required)
        - **Description** (optional)
        - **Scope** (required)
        - **Expiration** (optional)
    - **Click**: Create
3. Already signed in? Go to [LearnCardApp API Token Dev Tools](https://learncard.app/passport?showTokenDevTools=true).

#### Token Management Features

- **Revoke/Delete a Token**
- **Update an Existing Token**
- **View Token Details**: Including status, token, creation date, expiration, and scope.

{% embed url="https://www.loom.com/share/fe1901f8e3344f26b9dffdc7cd4bfff7" %}

## What you should see

When you successfully generate an API token, you receive a JWT string that you can use in the `Authorization` header of your HTTP requests. When you use it to send a credential, you should receive a `200 OK` response with the issuance details.

## Troubleshooting

| If…                | Then                                                                                                  |
| :----------------- | :---------------------------------------------------------------------------------------------------- |
| `401 Unauthorized` | Ensure your API token is included in the `Authorization: Bearer <token>` header and hasn't expired.   |
| `403 Forbidden`    | Check that your token has the correct scope (e.g., `boosts:write` for sending credentials).           |
| `Invalid grant ID` | Verify that the `grantId` you passed to `getAPITokenForAuthGrant` exists and belongs to your profile. |

## Scopes

Scopes define the permissions granted to a client via an API token. Each scope follows the pattern `{resource}:{action}`. You can combine multiple scopes with a space (e.g., `boosts:write inbox:read`).

| Scope          | What it allows                                                       |
| :------------- | :------------------------------------------------------------------- |
| `*:*`          | Full access to all resources                                         |
| `*:read`       | Read-only access to all resources                                    |
| `boosts:write` | Create and send credential templates (required for `POST /api/send`) |
| `inbox:write`  | Send credentials to a user's inbox                                   |
| `contracts:*`  | Manage ConsentFlow contracts                                         |
| `profiles:*`   | Manage the user's profile                                            |

## Next steps

- [Your First Integration](../../quick-start/your-first-integration.md) — see the curl tab for how to use your token.
- [Send Credentials](../send-credentials.md) — learn more about sending credentials.
