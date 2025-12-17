---
description: Add the following files/routes to your app to become CHAPI compliant!
---

# Wallets

{% code title="/" %}
```typescript
import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard();

await learnCard.invoke.installChapiHandler();
```
{% endcode %}

{% code title="/manifest.json" %}
```json
{
  "name": "LearnCard Demo CHAPI Wallet",
  "short_name": "LearnCard Demo CHAPI Wallet",
  "icons": [
    {
      "sizes": "64x64",
      "src": "icon.png",
      "type": "image/png"
    }

  ],
  "credential_handler": {
    "url": "/wallet-worker",
    "enabledTypes": ["VerifiablePresentation"]
  }
}
```
{% endcode %}

{% code title="/wallet-worker" %}
```typescript
import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard();

learnCard.invoke.activateChapiHandler({
    get: async () => {
        // Return an arbitrary route to display to users when requesting a credential
        // or using DIDAuth with your application
        return { type: 'redirect', url: `${window.location.origin}/get` };
    },
    store: async () => {
        // Return an arbitrary route to display to users when storing a credential
        // with your application
        return { type: 'redirect', url: `${window.location.origin}/store` };
    },
});
```
{% endcode %}

{% code title="/store" %}
```typescript
import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard({ seed });

const event = await learnCard.invoke.receiveChapiEvent();

const vp = event.credential.data;

const vc = Array.isArray(vp.verifiableCredential)
    ? vp.verifiableCredential[0]
    : vp.verifiableCredential;
    
const accept = async () => {
    const uri = await learnCard.store.Ceramic.upload(vc);
    await wallet.index.IDX.add({ uri, id });
    event.respondWith(Promise.resolve({ dataType: 'VerifiablePresentation', data: vp }); 
};

const reject = () => event.respondWith(Promise.resolve(null));
```
{% endcode %}

{% code title="/get" %}
```typescript
import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard({ seed });

const event = await learnCard.invoke.receiveChapiEvent();
const origin = event.credentialRequestOrigin;

const accept = () => {
    const presentation = event.credentialRequestOptions.web.VerifiablePresentation;
    const { challenge, domain } = presentation;

    event.respondWith(
        Promise.resolve({
            dataType: 'VerifiablePresentation',
            data: await learnCard.invoke.issuePresentation(await learnCard.invoke.getTestVp(), {
                challenge,
                domain,
                proofPurpose: 'authentication',
            }),
        })
    );
};

const reject = () => event.respondWith(Promise.resolve(null));
```
{% endcode %}

### More Info

{% content-ref url="../chapi-wallet-setup-guide.md" %}
[chapi-wallet-setup-guide.md](../chapi-wallet-setup-guide.md)
{% endcontent-ref %}

{% content-ref url="../demo-application.md" %}
[demo-application.md](../demo-application.md)
{% endcontent-ref %}
