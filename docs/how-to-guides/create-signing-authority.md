---
description: 'How-To Guide: Configuring a Signing Authority'
---

# Create Signing Authority

A [Signing Authority](../core-concepts/identities-and-keys/signing-authorities.md) is a service that cryptographically signs credentials on your behalf, allowing you to issue official records without directly handling private keys in your application.

**~5 minutes · Needs:** a LearnCard Passport profile

{% hint style="info" %}
**Do you need a signing authority?**
If you sign credentials yourself and pass `signedCredential` to `send()` (like in the [Quickstart](../quick-start/your-first-integration.md)), you do **NOT** need a signing authority. You only need one when LearnCard signs on your behalf — for example, when using `templateUri`/`templateData` sends, generating claim links, or building Partner Connect apps.
{% endhint %}

This guide assumes you have a LearnCard Passport profile. If not, create one via the UI or CLI.

## 1. The Simple Path: Using a LearnCard-Managed Authority (Recommended)

Create a secure signing mechanism without managing keys or infrastructure.

### **Recipe 1a: Using the UI (The Quickest Start)**

1. Navigate to your **Profile** in the LearnCard App.
2. Go to **Developer Tools > Signing Authorities**.
3. Click **"Create New Authority"**.
4. Give it a memorable name (e.g., `default-issuer`) and click **"Create"**.

If this is your first authority, it is automatically set as your primary. You can now issue credentials using the Universal Inbox, and LearnCard handles the signing.

### **Recipe 1b: Using the CLI**

The CLI provides a repeatable way to achieve the same result.

{% hint style="info" %}
To launch the CLI:

```bash
npx @learncard/cli
# Optionally specify a deterministic seed to instantiate the wallet with
# npx @learncard/cli 1b498556081a298261313657c32d5d0a9ce8285dc4d659e6787392207e4a7ac2h
```

{% endhint %}

```javascript
// This script assumes you have an authenticated `learnCard` client instance.

// First, ensure you have a profile. This only needs to be done once.
// await learnCard.invoke.createProfile({ profileId: 'my-org', isServiceProfile: true });

// 1. Create a new signing authority managed by the LearnCard App.
//    We generate and securely store the keys for you.
const managedAuthority = await learnCard.invoke.createSigningAuthority('default-issuer');

if (!managedAuthority) throw new Error('Could not create signing authority.');
// returns -> { name: 'default-issuer', did: 'did:key:z...', endpoint: 'https://...' }

// 2. Register this new authority with the LearnCard Network.
//    This authorizes it to issue credentials on your profile's behalf.
await learnCard.invoke.registerSigningAuthority(
    managedAuthority.endpoint,
    managedAuthority.name,
    managedAuthority.did
);

// 3. (Optional but Recommended) Set it as your primary authority.
//    This allows you to omit signing details from your API calls.
await learnCard.invoke.setPrimaryRegisteredSigningAuthority(
    managedAuthority.endpoint,
    managedAuthority.name
);

console.log('Successfully created and registered primary signing authority!');
```

**Result:** You have a default Signing Authority. When you call the [`/inbox/issue` endpoint](send-credentials.md) with an unsigned credential, the system uses this authority to sign it. You do not need to specify `signingAuthority` details in your API call `configuration` object.

## 2. The Advanced Path: Using Your Own External Authority

Delegate credential signing to your own, self-hosted VC-API compliant service.

**Prerequisites:** You must have a running, publicly accessible VC-API compliant issuer endpoint.

### **Recipe: Registering an External Authority**

Register your external authority with the network to authorize it to act on your behalf.

```javascript
// This script assumes you have an authenticated `learnCard` client instance.

// The details of YOUR external signing service.
const myExternalAuthority = {
    name: 'my-custom-signer',
    endpoint: 'https://my-vc-api.my-org.com/issue',
    did: 'did:web:my-org.com', // The DID of your external service
};

// 1. Register your external authority with the LearnCard Network.
await learnCard.invoke.registerSigningAuthority(
    myExternalAuthority.endpoint,
    myExternalAuthority.name,
    myExternalAuthority.did
);

console.log(`Successfully registered "${myExternalAuthority.name}".`);

// You can also set this as your primary authority if desired.
// await learnCard.invoke.setPrimaryRegisteredSigningAuthority(
//   myExternalAuthority.endpoint,
//   myExternalAuthority.name
// );
```

**Result:** Your external service is an authorized signer for your profile. Specify it in your `/inbox/issue` API call.

**Example `/inbox/issue` call using your external authority:**

```javascript
// Note the explicit `signingAuthority` object in the configuration.
await learncardApiClient.post('/inbox/issue', {
    recipient: {/* ... */},
    credential: {/* ...unsigned credential data... */},
    configuration: {
        signingAuthority: {
            name: 'my-custom-signer',
            endpoint: 'https://my-vc-api.my-org.com/issue',
        },
    },
});
```

## Generate a Signing Authority in LearnCardApp

### Steps to Create a Signing Authority

1. **Navigate to Your Profile:**
    - Go to **Developer Tools** > **Signing Authority**.
2. **Create:**
    - **Click**: **Create Signing Authority**
    - **Provide the Following Information:**
        - **Name** (required)
        - **Endpoint** (optional)
        - DID (Endpoint required)
    - **Click**: Create
3. Already Signed In? Deep link below 👇

- [LearnCardApp Signing Authority DevTools](https://learncard.app/passport?showSigningAuthorityDevTools=true)

{% embed url="https://www.loom.com/share/080838131d82428289073699d19a2aa8" %}

## What you should see

When you successfully create and register a signing authority, the CLI or API returns the authority details:

```json
{
    "name": "default-issuer",
    "did": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
    "endpoint": "https://network.learncard.com/api/signing-authority/..."
}
```

## Troubleshooting

| If…                                  | Then                                                                                         |
| :----------------------------------- | :------------------------------------------------------------------------------------------- |
| `Could not create signing authority` | Ensure your `learnCard` instance is initialized with a valid seed and network access.        |
| `Profile not found`                  | You must create a profile (`createServiceProfile`) before registering a signing authority.   |
| `Unauthorized`                       | Check that your API token or seed has the correct permissions to manage signing authorities. |

## Next steps

- Send your first credential → [Send & Issue Credentials](send-credentials.md)
- Issue at scale → [Issue at scale with templates](send-credentials.md#issue-at-scale-with-templates)
- Track claims → [Listen to Webhooks](../tutorials/listen-to-webhooks.md)
