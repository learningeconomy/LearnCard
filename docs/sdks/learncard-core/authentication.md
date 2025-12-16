# Authentication

The LearnCard Wallet SDK employs a decentralized authentication model rooted in [Decentralized Identifiers (DIDs)](../../core-concepts/identities-and-keys/decentralized-identifiers-dids.md). As a developer, you initiate and control your digital identity through a securely generated [**Key Generation Seed**](../../core-concepts/identities-and-keys/seed-phrases.md).

Here's the core concept:

1. **You generate a seed**: This seed must have sufficient entropy (randomness).
2. **SDK creates keypairs**: The SDK uses this seed to deterministically create cryptographic keypairs (a public and private key). These keypairs are the foundation of your digital identity.
3. **Authenticate using DIDs**: These keypairs are represented as [DIDs](../../core-concepts/identities-and-keys/decentralized-identifiers-dids.md). The SDK uses these DIDs and their associated private keys to authenticate with various services like the LearnCloud Network API, Storage APIs, and AI services through a process called DID-Auth.

This means you prove your identity by signing challenges with your private key, never revealing the key itself.

## Getting Started: Generating Your Identity Seed

Authentication begins with a **Key Generation Seed**. This is a crucial piece of data: a **64-character hexadecimal string**, which represents 32 bytes of secure randomness.

{% hint style="warning" %}
**Your Responsibility**: You are responsible for generating this seed and ensuring its secure management. The security of your LearnCard identity hinges on the secrecy and integrity of this seed.
{% endhint %}

### **How to Generate a** [**Secure Seed**](../../core-concepts/identities-and-keys/seed-phrases.md):

Use a cryptographically secure random number generator to create 32 bytes of data and then convert it to a 64-character hexadecimal string.

*   **In a Browser Environment:**

    ```typescript
    const randomKeyHex = Array.from(crypto.getRandomValues(new Uint8Array(32)), dec =>
      dec.toString(16).padStart(2, "0")
    ).join("");
    // randomKeyHex will be a 64-character hexadecimal string like "1a2b3c..."
    ```
*   **In a Node.js Environment:**

    ```typescript
    import crypto from 'node:crypto';

    const randomKeyHex = crypto.randomBytes(32).toString('hex');
    // randomKeyHex will be a 64-character hexadecimal string
    ```

{% hint style="danger" %}
## Key Security: Critical Reminder

Your 64-character hexadecimal **seed is the master key** for your LearnCard identity.

* **Protect It Rigorously**: Anyone who gains access to this seed can regenerate all your associated private keys. This would allow them to impersonate you, control your DIDs, and access or modify any data or credentials linked to your identity.
* **Irreversible Loss**: If you lose this seed and have no other backup of the private keys themselves, you may permanently lose access to your LearnCard identity and any associated assets or credentials.
* **Handling**: Treat this hex string with the same (or even greater) caution as you would a mnemonic seed phrase for a cryptocurrency wallet. Store it securely, preferably offline and in multiple locations if you are managing it directly.
{% endhint %}

### **Initializing LearnCard with Your Seed**:

Once you have your 64-character hexadecimal seed, you use it to initialize the LearnCard SDK. This process generates the cryptographic keys tied to your identity.

```typescript
// Example: pnpm i @learncard/init
import { initLearnCard } from '@learncard/init';

async function initialize() {
  const seed = 'your64characterhexstringgoeshere...'; // Replace with your generated seed

  const learnCard = await initLearnCard({
    seed: seed,
    network: true
  });

  // The `learnCard` instance is now ready for authenticated operations.
  return learnCard;
}

initialize().then(lc => console.log("LearnCard Initialized!", lc));
```

{% hint style="info" %}
**Important Notes on the Seed**:

* **Format**: The `seed` parameter for `initLearnCard` _must_ be a hexadecimal string. Providing a non-hex string will result in an error.
* **Length**: If you provide a hexadecimal string that is shorter than 64 characters, `initLearnCard` will typically prefix it with zeroes until it reaches the required 64-character length. For example, `'abc'` would be treated as `'000...00abc'` (61 zeroes followed by 'abc').
{% endhint %}

