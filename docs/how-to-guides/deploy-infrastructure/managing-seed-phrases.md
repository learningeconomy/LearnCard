---
description: Remote Key Management System (KMS) for LearnCard
---

# Remote Key Management

Implement a remote Key Management System (KMS) to derive a deterministic, 64-character seed phrase for your LearnCard wallet.

### Overview

Store and manage seed phrases in a remote KMS for better security and control.

### Implementation Steps

1. **Set up the remote KMS**: Choose a KMS provider (AWS KMS, Google Cloud KMS, Azure Key Vault) and create a dedicated key store.
2. **Generate seed phrases**: Generate a deterministic, 64-character seed phrase using your KMS provider's API.
3. **Securely store seed phrases**: Store the seed phrase in the remote KMS with proper access control.
4. **Retrieve seed phrases**: Retrieve the seed phrase from the remote KMS.
5. **Initialize LearnCard wallet**: Initialize the LearnCard wallet using the retrieved seed phrase.

```javascript
import { initLearnCard } from '@learncard/init';

const seed = getSeedFromKMS(); // Replace with the seed retrieved from your remote KMS
const learnCard = await initLearnCard({ seed });
```

**Important:** Rotating a seed = a new DID. Plan your issuer identity before going to production, as changing the seed will change the DID that issues your credentials.

## Next steps

- [How Should I Manage Keys?](choose-key-management.md) — review other key management strategies.
