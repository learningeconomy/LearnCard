# Ceramic

The Ceramic Plugin adds support for storing and retrieving credentials on [Ceramic](https://ceramic.network/). It exposes the ability to publish and read from Ceramic, as well as providing access to a Ceramic client object with a did attached to it.

This plugin implements the [Read](/broken/pages/s13FerGAbkHnrN13v85i) and [Store](/broken/pages/AacoBhj2Q6kUaK1EVNnj) Planes.

### Install

```bash
pnpm i @learncard/ceramic-plugin
```

### Uploading to Ceramic

To upload a credential to Ceramic, you may use the [Store Plane](/broken/pages/AacoBhj2Q6kUaK1EVNnj):

```typescript
const uri = await learnCard.store.Ceramic.upload(vc);
```

### Uploading  to Ceramic with Encryption

To upload a credential to Ceramic using encryption, you may use the [Store Plane](/broken/pages/AacoBhj2Q6kUaK1EVNnj):

<pre class="language-typescript"><code class="lang-typescript"><strong>// Encrypted, only the controller(s) can decrypt
</strong><strong>const uri = await learnCard.store.Ceramic.uploadEncrypted(vc);
</strong></code></pre>

{% hint style="warning" %}
Ceramic's uploadEncrypted method encrypts VCs as JWEs with the controller's DID and other specified recipients ([see below for advanced encryption options](ceramic.md#advanced-encryption-settings)). JOSE encryption is implemented with `ECDH-ES+XC20PKW` on the `x25519`curve with a key length of `256`. This is handled by the [did-jwt](https://github.com/decentralized-identity/did-jwt) library from the [Decentralized Identity Foundation](https://identity.foundation/).&#x20;

_Note: Additional metadata is **not**, by default, encrypted._
{% endhint %}

### Reading from Ceramic

To read a credential from Ceramic, you may use the [Read Plane](/broken/pages/s13FerGAbkHnrN13v85i):

```typescript
const vc = await learnCard.read.get(uri);
```

{% hint style="info" %}
Ceramic's `get`method will decrypt any JWE encrypted credentials (see [`uploadEncrypted`](ceramic.md#uploading-to-ceramic-1)) when reading, using the learnCard's DID (`learnCard.id.did()`). If the learnCard's DID is not a recipient of the JWE, reading the credential will fail.&#x20;
{% endhint %}

### Getting the Ceramic Client

To get access to the Ceramic Client, use the `getCeramicClient` method:

```typescript
const ceramic = learnCard.invoke.getCeramicClient();
```

### Advanced Encryption Settings

As indicated above, when using `learnCard.store.Ceramic.uploadEncrypted(vc),` uploaded VCs are encrypted using default settings.&#x20;

#### Upload & Get Encrypted Credential:

```typescript
const user = await initLearnCard({ seed: '123', debug: console.log })
const malicious = await initLearnCard({ seed: '666', debug: console.log });

const uvc = user.invoke.getTestVc();   
const vc = await  user.invoke.issueCredential(uvc);
const streamId = await user.store.Ceramic.uploadEncrypted(vc);

// Should properly retrieve credential!  ✅
await user.read.get(streamId);

// Should error -  Could not decrypt credential - DID not authorized. ❌
await malicious.read.get(streamId);
```

#### Upload & Get _Shared_ Encrypted Credential:

In addition to encrypting VCs for the controller, you can pass additional params of the following shape, to `learnCard.store.Ceramic.uploadEncrypted(vc, params):`

```typescript
// params in uploadEncrypted(vc, params):
type EncryptionParams = {
    recipients: string[]; // DIDs who can also decrypt the credential, in addition to the controller
};
```

You can play with the following examples in the[ LearnCard CLI](../learncard-cli.md):

```typescript
const user = await initLearnCard({ seed: '123', debug: console.log })
const malicious = await initLearnCard({ seed: '666', debug: console.log });
const friend = await initLearnCard({ seed: '808', debug: console.log });

const sharedStreamId = await user.store.Ceramic.uploadEncrypted(vc, { recipients: [friend.id.did()] });

// Should properly retrieve credential!  ✅
await user.read.get(sharedStreamId);
// Should properly retrieve credential!  ✅
await friend.read.get(sharedStreamId);

// Should error -  Could not decrypt credential - DID not authorized. ❌
await malicious.read.get(sharedStreamId);
```

#### Upload & Get One-Way Encrypted Credential:

To manually set encryption settings, you should directly use `learnCard.invoke.publishContentToCeramic(vc, encryption)` and pass in your `encryption` params:

Ceramic's specific encryption param is of the following shape:

```typescript
export type CeramicEncryptionParams = {
    encrypt: boolean; // Enables / disables JWE encryption
    controllersCanDecrypt?: boolean; // Adds the controller DIDs to the recipients list
    recipients?: string[] | undefined; // Specifies which DIDs can decrypt the credential
    options?: CreateJWEOptions | undefined; // Additional options, https://did.js.org/docs/api/modules/dids#createjweoptions
};
```

```typescript
const user = await initLearnCard({ seed: '123', debug: console.log })
const malicious = await initLearnCard({ seed: '666', debug: console.log });
const friend = await initLearnCard({ seed: '808', debug: console.log });

const unidirectionalStreamId = await user.invoke.publishContentToCeramic(vc, { encrypt: true, controllersCanDecrypt: false, recipients: [friend.id.did()] });

// Should properly retrieve credential!  ✅
await friend.read.get(unidirectionalStreamId);

// Should error -  Could not decrypt credential - DID not authorized. ❌
await user.read.get(unidirectionalStreamId);
// Should error -  Could not decrypt credential - DID not authorized. ❌
await malicious.read.get(unidirectionalStreamId);
```

{% hint style="info" %}
You can also use `publishContentToCeramic` to upload VPs! Try:

`learnCard.invoke.publishContentToCeramic(vp, encryption)`
{% endhint %}