## Authentication Flow: How It Works

1. **Seed to Keys**: The 64-character hexadecimal `seed` you provide is the master input. The SDK uses it to deterministically derive one or more cryptographic keypairs. "Deterministic" means that if you use the same seed again, you will always get the exact same keypairs.
2. **Keys to DIDs**: These keypairs are then used to generate [Decentralized Identifiers (DIDs)](../../core-concepts/identities-and-keys/decentralized-identifiers-dids.md). Your primary, locally generated DID will typically be a `did:key`. A DID is a globally unique identifier that you control, representing your digital identity.
3. **DID-Auth**: When your application needs to perform an action that requires authentication (e.g., accessing data, calling an API), the LearnCard SDK uses the private key associated with your DID. The API will issue an authentication challenge, which the SDK signs using your private key. This signature proves you control the DID without ever exposing the private key. This entire process is known as DID-Auth.

## Authenticating with Specific APIs

### 1. LearnCloud Network API

The [LearnCloud Network API ](../learncard-network/)enables you to create and manage rich, DID-based user profiles.

#### **Initial Authentication & Profile Creation**:

1. **Authenticate with `did:key`**: Your first interaction with the Network API, such as creating a profile, will be authenticated using the `did:key` that the LearnCard SDK generated from your seed. This `did:key` serves as your initial, self-controlled digital signature.
2. **Create a Profile**: Once authenticated with your `did:key`, you can make a request to the Network API to create a user profile (e.g., a Regular Profile for an individual, or a Service Profile for an application).
3. **Receive `did:web`**: Upon successful creation of your profile on the LearnCloud Network, the service will typically associate your profile with a new, more publicly discoverable DID: a `did:web`. This `did:web` is tied to a domain name and represents your identity within the LearnCloud ecosystem.

**Conceptual Example**:

```typescript
// Assuming 'learnCard' is your initialized LearnCard instance from the previous step
async function createNetworkProfile(learnCard) {
  try {
    const learnCard = await initialize(); // Initialize LearnCard with seed & network = true

    // The SDK automatically uses your did:key for authentication in this step
    const profileData = {
      displayName: "Alice Wonderland",
      profileId: "alice-wonderland", 
      // ... other desired profile attributes
    };

    const newProfile = await learnCard.invoke.createProfile(profileData);

    console.log("Profile created successfully:", newProfile);
    console.log("Your LearnCloud Network DID Web (did:web):", learnCard.id.did('web')); 
    console.log("Your LearnCloud DID Key (did:key):", learnCard.id.did('key')); 

    return newProfile;
  } catch (error) {
    console.error("Error creating profile:", error);
  }
}

// Example usage after initializing learnCard
// initialize().then(lc => createNetworkProfile(lc));
```

After profile creation, you can use your `did:web` (and in some cases, still your `did:key`) for ongoing interactions with the Network API.

### 2. Storage, AI, and Other APIs

Authentication with other APIs integrated into the LearnCard ecosystem (e.g., for decentralized storage, AI services) follows the same fundamental DID-Auth pattern:

* Your LearnCard instance, holding keys derived from your seed, will use the appropriate DID (e.g., `did:key`, `did:web`) to sign authentication challenges presented by these services.
* This proves your control over the identity requesting the action.

{% hint style="info" %}
Always refer to the specific documentation for each API to understand any unique requirements or recommended DIDs for authentication.
{% endhint %}

## Further Reading

For a more in-depth understanding of the concepts mentioned here, please refer to our Core Concept explainer documents:

* [Core Concept: Seeds](../../core-concepts/identities-and-keys/seed-phrases.md)&#x20;
* [Core Concept: DIDs (Decentralized Identifiers)](../../core-concepts/identities-and-keys/decentralized-identifiers-dids.md)
* [Core Concept: Profiles](../../core-concepts/identities-and-keys/network-profiles.md)&#x20;
* [Understanding DID-Auth Specification](https://www.w3.org/Security/201812-Auth-ID/04_-_Day_1_-_Understanding_DID_Auth.pdf)&#x20;
