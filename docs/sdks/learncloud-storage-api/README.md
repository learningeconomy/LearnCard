# LearnCloud Storage API

**LearnCloud Storage** is LearnCard's end-to-end encrypted storage system. It holds a user's _personal_ data — their credentials, presentations, and learning records — encrypted client-side, so not even LearnCard servers can read it.

{% hint style="info" %}
**Storage API vs Network API**: the [Network API](../learncard-network/README.md) handles _interactions between parties_ (sending credentials, profiles, boosts, consent). The Storage API handles a _single user's private data_ (their wallet contents and xAPI learning records). Most integrations that send credentials only need the Network API.
{% endhint %}

**Use the Storage API when you need to:**

-   Store credentials and presentations securely and sync them across devices
-   Record and query [xAPI learning statements](xapi-reference.md) ("Alice completed Lesson 3") tied to a user's DID
-   Swap in your own storage backend while keeping the same interface

```typescript
import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard({ seed: process.env.SEED, network: true });

const uri = await learnCard.store.LearnCloud.uploadEncrypted(credential);
const ids = await learnCard.index.LearnCloud.get({ category: 'Achievement' });
```

#### Key Features <a href="#key-features" id="key-features"></a>

-   **xAPI Integration**: Track and store learning experiences
-   **OIDC Authentication**: Provide OpenID Connect authentication
-   **DID Web Resolution**: Resolve DIDs for identity management
-   **End-to-End Encryption:** Data is encrypted client-side.&#x20;

<br>
