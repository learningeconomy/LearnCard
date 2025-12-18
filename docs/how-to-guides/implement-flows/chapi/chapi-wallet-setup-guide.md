---
description: Learn how to use LearnCard to build a CHAPI compliant wallet application
---

# ⭐ CHAPI Wallet Setup Guide

In order to make a CHAPI compliant wallet, there are six things that your site will need to do:

* Install/run the web-credential-polyfill
* Run the `installHandler` method
* Host a public manifest.json file
* Host a public wallet service worker
* \[Optional] Host a storage endpoint for users to visit when storing a credential via CHAPI
* \[Optional] Host a get endpoint for users to visit when retrieving a credential via CHAPI

## Install/run the web-credential-polyfill

Installing and running the `web-credential-polyfill` could not be easier with LearnCard! It is automatically run for you when constructing a wallet!

```typescript
const learnCard = await initLearnCard();
```

## Run the installHandler method

After initializing a wallet, prompt the user to use your application as a CHAPI wallet by calling the `installChapiHandler` method:

```typescript
await learnCard.invoke.installChapiHandler();
```

## Host a public manifest.json file

This step is a _bit_ trickier, and is deeply intertwined with the next step. The simple answer here is to add a `manifest.json` file to your site that is hosted at `/manifest.json` with contents similar to the following:

{% code title="manifest.json" %}
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

Replacing the `url` with the path to the service worker you set up in the next step, and pointing `src` to an image file that you would like to appear in the CHAPI menu.

In most bundlers/webapp setups, you will simply place this file inside the `public` directory. However, if you are not using a bundler and instead just hosting static files, you will want to place this file right next to your `index.html` file.

## Host a public wallet service worker

Using the `url` defined in the `manifest.json` above, add a public endpoint to your site that can be used to instantiate an empty wallet and run the following code:

```typescript
import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard();

try {
    // This will ask the user if they'd like to use your application as a CHAPI
    // compliant wallet
    await learnCard.invoke.installChapiHandler();
} catch (error) {
    console.error('Error installing Chapi Handler:', error);
}

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

There's a lot going on in this short amount of code, so let's break it down step-by-step:

1. A user visits your site and does something which ultimately instantiates a wallet and calls `installHandler`
2. A pop-up appears, asking the user if they'd like to use your site as a CHAPI wallet. Let's assume they say yes!
3. CHAPI looks at the hosted `manifest.json` to get some basic information about your wallet, such as what it's called and where to find this service worker
4. The same user then uses a website that asks to store a credential using CHAPI
5. A pop-up appears, asking the user what CHAPI wallet they'd like to use. Let's assume they say yours!
6. The `store` function passed into `activateChapiHandler` is called, and the result is used to determine what to display to the user. In the above example, we have specified that we would like the `/store` route to be displayed.
7. The user is shown your site's `/store` route via an iframe.

As you might have been able to tell, the operative code here is the function passed into `activateChapiHandler`. This is what determines what will be shown to users when asking to store a credential.

{% hint style="info" %}
**Hint:** We have arbitrarily chosen the `/store` route here. You can happily use whatever route you'd like to display the storage page to users!
{% endhint %}

## \[Optional] Host a storage endpoint for users to visit when storing a credential via CHAPI

{% hint style="info" %}
**Hint:** If you'd like, you can instead return the same data directly inside the function passed into `activateChapiHandler` to completely skip having users see this storage endpoint
{% endhint %}

After the above flow finishes, a user will land on your sites `/store` route. In order to actually display and store the sent credential, you will need to call `wallet.receiveChapiEvent`:

```typescript
const event = await learnCard.invoke.receiveChapiEvent();

const vp = event.credential.data;

const vc = Array.isArray(vp.verifiableCredential)
    ? vp.verifiableCredential[0]
    : vp.verifiableCredential;
```

After displaying the credential to the user, you may prompt the user for a title and store it with the following code:

```typescript
const uri = await learnCard.invoke.publishCredential(vc);
await learnCard.invoke.addCredential({ id, uri });
```

Once the credential is stored, you may inform the calling code that you have successfully stored the credential with the following code:

```typescript
event.respontWith(Promise.resolve({ dataType: 'VerifiablePresentation', data: vp }););
```

If you would instead prefer to reject the credential, you may do so with the following code:

```typescript
event.respondWith(Promise.resolve(null));
```

## \[Optional] Host a get endpoint for users to visit when retrieving a credential via CHAPI

### DIDAuth

One reason why you might want to have a `get` route setup is for [DID-Auth](https://w3c-ccg.github.io/vp-request-spec/#did-authentication). Including support for DID-Auth allows issuers to seemlessly request your user's did and verify that they actually control that did.

The code to do this looks very similar to the code used for hosting a storage endpoint, however you will want to display different information to the user!

To start, grab the event:

```typescript
const event = await learnCard.invoke.receiveChapiEvent();
```

Next, grab the request origin and display it to the user:

```typescript
const origin = event.credentialRequestOrigin;
```

A good prompt might be "{origin} would like to send you a credential".

If the user accepts, you will need to create a new VP that is signed using the challenge and domain in the DID-Auth request:

```typescript
const presentation = event.credentialRequestOptions.web.VerifiablePresentation;
const { challenge, domain } = presentation;

const didAuthVp = {
    '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1',
    ],
    type: 'VerifiablePresentation',
    holder: learnCard.id.did(),
};

const data = await learnCard.invoke.issuePresentation(didAuthVp, {
    challenge,
    domain,
    proofPurpose: 'authentication',
});

event.respondWith(
    Promise.resolve({
        dataType: 'VerifiablePresentation',
        data,
    })
);
```

If the user rejects, simply respond with `null`!

```typescript
event.respondWith(Promise.resolve(null));
```

## Testing

The easiest way to test out your new CHAPI software is by visiting [https://playground.chapi.io/issuer](https://playground.chapi.io/issuer). Once there, you can easily generate and attempt to store different test credentials into your wallet software.

## Troubleshooting

If you find yourself totally stuck, it can be really helpful to use the [official CHAPI docs](https://chapi.io/developers/wallets) to help get you totally unstuck! Because we are simply wrapping the exposed CHAPI methods, it is very easy to translate the CHAPI docs to the relevant LearnCard functions!

{% content-ref url="translating-to-chapi-documentation.md" %}
[translating-to-chapi-documentation.md](translating-to-chapi-documentation.md)
{% endcontent-ref %}
