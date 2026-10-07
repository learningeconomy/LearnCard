---
description: Add the following code to issue credentials via CHAPI with LearnCard!
---

# Issuers

```typescript
import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard({ seed: '1234' });

const vc = learnCard.invoke.newCredential(); // Or otherwise generate a credential, i.e. VC-API or OIDC

const result = await learnCard.invoke.storeCredentialViaChapiDidAuth(vc);

if (result.success) console.log('Credential stored! 😎');
```

{% hint style="info" %}
This cheat-sheet uses a test credential. Often, issuers will want to use VC-API or OIDCv4 protocols for signing the actual credential in tandem with CHAPI for selecting which wallet to send the credential to. Once you've got CHAPI setup, check out [LearnCard Bridge](/broken/pages/AZysSjiEjB89UYGnmoZ9) to setup VC-API.
{% endhint %}

### More Info

{% content-ref url="../using-learncard-to-interact-with-a-chapi-wallet.md" %}
[using-learncard-to-interact-with-a-chapi-wallet.md](../using-learncard-to-interact-with-a-chapi-wallet.md)
{% endcontent-ref %}
