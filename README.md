[<img src="https://user-images.githubusercontent.com/2185016/176284693-4ca14052-d067-4ea5-b170-c6cd2594ee23.png" width="400"/>](image.png)


# LearnCard SDK
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

The LearnCard SDK is an open-source digital wallet, ID, credentialing technology, and UX to enable any individual or organization to seamlessly **issue, earn, store, share, and spend currency and credentials.**

## About
The SDK is built on the [W3C Universal Wallet (UW)](https://w3c-ccg.github.io/universal-wallet-interop-spec/), a packaging of draft standards and open source frameworks incubated by MIT DCC, Transmute, Learning Economy Foundation. The UW includes key management and key rotation capabilities, [Verifiable Credentials (VCs)](https://www.w3.org/TR/vc-data-model/), [Decentralized Identifiers (DIDs)](https://github.com/w3c-ccg/did-spec), [Decentralized Web Nodes (DWN)](https://identity.foundation/decentralized-web-node/spec/), and a trust triangle that operates modularly on [IPFS](https://ipfs.io/) with plug-ins for any layer 1 or layer 2 blockchain.  

The LearnCard is a key primitive in the architecture for a [global network of learner wallets](https://github.com/Learning-Economy-Foundation/Protocol-Research/blob/main/IoE-Network.md), published by Learning Economy Foundation


## Documentation
All LearnCard documentation can be found at:
https://app.gitbook.com/o/6uDv1QDlxaaZC7i8EaGb/s/FXvEJ9j3Vf3FW5Nc557n/


## Packages
- [LearnCard Core](./packages/learn-card-core) – a pluggable, wallet for issuing, receiving, storing, sharing, and spending currency and credentials.
- [LearnCard React](./packages/react-learn-card) – dedicated set of flexible and reusable Storybook UX components for credential and currency visualization and interactions.
- [LearnCard Bridge - HTTP](./packages/learn-card-bridge-http) – simple CLI and CloudFormation IaC to easily spin up a dedicated execution environment for LearnCard Core exposed over an HTTP API.
- [LearnCard CLI](./packages/learn-card-cli) - an easy to use node REPL; instantiates a LearnCard + all the tools you need to easily play around with the LearnCard SDK.
- LearnCard App - iOS, Android, and Web implementation of LearnCard Core & UX; customizable, whitelabel-able, and modular to support pathways and communities.

## Installation

Use the package manager [pnpm](https://pnpm.io/) to install LearnCard.

```bash
pnpm install
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## Who is Learning Economy Foundation?

**[Learning Economy Foundation (LEF)](https://www.learningeconomy.io)** is a 501(c)(3) non-profit organization leveraging global standards and web3 protocols to bring quality skills and equal opportunity to every human on earth, and address the persistent inequities that exist around the globe in education and employment. 

## License
MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
