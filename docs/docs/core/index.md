---
id: "index"
title: "@learncard/core"
sidebar_label: "Readme"
sidebar_position: 0
custom_edit_url: null
---

[<img src="https://user-images.githubusercontent.com/2185016/176284693-4ca14052-d067-4ea5-b170-c6cd2594ee23.png" width="400"/>](image.png)
# @learncard/core

[![npm version](https://img.shields.io/npm/v/@learncard/core)](https://www.npmjs.com/package/@learncard/core)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/core)](https://www.npmjs.com/package/@learncard/core)
[![vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/@learncard/core)](https://www.npmjs.com/package/@learncard/core)

The LearnCard Core is a pluggable, open-source, universal digital wallet to enable any individual or organization to seamlessly **issue, earn, store, share, and spend currency and credentials** built for the future of education and work.

## Documentation
All LearnCard documentation can be found at:
https://docs.learncard.com

## Install

```bash
pnpm i @learncard/core
```

## Usage

### Instantiation

Instantiate a wallet using `initLearnCard`. This method accepts a unique identifier string that is 
up to 64 characters long. If it is less than 64 characters, `initLearnCard` will pad the start of
the string with 0's until it is 64 characters long.

```js
import { initLearnCard } from "@learncard/core";

const wallet = await initLearnCard({ seed: 'a'.repeat(64) });
```

### Issuing/Verifying Credentials and Presentations

#### Issue a credential
```js
// Grab a test VC, or create your own!
const unsignedVc = await wallet.getTestVc();

const vc = await wallet.issueCredential(unsignedVc);
```

#### Verify a credential
```js
const result = await wallet.verifyCredential(vc);

if (result.warnings.length > 0) console.error('Verification warnings:', result.warnings);

if (result.errors.length > 0) console.error('This credential is not valid!', result.errors);
else console.log('This credential is valid!');
```

#### Issue a presentation
```js
const vp = await wallet.issuePresentation(vc);
```

#### Verify a presentation
```js
const result = await wallet.verifyPresentation(vp);

if (result.warnings.length > 0) console.error('Verification warnings:', result.warnings);

if (result.errors.length > 0) console.error('This presentation is not valid!', result.errors);
else console.log('This presentation is valid!');
```

### Storing/Retrieving/Sending Credentials

#### Ceramic/IDX

To maintain co-ownership of credentials, it is best to store credentials in a public place, and then
store references to that public place. While this is not the only way to store credentials (and is
also definitely not a silver bullet! E.g. credentials containing private data), it is the opinion of
this library that it should be used by default. As a result, instantiating a wallet, will 
automatically connect you to WeLibrary's ceramic node, and allow you to publish and retrieve 
credentials there using IDX.

#### Publish Credential

After signing a VC, you may choose to publish that credential to Ceramic. Doing so will return a
stream ID, which you may share to the recipient. That stream ID can then be used to resolve the 
issued credential. This means both the issuer and recipient may store the _stream ID_ instead of the
credential itself.

```js
const streamId = await wallet.publishCredential(vc);
```

#### Reading From Ceramic

To resolve a VC from a stream ID, simply call the `readFromCeramic` method:

```js
const vcFromCeramic = await wallet.readFromCeramic(streamId);
```

#### Adding a Credential to a Wallet

After receiving a streamID, you can _persist_ that streamID by calling `addCredential`, and giving
the credential a bespoke title

```js
await wallet.addCredential({ id: streamId, title: 'Test VC' });
```

This will add the streamId, which can be used to resolve the verifiable credential to IDX using the
wallet's secret key. You can think of this as acting like the wallet's personal storage.

#### Getting a credential from the Wallet

After calling `addCredential`, you can use the bespoke title to retrieve that credential at any time

```js
const vcFromIdx = await wallet.getCredential('Test VC');
```

Alternatively, you can get an array of _all_ credentials you have added using `getCredentials`

```js
const vcs = await wallet.getCredentials();
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## Who is Learning Economy Foundation?

**[Learning Economy Foundation (LEF)](https://www.learningeconomy.io)** is a 501(c)(3) non-profit organization leveraging global standards and web3 protocols to bring quality skills and equal opportunity to every human on earth, and address the persistent inequities that exist around the globe in education and employment. We help you build the future of education and work with:

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
