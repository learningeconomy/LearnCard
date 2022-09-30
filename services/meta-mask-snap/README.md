[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/meta-mask-snap

[![npm version](https://img.shields.io/npm/v/@learncard/core)](https://www.npmjs.com/package/@learncard/meta-mask-snap)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/core)](https://www.npmjs.com/package/@learncard/meta-mask-snap)
[![vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/@learncard/core)](https://www.npmjs.com/package/@learncard/meta-mask-snap)

The LearnCard MetaMask Snap allows MetaMask users to view, issue, verify, present, and persist DIDs and Verifiable Credentials
via the LearnCard SDK. It allows dapps to use these methods without gaining access to the user's sensitive key material.

## Documentation
All LearnCard documentation can be found at:
https://app.gitbook.com/o/6uDv1QDlxaaZC7i8EaGb/s/FXvEJ9j3Vf3FW5Nc557n/

## Install

```bash
pnpm i @learncard/meta-mask-snap
```

## Usage

### Example

For a full fledged example, see [our official dapp example](../../examples/snap-example-dapp)

### Enable the snap

Make sure your users are using MetaMask Flask, and then enable the wallet with the following command:

```js
// See https://docs.metamask.io/guide/snaps-development-guide.html#developing-a-snap
import detectEthereumProvider from '@metamask/detect-provider';

const provider = await detectEthereumProvider();

const isFlask = (
    await provider?.request({ method: 'web3_clientVersion' })
)?.includes('flask');

if (!isFlask) throw new Error('Must use MetaMask Flask!'); // or explain to users how to download MetaMask Flask!

await provider.request({
    method: 'wallet_enable',
    params: [{ wallet_snap: { 'npm:@learncard/meta-mask-snap': {} } }],
})
```

### Validation, Serialization, and Deserialization

This snap comes with some handy functions to make the RPC API easier to use. These ultimately culminate
in the `sendRequest` function, that is strongly typed with discriminated unions to make the API a
joy to use. Under the hood, all requests between client code and the snap are sent as strings, but
`sendRequest` will automatically serialize and deserialize those strings for you!

```js
import { sendRequest } from '@learncard/meta-mask-snap';

const did = await sendRequest({ method: 'did', didMethod: 'key' }); // did is string | undefined
const testVc = await sendRequest({ method: 'getTestVc' }); // testVc is UnsingedVC (from @learncard/types)
const vc = await sendRequest({ method: 'issueCredential': credential: testVc }); //vc is VC (from @learncard/types)
```

### Issuing/Verifying Credentials and Presentations

#### Issue a credential
```js
// Grab a test VC, or create your own!
const unsignedVc = await sendRequest({ method: 'getTestVc' });

const vc = await sendRequest({ method: 'issueCredential': credential: unsignedVc });
```

#### Verify a credential
```js
const result = await sendRequest({ method: 'verifyCredential': credential: vc });

console.log('Verification Results: ', result);
```

#### Issue a presentation
```js
const vp = await sendRequest({ method: 'issuePresentation': credential: vc });
```

#### Verify a presentation
```js
const result = await sendRequest({ method: 'verifyPresentation': credential: vp });

if (result.warnings.length > 0) console.error('Verification warnings:', result.warnings);

if (result.errors.length > 0) console.error('This presentation is not valid!', result.errors);
else console.log('This presentation is valid!');
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## Who is Learning Economy Foundation?

**[Learning Economy Foundation (LEF)](https://www.learningeconomy.io)** is a 501(c)(3) non-profit organization leveraging global standards and web3 protocols to bring quality skills and equal opportunity to every human on earth, and address the persistent inequities that exist around the globe in education and employment. We help you build the future of education and work with:


## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
