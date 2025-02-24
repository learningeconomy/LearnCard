[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/learn-cloud-plugin

[![npm version](https://img.shields.io/npm/v/@learncard/learn-cloud-plugin)](https://www.npmjs.com/package/@learncard/learn-cloud-plugin)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/learn-cloud-plugin)](https://www.npmjs.com/package/@learncard/learn-cloud-plugin)
[![vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/@learncard/learn-cloud-plugin)](https://www.npmjs.com/package/@learncard/learn-cloud-plugin)

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
const unsignedVc = await wallet.invoke.getTestVc();

const vc = await wallet.invoke.issueCredential(unsignedVc);
```

#### Verify a credential
```js
const result = await wallet.invoke.verifyCredential(vc, {}, true);

if (result.warnings.length > 0) console.error('Verification warnings:', result.warnings);

if (result.errors.length > 0) console.error('This credential is not valid!', result.errors);
else console.log('This credential is valid!');
```

#### Issue a presentation
```js
const vp = await wallet.invoke.issuePresentation(vc);
```

#### Verify a presentation
```js
const result = await wallet.invoke.verifyPresentation(vp);

if (result.warnings.length > 0) console.error('Verification warnings:', result.warnings);

if (result.errors.length > 0) console.error('This presentation is not valid!', result.errors);
else console.log('This presentation is valid!');
```

### Storing/Retrieving/Publishing Credentials with LearnCloud

To maintain co-ownership of credentials, it is best to store credentials in a public place, and then
store references to that public place. While this is not the only way to store credentials (and is
also definitely not a silver bullet! E.g. credentials containing private data), it is the opinion of
this library that it should be used by default.

#### Publish Credential 

After signing a VC, you may choose to publish that credential to LearnCloud. Doing so will return a
URI, which you may share to the recipient. That URI can then be used to resolve the 
issued credential. This means both the issuer and recipient may store the _URI_ instead of the
credential itself.

```js
const uri = await wallet.store.LearnCloud.upload(vc);
```

#### Reading From LearnCloud

To resolve a VC from a URI:

```js
const vcFromLearnCloud = await wallet.read.get(uri);
```

#### Adding a Credential to a Wallet

After receiving a URI, you can _persist_ that URI by calling `add` and giving
the credential a bespoke title

```js
await wallet.index.LearnCloud.add({ uri, id: 'Test VC' });
```

This will add the URI, which can be used to resolve the verifiable credential using the
wallet's secret key. You can think of this as acting like the wallet's personal storage.

#### Getting a credential from the Wallet

After calling `addCredential`, you can use the bespoke title to retrieve that credential at any time

```js
const record = (await wallet.index.LearnCloud.get()).find(record => record.id === 'Test VC');
const vcFromLearnCloud = await wallet.read.get(record.uri);
```

Alternatively, you can get an array of _all_ your stored credentials:

```js
const records = await wallet.index.LearnCloud.get();
const uris = records.map(record => record.uri);
const vcs = await Promise.all(uris.map(async uri => wallet.read.get(uri)));
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## Who is Learning Economy Foundation?

**[Learning Economy Foundation (LEF)](https://www.learningeconomy.io)** is a 501(c)(3) non-profit organization leveraging global standards and web3 protocols to bring quality skills and equal opportunity to every human on earth, and address the persistent inequities that exist around the globe in education and employment. We help you build the future of education and work with:


## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
