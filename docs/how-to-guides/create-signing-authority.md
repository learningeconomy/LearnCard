---
description: 'How-To Guide: Configuring a Signing Authority'
---

# Create Signing Authority

This guide provides practical, step-by-step recipes for setting up a [Signing Authority](../core-concepts/identities-and-keys/signing-authorities.md). A [Signing Authority](../core-concepts/identities-and-keys/signing-authorities.md) is a service that cryptographically signs credentials on your behalf, allowing you to issue official records without directly handling private keys in your application.

We'll cover two paths: the simple, recommended approach of using a LearnCard-managed authority, and the advanced option of registering your own external service.

This guide assumes you have a LearnCard Passport profile. If not, you can create one via the UI or CLI.

## 1. The Simple Path: Using a LearnCard-Managed Authority (Recommended)

**Goal:** Create a secure signing mechanism in under a minute, without managing any keys or infrastructure.

This is the fastest and most common path, perfect for getting your issuance workflow up and running immediately. We handle the complexity so you can focus on your product.

### **Recipe 1a: Using the UI (The Quickest Start)**

1. Navigate to your **Profile** in the LearnCard App.
2. Go to **Developer Tools > Signing Authorities**.
3. Click **"Create New Authority"**.
4. Give it a memorable name (e.g., `default-issuer`) and click **"Create"**.

That's it. If this is your first authority, we automatically set it as your primary. You can now issue credentials using the Universal Inbox, and we'll handle the signing automatically.

### **Recipe 1b: Using the CLI**

For developers who prefer to script their setup, the CLI provides a fast and repeatable way to achieve the same result.

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

**Result:** You now have a default Signing Authority. When you call the [`/inbox/issue` endpoint](send-credentials.md) with an unsigned credential, our system will automatically use this authority to sign it. You don't need to specify any `signingAuthority` details in your API call `configuration` object.

## 2. The Advanced Path: Using Your Own External Authority

**Goal:** Delegate credential signing to your own, self-hosted VC-API compliant service for maximum control over your keys and infrastructure.

This path is for organizations with specific security, compliance, or existing identity infrastructure needs.

**Prerequisites:** You must have a running, publicly accessible VC-API compliant issuer endpoint. Or, you can [deploy your own](deploy-infrastructure/signing-authority.md).

### **Recipe: Registering an External Authority**

You don't create an external authority through our system; you simply tell our network about it and authorize it to act on your behalf.

```javascript
// This script assumes you have an authenticated `learnCard` client instance.

// The details of YOUR external signing service.
const myExternalAuthority = {
  name: 'my-custom-signer',
  endpoint: 'https://my-vc-api.my-org.com/issue',
  did: 'did:web:my-org.com' // The DID of your external service
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

**Result:** Your external service is now an authorized signer for your profile. When you want to use it, you must explicitly specify it in your `/inbox/issue` API call.

**Example `/inbox/issue` call using your external authority:**

```javascript
// Note the explicit `signingAuthority` object in the configuration.
await learncardApiClient.post('/inbox/issue', {
  recipient: { /* ... */ },
  credential: { /* ...unsigned credential data... */ },
  configuration: {
    signingAuthority: {
      name: 'my-custom-signer',
      endpoint: 'https://my-vc-api.my-org.com/issue'
    }
  }
});

```

## Generate a Signing Authority in LearnCardApp

### Steps to Create a Signing Authority

1. **Navigate to Your Profile:**
   * Go to **Developer Tools** > **Signing Authority**.
2. **Create:**
   * **Click**: **Create Signing Authority**
   * **Provide the Following Information:**
     * **Name** (required)
     * **Endpoint** (optional)
     * DID (Endpoint required)
   * **Click**: Create
3. Already Signed In? Deep link below 👇

* [LearnCardApp Signing Authority DevTools](https://learncard.app/passport?showSigningAuthorityDevTools=true)

{% embed url="https://www.loom.com/share/080838131d82428289073699d19a2aa8" %}
