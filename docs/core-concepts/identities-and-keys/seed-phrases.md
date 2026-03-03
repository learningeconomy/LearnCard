---
description: Understanding Seed Phrases (for Account & Key Recovery)
---

# Seed Phrases

**What is this section about?** This section explains "Key Generation Seeds" as they are used within the LearnCard ecosystem. We'll cover what these seeds are, why they are critically important for creating and securing digital identities and cryptographic keys, and how to handle them safely.

**Why is this important for you to understand?** In LearnCard, a seed is the foundational secret from which all of a user's or service's cryptographic keys are derived. If you are managing the raw key material for an identity, understanding how this seed works is essential for security, control, and potential account/key recovery. Mismanagement of this seed can lead to irreversible loss of access or compromised identity.

**What you'll learn:**

* What a LearnCard "seed" specifically refers to (a hexadecimal string).
* How these seeds are used to generate keys.
* Best practices for generating and securely managing these seeds.
* The distinction between this type of seed and mnemonic "seed phrases."

***

#### What is a LearnCard Key Generation Seed?

In the context of initializing LearnCard (e.g., with `initLearnCard({ seed: 'your-hex-string' })`), a **Seed** is a specific piece of data: **a 64-character hexadecimal string.** This string represents 32 bytes of randomness (entropy) and serves as the master input for deterministically generating all cryptographic keys associated with a LearnCard identity or wallet.

**Think of this hexadecimal seed as the root secret or the "DNA" for an identity's cryptographic capabilities.**

#### How Seeds Work in LearnCard

1. **Source of Entropy:** The seed provides the necessary randomness required to create strong, unpredictable cryptographic keys.
2. **Deterministic Key Derivation:** From this single hexadecimal seed, LearnCard (often utilizing underlying libraries like DIDKit) can generate a consistent set of multiple key pairs (public and private keys) for different cryptographic algorithms and purposes. "Deterministic" means that if you provide the exact same seed again, you will always get the exact same keys.
3. **Hexadecimal Input:**
   * The `seed` parameter in `initLearnCard` expects this hexadecimal string.
   * **Important:** If you provide a string that is not 64 characters long, `initLearnCard` will typically prefix it with zeroes until it reaches the required 64-character length. This means that, for example, `'1'` and `'0000...001'` (63 zeroes followed by a 1) would be treated as identical seeds.

#### Generating a Secure Seed

The responsibility for generating and securely storing this seed lies with you, the developer or the system integrating LearnCard. Insufficient randomness (entropy) or insecure storage can severely compromise the security of the identities and data.

{% hint style="warning" %}
There be dragons here. 🐉 In production environments, take great care and caution when generating and storing key material. Insufficient entropy or insecure storage, among other vectors, can easily compromise your data and identities.

Key input should be a hexadecimal string. If you pass a string that is not valid hex, an error will be thrown
{% endhint %}

Here are examples of how to generate a cryptographically secure 32-byte random value and convert it to the required 64-character hexadecimal string:

*   **In a Browser Environment:**

    ```typescript
    const randomKeyHex = Array.from(crypto.getRandomValues(new Uint8Array(32)), dec =>
      dec.toString(16).padStart(2, "0")
    ).join("");
    // randomKeyHex will be a 64-character hexadecimal string
    ```
*   **In a Node.js Environment:**

    ```typescript
    import crypto from 'node:crypto';

    const randomKeyHex = crypto.randomBytes(32).toString('hex');
    // randomKeyHex will be a 64-character hexadecimal string
    ```

#### The Critical Importance of Securing Your Seed

Because this hexadecimal seed is the master secret for an identity's keys within LearnCard:

* **It IS the Master Key:** If someone gains access to this 64-character hex string, they can regenerate all associated private keys and take full control of the identity and any credentials or assets it controls.
* **Loss Means Irreversibility:** If you (or your user) lose this seed and there are no other backups of the private keys themselves, access to the identity and its capabilities may be permanently lost.
* **Security Practices (similar to mnemonic seed phrases, but for a hex string):**
  * **Store Securely:** This hex string must be stored with extreme care. For end-users managing their own seeds, this often means writing it down accurately and storing it offline in multiple secure locations (e.g., a safe). For backend systems managing seeds, this involves robust secret management solutions (e.g., Hardware Security Modules (HSMs), managed KMS services).
  * **Accuracy is Crucial:** Unlike mnemonic phrases designed for easier human transcription, a 64-character hex string is prone to transcription errors if handled manually.
  * **Never Transmit Insecurely:** Avoid sending it over unencrypted channels or storing it in easily accessible digital locations.
  * **Do Not Hardcode (in client-side code):** For applications where users control their identities, the seed should be managed by the user or a secure wallet mechanism, not hardcoded into the application.

#### Seeds in LearnCard Initialization

When you initialize LearnCard with a seed, for example:

```typescript
// Make sure you have the didkit plugin installed! pnpm i @learncard/didkit-plugin
import { initLearnCard } from '@learncard/init';
import didkit from '@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm'; // Example for Webpack 5

const learnCard = await initLearnCard({ seed: 'abc123your64characterhexstringgoeshere...', didkit });
```

The LearnCard SDK uses this hexadecimal seed to deterministically generate the cryptographic keys needed for DID creation, signing, and other operations. This allows for consistent identity representation and control as long as the seed is known.

#### Distinction from Mnemonic Seed Phrases

It's important to distinguish LearnCard's direct use of a hexadecimal seed string from **mnemonic seed phrases** (e.g., the 12-24 words used by many cryptocurrency wallets, often following the BIP-39 standard).

* **Mnemonic Seed Phrases:** These are designed to be a more human-readable and writable way to back up the entropy (randomness) needed to generate keys. The words themselves are converted into the actual binary seed/entropy.
* **LearnCard's `seed` parameter:** Expects the direct hexadecimal representation of the 32-byte entropy.

While you _could_ technically generate a 32-byte entropy, convert it to a BIP-39 mnemonic phrase for user backup, and then convert that mnemonic _back_ to its 32-byte hex representation to pass to `initLearnCard`, LearnCard's `seed` parameter itself does not directly consume the list of words. It consumes the resulting hex string.

#### Key Takeaways

* A LearnCard Key Generation Seed is a **64-character hexadecimal string** representing 32 bytes of randomness.
* It is the **foundational secret** used to deterministically derive all cryptographic keys for a LearnCard identity.
* **Secure generation and extremely careful storage** of this seed are critical for maintaining control and enabling recovery of an identity.
* This direct hexadecimal seed is distinct from, though related to the concept of, mnemonic seed phrases commonly used for wallet backups.
