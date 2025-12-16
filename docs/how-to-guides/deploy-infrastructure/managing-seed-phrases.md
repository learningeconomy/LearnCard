---
description: Remote Key Management System (KMS) for LearnCard
---

# Managing Seed Phrases

This documentation will guide you through the process of implementing a remote Key Management System (KMS) for deriving a deterministic, 64-character seed phrase to construct your LearnCard wallet.

### Overview

In some cases, you may want to store and manage the seed phrases for LearnCard wallets in a remote and secure KMS. This approach allows for better control and security of the seed phrases while providing flexibility in managing multiple wallets for different use cases.

### Implementation Steps

1. **Set up the remote KMS**: Choose a suitable KMS provider that meets your requirements for security, scalability, and performance. Some popular KMS providers include AWS KMS, Google Cloud KMS, and Azure Key Vault. Set up your account and create a dedicated key store for your LearnCard seed phrases.
2. **Generate seed phrases**: Generate a deterministic, 64-character seed phrase using your chosen KMS provider's API or SDK. This seed phrase will be used to derive the keys for your LearnCard wallet.
3. **Securely store seed phrases**: Store the generated seed phrase securely in the remote KMS, ensuring proper access control and encryption are in place.
4. **Retrieve seed phrases**: When needed, retrieve the seed phrase from the remote KMS using a secure connection and authentication mechanism provided by your KMS provider.
5. **Initialize LearnCard wallet**: Import the `initLearnCard` function from the `@learncard/init` package, and initialize the LearnCard wallet using the retrieved seed phrase.

```javascript
import { initLearnCard } from '@learncard/init';

const seed = getSeedFromKMS(); // Replace with the seed retrieved from your remote KMS
const learnCard = await initLearnCard({ seed });
```

By following these steps, you can leverage a remote KMS for managing your LearnCard wallet's seed phrases, providing enhanced security and control over the wallet initialization process.
